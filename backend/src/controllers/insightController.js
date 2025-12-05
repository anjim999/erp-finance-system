import { query } from '../db/pool.js';
import { logAudit } from '../utils/auditLogger.js';

function riskLevelFromScore(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export async function getProjectRisk(req, res, next) {
  try {
    const { projectId } = req.params;

    const {
      rows: [project],
    } = await query(
      `SELECT id, name, budget, actual_cost, planned_progress, actual_progress
       FROM projects WHERE id = $1`,
      [projectId]
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { rows: invRows } = await query(
      `SELECT amount_base, due_date, paid_amount_base
       FROM invoices
       WHERE project_id = $1 AND type = 'AR'`,
      [projectId]
    );

    let riskScore = 0;
    const now = new Date();

    let overdueCount = 0;
    let overdueAmount = 0;
    for (const inv of invRows) {
      const due = new Date(inv.due_date);
      const remaining = Number(inv.amount_base) - Number(inv.paid_amount_base || 0);
      if (due < now && remaining > 0) {
        overdueCount++;
        overdueAmount += remaining;
      }
    }

    if (overdueCount > 0) riskScore += 20;
    if (overdueAmount > project.budget * 0.2) riskScore += 20;

    const budget = Number(project.budget);
    const actualCost = Number(project.actual_cost || 0);
    if (actualCost > budget) {
      const overPct = ((actualCost - budget) / budget) * 100;
      if (overPct > 10) riskScore += 20;
      if (overPct > 25) riskScore += 20;
    }

    const planned = Number(project.planned_progress || 0);
    const actual = Number(project.actual_progress || 0);
    const diff = planned - actual;
    if (diff > 10) riskScore += 10;
    if (diff > 25) riskScore += 20;

    const riskLevel = riskLevelFromScore(riskScore);

    await query(
      `INSERT INTO risk_logs (project_id, risk_score, risk_level, details)
       VALUES ($1, $2, $3, $4)`,
      [projectId, riskScore, riskLevel, JSON.stringify({ overdueCount, overdueAmount, diff })]
    );

    await logAudit({
      userId: req.user.userId,
      action: 'CALCULATE_RISK',
      entityType: 'project',
      entityId: projectId,
      details: JSON.stringify({ riskScore, riskLevel }),
    });

    res.json({
      project_id: project.id,
      risk_score: riskScore,
      risk_level: riskLevel,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllProjectsRisk(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT DISTINCT ON (project_id)
              project_id, risk_score, risk_level, created_at
       FROM risk_logs
       ORDER BY project_id, created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getCashFlowForecast(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT date_trunc('month', txn_date) AS month,
              SUM(CASE WHEN direction = 'IN' THEN amount_base ELSE -amount_base END) AS net
       FROM transactions
       WHERE txn_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY date_trunc('month', txn_date)
       ORDER BY date_trunc('month', txn_date)`
    );

    const nets = rows.map((r) => Number(r.net));
    const avg = nets.length ? nets.reduce((s, v) => s + v, 0) / nets.length : 0;

    res.json({
      history: rows.map((r) => ({
        month: r.month,
        net: Number(r.net),
      })),
      nextMonthForecast: avg,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectProgressInsight(req, res, next) {
  try {
    const { projectId } = req.params;
    const {
      rows: [project],
    } = await query(
      `SELECT id, name, planned_progress, actual_progress
       FROM projects WHERE id = $1`,
      [projectId]
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const planned = Number(project.planned_progress || 0);
    const actual = Number(project.actual_progress || 0);
    const deviation = actual - planned;

    let status = 'On Track';
    if (deviation < -20) status = 'Behind Schedule';
    else if (deviation < -5) status = 'Slightly Behind';
    else if (deviation > 10) status = 'Ahead of Schedule';

    res.json({
      project_id: project.id,
      planned_progress: planned,
      actual_progress: actual,
      deviation,
      status,
    });
  } catch (err) {
    next(err);
  }
}
