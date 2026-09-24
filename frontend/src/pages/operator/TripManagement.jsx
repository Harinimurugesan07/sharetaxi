import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Radar, Search, MapPin, Users } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { operatorTrips } from "../../api/operator";
import "./TripManagement.css";

const columns = [
  { key: "scheduled", label: "Scheduled", accent: "var(--color-yellow-500)" },
  { key: "ongoing", label: "Ongoing", accent: "var(--color-navy-500, #1565C0)" },
  { key: "completed", label: "Completed", accent: "var(--color-success-500, #22C55E)" },
  { key: "cancelled", label: "Cancelled", accent: "var(--color-danger-500, #EF4444)" },
];

const emptyCopy = {
  scheduled: "No trips scheduled yet",
  ongoing: "No trips on the road",
  completed: "No completed trips",
  cancelled: "No cancelled trips",
};

function formatDeparture(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortLocation(value) {
  if (!value) return "-";
  return value.split(",")[0].trim();
}

function shortId(id) {
  if (!id) return "-";
  return `#${String(id).slice(0, 8)}`;
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TripManagement() {
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    operatorTrips().then((data) => setTrips(data || [])).catch(() => setTrips([]));
  }, []);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) =>
      [t.id, t.origin_name, t.destination_name, t.driver_name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [trips, search]);

  const grouped = useMemo(() => {
    const map = {};
    columns.forEach((c) => (map[c.key] = []));
    filteredTrips.forEach((t) => {
      (map[t.status] = map[t.status] || []).push(t);
    });
    return map;
  }, [filteredTrips]);

  return (
    <div className="trip-board">
      <div className="trip-board-header">
        <div className="trip-board-heading">
          <h2>Trip Management</h2>
          <p>{filteredTrips.length} trip{filteredTrips.length === 1 ? "" : "s"} across all routes</p>
        </div>
        <div className="trip-board-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search trip, route or driver"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="trip-board-columns">
        {columns.map((col) => {
          const colTrips = grouped[col.key] || [];
          return (
            <div key={col.key} className="trip-board-col" style={{ "--col-accent": col.accent }}>
              <div className="trip-board-col-accent" />

              <div className="trip-board-col-head">
                <span className="trip-board-col-title">{col.label}</span>
                <span className="trip-board-col-count">{colTrips.length}</span>
              </div>

              <div className="trip-board-col-body">
                {colTrips.length === 0 && (
                  <div className="trip-board-empty">{emptyCopy[col.key] || "No trips"}</div>
                )}

                {colTrips.map((t) => (
                  <Card key={t.id} className="trip-card">
                    <div className="trip-card-top">
                      <span className="trip-card-id" title={t.id}>{shortId(t.id)}</span>
                      <span className="trip-card-time">{formatDeparture(t.departure_time)}</span>
                    </div>

                    <p
                      className="trip-card-route"
                      title={`${t.origin_name} → ${t.destination_name}`}
                    >
                      <MapPin size={14} />
                      <span>{shortLocation(t.origin_name)} → {shortLocation(t.destination_name)}</span>
                    </p>

                    <div className="trip-card-divider" />

                    <div className="trip-card-meta">
                      <span className="trip-card-driver">
                        <span className="trip-card-avatar">{initials(t.driver_name)}</span>
                        {t.driver_name || "Unassigned"}
                      </span>
                      <span className="trip-card-pax">
                        <Users size={12} /> {t.passenger_count}
                      </span>
                    </div>

                    <div className="trip-card-actions">
                      <Button as={Link} to={`/operator/trips/${t.id}`} size="sm" variant="outline">
                        <Eye /> View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Radar /> Track
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}