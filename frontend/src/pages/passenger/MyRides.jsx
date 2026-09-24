import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Navigation2, Users } from "lucide-react";
import { StatusBadge } from "../../components/Badge";
import { EmptyState, LoadingState } from "../../components/States";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { readBookings, syncBookingsFromServer } from "../../lib/bookingsCache";
import "./MyRides.css";

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function classify(booking) {
  const tripStatus = booking.trip?.status;
  if (booking.status === "cancelled" || tripStatus === "cancelled") return "cancelled";
  if (tripStatus === "completed") return "completed";
  if (tripStatus === "ongoing") return "active";
  return "upcoming";
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function MyRides() {
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState(() => readBookings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextBookings = await syncBookingsFromServer();
        if (!cancelled) {
          setBookings(nextBookings);
        }
      } catch {
        if (!cancelled) {
          setBookings(readBookings());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const base = { upcoming: 0, active: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      base[classify(b)] += 1;
    });
    return base;
  }, [bookings]);
  const filtered = bookings.filter((b) => classify(b) === tab);

  return (
    <div className="mr-wrap">
      <div className="mr-page-header">
        <div>
          <h1 className="mr-page-title">My Rides</h1>
          <p className="mr-page-subtitle">Track, review, and manage every ride you've booked.</p>
        </div>
      </div>

      <div className="mr-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`mr-tab ${tab === t.key ? "mr-tab-active" : ""}`}
          >
            {t.label}
            {counts[t.key] > 0 && <span className="mr-tab-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading your rides..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab} rides`}
          description="Rides you book will show up here."
          action={
            <Link to="/passenger/find-ride" className="mr-btn mr-btn-primary mr-btn-sm">
              Find a Ride
            </Link>
          }
        />
      ) : (
        <div className="mr-grid">
          {filtered.map((b) => {
            const status = classify(b);
            return (
              <div key={b.id} className="mr-card">
                <div className="mr-card-top">
                  <span className="mr-card-eyebrow">
                    <Calendar className="mr-eyebrow-icon" />
                    {formatDateTime(b.trip?.departure_time)}
                  </span>
                  <StatusBadge status={status === "cancelled" ? "cancelled" : b.trip?.status} />
                </div>

                <div className="mr-route">
                  <div className="mr-route-line">
                    <span className="mr-dot mr-dot-start" />
                    <span className="mr-dot-connector" />
                    <span className="mr-dot mr-dot-end" />
                  </div>
                  <div className="mr-route-points">
                    <div className="mr-route-point">
                      <p className="mr-point-label">Pickup</p>
                      <p className="mr-point-name">{b.trip?.origin_name}</p>
                    </div>
                    <div className="mr-route-point">
                      <p className="mr-point-label">Drop-off</p>
                      <p className="mr-point-name">{b.trip?.destination_name}</p>
                    </div>
                  </div>
                </div>

                <div className="mr-card-meta">
                  <span className="mr-meta-item">
                    <Users className="mr-meta-icon" />
                    {b.seats_booked} seat{b.seats_booked === 1 ? "" : "s"}
                  </span>
                  <span className="mr-meta-divider" />
                  <span className="mr-meta-item mr-driver">
                    <span className="mr-avatar">{initials(b.trip?.driver_name)}</span>
                    {b.trip?.driver_name || "Driver assigned soon"}
                  </span>
                </div>

                <div className="mr-card-footer">
                  <div>
                    <p className="mr-fare-label">Total fare</p>
                    <p className="mr-fare">{formatCurrency(b.fare_total)}</p>
                  </div>
                  {(tab === "upcoming" || tab === "active") && (
                    <Link to={`/passenger/track/${b.trip?.id}`} className="mr-btn mr-btn-primary">
                      <Navigation2 className="mr-btn-icon" />
                      Track Ride
                    </Link>
                  )}
                  {tab === "completed" && (
                    <Link to={`/passenger/find-ride`} className="mr-btn mr-btn-ghost">
                      Book again
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}