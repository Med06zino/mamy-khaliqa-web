import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../store/auth";
import { Spinner } from "./ui/States";

export function RequireAuth({ staff = false }: { staff?: boolean }) {
  const { user, ready } = useAuth();
  const loc = useLocation();

  if (!ready) return <Spinner label="Vérification de votre session…" />;
  if (!user) return <Navigate to="/connexion" state={{ from: loc.pathname }} replace />;
  if (staff && !user.is_staff) return <Navigate to="/" replace />;

  return <Outlet />;
}
