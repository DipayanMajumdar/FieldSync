const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
    try {
        const { code, name, description } = req.body;
        if (!code || !name) {
            return res.status(400).json({ error: 'Missing code or name' });
        }

        const result = await db.query(
            `INSERT INTO projects (code, name, description, created_by) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [code, name, description, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Project code already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/dashboard', authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;

        // Fetch all leaf nodes (have no children) with their rollup data
        const nodesRes = await db.query(`
            SELECT 
                w.id, w.code, w.name, w.level, w.status,
                w.planned_start, w.planned_end, w.planned_qty, w.unit,
                COALESCE(rc.pct_complete, 0) AS pct_complete,
                COALESCE(rc.actual_qty, 0) AS actual_qty
            FROM wbs_nodes w
            LEFT JOIN rollup_cache rc ON rc.wbs_node_id = w.id
            WHERE w.project_id = $1
        `, [projectId]);

        const nodes = nodesRes.rows;
        const leaves = nodes.filter(n => {
            // A leaf node is one not referenced as a parent_id by anyone
            return !nodes.some(other => other.parent_id === n.id);
        });

        // Count statuses across ALL nodes (not just leaves) for high-level KPIs
        const allStatuses = nodes.map(n => n.status);
        const stats = {
            total_activities: leaves.length,
            completed: leaves.filter(n => n.pct_complete >= 100).length,
            in_progress: leaves.filter(n => n.pct_complete > 0 && n.pct_complete < 100).length,
            not_started: leaves.filter(n => n.pct_complete === 0).length,
            delayed: leaves.filter(n => n.status === 'DELAYED' || n.status === 'OVERDUE').length,
            at_risk: leaves.filter(n => n.status === 'AT_RISK').length,
        };

        // S-curve data: cumulative planned vs actual progress by week
        const sCurve = [];
        if (nodes.length > 0) {
            const allStarts = nodes.map(n => n.planned_start).filter(Boolean).map(d => new Date(d).getTime());
            const allEnds = nodes.map(n => n.planned_end).filter(Boolean).map(d => new Date(d).getTime());
            if (allStarts.length > 0 && allEnds.length > 0) {
                const projectStart = new Date(Math.min(...allStarts));
                const projectEnd = new Date(Math.max(...allEnds));
                const totalMs = projectEnd - projectStart;
                const totalWeeks = Math.ceil(totalMs / (1000 * 60 * 60 * 24 * 7));

                for (let w = 0; w <= Math.min(totalWeeks, 52); w++) {
                    const weekDate = new Date(projectStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);
                    const weekTs = weekDate.getTime();
                    
                    let plannedSum = 0, actualSum = 0, totalWeight = 0;
                    for (const n of leaves) {
                        if (!n.planned_start || !n.planned_end) continue;
                        const start = new Date(n.planned_start).getTime();
                        const end = new Date(n.planned_end).getTime();
                        const duration = end - start || 1;
                        totalWeight++;
                        
                        // Linear interpolation for planned progress
                        if (weekTs >= end) plannedSum += 100;
                        else if (weekTs <= start) plannedSum += 0;
                        else plannedSum += ((weekTs - start) / duration) * 100;

                        // Actual is static (latest rollup value)
                        actualSum += n.pct_complete;
                    }

                    if (totalWeight > 0) {
                        sCurve.push({
                            week: weekDate.toISOString().split('T')[0],
                            planned: Math.min(100, plannedSum / totalWeight),
                            actual: Math.min(100, actualSum / totalWeight),
                        });
                    }
                }
            }
        }

        // Compute overall project progress from the rollup cache on the root node(s)
        const rootNodes = nodes.filter(n => !n.parent_id);
        const overallPct = rootNodes.length > 0
            ? rootNodes.reduce((sum, n) => sum + parseFloat(n.pct_complete || 0), 0) / rootNodes.length
            : (leaves.length > 0 ? leaves.reduce((sum, n) => sum + parseFloat(n.pct_complete || 0), 0) / leaves.length : 0);

        res.json({
            // New shape
            stats,
            s_curve: sCurve,
            nodes,
            // Legacy compatibility shape used by projects/page.tsx
            overall_progress_pct: Math.round(overallPct * 10) / 10,
            wbs_tree: nodes,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/delay-alerts', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                w.id as activity_id,
                w.id as wbs_id,
                w.code as wbs_code,
                w.name as activity_name,
                w.planned_qty,
                w.unit,
                w.planned_start,
                w.planned_end,
                w.status,
                COALESCE(rc.pct_complete, 0) as progress,
                COALESCE(rc.actual_qty, 0) as actual_qty
            FROM wbs_nodes w
            LEFT JOIN rollup_cache rc ON rc.wbs_node_id = w.id
            WHERE w.project_id = $1
              AND w.status IN ('DELAYED', 'AT_RISK', 'OVERDUE')
              AND w.id NOT IN (SELECT DISTINCT parent_id FROM wbs_nodes WHERE parent_id IS NOT NULL AND project_id = $1)
            ORDER BY w.planned_end ASC
        `, [req.params.id]);
        
        const alerts = result.rows.map(r => ({
            ...r,
            status: (r.status === 'DELAYED' || r.status === 'OVERDUE') ? 'Delayed' : 'At Risk'
        }));
        
        res.json({ alerts });
    } catch (err) {
        console.error('Delay alerts error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

