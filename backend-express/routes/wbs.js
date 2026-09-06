const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { computePlannedPct, computeStatus } = require('../services/rollup');


router.get('/projects/:projectId/wbs', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
              w.*,
              COALESCE(r.pct_complete, 0)  AS pct_complete,
              COALESCE(r.actual_qty, 0)    AS actual_qty,
              r.computed_at
            FROM wbs_nodes w
            LEFT JOIN rollup_cache r ON w.id = r.wbs_node_id
            WHERE w.project_id = $1
            ORDER BY w.level, w.code
        `, [req.params.projectId]);

        // Enrich each node with server-computed planned_pct, variance, status
        const now = new Date();
        const rows = result.rows.map(row => {
            const actualPct = parseFloat(row.pct_complete) || 0;
            const plannedPct = computePlannedPct(row.planned_start, row.planned_end);
            const variance = plannedPct !== null ? parseFloat((actualPct - plannedPct).toFixed(2)) : null;
            const computedStatus = computeStatus(actualPct, row.planned_end);
            return {
                ...row,
                pct_complete: actualPct,
                planned_pct_complete: plannedPct !== null ? parseFloat(plannedPct.toFixed(2)) : null,
                variance,
                computed_status: computedStatus,
            };
        });

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/projects/:projectId/wbs', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { parent_id, level, code, name, description, unit, planned_qty, weight, planned_start, planned_end } = req.body;

        if (!level || level < 1 || level > 6) {
            return res.status(400).json({ error: 'Invalid level, must be 1-6' });
        }
        if (!code || !name) {
            return res.status(400).json({ error: 'Code and name are required' });
        }

        if (level > 1) {
            if (!parent_id) {
                return res.status(400).json({ error: 'parent_id is required for level > 1' });
            }
            const parentRes = await db.query('SELECT level FROM wbs_nodes WHERE id = $1 AND project_id = $2', [parent_id, projectId]);
            if (parentRes.rows.length === 0) {
                return res.status(400).json({ error: 'Parent node not found' });
            }
            if (parentRes.rows[0].level !== level - 1) {
                return res.status(400).json({ error: 'Parent level must be exactly 1 less than this node level' });
            }
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const insertRes = await client.query(
                `INSERT INTO wbs_nodes (project_id, parent_id, level, code, name, description, unit, planned_qty, weight, planned_start, planned_end)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [projectId, parent_id || null, level, code, name, description, unit || '%', planned_qty || 0, weight || 1.0, planned_start, planned_end]
            );
            
            const newNode = insertRes.rows[0];

            await client.query(
                `INSERT INTO rollup_cache (wbs_node_id, pct_complete, actual_qty) VALUES ($1, 0, 0)`,
                [newNode.id]
            );

            await client.query('COMMIT');
            res.status(201).json(newNode);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'WBS code must be unique per project' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/wbs/:nodeId', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, r.pct_complete, r.actual_qty 
            FROM wbs_nodes w
            LEFT JOIN rollup_cache r ON w.id = r.wbs_node_id
            WHERE w.id = $1
        `, [req.params.nodeId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'WBS node not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
