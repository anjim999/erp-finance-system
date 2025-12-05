import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const params =
        typeFilter === "ALL" ? {} : { params: { type: typeFilter } };
      const res = await api.get("/api/finance/invoices", params);
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [typeFilter]);

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          to="/finance/invoices/new"
          className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-3 flex gap-3 items-center">
        <span className="text-xs text-slate-500">Filter:</span>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="AR">Accounts Receivable (AR)</option>
          <option value="AP">Accounts Payable (AP)</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Invoice #</th>
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-left py-2 px-2">Issue</th>
              <th className="text-left py-2 px-2">Due</th>
              <th className="text-left py-2 px-2">Amount (Base)</th>
              <th className="text-left py-2 px-2">Paid</th>
              <th className="text-left py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">{inv.invoice_number}</td>
                <td className="py-2 px-2">{inv.type}</td>
                <td className="py-2 px-2">
                  {inv.issue_date ? inv.issue_date.slice(0, 10) : ""}
                </td>
                <td className="py-2 px-2">
                  {inv.due_date ? inv.due_date.slice(0, 10) : ""}
                </td>
                <td className="py-2 px-2">₹{inv.amount_base}</td>
                <td className="py-2 px-2">₹{inv.paid_amount_base}</td>
                <td className="py-2 px-2">{inv.status}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
