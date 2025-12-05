import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        api.get("/api/projects"),
        api.get("/api/insights/project-risk"),
      ]);
      setProjects(pRes.data || []);
      setRisks(rRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const riskMap = new Map(
    risks.map((r) => [Number(r.project_id), r])
  );

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Budget</th>
              <th className="text-left py-2 px-2">Actual Cost</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2">Progress</th>
              <th className="text-left py-2 px-2">Risk</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const r = riskMap.get(p.id);
              return (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="py-2 px-2">{p.name}</td>
                  <td className="py-2 px-2">₹{p.budget}</td>
                  <td className="py-2 px-2">₹{p.actual_cost}</td>
                  <td className="py-2 px-2">{p.status}</td>
                  <td className="py-2 px-2">
                    {p.actual_progress ?? 0}% / {p.planned_progress ?? 0}%
                  </td>
                  <td className="py-2 px-2">
                    {r ? (
                      <span
                        className={
                          r.risk_level === "High" || r.risk_level === "Critical"
                            ? "text-red-600 font-semibold"
                            : "text-amber-600"
                        }
                      >
                        {r.risk_level} ({r.risk_score})
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        Not calculated
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500">
                  No projects yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
