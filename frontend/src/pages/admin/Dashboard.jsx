import { useEffect, useState } from "react";
import { Users, IdCard, CarFront, Route, IndianRupee, ShieldCheck } from "lucide-react";
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
    { label: "Total Users", value: stats?.total_users ?? "—", icon: Users },
    { label: "Total Drivers", value: stats?.total_drivers ?? "—", icon: IdCard },
    { label: "Verified Drivers", value: stats?.verified_drivers ?? "—", icon: ShieldCheck },
    { label: "Total Vehicles", value: stats?.total_vehicles ?? "—", icon: CarFront },
    { label: "Total Trips", value: stats?.total_trips ?? "—", icon: Route },
    { label: "Total Revenue", value: formatCurrency(stats?.total_revenue ?? 0), icon: IndianRupee },
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

      <Card className="admin-activity-card">
        <p className="admin-activity-title">Recent activity</p>
        {stats?.recent_activity?.length ? (
          <div className="admin-activity-list">
            {stats.recent_activity.map((a, i) => (
              <div key={i} className="admin-activity-item">{a.message || JSON.stringify(a)}</div>
            ))}
          </div>
        ) : (
          <p className="admin-no-activity">No recent activity to show.</p>
        )}
      </Card>
    </div>
  );
}