const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('../db.js');

async function setup() {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await db.query(schema);
        console.log('Schema executed successfully.');

        console.log('Inserting default admin user...');
        const hash = bcrypt.hashSync('Admin@1234', 10);
        const userRes = await db.query(
            `INSERT INTO users (email, password_hash, name, role) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            ['admin@fieldsync.io', hash, 'Admin', 'admin']
        );
        let adminId;
        if (userRes.rows.length > 0) {
            adminId = userRes.rows[0].id;
        } else {
            const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1', ['admin@fieldsync.io']);
            adminId = existingAdmin.rows[0].id;
        }

        console.log('Inserting default project...');
        const projRes = await db.query(
            `INSERT INTO projects (code, name, description, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (code) DO NOTHING
             RETURNING id`,
            ['PRJ-001', 'Pipeline Expansion — Sector 7B', 'Phase 1 MVP Sample Project', adminId]
        );
        
        let projectId;
        if (projRes.rows.length > 0) {
            projectId = projRes.rows[0].id;
        } else {
            const existingProj = await db.query('SELECT id FROM projects WHERE code = $1', ['PRJ-001']);
            projectId = existingProj.rows[0].id;
        }

        console.log('Inserting sample WBS nodes...');
        // Level 1
        const wbs1 = await insertWbs(projectId, null, 1, 'L1', 'Project Level', 100);
        // Level 2
        const wbs2 = await insertWbs(projectId, wbs1, 2, 'L1.1', 'Phase 1', 100);
        // Level 3
        const wbs3 = await insertWbs(projectId, wbs2, 3, 'L1.1.1', 'Excavation', 100);
        // Level 4
        const wbs4 = await insertWbs(projectId, wbs3, 4, 'L1.1.1.1', 'Trenching', 100);
        // Level 5
        const wbs5 = await insertWbs(projectId, wbs4, 5, 'L1.1.1.1.1', 'Segment A', 100);
        // Level 6
        const wbs6 = await insertWbs(projectId, wbs5, 6, 'L1.1.1.1.1.1', 'Task 1', 100);

        console.log('Setup complete!');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

async function insertWbs(projectId, parentId, level, code, name, plannedQty) {
    const res = await db.query(
        `INSERT INTO wbs_nodes (project_id, parent_id, level, code, name, planned_qty)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (project_id, code) DO NOTHING
         RETURNING id`,
        [projectId, parentId, level, code, name, plannedQty]
    );
    let nodeId;
    if (res.rows.length > 0) {
        nodeId = res.rows[0].id;
    } else {
        const existing = await db.query('SELECT id FROM wbs_nodes WHERE project_id = $1 AND code = $2', [projectId, code]);
        nodeId = existing.rows[0].id;
    }
    
    // Insert into rollup_cache
    await db.query(
        `INSERT INTO rollup_cache (wbs_node_id, pct_complete, actual_qty)
         VALUES ($1, 0, 0)
         ON CONFLICT (wbs_node_id) DO NOTHING`,
        [nodeId]
    );

    return nodeId;
}

setup();
