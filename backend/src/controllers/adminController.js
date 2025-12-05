import { query } from '../db/pool.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getAllUsers(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, is_verified, created_at, avatar, google_id
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'finance_manager', 'project_manager', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const { rowCount, rows } = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit({
      userId: req.user.userId,
      action: 'UPDATE_USER_ROLE',
      entityType: 'user',
      entityId: id,
      details: JSON.stringify({ newRole: role }),
    });

    res.json({ message: 'Role updated', user: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { rows } = await query(
      `SELECT al.id, al.user_id, u.email, al.action, al.entity_type,
              al.entity_id, al.details, al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getIntegrations(_req, res) {
  res.json([
    { id: 'sap', name: 'SAP ERP', status: 'DISCONNECTED' },
    { id: 'tally', name: 'Tally', status: 'DISCONNECTED' },
    { id: 'quickbooks', name: 'QuickBooks', status: 'DISCONNECTED' }
  ]);
}

export async function testIntegration(req, res) {
  const { integrationId } = req.body || {};
  res.json({
    integrationId,
    status: 'OK',
    message: 'Integration test successful (mock)',
  });
}
