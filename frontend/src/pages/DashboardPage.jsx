import { useEffect, useState } from "react";
import api from "../api/axiosClient";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          api.get("/api/dashboard"),
          api.get("/api/dashboard/alerts"),
        ]);
        setSummary(summaryRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!summary) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Construction ERP Dashboard
      </h1>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Projects" value={summary.totalProjects} />
        <StatCard label="Active Projects" value={summary.activeProjects} />
        <StatCard
          label="Total Receivables"
          value={summary.totalReceivables}
          prefix="₹"
        />
        <StatCard
          label="Total Payables"
          value={summary.totalPayables}
          prefix="₹"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Overdue Invoices</h2>
          <ul className="space-y-1 max-h-64 overflow-y-auto text-sm">
            {alerts?.overdueInvoices?.length ? (
              alerts.overdueInvoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex justify-between border-b border-slate-100 py-1"
                >
                  <span>{inv.invoice_number}</span>
                  <span className="text-red-600 font-medium">
                    ₹{inv.amount_base}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No overdue invoices 🎉</p>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">High Risk Projects</h2>
          <ul className="space-y-1 max-h-64 overflow-y-auto text-sm">
            {alerts?.highRiskProjects?.length ? (
              alerts.highRiskProjects.map((r) => (
                <li
                  key={r.project_id + r.created_at}
                  className="flex justify-between border-b border-slate-100 py-1"
                >
                  <span>Project #{r.project_id}</span>
                  <span className="text-red-600 font-semibold">
                    {r.risk_level} ({r.risk_score})
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No critical risks detected</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, prefix = "" }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900">
        {prefix}
        {value}
      </p>
    </div>
  );
}
