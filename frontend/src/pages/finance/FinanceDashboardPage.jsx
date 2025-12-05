import { useEffect, useState } from "react";
import api from "../../api/axiosClient";

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get("/api/finance/dashboard/summary"),
          api.get("/api/finance/dashboard/cash-flow-trend"),
        ]);
        setSummary(sRes.data);
        setTrend(tRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading finance dashboard...</div>;
  if (!summary) return <div>No data</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finance Dashboard</h1>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <StatCard label="Receivables" value={summary.receivables} prefix="₹" />
        <StatCard label="Payables" value={summary.payables} prefix="₹" />
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">Cash Flow Trend (Monthly)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-2 px-2">Month</th>
                <th className="text-left py-2 px-2">Cash In</th>
                <th className="text-left py-2 px-2">Cash Out</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((row, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-2 px-2">
                    {row.month?.slice(0, 10) || row.month}
                  </td>
                  <td className="py-2 px-2">₹{Number(row.cash_in || 0)}</td>
                  <td className="py-2 px-2">₹{Number(row.cash_out || 0)}</td>
                </tr>
              ))}
              {trend.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">
                    No cash flow records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
