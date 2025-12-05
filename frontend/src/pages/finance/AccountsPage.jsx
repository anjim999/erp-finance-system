import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

const TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    currency: "INR",
  });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/api/finance/accounts");
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load accounts");
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
      const res = await api.post("/api/finance/accounts", form);
      toast.success("Account created");
      setAccounts((prev) => [...prev, res.data]);
      setForm({ code: "", name: "", type: "ASSET", currency: "INR" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create account");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this account?")) return;
    try {
      await api.delete(`/api/finance/accounts/${id}`);
      toast.success("Deleted");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div>Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chart of Accounts</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-4 grid gap-3 grid-cols-1 md:grid-cols-5 items-end"
      >
        <div>
          <label className="block text-xs mb-1">Code</label>
          <input
            className="border rounded w-full px-2 py-1 text-sm"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs mb-1">Name</label>
          <input
            className="border rounded w-full px-2 py-1 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Type</label>
          <select
            className="border rounded w-full px-2 py-1 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1">Currency</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value.toUpperCase() })
              }
            />
          </div>
          <button
            type="submit"
            className="mt-5 px-4 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Code</th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-left py-2 px-2">Currency</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">{a.code}</td>
                <td className="py-2 px-2">{a.name}</td>
                <td className="py-2 px-2">{a.type}</td>
                <td className="py-2 px-2">{a.currency}</td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No accounts yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
