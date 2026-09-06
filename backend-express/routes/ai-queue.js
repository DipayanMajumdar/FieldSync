const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { log } = require('../services/audit');
const { rollupNode } = require('../services/rollup');

router.get('/', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, s.id as submission_id, s.pct_complete as orig_pct, w.id as wbs_node_id, w.name as wbs_name, u.name as uploader_name
            FROM ai_suggestions a
            LEFT JOIN submissions s ON a.submission_id = s.id
            LEFT JOIN wbs_nodes w ON s.wbs_node_id = w.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE a.status = 'PENDING'
            ORDER BY a.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/approve', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const aiRes = await client.query('SELECT * FROM ai_suggestions WHERE id = $1 FOR UPDATE', [req.params.id]);
        if (aiRes.rows.length === 0) return res.status(404).json({ error: 'Suggestion not found' });
        
        const suggestion = aiRes.rows[0];
        if (suggestion.status !== 'PENDING') return res.status(400).json({ error: 'Suggestion is not PENDING' });

        if (suggestion.suggested_pct_complete !== null && suggestion.suggested_pct_complete !== undefined) {
            const subRes = await client.query('SELECT * FROM submissions WHERE id = $1', [suggestion.submission_id]);
            const origSub = subRes.rows[0];
            
            if (origSub) {
                const idempotencyKey = 'ai-approved-' + suggestion.id;
                const newSubRes = await client.query(
                    `INSERT INTO submissions (idempotency_key, wbs_node_id, user_id, pct_complete, notes, captured_at, device_id, location, gps_lat, gps_lng)
                     VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9) RETURNING *`,
                    [idempotencyKey, origSub.wbs_node_id, req.user.id, suggestion.suggested_pct_complete, suggestion.suggested_notes || 'AI Suggestion Approved', 'ai-worker', origSub.location, origSub.gps_lat, origSub.gps_lng]
                );
                
                const newSubmission = newSubRes.rows[0];
                
                await client.query(
                    'INSERT INTO sync_idempotency (idempotency_key, submission_id, user_id) VALUES ($1, $2, $3)',
                    [idempotencyKey, newSubmission.id, req.user.id]
                );

                await log(db, {
                    userId: req.user.id, action: 'CREATE_SUBMISSION', targetType: 'submissions', targetId: newSubmission.id, after: newSubmission, ip: req.ip
                });
                
                await rollupNode(db, origSub.wbs_node_id);
            }
        }

        const updateRes = await client.query(
            `UPDATE ai_suggestions SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *`,
            [req.user.id, suggestion.id]
        );

        await client.query('COMMIT');

        await log(db, {
            userId: req.user.id, action: 'APPROVE_AI_SUGGESTION', targetType: 'ai_suggestions', targetId: suggestion.id, before: suggestion, after: updateRes.rows[0], ip: req.ip
        });

        res.json(updateRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

router.post('/:id/reject', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
    try {
        const { reason } = req.body;
        const aiRes = await db.query('SELECT * FROM ai_suggestions WHERE id = $1', [req.params.id]);
        if (aiRes.rows.length === 0) return res.status(404).json({ error: 'Suggestion not found' });
        
        const suggestion = aiRes.rows[0];
        if (suggestion.status !== 'PENDING') return res.status(400).json({ error: 'Suggestion is not PENDING' });

        const updateRes = await db.query(
            `UPDATE ai_suggestions SET status = 'REJECTED', reviewed_by = $1, review_reason = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *`,
            [req.user.id, reason || null, suggestion.id]
        );

        await log(db, {
            userId: req.user.id, action: 'REJECT_AI_SUGGESTION', targetType: 'ai_suggestions', targetId: suggestion.id, before: suggestion, after: updateRes.rows[0], ip: req.ip
        });

        res.json(updateRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
