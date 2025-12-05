import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoice_number: "",
    type: "AR",
    customer_id: "",
    vendor_id: "",
    project_id: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    currency: "INR",
    amount: "",
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const [cRes, vRes, pRes] = await Promise.all([
          api.get("/api/finance/customers"),
          api.get("/api/finance/vendors"),
          api.get("/api/projects"),
        ]);
        setCustomers(cRes.data || []);
        setVendors(vRes.data || []);
        setProjects(pRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        customer_id: form.type === "AR" ? Number(form.customer_id) || null : null,
        vendor_id: form.type === "AP" ? Number(form.vendor_id) || null : null,
        project_id: form.project_id ? Number(form.project_id) : null,
        amount: Number(form.amount),
      };
      await api.post("/api/finance/invoices", payload);
      toast.success("Invoice created");
      navigate("/finance/invoices");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">New Invoice</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-4 space-y-4"
      >
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <div>
            <label className="block text-xs mb-1">Invoice Number</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.invoice_number}
              onChange={(e) =>
                setForm({ ...form, invoice_number: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Type</label>
            <select
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value, customer_id: "", vendor_id: "" })
              }
            >
              <option value="AR">Accounts Receivable (AR)</option>
              <option value="AP">Accounts Payable (AP)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {form.type === "AR" ? (
            <div>
              <label className="block text-xs mb-1">Customer</label>
              <select
                className="border rounded w-full px-2 py-1 text-sm"
                value={form.customer_id}
                onChange={(e) =>
                  setForm({ ...form, customer_id: e.target.value })
                }
                disabled={loadingOptions}
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs mb-1">Vendor</label>
              <select
                className="border rounded w-full px-2 py-1 text-sm"
                value={form.vendor_id}
                onChange={(e) =>
                  setForm({ ...form, vendor_id: e.target.value })
                }
                disabled={loadingOptions}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs mb-1">Project (optional)</label>
            <select
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.project_id}
              onChange={(e) =>
                setForm({ ...form, project_id: e.target.value })
              }
              disabled={loadingOptions}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs mb-1">Issue Date</label>
            <input
              type="date"
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.issue_date}
              onChange={(e) =>
                setForm({ ...form, issue_date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Due Date</label>
            <input
              type="date"
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
            />
          </div>
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
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs rounded border border-slate-300 text-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
