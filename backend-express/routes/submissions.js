const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { log } = require('../services/audit');
const { rollupNode, deriveLeafPct } = require('../services/rollup');

router.post('/', authenticate, async (req, res) => {
    try {
        const {
            idempotency_key,
            wbs_node_id,
            pct_complete,
            qty,
            notes,
            gps_lat,
            gps_lng,
            captured_at,
            device_id
        } = req.body;

        // Idempotency check
        if (!idempotency_key) {
            return res.status(400).json({
                error: 'idempotency_key is required'
            });
        }

        const existingRes = await db.query(
            'SELECT * FROM sync_idempotency WHERE idempotency_key = $1',
            [idempotency_key]
        );

        if (existingRes.rows.length > 0) {
            const existingSub = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [existingRes.rows[0].submission_id]
            );

            return res.status(200).json(existingSub.rows[0]);
        }

        // Basic validation
        if (!wbs_node_id) {
            return res.status(400).json({
                error: 'wbs_node_id is required'
            });
        }

        if (!captured_at || isNaN(new Date(captured_at).getTime())) {
            return res.status(400).json({
                error: 'Valid captured_at is required'
            });
        }

        if (pct_complete === undefined && qty === undefined) {
            return res.status(400).json({
                error: 'At least one of pct_complete or actual_qty (qty) is required'
            });
        }

        if (
            pct_complete !== undefined &&
            (pct_complete < 0 || pct_complete > 100)
        ) {
            return res.status(400).json({
                error: 'pct_complete must be between 0 and 100'
            });
        }

        if (qty !== undefined && qty < 0) {
            return res.status(400).json({
                error: 'qty must be >= 0'
            });
        }

        // Fetch WBS node
        const nodeRes = await db.query(
            'SELECT id, planned_qty FROM wbs_nodes WHERE id = $1',
            [wbs_node_id]
        );

        if (nodeRes.rows.length === 0) {
            return res.status(400).json({
                error: 'wbs_node_id does not exist'
            });
        }

        const plannedQty = nodeRes.rows[0].planned_qty || 0;

        // Derive effective percentage
        let effectivePct = deriveLeafPct(
            qty,
            pct_complete,
            plannedQty
        );

        if (effectivePct === null) {
            return res.status(400).json({
                error:
                    'Cannot derive progress: provide pct_complete or qty with a planned_qty > 0'
            });
        }

        effectivePct = parseFloat(effectivePct.toFixed(4));

        // Insert submission
        let insertSql;

        const params = [
            idempotency_key,
            wbs_node_id,
            req.user.id,
            effectivePct,
            qty !== undefined ? qty : null,
            notes || null,
            gps_lat !== undefined ? gps_lat : null,
            gps_lng !== undefined ? gps_lng : null,
            captured_at,
            device_id || null
        ];

        if (
            gps_lat !== undefined &&
            gps_lng !== undefined &&
            gps_lat !== null &&
            gps_lng !== null
        ) {
            insertSql = `
                INSERT INTO submissions
                (
                    idempotency_key,
                    wbs_node_id,
                    user_id,
                    pct_complete,
                    qty,
                    notes,
                    gps_lat,
                    gps_lng,
                    captured_at,
                    device_id,
                    location
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    ST_SetSRID(
                        ST_MakePoint($8, $7),
                        4326
                    )
                )
                RETURNING *
            `;
        } else {
            insertSql = `
                INSERT INTO submissions
                (
                    idempotency_key,
                    wbs_node_id,
                    user_id,
                    pct_complete,
                    qty,
                    notes,
                    gps_lat,
                    gps_lng,
                    captured_at,
                    device_id,
                    location
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    NULL
                )
                RETURNING *
            `;
        }

        const client = await db.connect();

        let newSubmission;

        try {
            await client.query('BEGIN');

            const subRes = await client.query(
                insertSql,
                params
            );

            newSubmission = subRes.rows[0];

            await client.query(
                `
                INSERT INTO sync_idempotency
                (
                    idempotency_key,
                    submission_id,
                    user_id
                )
                VALUES ($1, $2, $3)
                `,
                [
                    idempotency_key,
                    newSubmission.id,
                    req.user.id
                ]
            );

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        // Audit log
        await log(db, {
            userId: req.user.id,
            action: 'CREATE_SUBMISSION',
            targetType: 'submissions',
            targetId: newSubmission.id,
            after: newSubmission,
            ip: req.ip
        });

        // Rollup
        await rollupNode(
            db,
            wbs_node_id
        );

        res.status(201).json({
            ...newSubmission,
            effective_pct: effectivePct
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
});


/*
|--------------------------------------------------------------------------
| GET ALL SUBMISSIONS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Previously field_worker users could only see submissions created
| by their own user_id.
|
| That caused the Engineer Evidence page to show 0 when the shared
| database contained evidence submitted by other users.
|
| Now authenticated users can view the same submission registry.
| Existing POST / PUT permission behaviour is unchanged.
|
*/

router.get('/', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const queryStr = `
            SELECT
                s.*,
                w.name AS wbs_node_name
            FROM submissions s
            JOIN wbs_nodes w
                ON s.wbs_node_id = w.id
            ORDER BY s.created_at DESC
            LIMIT $1
            OFFSET $2
        `;

        const params = [
            limit,
            offset
        ];

        const result = await db.query(
            queryStr,
            params
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Internal server error'
        });
    }
});


/*
|--------------------------------------------------------------------------
| Manager Override
|--------------------------------------------------------------------------
*/

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'project_manager'),
    async (req, res) => {
        try {
            const {
                pct_complete,
                qty,
                notes
            } = req.body;

            if (
                pct_complete === undefined ||
                pct_complete < 0 ||
                pct_complete > 100
            ) {
                return res.status(400).json({
                    error: 'pct_complete must be 0-100'
                });
            }

            const subRes = await db.query(
                'SELECT * FROM submissions WHERE id = $1',
                [req.params.id]
            );

            if (subRes.rows.length === 0) {
                return res.status(404).json({
                    error: 'Submission not found'
                });
            }

            const oldSub = subRes.rows[0];

            const updated = await db.query(
                `
                UPDATE submissions
                SET
                    pct_complete = $1,
                    qty = $2,
                    notes = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
                `,
                [
                    pct_complete,
                    qty !== undefined
                        ? qty
                        : oldSub.qty,
                    notes || oldSub.notes,
                    req.params.id
                ]
            );

            const newSub = updated.rows[0];

            await log(db, {
                userId: req.user.id,
                action: 'UPDATE_SUBMISSION',
                targetType: 'submissions',
                targetId: newSub.id,
                before: oldSub,
                after: newSub,
                ip: req.ip
            });

            await rollupNode(
                db,
                newSub.wbs_node_id
            );

            res.json(newSub);

        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
);


module.exports = router;