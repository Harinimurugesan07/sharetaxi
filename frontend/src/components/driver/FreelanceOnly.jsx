import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isOperatorOwnedDriver } from "../../lib/driverType";

// Route guard for pages an operator-owned driver must not use
// (creating trips, managing a subscription). They are sent back to /driver.
export default function FreelanceOnly() {
  const { user } = useAuth();
  if (isOperatorOwnedDriver(user)) {
    return <Navigate to="/driver" replace />;
  }
  return <Outlet />;
}
