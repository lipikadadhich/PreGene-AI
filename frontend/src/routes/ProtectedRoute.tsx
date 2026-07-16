import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// PROTECTED ROUTE
//
// Wraps route groups that require a signed-in user. Unauthenticated visitors
// are redirected to /login, with the originally-requested path preserved in
// location state so LoginPage can send them back after a successful sign-in.
//
// This checks frontend session state only (see AuthContext.tsx). Once a real
// backend is connected, isAuthenticated should reflect a verified session
// rather than a locally-stored placeholder token.
// ---------------------------------------------------------------------------

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    // Avoid a login-page flash while we check localStorage on first load.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}