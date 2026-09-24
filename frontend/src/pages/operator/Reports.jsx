import { useEffect, useMemo, useState } from "react";
import {
  Bus,
  CalendarClock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import Card from "../../components/Card";
import {
  operatorDashboard,
  operatorDrivers,
  operatorFinancialSummary,
  operatorPayoutRequests,
} from "../../api/operator";
import { formatCurrency } from "../../lib/format";
import "./OperatorReports.css";

const TRIP_STATUS_COLORS = {
  Active: "#2F5CE0",
  Scheduled: "#7C9BFF",
  "Completed Today": "#22C55E",
  "Cancelled Today": "#DC2626",
};

const VERIFICATION_COLORS = {
  verified: "#22C55E",
  pending: "#F59E0B",
  rejected: "#DC2626",
  suspended: "#94A3B8",
};

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`operator-stat-card operator-stat-card-${tone}`}>
      <div className="operator-stat-icon">
        <Icon size={18} />
      </div>
      <div className="operator-stat-body">
        <span className="operator-stat-value">{value ?? "—"}</span>
        <span className="operator-stat-label">{label}</span>
      </div>
    </div>
  );
}

function ChartEmptyState({ label }) {
  return <div className="operator-chart-empty">{label}</div>;
}

export default function OperatorReports() {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      operatorDashboard(),
      operatorDrivers(),
      operatorFinancialSummary(),
      operatorPayoutRequests(),
    ])
      .then(([dashboard, driverList, financialSummary, payoutList]) => {
        setStats(dashboard);
        setDrivers(driverList || []);
        setFinancial(financialSummary);
        setPayouts(payoutList || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tripStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Active", value: stats.active_trips || 0 },
      { name: "Scheduled", value: stats.scheduled_trips || 0 },
      { name: "Completed Today", value: stats.completed_today || 0 },
      { name: "Cancelled Today", value: stats.cancelled_today || 0 },
    ].filter((entry) => entry.value > 0);
  }, [stats]);

  const verificationData = useMemo(() => {
    const counts = drivers.reduce((acc, driver) => {
      const status = driver.verification_status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      key: status,
      count,
    }));
  }, [drivers]);

  const verifiedCount = drivers.filter(
    (driver) => driver.verification_status === "verified"
  ).length;

  return (
    <div className="operator-reports-page">
      <div className="operator-reports-header">
        <div>
          <h2 className="operator-reports-heading">Operations Summary</h2>
          <p className="operator-reports-subheading">
            Live snapshot of trips and driver verification
          </p>
        </div>
      </div>

      <div className="operator-stat-grid">
        <StatCard
          icon={Bus}
          label="Active Trips"
          value={stats?.active_trips}
          tone="blue"
        />
        <StatCard
          icon={CalendarClock}
          label="Scheduled Trips"
          value={stats?.scheduled_trips}
          tone="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Today"
          value={stats?.completed_today}
          tone="green"
        />
        <StatCard
          icon={XCircle}
          label="Cancelled Today"
          value={stats?.cancelled_today}
          tone="red"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verified Drivers"
          value={verifiedCount}
          tone="teal"
        />
      </div>

      <div className="operator-charts-grid">
        <Card className="operator-chart-card">
          <p className="operator-reports-title">Trip Status Breakdown</p>

          {loading ? (
            <ChartEmptyState label="Loading trip data…" />
          ) : tripStatusData.length === 0 ? (
            <ChartEmptyState label="No trip activity to show yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={tripStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {tripStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TRIP_STATUS_COLORS[entry.name] || "#94A3B8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="operator-chart-card">
          <p className="operator-reports-title">Driver Verification Status</p>

          {loading ? (
            <ChartEmptyState label="Loading driver data…" />
          ) : verificationData.length === 0 ? (
            <ChartEmptyState label="No drivers on file yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={verificationData}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid horizontal={false} stroke="#E7EAF3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {verificationData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={VERIFICATION_COLORS[entry.key] || "#94A3B8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="operator-reports-card">
        <p className="operator-reports-title">Trip Totals</p>
        <div className="operator-reports-list">
          {[
            ["Active Trips", stats?.active_trips],
            ["Scheduled Trips", stats?.scheduled_trips],
            ["Completed Today", stats?.completed_today],
            ["Cancelled Today", stats?.cancelled_today],
            ["Verified Drivers", verifiedCount],
          ].map(([label, value]) => (
            <div key={label} className="operator-reports-row">
              <span className="operator-reports-row-label">{label}</span>
              <span className="operator-reports-row-value">
                {value ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="operator-reports-card">
        <p className="operator-reports-title">Your Earnings and Payouts</p>
        <div className="operator-reports-list">
          {[
            ["Ride revenue", financial?.total_ride_revenue],
            ["Admin commission", financial?.total_admin_commission],
            ["Operator earnings", financial?.total_operator_share],
            ["Driver earnings", financial?.total_driver_earnings],
            ["Pending driver earnings", financial?.pending_driver_earnings],
            ["Vehicle expenses", financial?.total_vehicle_expenses],
          ].map(([label, value]) => (
            <div key={label} className="operator-reports-row">
              <span className="operator-reports-row-label">{label}</span>
              <span className="operator-reports-row-value">
                {formatCurrency(value ?? 0)}
              </span>
            </div>
          ))}
        </div>
        <p className="operator-reports-title operator-payouts-heading">
          Driver payout status
        </p>
        {payouts.length === 0 ? (
          <ChartEmptyState label="No payout requests from your drivers." />
        ) : (
          <div className="operator-payout-table-wrap">
            <table className="operator-payout-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <th scope="row">{payout.driver_name || "Driver"}</th>
                    <td>{formatCurrency(payout.amount || 0)}</td>
                    <td>{payout.status || "unknown"}</td>
                    <td>{payout.created_at ? new Date(payout.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}