const db = require('../db');

async function log(dbInstance, { userId, action, targetType, targetId, before, after, ip }) {
    try {
        await dbInstance.query(
            `INSERT INTO audit_log (user_id, action, target_type, target_id, before_state, after_state, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId, 
                action, 
                targetType, 
                targetId, 
                before ? JSON.stringify(before) : null, 
                after ? JSON.stringify(after) : null, 
                ip
            ]
        );
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}

module.exports = { log };
