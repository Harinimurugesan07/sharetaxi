import { Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, Route, Inbox, Wallet, User } from "lucide-react";
import DashboardLayout from "../../DashboardLayout";

// Operator-owned drivers only run what their operator assigns: no trip
// creation, no vehicle management, no subscription. Earnings come from the
// operator's settlements. (Their assigned vehicle is read-only and reachable
// from the vehicle card on the dashboard.)
const nav = [
  { to: "/driver", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/driver/trips", label: "Assigned Trips", icon: Route },
  { to: "/driver/requests", label: "Bookings", icon: Inbox },
  { to: "/driver/earnings", label: "Earnings", icon: Wallet },
  { to: "/driver/profile", label: "Profile", icon: User },
];

const staticTitles = {
  "/driver": "Driver Dashboard",
  "/driver/trips": "Assigned Trips",
  "/driver/requests": "Bookings",
  "/driver/vehicles": "Assigned Vehicle",
  "/driver/earnings": "Earnings",
  "/driver/profile": "Profile",
};

export default function OperatorDriverLayout() {
  const { pathname } = useLocation();
  const title = staticTitles[pathname] || (pathname.includes("active-trip") ? "Trip Status Update" : "ShareTaxi Driver");
  return (
    <DashboardLayout nav={nav} title={title}>
      <Outlet />
    </DashboardLayout>
  );
}
