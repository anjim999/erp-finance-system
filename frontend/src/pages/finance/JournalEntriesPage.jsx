import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [line, setLine] = useState({
    account_id: "",
    debit: "",
    credit: "",
  });

  async function load() {
    try {
      setLoading(true);
      const [jRes, aRes] = await Promise.all([
        api.get("/api/finance/journals"),
        api.get("/api/finance/accounts"),
      ]);
      setJournals(jRes.data || []);
      setAccounts(aRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load journals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!line.account_id || (!line.debit && !line.credit)) {
      toast.error("Add debit or credit");
      return;
    }
    try {
      await api.post("/api/finance/journals", {
        date,
        description,
        lines: [
          {
            account_id: Number(line.account_id),
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
          },
        ],
      });
      toast.success("Journal created (Draft)");
      setDescription("");
      setLine({ account_id: "", debit: "", credit: "" });
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create journal");
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/api/finance/journals/${id}/approve`);
      toast.success("Journal approved");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    }
  };

  if (loading) return <div>Loading journal entries...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Journal Entries</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-4 space-y-3"
      >
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs mb-1">Date</label>
            <input
              type="date"
              className="border rounded w-full px-2 py-1 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Description</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weekly site expenses, material purchase, etc."
            />
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Account</label>
            <select
              className="border rounded w-full px-2 py-1 text-sm"
              value={line.account_id}
              onChange={(e) =>
                setLine({ ...line, account_id: e.target.value })
              }
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Debit</label>
            <input
              type="number"
              step="0.01"
              className="border rounded w-full px-2 py-1 text-sm"
              value={line.debit}
              onChange={(e) =>
                setLine({ ...line, debit: e.target.value, credit: "" })
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Credit</label>
            <input
              type="number"
              step="0.01"
              className="border rounded w-full px-2 py-1 text-sm"
              value={line.credit}
              onChange={(e) =>
                setLine({ ...line, credit: e.target.value, debit: "" })
              }
            />
          </div>
        </div>

        <button
          type="submit"
          className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Add Journal (Draft)
        </button>
      </form>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Description</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2">Created By</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {journals.map((j) => (
              <tr key={j.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">
                  {j.date ? j.date.slice(0, 10) : ""}
                </td>
                <td className="py-2 px-2">{j.description}</td>
                <td className="py-2 px-2">{j.status}</td>
                <td className="py-2 px-2">{j.created_by_name || "-"}</td>
                <td className="py-2 px-2 text-right">
                  {j.status !== "Approved" && (
                    <button
                      onClick={() => handleApprove(j.id)}
                      className="text-xs px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {journals.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No journals yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
