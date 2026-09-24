import { useEffect, useState } from "react";
import { Users, IdCard, CarFront, Route, IndianRupee, ShieldCheck, UserRound, Clock3, WalletCards } from "lucide-react";
import Card from "../../components/Card";
import { LoadingState, ErrorState } from "../../components/States";
import { formatCurrency } from "../../lib/format";
import { adminDashboard } from "../../api/admin";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");
    adminDashboard()
      .then((d) => {
        setStats(d);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(load, []);

  if (status === "loading") return <LoadingState label="Loading dashboard..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  const cards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users },
    { label: "Total Operators", value: stats?.total_operators ?? 0, icon: UserRound },
    { label: "Total Drivers", value: stats?.total_drivers ?? 0, icon: IdCard },
    { label: "Freelance Drivers", value: stats?.freelance_drivers ?? 0, icon: UserRound },
    { label: "Verified Drivers", value: stats?.drivers_verified ?? 0, icon: ShieldCheck },
    { label: "Total Vehicles", value: stats?.total_vehicles ?? "—", icon: CarFront },
    { label: "Total Trips", value: stats?.total_trips ?? 0, icon: Route },
    { label: "Completed Trips", value: stats?.trips_completed ?? 0, icon: Route },
    { label: "Pending Trips", value: stats?.trips_pending ?? 0, icon: Clock3 },
    { label: "Total Commission", value: formatCurrency(stats?.total_commission ?? 0), icon: IndianRupee },
    { label: "Payouts Requested", value: formatCurrency(stats?.payout_requested ?? 0), icon: WalletCards },
    { label: "Payouts Pending", value: formatCurrency(stats?.payout_pending ?? 0), icon: WalletCards },
    { label: "Payouts Paid", value: formatCurrency(stats?.payout_paid ?? 0), icon: WalletCards },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        {cards.map((c) => (
          <Card key={c.label} className="admin-stat-card">
            <div className="admin-stat-header">
              <p className="admin-stat-label">{c.label}</p>
              <span className="admin-stat-icon">
                <c.icon />
              </span>
            </div>
            <p className="admin-stat-value">{c.value}</p>
          </Card>
        ))}
      </div>

    </div>
  );
}