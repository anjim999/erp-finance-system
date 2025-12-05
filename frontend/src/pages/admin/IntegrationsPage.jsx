import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function IntegrationsPage() {
  const [items, setItems] = useState([]);
  const [testingId, setTestingId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/integrations");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleTest = async (id) => {
    try {
      setTestingId(id);
      const res = await api.post("/api/admin/integrations/test", {
        integrationId: id,
      });
      toast.success(res.data?.message || "Integration OK");
    } catch (err) {
      console.error(err);
      toast.error("Failed to test integration");
    } finally {
      setTestingId(null);
    }
  };

  if (loading) return <div>Loading integrations...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-2">Integrations (Mock)</h1>
      <div className="bg-white rounded-xl shadow p-4">
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-slate-500">
                  Status: {i.status || "UNKNOWN"}
                </p>
              </div>
              <button
                onClick={() => handleTest(i.id)}
                disabled={testingId === i.id}
                className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {testingId === i.id ? "Testing..." : "Test Connection"}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="py-4 text-center text-slate-500">
              No integrations configured
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
