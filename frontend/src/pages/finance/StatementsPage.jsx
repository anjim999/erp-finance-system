import { useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function StatementsPage() {
  const [type, setType] = useState("balance");
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      let url = "";
      if (type === "balance") {
        url = `/api/finance/statements/balance-sheet?asOf=${asOf}`;
      } else if (type === "pl") {
        url = `/api/finance/statements/profit-loss?from=${from}&to=${to}`;
      } else {
        url = `/api/finance/statements/cash-flow?from=${from}&to=${to}`;
      }
      const res = await api.get(url);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Financial Statements</h1>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="balance">Balance Sheet</option>
            <option value="pl">Profit &amp; Loss</option>
            <option value="cash">Cash Flow</option>
          </select>

          {type === "balance" ? (
            <div>
              <label className="block text-xs mb-1">As of</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs mb-1">From</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">To</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="mt-4 px-4 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        {type === "cash" ? (
          <CashFlowTable data={data} />
        ) : (
          <GenericStatementTable data={data} />
        )}
      </div>
    </div>
  );
}

function GenericStatementTable({ data }) {
  if (!data.length)
    return (
      <p className="text-sm text-slate-500">No statement data available.</p>
    );
  return (
    <table className="min-w-full text-xs">
      <thead>
        <tr className="border-b bg-slate-50">
          <th className="text-left py-2 px-2">Type</th>
          <th className="text-left py-2 px-2">Name</th>
          <th className="text-left py-2 px-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b last:border-b-0">
            <td className="py-2 px-2">{row.type}</td>
            <td className="py-2 px-2">{row.name}</td>
            <td className="py-2 px-2">
              ₹{Number(row.amount ?? row.balance ?? 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CashFlowTable({ data }) {
  if (!data.length)
    return (
      <p className="text-sm text-slate-500">No cash flow data available.</p>
    );
  return (
    <table className="min-w-full text-xs">
      <thead>
        <tr className="border-b bg-slate-50">
          <th className="text-left py-2 px-2">Date</th>
          <th className="text-left py-2 px-2">Cash In</th>
          <th className="text-left py-2 px-2">Cash Out</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b last:border-b-0">
            <td className="py-2 px-2">
              {row.txn_date ? row.txn_date.slice(0, 10) : ""}
            </td>
            <td className="py-2 px-2">₹{Number(row.cash_in || 0)}</td>
            <td className="py-2 px-2">₹{Number(row.cash_out || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
