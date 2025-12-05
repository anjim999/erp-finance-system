import { query } from '../db/pool.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getProjects(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT * FROM projects ORDER BY created_at DESC NULLS LAST, id DESC`
    ).catch(async (err) => {
      // If created_at doesn't exist, fallback simple order
      if (err) {
        const { rows: r } = await query(`SELECT * FROM projects ORDER BY id DESC`);
        return { rows: r };
      }
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;
    const {
      rows: [project],
    } = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, budget, start_date, end_date } = req.body;
    const {
      rows: [project],
    } = await query(
      `INSERT INTO projects (name, budget, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, 'Active')
       RETURNING *`,
      [name, budget, start_date, end_date]
    );
    await logAudit({
      userId: req.user.userId,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project.id,
      details: JSON.stringify(project),
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, budget, actual_cost, planned_progress, actual_progress, status } = req.body;
    const { rows, rowCount } = await query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           budget = COALESCE($2, budget),
           actual_cost = COALESCE($3, actual_cost),
           planned_progress = COALESCE($4, planned_progress),
           actual_progress = COALESCE($5, actual_progress),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [name, budget, actual_cost, planned_progress, actual_progress, status, id]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Project not found' });

    await logAudit({
      userId: req.user.userId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: id,
      details: JSON.stringify(rows[0]),
    });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getProjectProgressHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT date, planned_percent, actual_percent
       FROM project_progress
       WHERE project_id = $1
       ORDER BY date`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
