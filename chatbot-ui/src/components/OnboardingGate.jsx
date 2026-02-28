import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { getDashboardPath, isManagerRole } from "../utils/roles.js";

export default function OnboardingGate() {
  const { isAuthenticated, user, isAuthenticating } = useAuth(); 
  // ^ if your hook uses a different loading flag name, use that (e.g. isLoading)

  const location = useLocation();

  // While auth is hydrating, don't redirect anywhere yet.
  if (isAuthenticating || (isAuthenticated && !user)) {
    return null; // or a small spinner component
  }

  if (!isAuthenticated) {
    return <Outlet />; // RequireAuth handles redirect to /login anyway
  }

  const onboardingComplete = Boolean(user?.onboardingComplete);
  const manager = isManagerRole(user?.role);
  const managerDashboardPath = getDashboardPath(user?.role);

  if (manager) {
    if (location.pathname === "/onboarding" || location.pathname === "/dashboard") {
      return <Navigate to={managerDashboardPath} replace />;
    }
    return <Outlet />;
  }

  if (!onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingComplete && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
