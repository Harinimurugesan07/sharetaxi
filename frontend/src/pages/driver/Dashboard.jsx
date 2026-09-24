import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Route, Wallet, Star, TrendingUp, Armchair, ShieldCheck, ChevronRight, Car } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import StarRating from "../../components/StarRating";
import { LoadingState, ErrorState } from "../../components/States";
import { formatCurrency } from "../../lib/format";
import { myDriverProfile, setAvailability } from "../../api/driver";
import { myTrips } from "../../api/trips";
import { myVehicles } from "../../api/vehicles";
import { useAuth } from "../../context/AuthContext";
import { isOperatorOwnedDriver } from "../../lib/driverType";
import { passengerCapacity, bookedSeats } from "../../lib/seats";
import { useToast } from "../../context/ToastContext";

import "./DriverDashboard.css";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const operatorOwned = isOperatorOwnedDriver(user);
  const toast = useToast();
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [status, setStatus] = useState("loading");
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const [d, t, v] = await Promise.all([myDriverProfile(), myTrips(), myVehicles()]);
      setDriver(d);
      setTrips(t || []);
      setVehicle((v || [])[0] || null);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isVerified = driver?.verification_status === "verified";

  const toggleOnline = async () => {
    if (!isVerified) {
      toast.error("You can go online once your verification is approved.");
      return;
    }
    setToggling(true);
    try {
      const next = driver.availability === "online" ? "offline" : "online";
      const updated = await setAvailability(next);
      setDriver(updated);
      toast.success(`You're now ${updated.availability}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (status === "loading") return <LoadingState label="Loading your dashboard..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  const today = new Date().toDateString();
  const todaysTrips = trips.filter((t) => new Date(t.departure_time).toDateString() === today);
  const todaysEarnings = todaysTrips
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + Number(t.fare_per_seat) * bookedSeats(t), 0);
  const isOnline = driver?.availability === "online";

  const stats = [
    { label: "Today's Trips", value: todaysTrips.length, icon: Route, hint: "+1 more than yesterday" },
    { label: "Passenger Seats", value: vehicle ? passengerCapacity(vehicle) : "—", icon: Armchair, hint: "driver seat excluded" },
    { label: "Today's Earnings", value: formatCurrency(todaysEarnings), icon: Wallet, hint: "vs. yesterday" },
    { label: "Total Trips", value: driver?.total_trips ?? 0, icon: TrendingUp, hint: "since registration" },
    { label: "Rating", value: Number(driver?.average_rating || 5).toFixed(1), icon: Star, hint: `${driver?.total_trips ?? 0} rides` },
  ];

  return (
    <div className="driver-dashboard">
      {/* Header: greeting + driver + vehicle */}
      <Card className="driver-dashboard-header-card">
        <div className="driver-dashboard-header">
          <div className="driver-dashboard-welcome">
            <span className="driver-dashboard-eyebrow">Overview</span>
            <h2>{greeting()}, {user?.full_name?.split(" ")[0]}!</h2>
            <p>Drive safe. Earn more. Keep moving.</p>
          </div>
          <div className="driver-dashboard-profile">
            <div className="driver-dashboard-avatar">
              {user?.full_name?.[0]}
            </div>
            <div className="driver-dashboard-profile-info">
              <p className="driver-dashboard-name">{user?.full_name}</p>
              <div className="driver-dashboard-rating">
                <StarRating value={driver?.average_rating || 5} />
                <span>({driver?.total_trips ?? 0} trips)</span>
              </div>
              {isVerified && (
                <p className="driver-dashboard-verified">
                  <ShieldCheck /> Verified Driver
                </p>
              )}
            </div>
          </div>
        </div>

        {vehicle && (
          <div className="driver-dashboard-vehicle">
            <div className="driver-dashboard-vehicle-info">
              <span className="driver-dashboard-vehicle-icon">
                <Car />
              </span>
              <div>
                <p>{vehicle.make} {vehicle.model}</p>
                <span>{vehicle.registration_number} · {passengerCapacity(vehicle)} Passenger Seats</span>
              </div>
            </div>
            <Button as={Link} to="/driver/vehicles" variant="outline" size="sm">View Details</Button>
          </div>
        )}
      </Card>

      {!isVerified && (
        <Card className="driver-verification-alert">
          <span className="driver-verification-icon">
            <ShieldCheck />
          </span>
          <p>
            Your account is <strong>{driver?.verification_status}</strong>.{" "}
            <Link to="/onboarding/verification">Check verification status</Link> — you can go online once it's approved.
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="driver-dashboard-stats">
        {stats.map((s) => (
          <Card key={s.label} className="driver-stat-card">
            <div className="driver-stat-top">
              <p>{s.label}</p>
              <s.icon />
            </div>
            <p className="driver-stat-value">{s.value}</p>
            <p className="driver-stat-hint">{s.hint}</p>
          </Card>
        ))}
      </div>

      {/* Online toggle band */}
      <Card className={`driver-online-card ${isOnline ? "driver-online-card-active" : ""}`}>
        <div className="driver-online-content">
          <div>
            <p className="driver-online-status">
              <span className={`driver-online-dot ${isOnline ? "driver-online-dot-active" : ""}`} />
              You are {isOnline ? "Online" : "Offline"}
            </p>
            <p className="driver-online-description">
              {isOnline ? "Ready to receive ride requests" : "Go online to start receiving requests"}
            </p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling || !isVerified}
            className={`driver-online-toggle ${isOnline ? "driver-online-toggle-active" : ""}`}
          >
            <span className={`driver-online-toggle-knob ${isOnline ? "driver-online-toggle-knob-active" : ""}`} />
          </button>
        </div>
      </Card>

      <div className="driver-today-section">
        <div className="driver-section-header">
          <div>
            <span className="driver-section-eyebrow">Schedule</span>
            <p className="driver-section-title">Today's trips</p>
          </div>
          {!operatorOwned && (
            <Button as={Link} to="/driver/create-trip" size="sm">Create Trip</Button>
          )}
        </div>
        {todaysTrips.length === 0 ? (
          <Card className="driver-empty-trips">
            <span className="driver-empty-icon">
              <Route />
            </span>
            <p>No trips today</p>
            <span>
              {operatorOwned ? "Trips your operator assigns to you will appear here." : "No trips scheduled for today."}
            </span>
          </Card>
        ) : (
          <div className="driver-trip-grid">
            {todaysTrips.map((t) => (
              <Link
                key={t.id}
                className="driver-trip-link"
                to={t.status === "scheduled" || t.status === "ongoing" ? `/driver/active-trip/${t.id}` : "/driver/trips"}
              >
                <Card className="driver-trip-card">
                  <div className="driver-trip-route">
                    <div className="driver-trip-route-line" />
                    <div className="driver-trip-location">
                      <span className="driver-trip-dot driver-trip-dot-origin" />
                      <span>{t.origin_name}</span>
                    </div>
                    <div className="driver-trip-location">
                      <span className="driver-trip-dot driver-trip-dot-destination" />
                      <span>{t.destination_name}</span>
                    </div>
                  </div>
                  <div className="driver-trip-details">
                    <span>{t.available_seats}/{t.total_seats} seats open</span>
                    <span>{formatCurrency(t.fare_per_seat)}/seat</span>
                  </div>
                  <ChevronRight className="driver-trip-arrow" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}