import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function CustomersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    currency: "INR",
  });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/api/finance/customers");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/finance/customers", form);
      toast.success("Customer created");
      setItems((prev) => [...prev, res.data]);
      setForm({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        currency: "INR",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create customer");
    }
  };

  if (loading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-4 space-y-3"
      >
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <div>
            <label className="block text-xs mb-1">Name</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Contact Person</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.contact_person}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs mb-1">Email</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Phone</label>
            <input
              className="border rounded w-full px-2 py-1 text-sm"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
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
          <label className="block text-xs mb-1">Address</label>
          <textarea
            className="border rounded w-full px-2 py-1 text-sm"
            rows={2}
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Add Customer
        </button>
      </form>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Contact</th>
              <th className="text-left py-2 px-2">Email</th>
              <th className="text-left py-2 px-2">Phone</th>
              <th className="text-left py-2 px-2">Currency</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">{c.name}</td>
                <td className="py-2 px-2">{c.contact_person}</td>
                <td className="py-2 px-2">{c.email}</td>
                <td className="py-2 px-2">{c.phone}</td>
                <td className="py-2 px-2">{c.currency}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
