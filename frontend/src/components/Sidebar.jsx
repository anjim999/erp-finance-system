import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { auth } = useAuth();
  const role = auth?.user?.role || "user";

  const linkClass = ({ isActive }) =>
    "block px-3 py-2 rounded text-xs mb-1 " +
    (isActive
      ? "bg-blue-600 text-white"
      : "text-slate-600 hover:bg-slate-100");

  return (
    <aside className="hidden md:block w-52 shrink-0 bg-white rounded-xl shadow p-3 h-fit">
      <nav>
        <NavLink to="/" className={linkClass} end>
          Dashboard
        </NavLink>
        {(role === "admin" || role === "finance_manager") && (
          <>
            <p className="mt-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase">
              Finance
            </p>
            <NavLink to="/finance" className={linkClass} end>
              Finance Dashboard
            </NavLink>
            <NavLink to="/finance/accounts" className={linkClass}>
              Accounts
            </NavLink>
            <NavLink to="/finance/journals" className={linkClass}>
              Journals
            </NavLink>
            <NavLink to="/finance/statements" className={linkClass}>
              Statements
            </NavLink>
            <NavLink to="/finance/invoices" className={linkClass}>
              Invoices
            </NavLink>
            <NavLink to="/finance/payments" className={linkClass}>
              Payments
            </NavLink>
            <NavLink to="/finance/customers" className={linkClass}>
              Customers
            </NavLink>
            <NavLink to="/finance/vendors" className={linkClass}>
              Vendors
            </NavLink>
          </>
        )}

        {(role === "admin" || role === "project_manager") && (
          <>
            <p className="mt-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase">
              Projects
            </p>
            <NavLink to="/projects" className={linkClass}>
              Projects
            </NavLink>
          </>
        )}

        {role === "admin" && (
          <>
            <p className="mt-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase">
              Admin
            </p>
            <NavLink to="/admin/users" className={linkClass}>
              Users
            </NavLink>
            <NavLink to="/admin/audit-logs" className={linkClass}>
              Audit Logs
            </NavLink>
            <NavLink to="/admin/integrations" className={linkClass}>
              Integrations
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
