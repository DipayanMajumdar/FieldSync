require('dotenv').config();
const db = require('./db.js');
const { rollupNode } = require('./services/rollup.js');

async function seedMockData() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Nuke everything
    console.log("Cleaning up old data...");
    await client.query('DELETE FROM ai_suggestions');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM rollup_cache');
    await client.query('DELETE FROM wbs_nodes');
    await client.query('DELETE FROM projects');

    const uRes = await client.query("SELECT id FROM users LIMIT 1");
    let uid = uRes.rows.length > 0 ? uRes.rows[0].id : null;

    // Helper to insert a WBS node and initialize rollup_cache
    const insertNode = async (pid, parent, lvl, code, name, qty, startStr, endStr, weight = 1.0) => {
      const res = await client.query(
        `INSERT INTO wbs_nodes (project_id, parent_id, level, code, name, planned_qty, planned_start, planned_end, weight, unit) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [pid, parent, lvl, code, name, qty, startStr, endStr, weight, qty > 0 ? 'm³' : '%']
      );
      const id = res.rows[0].id;
      await client.query(`INSERT INTO rollup_cache (wbs_node_id, pct_complete, actual_qty) VALUES ($1, 0, 0)`, [id]);
      return id;
    };

    const addSub = async (nodeId, pct, qty, offsetDays) => {
      const date = new Date();
      date.setDate(date.getDate() - offsetDays);
      const res = await client.query(
        `INSERT INTO submissions (idempotency_key, wbs_node_id, user_id, pct_complete, qty, captured_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id`,
        [`sub-${nodeId}-${offsetDays}-${Date.now()}`, nodeId, uid, pct, qty, date]
      );
      return res.rows[0].id;
    };

    // ──────────────────────────────────────────────────────────────────────────
    // PROJECT 1: Metro Line 3 – Extension (Urban Rail)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("Seeding Project 1: Metro Line 3...");
    const p1 = (await client.query(
      `INSERT INTO projects (code, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['P-001', 'Metro Line 3', 'Extension of the urban metro railway — 3 new underground stations, 8.5km of twin tunnels.', uid]
    )).rows[0].id;

    // L1 – Project root (represents entire project)
    const p1_root = await insertNode(p1, null, 1, 'ML3', 'Metro Line 3 – Extension', 0, '2026-01-01', '2027-06-30');

    // L2 – Phases
    const p1_ph1 = await insertNode(p1, p1_root, 2, 'ML3-PH1', 'Phase 1: Site Prep & Earthworks', 0, '2026-01-01', '2026-06-30', 1.5);
    const p1_ph2 = await insertNode(p1, p1_root, 2, 'ML3-PH2', 'Phase 2: Foundation & Structural', 0, '2026-05-01', '2026-12-31', 2.0);
    const p1_ph3 = await insertNode(p1, p1_root, 2, 'ML3-PH3', 'Phase 3: Tunneling & Track Laying', 0, '2026-10-01', '2027-06-30', 3.0);

    // ── Phase 1 branch (goes to L6) ──
    const p1_a1 = await insertNode(p1, p1_ph1, 3, 'ML3-EW', 'Earthworks & Site Clearing', 0, '2026-01-01', '2026-04-30', 1.0);
    const p1_b1 = await insertNode(p1, p1_a1, 4, 'ML3-EW-N', 'North Sector Earthworks', 0, '2026-01-01', '2026-03-31', 1.2);
    const p1_c1 = await insertNode(p1, p1_b1, 5, 'ML3-EW-N-T', 'Topsoil Removal', 0, '2026-01-01', '2026-02-28', 1.0);
    const p1_exc = await insertNode(p1, p1_c1, 6, 'EXC-001', 'Excavation Block A', 2500, '2026-01-01', '2026-01-31');
    const p1_haul = await insertNode(p1, p1_c1, 6, 'EXC-002', 'Excavation Block B', 2000, '2026-02-01', '2026-02-28');

    const p1_c2 = await insertNode(p1, p1_b1, 5, 'ML3-EW-N-G', 'Site Grading & Compaction', 0, '2026-03-01', '2026-03-31', 0.8);
    const p1_grad = await insertNode(p1, p1_c2, 6, 'GRD-001', 'Grading North Sector', 1800, '2026-03-01', '2026-03-31');

    // ── Phase 1 – Utility Relocation (L3→L5) ──
    const p1_a2 = await insertNode(p1, p1_ph1, 3, 'ML3-UR', 'Utility Relocation', 0, '2026-03-01', '2026-06-30', 0.8);
    const p1_b2 = await insertNode(p1, p1_a2, 4, 'ML3-UR-E', 'Electrical Relocation', 0, '2026-03-01', '2026-05-31', 1.0);
    const p1_elec = await insertNode(p1, p1_b2, 5, 'ELEC-001', 'HV Cable Diversion – Sector A', 600, '2026-03-01', '2026-04-30');
    const p1_elec2 = await insertNode(p1, p1_b2, 5, 'ELEC-002', 'HV Cable Diversion – Sector B', 450, '2026-05-01', '2026-05-31');

    // ── Phase 2 branch (goes to L5) ──
    const p1_a3 = await insertNode(p1, p1_ph2, 3, 'ML3-FD', 'Foundation Works', 0, '2026-05-01', '2026-09-30', 1.5);
    const p1_b3 = await insertNode(p1, p1_a3, 4, 'ML3-FD-P', 'Deep Piling', 0, '2026-05-01', '2026-08-31', 1.0);
    const p1_pile1 = await insertNode(p1, p1_b3, 5, 'PILE-001', 'Bored Piling – Station A', 1200, '2026-05-01', '2026-06-30');
    const p1_pile2 = await insertNode(p1, p1_b3, 5, 'PILE-002', 'Bored Piling – Station B', 1000, '2026-07-01', '2026-08-31');

    const p1_a4 = await insertNode(p1, p1_ph2, 3, 'ML3-ST', 'Structural Concrete Works', 0, '2026-08-01', '2026-12-31', 2.0);
    const p1_b4 = await insertNode(p1, p1_a4, 4, 'ML3-ST-RC', 'Reinforced Concrete', 0, '2026-08-01', '2026-11-30', 1.0);
    const p1_rebar = await insertNode(p1, p1_b4, 5, 'RBR-001', 'Rebar Installation – Station A', 850, '2026-08-01', '2026-09-30');
    const p1_conc = await insertNode(p1, p1_b4, 5, 'CON-001', 'Concrete Pouring – Station A', 960, '2026-10-01', '2026-11-30');

    // ── Phase 3 (not yet started, L3→L5) ──
    const p1_a5 = await insertNode(p1, p1_ph3, 3, 'ML3-TN', 'TBM Tunneling', 0, '2026-10-01', '2027-04-30', 2.0);
    const p1_b5 = await insertNode(p1, p1_a5, 4, 'ML3-TN-N', 'North Tunnel Drive', 0, '2026-10-01', '2027-02-28', 1.0);
    const p1_tbm1 = await insertNode(p1, p1_b5, 5, 'TBM-001', 'TBM Launch & Drive – North', 4200, '2026-10-01', '2027-01-31');
    const p1_tbm2 = await insertNode(p1, p1_b5, 5, 'TBM-002', 'TBM Drive – South', 4200, '2026-11-01', '2027-02-28');

    // ──────────────────────────────────────────────────────────────────────────
    // PROJECT 2: Highway Bridge Reconstruction (Civil)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("Seeding Project 2: Highway Bridge Reconstruction...");
    const p2 = (await client.query(
      `INSERT INTO projects (code, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['P-002', 'NH-48 Bridge Reconstruction', 'Full reconstruction of the NH-48 highway bridge over Damodar River — 320m span, 4-lane.', uid]
    )).rows[0].id;

    // L1 – root
    const p2_root = await insertNode(p2, null, 1, 'BR48', 'NH-48 Bridge Project', 0, '2026-03-01', '2027-03-31');

    // L2 – Phases
    const p2_ph1 = await insertNode(p2, p2_root, 2, 'BR48-PH1', 'Phase 1: Demolition & Substructure', 0, '2026-03-01', '2026-09-30', 2.0);
    const p2_ph2 = await insertNode(p2, p2_root, 2, 'BR48-PH2', 'Phase 2: Superstructure & Deck', 0, '2026-08-01', '2027-01-31', 2.5);
    const p2_ph3 = await insertNode(p2, p2_root, 2, 'BR48-PH3', 'Phase 3: Surfacing & Completion', 0, '2026-12-01', '2027-03-31', 1.0);

    // ── Phase 1 (L6 leaves) ──
    const p2_a1 = await insertNode(p2, p2_ph1, 3, 'BR48-DM', 'Demolition Works', 0, '2026-03-01', '2026-05-31', 1.0);
    const p2_b1 = await insertNode(p2, p2_a1, 4, 'BR48-DM-S', 'Superstructure Demolition', 0, '2026-03-01', '2026-04-30', 1.0);
    const p2_c1 = await insertNode(p2, p2_b1, 5, 'BR48-DM-C', 'Concrete Breaking', 0, '2026-03-01', '2026-03-31', 1.0);
    const p2_dem1 = await insertNode(p2, p2_c1, 6, 'DEM-001', 'Deck Demolition – Left Half', 1100, '2026-03-01', '2026-03-15');
    const p2_dem2 = await insertNode(p2, p2_c1, 6, 'DEM-002', 'Deck Demolition – Right Half', 1100, '2026-03-16', '2026-03-31');

    const p2_a2 = await insertNode(p2, p2_ph1, 3, 'BR48-PL', 'Pile Foundation', 0, '2026-04-01', '2026-08-31', 1.5);
    const p2_b2 = await insertNode(p2, p2_a2, 4, 'BR48-PL-D', 'Driven Piling', 0, '2026-04-01', '2026-07-31', 1.0);
    const p2_pile1 = await insertNode(p2, p2_b2, 5, 'BR-PILE-001', 'Pile Group – Pier 1', 960, '2026-04-01', '2026-05-31');
    const p2_pile2 = await insertNode(p2, p2_b2, 5, 'BR-PILE-002', 'Pile Group – Pier 2', 960, '2026-06-01', '2026-07-31');

    // ── Phase 2 (L5 leaves) ──
    const p2_a3 = await insertNode(p2, p2_ph2, 3, 'BR48-SS', 'Superstructure Erection', 0, '2026-08-01', '2026-12-31', 2.0);
    const p2_b3 = await insertNode(p2, p2_a3, 4, 'BR48-SS-G', 'Girder Fabrication & Erection', 0, '2026-08-01', '2026-11-30', 1.0);
    const p2_gird1 = await insertNode(p2, p2_b3, 5, 'GDR-001', 'Girder Span 1 & 2', 1800, '2026-08-01', '2026-09-30');
    const p2_gird2 = await insertNode(p2, p2_b3, 5, 'GDR-002', 'Girder Span 3 & 4', 1800, '2026-10-01', '2026-11-30');

    // ── Phase 3 (L5 leaves, not started) ──
    const p2_a4 = await insertNode(p2, p2_ph3, 3, 'BR48-SF', 'Surfacing & Finishing', 0, '2026-12-01', '2027-03-31', 1.0);
    const p2_b4 = await insertNode(p2, p2_a4, 4, 'BR48-SF-A', 'Asphalt & Wearing Course', 0, '2026-12-01', '2027-02-28', 1.0);
    const p2_asph = await insertNode(p2, p2_b4, 5, 'ASPH-001', 'Asphalt Layer – Left Carriageway', 3200, '2026-12-01', '2027-01-31');
    const p2_asph2 = await insertNode(p2, p2_b4, 5, 'ASPH-002', 'Asphalt Layer – Right Carriageway', 3200, '2027-02-01', '2027-02-28');

    await client.query('COMMIT');
    console.log("WBS nodes inserted. Seeding progress submissions...");

    // ──────────────────────────────────────────────────────────────────────────
    // SUBMISSIONS — Only on leaf nodes. Rollup engine propagates upward.
    // ──────────────────────────────────────────────────────────────────────────
    const leafSubs = [];

    if (uid) {
      // Project 1 — leaves in Phase 1 (all complete/near-complete, happened months ago)
      await addSub(p1_exc,   100, 2500, 120);
      await addSub(p1_haul,  100, 2000, 90);
      await addSub(p1_grad,  100, 1800, 75);
      const elecSub1 = await addSub(p1_elec, 100, 600, 55);
      const elecSub2 = await addSub(p1_elec2, 60, 270, 20);

      // Project 1 — Phase 2 (in progress)
      await addSub(p1_pile1, 100, 1200, 40);
      await addSub(p1_pile2, 45, 450, 10);
      await addSub(p1_rebar, 30, 255, 5);
      const concSub = await addSub(p1_conc, 0, 0, 0);  // not started

      // Project 1 — Phase 3 (not started) — no submissions

      // Project 2 — Phase 1 (demolition done, piling in progress)
      await addSub(p2_dem1, 100, 1100, 110);
      await addSub(p2_dem2, 100, 1100, 95);
      await addSub(p2_pile1, 100, 960, 60);
      const pileSub2 = await addSub(p2_pile2, 55, 528, 15);

      // Project 2 — Phase 2 (just started)
      const girdSub = await addSub(p2_gird1, 20, 360, 5);

      // Project 2 — Phase 3 (not started) — no submissions

      // ── AI Suggestions on pending items ──
      await client.query(`DELETE FROM ai_suggestions`);
      await client.query(
        `INSERT INTO ai_suggestions (submission_id, suggested_pct_complete, suggested_notes, confidence, status) VALUES ($1,$2,$3,$4,$5)`,
        [elecSub2, 75, 'Drone imagery analysis shows cable installation is further along than reported.', 0.91, 'PENDING']
      );
      await client.query(
        `INSERT INTO ai_suggestions (submission_id, suggested_pct_complete, suggested_notes, confidence, status) VALUES ($1,$2,$3,$4,$5)`,
        [pileSub2, 70, 'Progress photographs indicate pile driving at ~70% completion for Pier 2 group.', 0.87, 'PENDING']
      );
      await client.query(
        `INSERT INTO ai_suggestions (submission_id, suggested_pct_complete, suggested_notes, confidence, status) VALUES ($1,$2,$3,$4,$5)`,
        [girdSub, 30, 'Girder erection imagery shows 2 of 6 spans fully landed — estimated 30%.', 0.93, 'PENDING']
      );

      leafSubs.push(
        // Project 1 leaves
        p1_exc, p1_haul, p1_grad, p1_elec, p1_elec2,
        p1_pile1, p1_pile2, p1_rebar, p1_conc,
        p1_tbm1, p1_tbm2,
        // Project 2 leaves
        p2_dem1, p2_dem2, p2_pile1, p2_pile2,
        p2_gird1, p2_gird2,
        p2_asph, p2_asph2
      );
    }

    console.log("Running rollup engine from all leaf nodes...");
    for (const leafId of leafSubs) {
      await rollupNode(db, leafId);
    }

    console.log("✅ Mock data seeded successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error seeding mock data:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedMockData();
