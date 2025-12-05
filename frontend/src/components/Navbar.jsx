import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }) {
  const { auth, loading } = useAuth();

  if (loading) return null;

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = auth.user?.role || "user";

  if (requireAdmin && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
