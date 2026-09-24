import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isOperatorOwnedDriver } from "../lib/driverType";
import { LoadingState } from "./States";

// Guards the subscribe / payment / details pages. Only a signed-in, verified
// freelance driver or operator may reach them:
//   - signed out              -> login
//   - not a driver / operator -> home
//   - not verified yet        -> onboarding verification (pay only after approval)
//   - operator-owned driver   -> driver portal (their operator covers access)
export default function SubscriptionAccess() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingState label="Loading your account..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?role=driver" state={{ from: location }} replace />;
  }

  if (user.role !== "driver" && user.role !== "operator") {
    return <Navigate to="/" replace />;
  }

  if (user.verification_status !== "verified") {
    return <Navigate to="/onboarding/verification" replace />;
  }

  if (isOperatorOwnedDriver(user)) {
    return <Navigate to="/driver" replace />;
  }

  return <Outlet />;
}
