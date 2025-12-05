import { query } from '../db/pool.js';

export async function getDashboardSummary(_req, res, next) {
  try {
    const [projectsRes, arRes, apRes, expensesRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total_projects,
                    COUNT(*) FILTER (WHERE status = 'Active') AS active_projects
             FROM projects`),
      query(`SELECT COALESCE(SUM(amount_base - paid_amount_base), 0) AS total_receivables
             FROM invoices WHERE type = 'AR'`),
      query(`SELECT COALESCE(SUM(amount_base - paid_amount_base), 0) AS total_payables
             FROM invoices WHERE type = 'AP'`),
      query(`SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS total_expenses
             FROM journal_lines jl
             JOIN accounts a ON jl.account_id = a.id
             WHERE a.type = 'EXPENSE'`)
    ]);

    res.json({
      totalProjects: Number(projectsRes.rows[0].total_projects),
      activeProjects: Number(projectsRes.rows[0].active_projects),
      totalReceivables: Number(arRes.rows[0].total_receivables),
      totalPayables: Number(apRes.rows[0].total_payables),
      totalExpenses: Number(expensesRes.rows[0].total_expenses),
    });
  } catch (err) {
    next(err);
  }
}

export async function getCashFlowTrend(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT to_char(date_trunc('month', t.txn_date), 'YYYY-MM') AS month,
              COALESCE(SUM(CASE WHEN t.direction = 'IN' THEN t.amount_base ELSE 0 END), 0) AS cash_in,
              COALESCE(SUM(CASE WHEN t.direction = 'OUT' THEN t.amount_base ELSE 0 END), 0) AS cash_out
       FROM transactions t
       GROUP BY date_trunc('month', t.txn_date)
       ORDER BY date_trunc('month', t.txn_date)`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(_req, res, next) {
  try {
    const [overdueInvoices, highRiskProjects] = await Promise.all([
      query(
        `SELECT id, invoice_number, type, amount_base, due_date, status
         FROM invoices
         WHERE due_date < CURRENT_DATE
           AND amount_base > paid_amount_base`
      ),
      query(
        `SELECT project_id, risk_score, risk_level, created_at
         FROM risk_logs
         WHERE risk_level IN ('High', 'Critical')
         ORDER BY created_at DESC
         LIMIT 10`
      )
    ]);

    res.json({
      overdueInvoices: overdueInvoices.rows,
      highRiskProjects: highRiskProjects.rows,
    });
  } catch (err) {
    next(err);
  }
}
