// Single source of truth for role → dashboard path.
// Keep this in sync with the routes defined in App.jsx.
export const DASHBOARD_PATH_BY_ROLE = {
  patient: "/dashboard",
  doctor: "/doctor/dashboard",
  hitl_reviewer: "/reviewer/dashboard",
  admin: "/admin/dashboard",
};

export function dashboardPathForRole(role) {
  return DASHBOARD_PATH_BY_ROLE[role] || "/";
}