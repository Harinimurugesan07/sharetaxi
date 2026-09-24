import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, ArrowRight, Clock } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { StatusBadge } from "../../components/Badge";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { formatCurrency, formatDate, formatTime } from "../../lib/format";
import { myTrips } from "../../api/trips";
import { useAuth } from "../../context/AuthContext";
import { isOperatorOwnedDriver } from "../../lib/driverType";
import { bookedSeats } from "../../lib/seats";

import "./Trips.css";

const tabs = [
  { key: "scheduled", label: "Scheduled" },
  { key: "ongoing", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DriverTrips() {
  const { user } = useAuth();
  const operatorOwned = isOperatorOwnedDriver(user);
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("scheduled");

  const load = () => {
    setStatus("loading");
    myTrips()
      .then((t) => {
        setTrips(t || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  const filtered = trips.filter((t) => t.status === tab);

  return (
    <div className="driver-trips">
      <div className="driver-trips-toolbar">
        <div className="driver-trips-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`driver-trips-tab ${tab === t.key ? "driver-trips-tab-active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!operatorOwned && (
          <Button as={Link} to="/driver/create-trip" size="sm" className="driver-trips-new-button">
            <PlusCircle /> New Trip
          </Button>
        )}
      </div>

      {status === "loading" && <LoadingState label="Loading your trips..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && filtered.length === 0 && (
        <EmptyState
          title={`No ${tab} trips`}
          description={operatorOwned ? "Trips your operator assigns to you will appear here." : "Trips you create will appear here."}
        />
      )}
      {status === "success" && filtered.length > 0 && (
        <div className="driver-trips-grid">
          {filtered.map((t) => {
            const booked = bookedSeats(t);
            return (
              <Card key={t.id} className="driver-trip-summary-card">
                <div className="driver-trip-summary-header">
                  <p className="driver-trip-summary-route">
                    {t.origin_name} <ArrowRight /> {t.destination_name}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="driver-trip-summary-time">
                  <Clock /> {formatDate(t.departure_time)} · {formatTime(t.departure_time)}
                </p>

                <div className="driver-trip-stats">
                  <div className="driver-trip-stat">
                    <p className="driver-trip-stat-value">{t.total_seats}</p>
                    <p className="driver-trip-stat-label">Passenger Seats</p>
                  </div>
                  <div className="driver-trip-stat">
                    <p className="driver-trip-stat-value">{booked}</p>
                    <p className="driver-trip-stat-label">Seats Booked</p>
                  </div>
                  <div className="driver-trip-stat">
                    <p className="driver-trip-stat-value">{t.available_seats}</p>
                    <p className="driver-trip-stat-label">Seats Available</p>
                  </div>
                </div>

                <div className="driver-trip-summary-footer">
                  <span className="driver-trip-summary-fare">{formatCurrency(t.fare_per_seat)}/seat</span>
                  {(t.status === "scheduled" || t.status === "ongoing") && (
                    <Button as={Link} to={`/driver/active-trip/${t.id}`} size="sm">Update Status</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}