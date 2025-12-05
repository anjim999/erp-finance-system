import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoice_id: "",
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    currency: "INR",
    method: "",
    reference_number: "",
  });

  async function load() {
    try {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([
        api.get("/api/finance/payments"),
        api.get("/api/finance/invoices"),
      ]);
      setPayments(pRes.data || []);
      setInvoices(iRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
      };
      await api.post("/api/finance/payments", payload);
      toast.success("Payment recorded");
      setForm({
        ...form,
        invoice_id: "",
        amount: "",
        method: "",
        reference_number: "",
      });
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create payment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-4 space-y-3"
      >
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs mb-1">Invoice</label>
            <select
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.invoice_id}
              onChange={(e) =>
                setForm({ ...form, invoice_id: e.target.value })
              }
            >
              <option value="">Select invoice</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.type} - ₹{inv.amount_base}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Date</label>
            <input
              type="date"
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.payment_date}
              onChange={(e) =>
                setForm({ ...form, payment_date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs mb-1">Currency</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Method</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value })
              }
              placeholder="Bank Transfer, Cash, UPI"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Reference</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.reference_number}
              onChange={(e) =>
                setForm({ ...form, reference_number: e.target.value })
              }
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Record Payment"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Invoice</th>
              <th className="text-left py-2 px-2">Amount (Base)</th>
              <th className="text-left py-2 px-2">Method</th>
              <th className="text-left py-2 px-2">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">
                  {p.payment_date ? p.payment_date.slice(0, 10) : ""}
                </td>
                <td className="py-2 px-2">{p.invoice_id}</td>
                <td className="py-2 px-2">₹{p.amount_base}</td>
                <td className="py-2 px-2">{p.method}</td>
                <td className="py-2 px-2">{p.reference_number}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No payments yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
