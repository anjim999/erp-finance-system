import { query } from '../db/pool.js';

export async function logAudit({ userId, action, entityType, entityId, details }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, entityType, entityId || null, details || null]
    );
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}
