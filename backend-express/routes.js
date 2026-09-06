const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const csv = require('csv-parser');
const db = require('./db');

const rt = express.Router();

const p = db;
const ax = axios;

// =====================================================
// SUPABASE STORAGE & MULTER CONFIGURATION
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'fieldsync';

const storage = multer.memoryStorage();
const up = multer({ storage });

// =====================================================
// PROJECTS
// =====================================================

rt.get('/projects', async (q, rs) => {
  try {
    const d = await p.query(`
      SELECT
        id,
        tnt,
        nm,
        st
      FROM prj
      ORDER BY id
    `);

    rs.json(d.rows);

  } catch (e) {
    console.error("PROJECTS ERR FULL:", e);
    console.error("PROJECTS ERR MESSAGE:", e?.message);
    console.error("PROJECTS ERR STACK:", e?.stack);

    rs.status(500).json({
      err: "Failed to fetch projects",
      message: e?.message || String(e),
      code: e?.code || null,
      detail: e?.detail || null
    });
  }
});

// =====================================================
// PROJECT WBS
// =====================================================

rt.get('/prj/:id/wbs', async (q, rs) => {
  try {
    const d = await p.query(`
      SELECT
        w.id AS wbs_id,
        w.pid,
        w.cd AS wbs_code,
        w.nm AS wbs_name,
        w.lvl,

        a.id AS activity_id,
        a.plan_qty,
        a.act_qty,
        a.unt

      FROM wbs w

      LEFT JOIN act a
        ON a.wid = w.id

      WHERE w.pid = $1

      ORDER BY
        w.lvl,
        w.id,
        a.id
    `, [q.params.id]);

    rs.json(d.rows);

  } catch (e) {
    console.error('WBS ERR:', e.message);

    rs.status(500).json({
      err: 'Failed to fetch WBS data',
      message: e.message
    });
  }
});

// =====================================================
// ACTIVITY DETAILS
// =====================================================

rt.get('/activity/:id', async (q, rs) => {
  try {
    const d = await p.query(`
      SELECT
        a.id AS activity_id,
        a.wid,
        a.plan_qty,
        a.act_qty,
        a.unt,

        w.id AS wbs_id,
        w.cd AS wbs_code,
        w.nm AS wbs_name,
        w.lvl,
        w.pid

      FROM act a

      JOIN wbs w
        ON a.wid = w.id

      WHERE a.id = $1
    `, [q.params.id]);

    if (!d.rows.length) {
      return rs.status(404).json({
        err: 'Activity not found'
      });
    }

    const activity = d.rows[0];

    const planned =
      Number(activity.plan_qty || 0);

    const actual =
      Number(activity.act_qty || 0);

    const progress =
      planned > 0
        ? Math.min(
            100,
            Number(
              ((actual / planned) * 100).toFixed(2)
            )
          )
        : 0;

    let status = 'Pending';

    if (progress >= 100) {
      status = 'Completed';
    } else if (progress >= 70) {
      status = 'In Progress';
    } else if (progress >= 40) {
      status = 'At Risk';
    } else if (progress > 0) {
      status = 'Delayed';
    }

    rs.json({
      activity_id: activity.activity_id,
      wbs_id: activity.wbs_id,
      wbs_code: activity.wbs_code,
      activity_name: activity.wbs_name,
      level: activity.lvl,
      project_id: activity.pid,

      planned_qty: planned,
      actual_qty: actual,

      unit: activity.unt || '%',

      progress,
      status
    });

  } catch (e) {
    console.error('ACTIVITY ERR:', e.message);

    rs.status(500).json({
      err: 'Failed to fetch activity',
      message: e.message
    });
  }
});

// =====================================================
// GET EVIDENCE
// =====================================================

