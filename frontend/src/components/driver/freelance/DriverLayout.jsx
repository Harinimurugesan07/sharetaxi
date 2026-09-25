import { Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, PlusCircle, Route, Inbox, Car, Wallet, User, CreditCard } from "lucide-react";
import DashboardLayout from "../../DashboardLayout";

// Freelance drivers run their own business: they publish trips, manage their
// own vehicles, are paid through the driver wallet and pay a subscription.
const nav = [
  { to: "/driver", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/driver/create-trip", label: "Create Trip", icon: PlusCircle },
  { to: "/driver/trips", label: "My Trips", icon: Route },
  { to: "/driver/requests", label: "Bookings", icon: Inbox },
  { to: "/driver/vehicles", label: "Vehicles", icon: Car },
  { to: "/driver/earnings", label: "Wallet & Payout", icon: Wallet },
  { to: "/driver/profile", label: "Profile", icon: User },
  { to: "/driver/settings/subscription", label: "Subscription", icon: CreditCard },
];

const staticTitles = {
  "/driver": "Driver Dashboard",
  "/driver/create-trip": "Create Trip",
  "/driver/trips": "My Trips",
  "/driver/requests": "Bookings",
  "/driver/vehicles": "Vehicles",
  "/driver/earnings": "Earnings",
  "/driver/profile": "Profile",
  "/driver/settings/subscription": "Subscription Details",
};

export default function FreelanceDriverLayout() {
  const { pathname } = useLocation();
  const title = staticTitles[pathname] || (pathname.includes("active-trip") ? "Trip Status Update" : "ShareTaxi Driver");
  return (
    <DashboardLayout nav={nav} title={title} subscriptionGated>
      <Outlet />
    </DashboardLayout>
  );
}
