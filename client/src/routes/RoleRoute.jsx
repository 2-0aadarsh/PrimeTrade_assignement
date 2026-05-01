import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function RoleRoute({ allowedRoles = [] }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
