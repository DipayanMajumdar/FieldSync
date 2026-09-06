const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'project-media';

let supabase;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

router.post('/upload-url', authenticate, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not configured' });

        const { projectId, wbsNodeId, mediaType, fileName, mimeType } = req.body;
        
        if (!projectId || !wbsNodeId || !mediaType || !fileName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const typeFolder = mediaType === 'photo' ? 'photos' : 'audio';
        const storagePath = `project/${projectId}/activity/${wbsNodeId}/${typeFolder}/${Date.now()}-${fileName}`;

        const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath);
        
        if (error) throw error;
        
        res.json({
            uploadUrl: data.signedUrl,
            storagePath: data.path,
            token: data.token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/confirm', authenticate, async (req, res) => {
    try {
        const { submissionId, projectId, wbsNodeId, storagePath, mediaType, fileName, fileSize, mimeType, gpsLat, gpsLng, capturedAt } = req.body;
        
        if (!storagePath) return res.status(400).json({ error: 'storagePath is required' });

        const result = await db.query(
            `INSERT INTO media_files (submission_id, project_id, wbs_node_id, uploader_id, bucket, storage_path, media_type, file_name, file_size, mime_type, gps_lat, gps_lng, captured_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [submissionId || null, projectId || null, wbsNodeId || null, req.user.id, bucket, storagePath, mediaType || null, fileName || null, fileSize || null, mimeType || null, gpsLat || null, gpsLng || null, capturedAt || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/submission/:submissionId', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM media_files WHERE submission_id = $1 ORDER BY created_at DESC', [req.params.submissionId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
