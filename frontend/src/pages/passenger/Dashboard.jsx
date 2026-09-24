import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Navigation,
  CalendarDays,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ArrowUpDown,
  Search,
  CalendarClock,
} from "lucide-react";
import { Field, Input } from "../../components/Field";
import LocationPicker from "../../components/LocationPicker";
import { StatusBadge } from "../../components/Badge";
import { useAuth } from "../../context/AuthContext";
import { POPULAR_LOCATIONS } from "../../lib/constants";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { readBookings, syncBookingsFromServer } from "../../lib/bookingsCache";
import "./PassengerDashboard.css";

export default function PassengerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recentBookings, setRecentBookings] = useState(() => readBookings());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextBookings = await syncBookingsFromServer();
        if (!cancelled) {
          setRecentBookings(nextBookings);
        }
      } catch {
        if (!cancelled) {
          setRecentBookings(readBookings());
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = recentBookings.find((b) => b.status !== "cancelled");

  const swapLocations = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    navigate(`/passenger/find-ride?${params.toString()}`);
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pd-wrap">
      <div className="pd-header">
        <div>
          <h2 className="pd-greeting">Hello, {firstName}</h2>
          <p className="pd-subtitle">Where would you like to go today?</p>
        </div>
        {/* <span className="pd-today">{todayLabel}</span> */}
      </div>

      <div className="pd-body">
        <div className="pd-main">
          <section>
            <p className="pd-section-title">Popular locations</p>
            <div className="pd-pill-row">
              {POPULAR_LOCATIONS.map((l) => (
                <button
                  key={l.name}
                  onClick={() => navigate(`/passenger/find-ride?to=${encodeURIComponent(l.name)}`)}
                  className="pd-pill"
                >
                  <MapPin className="pd-pill-icon" />
                  {l.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="pd-section-head">
              <p className="pd-section-title">Recent rides</p>
              <button onClick={() => navigate("/passenger/my-rides")} className="pd-view-all">
                View all
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">
                  <Navigation />
                </div>
                <p className="pd-empty-title">No rides yet</p>
                <p className="pd-empty-body">Book your first shared ride and it'll show up here.</p>
                <button className="pd-btn pd-btn-secondary" onClick={() => navigate("/passenger/find-ride")}>
                  Find a ride
                </button>
              </div>
            ) : (
              <div className="pd-recent-list">
                {recentBookings.map((b) => (
                  <button key={b.id} className="pd-recent-row" onClick={() => navigate(`/passenger/track/${b.trip?.id}`)}>
                    <div className="pd-route-line" aria-hidden="true">
                      <span className="pd-route-dot pd-route-dot-start" />
                      <span className="pd-route-track" />
                      <span className="pd-route-dot pd-route-dot-end" />
                    </div>
                    <div className="pd-recent-info">
                      <p className="pd-recent-route">
                        <span>{b.trip?.origin_name}</span>
                        <span className="pd-recent-route-to">{b.trip?.destination_name}</span>
                      </p>
                      <p className="pd-recent-date">{formatDateTime(b.trip?.departure_time)}</p>
                    </div>
                    <div className="pd-recent-side">
                      <span className="pd-recent-fare">{formatCurrency(b.fare_total)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="pd-sidebar">
          <form onSubmit={submit} className="pd-search-card">
            <p className="pd-search-card-title">Plan a ride</p>

            <div className="pd-search-card-locations">
              <Field label="From">
                <LocationPicker icon={MapPin} value={from} onChange={setFrom} placeholder="Pickup location" />
              </Field>

              <button
                type="button"
                className="pd-swap-btn"
                onClick={swapLocations}
                aria-label="Swap pickup and destination"
                disabled={!from && !to}
              >
                <ArrowUpDown className="pd-swap-icon" />
              </button>

              <Field label="To">
                <LocationPicker icon={Navigation} value={to} onChange={setTo} placeholder="Destination" />
              </Field>
            </div>

            <div className="pd-search-card-row">
              <Field label="Date">
                <Input icon={CalendarDays} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Time">
                <Input icon={Clock} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
            </div>

            <button type="submit" className="pd-btn pd-btn-primary pd-search-card-submit">
              <Search className="pd-btn-icon" />
              Find rides
            </button>
          </form>

          {upcoming ? (
            <button className="pd-upcoming" onClick={() => navigate(`/passenger/track/${upcoming.trip?.id}`)}>
              <div className="pd-upcoming-top">
                <span className="pd-upcoming-label">Upcoming ride</span>
                <StatusBadge status={upcoming.status} />
              </div>

              <div className="pd-upcoming-route">
                <div className="pd-route-line pd-route-line-lg" aria-hidden="true">
                  <span className="pd-route-dot pd-route-dot-start" />
                  <span className="pd-route-track" />
                  <span className="pd-route-dot pd-route-dot-end" />
                </div>
                <div className="pd-upcoming-stops">
                  <span className="pd-upcoming-stop">{upcoming.trip?.origin_name}</span>
                  <span className="pd-upcoming-stop">{upcoming.trip?.destination_name}</span>
                </div>
              </div>

              <div className="pd-upcoming-footer">
                <div className="pd-upcoming-time">
                  <CalendarClock className="pd-inline-icon" />
                  {formatDateTime(upcoming.trip?.departure_time)}
                </div>
                <div className="pd-upcoming-fare">
                  {upcoming.seats_booked} seat{upcoming.seats_booked === 1 ? "" : "s"} ·{" "}
                  {formatCurrency(upcoming.fare_total)}
                </div>
              </div>

              <span className="pd-upcoming-cta">
                Track ride
                <ArrowUpRight className="pd-upcoming-arrow" />
              </span>
            </button>
          ) : (
            <div className="pd-sidebar-empty">
              <p className="pd-sidebar-empty-title">No trips scheduled</p>
              <p className="pd-sidebar-empty-body">
                Search for a route above and your next confirmed ride will appear here.
              </p>
            </div>
          )}

          <div className="pd-quick-actions">
            <button className="pd-quick-action" onClick={() => navigate("/passenger/find-ride")}>
              <Search className="pd-quick-action-icon" />
              <span>Find a ride</span>
              <ArrowRight className="pd-quick-action-arrow" />
            </button>
            <button className="pd-quick-action" onClick={() => navigate("/passenger/my-rides")}>
              <CalendarDays className="pd-quick-action-icon" />
              <span>My rides</span>
              <ArrowRight className="pd-quick-action-arrow" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}