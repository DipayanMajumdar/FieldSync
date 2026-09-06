/**
 * FieldSync Rollup Engine v2
 *
 * Implements:
 *  1. Leaf node progress: actual_qty → pct_complete derivation
 *  2. Recursive weighted rollup from leaf up to L1
 *  3. Baseline planned_pct_complete from schedule dates (linear interpolation)
 *  4. Schedule variance = actual - planned
 *
 * All rollup_cache writes are atomic and synchronous before returning.
 */

/**
 * Derives pct_complete for a leaf node given a submission payload.
 * Priority: actual_qty (if planned_qty > 0), else pct_complete directly.
 */
function deriveLeafPct(actualQty, pctComplete, plannedQty) {
    if (actualQty !== undefined && actualQty !== null && plannedQty > 0) {
        return Math.min((actualQty / plannedQty) * 100, 100);
    }
    if (pctComplete !== undefined && pctComplete !== null) {
        return Math.max(0, Math.min(100, pctComplete));
    }
    return null; // neither provided — caller should reject
}

/**
 * Computes how far along the baseline schedule should be RIGHT NOW.
 * Uses linear interpolation between planned_start and planned_end.
 */
function computePlannedPct(plannedStart, plannedEnd) {
    if (!plannedStart || !plannedEnd) return null;
    const now = Date.now();
    const start = new Date(plannedStart).getTime();
    const end = new Date(plannedEnd).getTime();
    if (now < start) return 0;
    if (now >= end) return 100;
    return ((now - start) / (end - start)) * 100;
}

/**
 * Computes the dynamic status string from actual progress and schedule.
 */
function computeStatus(actualPct, plannedEnd) {
    if (actualPct >= 100) return 'COMPLETED';
    if (plannedEnd && new Date() > new Date(plannedEnd) && actualPct < 100) return 'OVERDUE';
    if (actualPct > 0) return 'IN_PROGRESS';
    return 'NOT_STARTED';
}

/**
 * Recursively rolls up a single node and all its ancestors.
 * For leaf nodes: reads the latest direct submission.
 * For parent nodes: weighted average of children's cached pct_complete.
 * If a direct submission on a non-leaf node exists AND is higher than
 * the children rollup, the direct submission wins (Manager Override).
 */