rt.get('/evidence/:pid', async (q, rs) => {
  const pid = q.params.pid;

  try {
    const d = await p.query(`
      SELECT

        e.id AS evidence_id,
        e.pid AS activity_id,
        e.loc,
        e.uri,
        e.ai_result,
        e.ai_confidence,
        e.review_status,
        e.review_reason,
        e.reviewed_by,
        e.reviewed_at,
        e.created_at,

        a.id AS act_id,
        a.plan_qty,
        a.act_qty,
        a.unt,

        w.id AS wbs_id,
        w.cd AS wbs_code,
        w.nm AS activity_name,
        w.pid AS project_id

      FROM evd e

      LEFT JOIN act a
        ON e.pid = a.id

      LEFT JOIN wbs w
        ON a.wid = w.id

      WHERE w.pid = $1

      ORDER BY
        e.created_at DESC,
        e.id DESC
    `, [pid]);

    const evidence = d.rows.map((item) => {

      let latitude = null;
      let longitude = null;

      // -----------------------------------------
      // GPS PARSING
      // -----------------------------------------

      if (item.loc) {
        const parts =
          String(item.loc)
            .split(',')
            .map((x) => x.trim());

        if (parts.length === 2) {
          const parsedLat = Number(parts[0]);
          const parsedLng = Number(parts[1]);

          if (
            Number.isFinite(parsedLat) &&
            Number.isFinite(parsedLng)
          ) {
            latitude = parsedLat;
            longitude = parsedLng;
          }
        }
      }

      return {
        evidence_id: item.evidence_id,

        activity_id: item.activity_id,

        wbs_id: item.wbs_id,

        wbs_code: item.wbs_code,

        activity_name: item.activity_name,

        // ---------------------------------------
        // IMAGE URL (Supabase Storage)
        // ---------------------------------------

        uri:
          item.uri || null,

        // ---------------------------------------
        // GPS
        // ---------------------------------------

        loc: item.loc || null,

        latitude,
        longitude,

        // ---------------------------------------
        // QUANTITY
        // ---------------------------------------

        plan_qty:
          Number(item.plan_qty || 0),

        actual_qty:
          Number(item.act_qty || 0),

        unit:
          item.unt || '%',

        // ---------------------------------------
        // AI
        // ---------------------------------------

        ai_result:
          item.ai_result || null,

        ai_confidence:
          Number(item.ai_confidence || 0),

        // ---------------------------------------
        // REVIEW
        // ---------------------------------------

        review_status:
          item.review_status ||
          'Pending Review',

        review_reason:
          item.review_reason || null,

        reviewed_by:
          item.reviewed_by || null,

        reviewed_at:
          item.reviewed_at || null,

        created_at:
          item.created_at || null
      };
    });

    rs.json({
      project_id: Number(pid),
      total: evidence.length,
      evidence
    });

  } catch (e) {
    console.error('EVIDENCE GET ERR:', e);

    rs.status(500).json({
      err: 'Failed to fetch evidence',
      message: e.message
    });
  }
});

// =====================================================
// UPLOAD FIELD EVIDENCE
// =====================================================

