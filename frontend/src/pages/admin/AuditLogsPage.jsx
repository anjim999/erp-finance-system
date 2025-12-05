import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/audit-logs?limit=100");
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) return <div>Loading audit logs...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <button
          onClick={loadLogs}
          className="text-xs px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-900"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Time</th>
              <th className="text-left py-2 px-2">User</th>
              <th className="text-left py-2 px-2">Action</th>
              <th className="text-left py-2 px-2">Entity</th>
              <th className="text-left py-2 px-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-b-0 align-top">
                <td className="py-2 px-2 whitespace-nowrap">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="py-2 px-2">{log.email || "System"}</td>
                <td className="py-2 px-2 font-semibold">{log.action}</td>
                <td className="py-2 px-2">
                  {log.entity_type}
                  {log.entity_id ? ` #${log.entity_id}` : ""}
                </td>
                <td className="py-2 px-2 max-w-xs">
                  <pre className="text-[10px] whitespace-pre-wrap break-words bg-slate-50 rounded p-1">
                    {log.details ? JSON.stringify(log.details, null, 2) : "-"}
                  </pre>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
