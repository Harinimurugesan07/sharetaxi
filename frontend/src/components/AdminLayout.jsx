import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  IdCard,
  CarFront,
  Route,
  BarChart3,
  UserCheck,
  CreditCard,
  FileText,
  WalletCards,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/admin/drivers", label: "Drivers", icon: IdCard },
  { to: "/admin/verification", label: "Verification Requests", icon: UserCheck },
  { to: "/admin/subscription-plans", label: "Plans", icon: CreditCard },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/blogs", label: "Blog Management", icon: FileText },
  { to: "/admin/vehicles", label: "Vehicles", icon: CarFront },
  { to: "/admin/trips", label: "Trips", icon: Route },
  { to: "/admin/customers", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  {
  to: "/admin/payout-requests",
  label: "Payout Requests",
  icon: WalletCards,
},
];

const titles = {
  "/admin": "Admin Dashboard",
  "/admin/drivers": "Driver Verification",
  "/admin/verification": "Verification Requests",
  "/admin/subscription-plans": "Subscription Plans",
  "/admin/subscriptions": "Subscriptions",
  "/admin/blogs": "Blog Management",
  "/admin/vehicles": "Vehicle Verification",
  "/admin/trips": "Trip Management",
  "/admin/customers": "User Management",
  "/admin/reports": "Reports",
  "/admin/payout-requests": "Driver Payout Requests",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const title = titles[pathname] || "ShareTaxi Admin";
  return (
    <DashboardLayout nav={nav} title={title}>
      <Outlet />
    </DashboardLayout>
  );
}