rt.post(
  '/evd',
  up.single('file'),
  async (q, rs) => {

    const {
      id,
      w,
      t,
      lat,
      lng
    } = q.body;

    // -----------------------------------------
    // GPS
    // -----------------------------------------

    const latitude =
      lat !== undefined && lat !== ''
        ? Number(lat)
        : null;

    const longitude =
      lng !== undefined && lng !== ''
        ? Number(lng)
        : null;

    // -----------------------------------------
    // STORE GPS IN loc
    // -----------------------------------------

    const location =
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
        ? `${latitude},${longitude}`
        : null;

    // -----------------------------------------
    // CLEAN FILE URL
    // -----------------------------------------

    let u = q.body.u;
    if (q.file) {
      const fileName = Date.now() + '-' + q.file.originalname;
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(fileName, q.file.buffer, {
          contentType: q.file.mimetype
        });

      if (error) {
        throw new Error('Supabase upload failed: ' + error.message);
      }
      
      const { data: publicUrlData } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
        
      u = publicUrlData.publicUrl;
    }

    try {

      // -----------------------------------------
      // REQUIRED ACTIVITY CHECK
      // -----------------------------------------

      if (!id) {
        return rs.status(400).json({
          err: 'Activity ID is required'
        });
      }

      // -----------------------------------------
      // FILE CHECK
      // -----------------------------------------

      if (!q.file && !q.body.u) {
        return rs.status(400).json({
          err: 'Evidence file is required'
        });
      }

      // -----------------------------------------
      // AI ANALYSIS
      // -----------------------------------------

      let aiResult = 'AI analysis completed';
      let aiConfidence = 90;

      if (q.file) {

        const form = new FormData();

        const isImage =
          q.file.mimetype &&
          q.file.mimetype.startsWith('image/');

        const isAudio =
          q.file.mimetype &&
          q.file.mimetype.startsWith('audio/');

        // ---------------------------------------
        // IMAGE
        // ---------------------------------------

        if (isImage) {

          form.append(
            'image',
            q.file.buffer,
            {
              filename: q.file.originalname,
              contentType: q.file.mimetype
            }
          );

        }

        // ---------------------------------------
        // AUDIO
        // ---------------------------------------

        else if (isAudio) {

          form.append(
            'audio',
            q.file.buffer,
            {
              filename: q.file.originalname,
              contentType: q.file.mimetype
            }
          );

        }

        // ---------------------------------------
        // SEND TO CLOUD AI WORKER
        // ---------------------------------------

        if (isImage || isAudio) {

          const ai =
            await ax.post(
              'https://fieldsync-ai-worker.onrender.com/analyze',
              form,
              {
                headers: form.getHeaders(),

                maxContentLength:
                  Infinity,

                maxBodyLength:
                  Infinity
              }
            );

          // -------------------------------------
          // PARSE AI RESPONSE
          // -------------------------------------

          if (
            Array.isArray(
              ai.data?.vision_analysis
            ) &&
            ai.data.vision_analysis.length
          ) {

            aiResult =
              ai.data.vision_analysis
                .map((x) => {

                  const name =
                    x.class_name ||
                    x.class ||
                    x.name ||
                    'object';

                  return `Detected: ${name}`;
                })
                .join(', ');

            aiConfidence =
              Number(
                ai.data.vision_analysis[0]?.confidence ||
                90
              );

          }

          else if (
            ai.data?.voice_transcript
          ) {

            const transcript =
              ai.data.voice_transcript;

            aiResult =
              transcript?.text ||
              transcript?.transcript ||
              'Voice transcription completed';

            aiConfidence =
              Number(
                transcript?.confidence ||
                90
              );

          }

          else {

            aiResult =
              'AI analysis completed';

            aiConfidence = 90;
          }
        }
      }

      // -----------------------------------------
      // SAVE EVIDENCE
      // -----------------------------------------

      const ev = await p.query(`
        INSERT INTO evd
        (
          pid,
          loc,
          uri,
          ai_result,
          ai_confidence,
          review_status,
          created_at
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_TIMESTAMP
        )

        RETURNING
          id,
          pid,
          loc,
          uri,
          ai_result,
          ai_confidence,
          review_status,
          created_at
      `, [
        parseInt(id),
        location,
        u,
        aiResult,
        aiConfidence,
        'Pending Review'
      ]);

      // -----------------------------------------
      // RESPONSE
      // -----------------------------------------

      rs.json({
        st:
          'Evidence uploaded successfully',

        db:
          ev.rows[0],

        ai: {
          result:
            aiResult,

          confidence:
            aiConfidence
        },

        gps: {
          latitude,
          longitude,
          location
        },

        image_url:
          u
      });

    } catch (e) {

      console.error(
        'EVIDENCE UPLOAD ERR:',
        e
      );

      rs.status(500).json({
        err:
          'Failed to upload evidence',

        message:
          e.message
      });
    }
  }
);

// =====================================================
// BRG
// =====================================================

