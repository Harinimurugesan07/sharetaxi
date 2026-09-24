import { Outlet, useLocation } from "react-router-dom";
import { Home, Search, Ticket, Wallet, User, Settings } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const nav = [
  { to: "/passenger", label: "Home", icon: Home, end: true },
  { to: "/passenger/find-ride", label: "Book a Ride", icon: Search },
  { to: "/passenger/my-rides", label: "My Rides", icon: Ticket },
  { to: "/passenger/wallet", label: "Wallet", icon: Wallet },
  { to: "/passenger/profile", label: "Profile", icon: User },
  { to: "/passenger/settings", label: "Settings", icon: Settings },
];

const titles = {
  "/passenger": "Dashboard",
  "/passenger/find-ride": "Find a Ride",
  "/passenger/my-rides": "My Rides",
  "/passenger/wallet": "Wallet",
  "/passenger/profile": "Profile",
  "/passenger/settings": "Settings",
};

export default function PassengerLayout() {
  const { pathname } = useLocation();
  const title = titles[pathname] || (pathname.includes("track") ? "Live Tracking" : "ShareTaxi");
  return (
    <DashboardLayout nav={nav} title={title}>
      <Outlet />
    </DashboardLayout>
  );
}
