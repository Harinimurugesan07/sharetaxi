import { useAuth } from "../context/AuthContext";
import { isOperatorOwnedDriver } from "../lib/driverType";
import FreelanceDriverLayout from "./driver/freelance/DriverLayout";
import OperatorDriverLayout from "./driver/operator/DriverLayout";

// One /driver route tree, two shells: the driver's type decides the nav,
// the subscription banner and which pages they can reach.
export default function DriverLayout() {
  const { user } = useAuth();
  return isOperatorOwnedDriver(user) ? <OperatorDriverLayout /> : <FreelanceDriverLayout />;
}
