import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { auth, hasActiveSubscription, isAdmin } = useAuth();
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const isBillingPage = location.pathname.startsWith("/app/minha-assinatura");
  const isDashboard = location.pathname.startsWith("/app/dashboard");
  if (!isAdmin && !hasActiveSubscription && !isBillingPage && !isDashboard) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
