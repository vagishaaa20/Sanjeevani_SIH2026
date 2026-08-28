import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardPathForRole } from "../../config/roleRoutes";

/**
 * Wrap a dashboard route with this. If not logged in -> /login.
 * If logged in but wrong role -> bounced to THEIR correct dashboard
 * (so a patient hitting /admin/dashboard lands on /dashboard, not a blank page).
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}