import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { StatusBadge } from "../../components/Badge";
import { Select } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { adminListTrips } from "../../api/admin";
import "./AdminTable.css";

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = () => {
    setStatus("loading");
    adminListTrips(filter || undefined)
      .then((t) => {
        setTrips(t || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(() => {
    load();
  }, [filter]);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "freelance") return !trip.operator_id;
      if (categoryFilter === "operator") return Boolean(trip.operator_id);
      return true;
    });
  }, [trips, categoryFilter]);

  return (
    <div className="admin-page">
      <div className="admin-filter-bar">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
          <option value="">All trips</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="admin-segmented-control" role="tablist" aria-label="Trip categories">
        {[
          { value: "all", label: "All trips" },
          { value: "freelance", label: "Freelancing drivers" },
          { value: "operator", label: "Operator drivers" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`admin-segmented-button ${categoryFilter === tab.value ? "admin-segmented-button--active" : ""}`}
            onClick={() => setCategoryFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "loading" && <LoadingState label="Loading trips..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && filteredTrips.length === 0 && <EmptyState title="No trips found" />}

      {status === "success" && filteredTrips.length > 0 && (
        <Card className="admin-table-card">
          <table className="admin-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th>Route</th>
                <th>Driver</th>
                <th>Departure</th>
                <th>Seats</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((t) => (
                <tr key={t.id}>
                  <td className="admin-table-cell-primary">{t.origin_name} → {t.destination_name}</td>
                  <td>{t.driver_name}</td>
                  <td>{formatDateTime(t.departure_time)}</td>
                  <td>{t.total_seats - t.available_seats}/{t.total_seats}</td>
                  <td>{formatCurrency(t.fare_per_seat)}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}