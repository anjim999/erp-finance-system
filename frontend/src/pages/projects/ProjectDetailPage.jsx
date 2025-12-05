import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);

  const [project, setProject] = useState(null);
  const [risk, setRisk] = useState(null);
  const [progressInsight, setProgressInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const [pRes, rRes, piRes, hRes] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/insights/project-risk/${projectId}`),
        api.get(`/api/insights/project-progress/${projectId}`),
        api.get(`/api/projects/${projectId}/progress`),
      ]);
      setProject(pRes.data);
      setRisk(rRes.data);
      setProgressInsight(piRes.data);
      setHistory(hRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  if (loading) return <div>Loading project...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-slate-500">
          Budget: ₹{project.budget} | Actual Cost: ₹{project.actual_cost} |{" "}
          Status: {project.status}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card title="Progress">
          <p className="text-sm">
            Planned: {project.planned_progress ?? 0}%<br />
            Actual: {project.actual_progress ?? 0}%
          </p>
          {progressInsight && (
            <p className="mt-2 text-sm">
              Status:{" "}
              <span className="font-semibold">{progressInsight.status}</span>
              <br />
              Deviation: {progressInsight.deviation}%
            </p>
          )}
        </Card>

        <Card title="Risk">
          {risk ? (
            <div>
              <p className="text-sm">
                Score:{" "}
                <span className="font-bold">{risk.risk_score}</span>
              </p>
              <p className="text-sm">
                Level:{" "}
                <span
                  className={
                    risk.risk_level === "High" ||
                    risk.risk_level === "Critical"
                      ? "text-red-600 font-semibold"
                      : "text-amber-600"
                  }
                >
                  {risk.risk_level}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Risk not calculated yet.
            </p>
          )}
        </Card>

        <Card title="Dates">
          <p className="text-sm">
            Start:{" "}
            {project.start_date
              ? project.start_date.slice(0, 10)
              : "N/A"}
            <br />
            End:{" "}
            {project.end_date ? project.end_date.slice(0, 10) : "N/A"}
          </p>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <h2 className="font-semibold mb-2 text-sm">
          Progress History (Planned vs Actual)
        </h2>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-left py-2 px-2">Planned %</th>
              <th className="text-left py-2 px-2">Actual %</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b last:border-b-0">
                <td className="py-2 px-2">
                  {h.date ? h.date.slice(0, 10) : ""}
                </td>
                <td className="py-2 px-2">{h.planned_percent}</td>
                <td className="py-2 px-2">{h.actual_percent}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-500">
                  No historical data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold mb-2 text-sm">{title}</h2>
      {children}
    </div>
  );
}