async function rollupNode(db, nodeId) {
    // 1. Leaf Node Update vs Recursive Aggregation
    const childrenRes = await db.query(
        'SELECT id, weight FROM wbs_nodes WHERE parent_id = $1',
        [nodeId]
    );
    const children = childrenRes.rows;

    const directSubRes = await db.query(
        'SELECT pct_complete, qty FROM submissions WHERE wbs_node_id = $1 ORDER BY captured_at DESC LIMIT 1',
        [nodeId]
    );
    const hasDirectSub = directSubRes.rows.length > 0;

    const nodeData = await db.query(
        'SELECT planned_qty, planned_start, planned_end FROM wbs_nodes WHERE id = $1',
        [nodeId]
    );
    const node = nodeData.rows[0] || {};
    const plannedQty = node.planned_qty || 0;
    const plannedStart = node.planned_start;
    const plannedEnd = node.planned_end;

    let pct_complete = 0;

    if (children.length === 0) {
        // LEAF NODE
        if (hasDirectSub) {
            const sub = directSubRes.rows[0];
            const derived = deriveLeafPct(sub.qty, sub.pct_complete, plannedQty);
            pct_complete = derived !== null ? derived : 0;
        }
    } else {
        // PARENT NODE: Recursive Weighted Aggregation (L4 up to L1)
        let totalWeight = 0;
        for (const c of children) {
            totalWeight += (parseFloat(c.weight) || 1.0); // Assume weight 1 if not set
        }

        if (totalWeight > 0) {
            let sumPct = 0;
            for (const child of children) {
                const cacheRes = await db.query('SELECT pct_complete FROM rollup_cache WHERE wbs_node_id = $1', [child.id]);
                const childPct = cacheRes.rows.length > 0 ? parseFloat(cacheRes.rows[0].pct_complete) : 0;
                
                const childWeight = parseFloat(child.weight) || 1.0;
                sumPct += childPct * (childWeight / totalWeight);
            }
            pct_complete = sumPct; 
            // Do not artificially cap the parent progress at 100%; the weighted math will naturally constrain it.
        } else {
            // Fallback to equal weighting across all children
            let sumPct = 0;
            for (const child of children) {
                const cacheRes = await db.query('SELECT pct_complete FROM rollup_cache WHERE wbs_node_id = $1', [child.id]);
                const childPct = cacheRes.rows.length > 0 ? parseFloat(cacheRes.rows[0].pct_complete) : 0;
                sumPct += childPct;
            }
            pct_complete = children.length > 0 ? (sumPct / children.length) : 0;
        }

        // Parent overriding (if needed)
        if (hasDirectSub) {
            const sub = directSubRes.rows[0];
            const derived = deriveLeafPct(sub.qty, sub.pct_complete, plannedQty);
            if (derived !== null && derived > pct_complete) pct_complete = derived;
        }
    }

    // 3. Schedule Variance & Status Logic
    // For parent nodes (planned_qty=0), sum children's actual_qty and planned_qty from rollup/wbs_nodes
    let actual_qty = 0;
    let effective_planned_qty = plannedQty;

    if (children.length > 0) {
        // Sum actual_qty from children's rollup_cache
        const childActualRes = await db.query(
            `SELECT COALESCE(SUM(rc.actual_qty), 0) as total_actual, 
                    COALESCE(SUM(w.planned_qty), 0) as total_planned
             FROM wbs_nodes w
             LEFT JOIN rollup_cache rc ON rc.wbs_node_id = w.id
             WHERE w.parent_id = $1`,
            [nodeId]
        );
        actual_qty = parseFloat(childActualRes.rows[0].total_actual) || 0;
        effective_planned_qty = parseFloat(childActualRes.rows[0].total_planned) || 0;
    } else {
        // Leaf node: derive actual_qty from pct_complete × planned_qty
        actual_qty = plannedQty > 0 ? (pct_complete / 100) * plannedQty : 0;
        effective_planned_qty = plannedQty;
    }

    const planned_pct = computePlannedPct(plannedStart, plannedEnd);
    
    // variance = actual_pct_complete - planned_pct_complete
    const variance = planned_pct !== null ? pct_complete - planned_pct : null;
    const status = computeStatus(pct_complete, plannedEnd);

    // Persist to rollup_cache
    await db.query(
        `INSERT INTO rollup_cache (wbs_node_id, pct_complete, actual_qty, computed_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (wbs_node_id)
         DO UPDATE SET pct_complete = EXCLUDED.pct_complete, actual_qty = EXCLUDED.actual_qty, computed_at = CURRENT_TIMESTAMP`,
        [nodeId, pct_complete, actual_qty]
    );

    // Also store effective_planned_qty on the node for display (update wbs_nodes planned_qty for parents)
    await db.query(
        `UPDATE wbs_nodes SET status = $1, planned_qty = CASE WHEN planned_qty = 0 AND $2 > 0 THEN $2 ELSE planned_qty END WHERE id = $3`,
        [status, effective_planned_qty, nodeId]
    );


    // Recursively update the next parent up the tree until reaching the L1 Project root node
    const parentRes = await db.query('SELECT parent_id FROM wbs_nodes WHERE id = $1', [nodeId]);
    if (parentRes.rows.length > 0 && parentRes.rows[0].parent_id) {
        await rollupNode(db, parentRes.rows[0].parent_id);
    }
}

/**
 * Full-project rollup: starts from all true leaf nodes and rolls up.
 * Use this to recompute the entire project from scratch.
 */
async function rollupProject(db, projectId) {
    // Find all leaf nodes (no children)
    const leavesRes = await db.query(`
        SELECT id FROM wbs_nodes
        WHERE project_id = $1
          AND id NOT IN (
            SELECT DISTINCT parent_id FROM wbs_nodes
            WHERE parent_id IS NOT NULL AND project_id = $1
          )
    `, [projectId]);

    for (const leaf of leavesRes.rows) {
        await rollupNode(db, leaf.id);
    }
}

module.exports = { rollupNode, rollupProject, deriveLeafPct, computePlannedPct, computeStatus };
