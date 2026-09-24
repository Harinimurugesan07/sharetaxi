import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isOperatorOwnedDriver } from "../lib/driverType";

export default function PortalAccess({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const operatorOwnedDriver = isOperatorOwnedDriver(user);

  if (user?.verification_status !== "verified") {
    return <Navigate to="/onboarding/verification" state={{ from: location }} replace />;
  }
  const subscriptionExpired = user?.subscription_expires_at && new Date(user.subscription_expires_at) <= new Date();
  if (!operatorOwnedDriver && (user?.subscription_status !== "active" || subscriptionExpired)) {
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }
  return children;
}
