import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { canAccessPath, getDefaultPathForRole, getUserRole } from "@/lib/navigation";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fdfdf9_0%,_#f3f3ee_42%,_#ecece6_100%)] px-6">
      <div className="rounded-[28px] border border-black/6 bg-white px-8 py-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Authenticating</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Checking your session</h1>
        <p className="mt-2 text-sm text-slate-500">One moment while we connect you to the dashboard.</p>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = getUserRole(user);
  const isRootPath = location.pathname === "/";

  if (!isRootPath && !canAccessPath(role, location.pathname)) {
    return <Navigate to={getDefaultPathForRole(role)} replace />;
  }

  return <Outlet />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export { GuestRoute, ProtectedRoute };
