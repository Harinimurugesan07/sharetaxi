import { Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, Radar, ListChecks, UserCog, Users, Inbox, Route, Car, AlertTriangle, BarChart3, User, Settings, UserPlus, PlusCircle, WalletCards } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const nav = [
  { to: "/operator", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/operator/live", label: "Live Trips", icon: Radar },
  { to: "/operator/trips", label: "Trip Management", icon: ListChecks, end: true },
  { to: "/operator/drivers", label: "Driver Monitoring", icon: UserCog, end: true },
  { to: "/operator/drivers/new", label: "Create Driver", icon: UserPlus },
  { to: "/operator/passengers", label: "Passengers from your services", icon: Users },
  { to: "/operator/requests", label: "Ride Requests", icon: Inbox },
  { to: "/operator/settlements", label: "Driver Settlements", icon: WalletCards },
  { to: "/operator/wallet", label: "Operator Wallet", icon: WalletCards },
  { to: "/operator/expenses", label: "Expenses", icon: WalletCards },
  { to: "/operator/assignments", label: "Trip Assignments", icon: Route },
  { to: "/operator/trips/new", label: "Create Trip", icon: PlusCircle },
  { to: "/operator/vehicles", label: "Vehicles", icon: Car },
  { to: "/operator/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/operator/reports", label: "Reports", icon: BarChart3 },
  { to: "/operator/profile", label: "Profile", icon: User },
  { to: "/operator/settings/subscription", label: "Settings", icon: Settings },
];

const titles = {
  "/operator": "Operator Dashboard",
  "/operator/live": "Live Operations",
  "/operator/trips": "Trip Management",
  "/operator/drivers": "Driver Monitoring",
  "/operator/drivers/new": "Create Driver",
  "/operator/passengers": "Passengers from your services",
  "/operator/requests": "Ride Requests",
  "/operator/settlements": "Driver Settlements",
  "/operator/wallet": "Operator Wallet",
  "/operator/expenses": "Operator Expenses",
  "/operator/assignments": "Trip Assignment",
  "/operator/trips/new": "Create Trip",
  "/operator/vehicles": "Vehicles",
  "/operator/alerts": "Alerts & Issues",
  "/operator/reports": "Reports",
  "/operator/profile": "Profile",
  "/operator/settings/subscription": "Your Operator subscription and access status.",
};

export default function OperatorLayout() {
  const { pathname } = useLocation();
  const title = titles[pathname] || (pathname.includes("/operator/trips/") ? "Trip Details" : "ShareTaxi Operator");
  return (
    <DashboardLayout nav={nav} title={title} subscriptionGated>
      <Outlet />
    </DashboardLayout>
  );
}