rt.post('/brg', async (q, rs) => {

  const {
    wid,
    pp
  } = q.body;

  try {

    const t = await p.query(
      'SELECT * FROM act WHERE wid = $1',
      [wid]
    );

    if (!t.rows.length) {
      return rs.status(404).json({
        err: 'not found'
      });
    }

    const b =
      Number(
        t.rows[0].act_qty || 0
      );

    const d =
      Number(pp) - b;

    const s = await p.query(
      `INSERT INTO aud
       (
         uid,
         act,
         bfr,
         aft
       )
       VALUES
       (
         $1,
         $2,
         $3,
         $4
       )
       RETURNING id`,
      [
        'sys',
        'ai_sg',
        b,
        pp
      ]
    );

    rs.json({
      dev: d,
      sug: s.rows[0].id
    });

  } catch (e) {

    console.error(
      'BRG ERR:',
      e.message
    );

    rs.status(500).json({
      err: 1
    });
  }
});

// =====================================================
// APPROVE EVIDENCE
// =====================================================

rt.post('/approve', async (q, rs) => {

  const {
    activity_id,
    evidence_id,
    actual_qty
  } = q.body;

  try {

    // -----------------------------------------
    // REQUIRED FIELD CHECK
    // -----------------------------------------

    if (
      !activity_id ||
      !evidence_id ||
      actual_qty === undefined
    ) {
      return rs.status(400).json({
        err:
          'activity_id, evidence_id and actual_qty are required'
      });
    }

    // -----------------------------------------
    // CHECK ACTIVITY
    // -----------------------------------------

    const activity = await p.query(
      `SELECT
         id,
         act_qty
       FROM act
       WHERE id = $1`,
      [activity_id]
    );

    if (!activity.rows.length) {
      return rs.status(404).json({
        err: 'Activity not found'
      });
    }

    // -----------------------------------------
    // CHECK EXACT EVIDENCE
    // -----------------------------------------

    const evidence = await p.query(
      `SELECT
         id,
         pid,
         review_status
       FROM evd
       WHERE id = $1
         AND pid = $2`,
      [
        evidence_id,
        activity_id
      ]
    );

    if (!evidence.rows.length) {
      return rs.status(404).json({
        err:
          'Evidence not found for this activity'
      });
    }

    const before =
      Number(
        activity.rows[0].act_qty || 0
      );

    const after =
      Number(actual_qty);

    if (!Number.isFinite(after)) {
      return rs.status(400).json({
        err:
          'actual_qty must be a valid number'
      });
    }

    // -----------------------------------------
    // UPDATE ACTIVITY
    // -----------------------------------------

    await p.query(
      `UPDATE act
       SET act_qty = $1
       WHERE id = $2`,
      [
        after,
        activity_id
      ]
    );

    // -----------------------------------------
    // UPDATE EXACT EVIDENCE
    // -----------------------------------------

    await p.query(
      `UPDATE evd
       SET
         review_status = 'Approved',
         review_reason = NULL,
         reviewed_by = 'sys_manager',
         reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [evidence_id]
    );

    // -----------------------------------------
    // AUDIT LOG
    // -----------------------------------------

    await p.query(
      `INSERT INTO aud
       (
         uid,
         act,
         bfr,
         aft
       )
       VALUES
       (
         $1,
         $2,
         $3,
         $4
       )`,
      [
        'sys_manager',
        'progress_update',
        before,
        after
      ]
    );

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    rs.json({
      st:
        'Progress successfully updated',

      activity_id:
        Number(activity_id),

      evidence_id:
        Number(evidence_id),

      before,
      after,

      review_status:
        'Approved'
    });

  } catch (e) {

    console.error(
      'APPROVE ERR:',
      e
    );

    rs.status(500).json({
      err:
        'Failed to update progress',

      message:
        e.message
    });
  }
});

// =====================================================
// REJECT EVIDENCE
// =====================================================

rt.post('/reject', async (q, rs) => {

  const {
    activity_id,
    evidence_id,
    reason
  } = q.body;

  try {

    // -----------------------------------------
    // REQUIRED FIELD CHECK
    // -----------------------------------------

    if (
      !activity_id ||
      !evidence_id
    ) {
      return rs.status(400).json({
        err:
          'activity_id and evidence_id are required'
      });
    }

    // -----------------------------------------
    // CHECK ACTIVITY
    // -----------------------------------------

    const activity = await p.query(
      `SELECT
         id,
         act_qty
       FROM act
       WHERE id = $1`,
      [activity_id]
    );

    if (!activity.rows.length) {
      return rs.status(404).json({
        err: 'Activity not found'
      });
    }

    // -----------------------------------------
    // CHECK EXACT EVIDENCE
    // -----------------------------------------

    const evidence = await p.query(
      `SELECT
         id,
         pid,
         review_status
       FROM evd
       WHERE id = $1
         AND pid = $2`,
      [
        evidence_id,
        activity_id
      ]
    );

    if (!evidence.rows.length) {
      return rs.status(404).json({
        err:
          'Evidence not found for this activity'
      });
    }

    const currentQty =
      Number(
        activity.rows[0].act_qty || 0
      );

    const rejectReason =
      reason ||
      'Evidence rejected';

    // -----------------------------------------
    // UPDATE EXACT EVIDENCE
    // -----------------------------------------

    const updatedEvidence =
      await p.query(
        `UPDATE evd
         SET
           review_status = 'Rejected',
           review_reason = $1,
           reviewed_by = 'sys_manager',
           reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING
           id,
           pid,
           review_status,
           review_reason,
           reviewed_by,
           reviewed_at`,
        [
          rejectReason,
          evidence_id
        ]
      );

    // -----------------------------------------
    // AUDIT LOG
    // -----------------------------------------

    await p.query(
      `INSERT INTO aud
       (
         uid,
         act,
         bfr,
         aft
       )
       VALUES
       (
         $1,
         $2,
         $3,
         $4
       )`,
      [
        'sys_manager',
        'evidence_rejected',
        currentQty,
        currentQty
      ]
    );

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    rs.json({
      st:
        'Evidence rejected successfully',

      activity_id:
        Number(activity_id),

      evidence_id:
        Number(evidence_id),

      reason:
        rejectReason,

      evidence:
        updatedEvidence.rows[0] || null
    });

  } catch (e) {

    console.error(
      'REJECT ERR:',
      e
    );

    rs.status(500).json({
      err:
        'Failed to reject evidence',

      message:
        e.message
    });
  }
});

// =====================================================
// SCHEDULE CSV UPLOAD
// =====================================================

rt.post(
  '/schedule/upload',
  up.single('file'),
  async (q, rs) => {

    const tasks = [];

    const pid =
      q.body.pid || 1;

    // -----------------------------------------
    // CHECK FILE
    // -----------------------------------------

    if (!q.file) {
      return rs.status(400).json({
        err: 'CSV file is required'
      });
    }

    // -----------------------------------------
    // PARSE CSV
    // -----------------------------------------

    require('stream').Readable.from(q.file.buffer)
      .pipe(csv())

      .on('data', (row) => {
        tasks.push(row);
      })

      .on('end', async () => {

        try {

          // -----------------------------------
          // INSERT EACH CSV TASK
          // -----------------------------------

          for (const t of tasks) {

            // -------------------------------
            // INSERT WBS
            // -------------------------------

            const wbs =
              await p.query(
                `INSERT INTO wbs
                 (
                   pid,
                   cd,
                   nm
                 )
                 VALUES
                 (
                   $1,
                   $2,
                   $3
                 )
                 RETURNING id`,
                [
                  pid,
                  t.wbs_code,
                  t.wbs_name
                ]
              );

            // -------------------------------
            // INSERT ACTIVITY
            // -------------------------------

            await p.query(
              `INSERT INTO act
               (
                 wid,
                 plan_qty,
                 act_qty,
                 unt
               )
               VALUES
               (
                 $1,
                 $2,
                 $3,
                 $4
               )`,
              [
                wbs.rows[0].id,

                Number(
                  t.planned_qty || 100
                ),

                Number(
                  t.actual_qty || 0
                ),

                t.unit || 'pct'
              ]
            );
          }

          // -----------------------------------
          // RESPONSE
          // -----------------------------------

          rs.json({
            st:
              `Successfully imported ${tasks.length} WBS tasks into PostgreSQL.`
          });

        } catch (e) {

          console.error(
            'INGESTION ERR:',
            e.message
          );

          rs.status(500).json({
            err:
              'Database insertion failed',

            message:
              e.message
          });
        }
      });
  }
);

// =====================================================
// DELAY ALERTS
// =====================================================

rt.get('/delay-alerts/:pid', async (q, rs) => {

  const pid =
    q.params.pid;

  try {

    const d = await p.query(`
      SELECT

        a.id AS activity_id,

        a.plan_qty,
        a.act_qty,
        a.unt,

        w.id AS wbs_id,
        w.cd AS wbs_code,
        w.nm AS activity_name,
        w.pid,
        w.lvl

      FROM act a

      JOIN wbs w
        ON a.wid = w.id

      WHERE w.pid = $1

      ORDER BY
        a.id
    `, [pid]);

    const alerts =
      d.rows
        .map((item) => {

          const planned =
            Number(
              item.plan_qty || 0
            );

          const actual =
            Number(
              item.act_qty || 0
            );

          const progress =
            planned > 0
              ? Number(
                  Math.min(
                    100,
                    (actual / planned) * 100
                  ).toFixed(2)
                )
              : 0;

          let status = null;

          if (progress === 0) {
            status = 'Delayed';
          } else if (progress < 40) {
            status = 'Delayed';
          } else if (progress < 70) {
            status = 'At Risk';
          }

          if (!status) {
            return null;
          }

          return {
            activity_id:
              item.activity_id,

            wbs_id:
              item.wbs_id,

            wbs_code:
              item.wbs_code,

            activity_name:
              item.activity_name,

            planned_qty:
              planned,

            actual_qty:
              actual,

            progress,

            status,

            unit:
              item.unt || '%'
          };
        })
        .filter(Boolean);

    rs.json({
      project_id:
        Number(pid),

      total_alerts:
        alerts.length,

      delayed_count:
        alerts.filter(
          (x) =>
            x.status === 'Delayed'
        ).length,

      at_risk_count:
        alerts.filter(
          (x) =>
            x.status === 'At Risk'
        ).length,

      alerts
    });

  } catch (e) {

    console.error(
      'DELAY ALERTS ERR:',
      e.message
    );

    rs.status(500).json({
      err:
        'Failed to fetch delay alerts',

      message:
        e.message
    });
  }
});

// =====================================================
// DASHBOARD
// =====================================================

rt.get('/dashboard/:pid', async (q, rs) => {

  const pid =
    Number(q.params.pid);

  try {

    // =================================================
    // 1. PROJECT INFORMATION
    // =================================================

    const projectRes =
      await p.query(`
        SELECT
          id,
          tnt,
          nm,
          st
        FROM prj
        WHERE id = $1
      `, [pid]);

    if (!projectRes.rows.length) {
      return rs.status(404).json({
        err:
          'Project not found'
      });
    }

    const project =
      projectRes.rows[0];

    // =================================================
    // 2. ACTIVITY STATISTICS
    // =================================================

    const progressRes =
      await p.query(`
        SELECT

          COUNT(a.id)
            AS total_activities,

          COUNT(
            CASE
              WHEN
                a.plan_qty > 0
                AND a.act_qty >= a.plan_qty
              THEN 1
            END
          )
            AS completed_activities,

          COUNT(
            CASE
              WHEN
                COALESCE(a.act_qty, 0) = 0
              THEN 1
            END
          )
            AS pending_activities,

          COALESCE(
            SUM(a.plan_qty),
            0
          )
            AS total_planned_qty,

          COALESCE(
            SUM(a.act_qty),
            0
          )
            AS total_actual_qty

        FROM act a

        JOIN wbs w
          ON a.wid = w.id

        WHERE w.pid = $1
      `, [pid]);

    const stats =
      progressRes.rows[0];

    const totalActivities =
      Number(
        stats.total_activities || 0
      );

    const completedActivities =
      Number(
        stats.completed_activities || 0
      );

    const pendingActivities =
      Number(
        stats.pending_activities || 0
      );

    const plannedQty =
      Number(
        stats.total_planned_qty || 0
      );

    const actualQty =
      Number(
        stats.total_actual_qty || 0
      );

    // =================================================
    // 3. OVERALL PROGRESS
    // =================================================

    const overallProgress =
      plannedQty > 0
        ? Number(
            Math.min(
              100,
              (actualQty / plannedQty) * 100
            ).toFixed(2)
          )
        : 0;

    // =================================================
    // 4. EVIDENCE STATISTICS
    // =================================================

    const evidenceStatsRes =
      await p.query(`
        SELECT

          COUNT(e.id)
            AS evidence_count,

          COUNT(
            CASE
              WHEN
                e.review_status =
                'Approved'
              THEN 1
            END
          )
            AS approved_evidence,

          COUNT(
            CASE
              WHEN
                e.review_status =
                'Rejected'
              THEN 1
            END
          )
            AS rejected_evidence,

          COUNT(
            CASE
              WHEN
                e.review_status IS NULL
                OR
                e.review_status =
                'Pending Review'
              THEN 1
            END
          )
            AS pending_evidence

        FROM evd e

        JOIN act a
          ON e.pid = a.id

        JOIN wbs w
          ON a.wid = w.id

        WHERE w.pid = $1
      `, [pid]);

    const evidenceStats =
      evidenceStatsRes.rows[0];

    const evidenceCount =
      Number(
        evidenceStats.evidence_count || 0
      );

    const approvedEvidence =
      Number(
        evidenceStats.approved_evidence || 0
      );

    const rejectedEvidence =
      Number(
        evidenceStats.rejected_evidence || 0
      );

    const pendingEvidence =
      Number(
        evidenceStats.pending_evidence || 0
      );

    // =================================================
    // 5. ACTIVITY-WISE PROGRESS
    // =================================================

    const activityRes =
      await p.query(`
        SELECT

          a.id AS activity_id,

          w.id AS wbs_id,

          w.cd AS wbs_code,

          w.nm AS activity_name,

          a.plan_qty,

          a.act_qty,

          a.unt

        FROM act a

        JOIN wbs w
          ON a.wid = w.id

        WHERE w.pid = $1

        ORDER BY
          w.lvl,
          w.id,
          a.id
      `, [pid]);

    const activities =
      activityRes.rows.map(
        (item) => {

          const plan =
            Number(
              item.plan_qty || 0
            );

          const actual =
            Number(
              item.act_qty || 0
            );

          const progress =
            plan > 0
              ? Number(
                  Math.min(
                    100,
                    (actual / plan) * 100
                  ).toFixed(2)
                )
              : 0;

          let status =
            'Pending';

          if (progress >= 100) {
            status =
              'Completed';

          } else if (progress >= 70) {
            status =
              'In Progress';

          } else if (progress >= 40) {
            status =
              'At Risk';

          } else if (progress > 0) {
            status =
              'Delayed';
          }

          return {
            activity_id:
              item.activity_id,

            wbs_id:
              item.wbs_id,

            wbs_code:
              item.wbs_code,

            activity_name:
              item.activity_name,

            planned_qty:
              plan,

            actual_qty:
              actual,

            progress,

            status,

            unit:
              item.unt || '%'
          };
        }
      );

    // =================================================
    // 6. DELAY / RISK
    // =================================================

    const delayedActivities =
      activities.filter(
        (x) =>
          x.status === 'Delayed'
      );

    const atRiskActivities =
      activities.filter(
        (x) =>
          x.status === 'At Risk'
      );

    // =================================================
    // 7. RECENT EVIDENCE
    // =================================================

    const recentEvidenceRes =
      await p.query(`
        SELECT

          e.id AS evidence_id,

          e.pid AS activity_id,

          e.loc,

          e.uri,

          e.ai_result,

          e.ai_confidence,

          e.review_status,

          e.review_reason,

          e.reviewed_by,

          e.reviewed_at,

          e.created_at,

          w.cd AS wbs_code,

          w.nm AS activity_name

        FROM evd e

        JOIN act a
          ON e.pid = a.id

        JOIN wbs w
          ON a.wid = w.id

        WHERE w.pid = $1

        ORDER BY
          e.created_at DESC,
          e.id DESC

        LIMIT 10
      `, [pid]);

    const recentEvidence =
      recentEvidenceRes.rows.map(
        (item) => {

          let latitude = null;
          let longitude = null;

          // -----------------------------------------
          // GPS PARSING
          // -----------------------------------------

          if (item.loc) {

            const parts =
              String(item.loc)
                .split(',')
                .map((x) => x.trim());

            if (parts.length === 2) {

              const parsedLat =
                Number(parts[0]);

              const parsedLng =
                Number(parts[1]);

              if (
                Number.isFinite(parsedLat) &&
                Number.isFinite(parsedLng)
              ) {

                latitude =
                  parsedLat;

                longitude =
                  parsedLng;
              }
            }
          }

          return {

            evidence_id:
              item.evidence_id,

            activity_id:
              item.activity_id,

            wbs_code:
              item.wbs_code,

            activity_name:
              item.activity_name,

            // ---------------------------------------
            // IMAGE URL (Supabase Storage)
            // ---------------------------------------

            uri:
              item.uri || null,

            loc:
              item.loc || null,

            latitude,
            longitude,

            ai_result:
              item.ai_result || null,

            ai_confidence:
              Number(
                item.ai_confidence || 0
              ),

            review_status:
              item.review_status ||
              'Pending Review',

            review_reason:
              item.review_reason || null,

            reviewed_by:
              item.reviewed_by || null,

            reviewed_at:
              item.reviewed_at || null,

            created_at:
              item.created_at || null
          };
        }
      );

    // =================================================
    // 8. RECENT AUDIT ACTIVITY
    // =================================================

    const auditRes =
      await p.query(`
        SELECT

          id,
          uid,
          act,
          bfr,
          aft

        FROM aud

        ORDER BY
          id DESC

        LIMIT 10
      `);

    // =================================================
    // 9. FINAL DASHBOARD RESPONSE
    // =================================================

    rs.json({

      // -----------------------------
      // PROJECT
      // -----------------------------

      project_id:
        pid,

      project: {

        id:
          project.id,

        code:
          project.tnt,

        name:
          project.nm,

        status:
          project.st
      },

      // -----------------------------
      // PROGRESS
      // -----------------------------

      overall_progress_pct:
        overallProgress,

      total_planned_qty:
        plannedQty,

      total_actual_qty:
        actualQty,

      // -----------------------------
      // ACTIVITIES
      // -----------------------------

      total_activities:
        totalActivities,

      completed_activities:
        completedActivities,

      pending_activities:
        pendingActivities,

      // -----------------------------
      // EVIDENCE
      // -----------------------------

      evidence_count:
        evidenceCount,

      approved_evidence:
        approvedEvidence,

      rejected_evidence:
        rejectedEvidence,

      pending_evidence:
        pendingEvidence,

      // -----------------------------
      // DELAYS
      // -----------------------------

      total_delayed:
        delayedActivities.length,

      total_at_risk:
        atRiskActivities.length,

      alerts: [
        ...delayedActivities,
        ...atRiskActivities
      ],

      // -----------------------------
      // ACTIVITIES
      // -----------------------------

      activities,

      // -----------------------------
      // RECENT EVIDENCE
      // -----------------------------

      recent_evidence:
        recentEvidence,

      // -----------------------------
      // AUDIT
      // -----------------------------

      recent_audit:
        auditRes.rows
    });

  } catch (e) {

    console.error(
      'DASHBOARD ERR:',
      e
    );

    rs.status(500).json({

      err:
        'Dashboard generation failed',

      message:
        e.message
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = rt;