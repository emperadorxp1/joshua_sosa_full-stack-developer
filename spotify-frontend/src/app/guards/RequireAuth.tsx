// src/app/guards/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../../auth/auth";

export default function RequireAuth() {
  const token = getToken();
  const loc = useLocation();
  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: loc }} replace />
  );
}
