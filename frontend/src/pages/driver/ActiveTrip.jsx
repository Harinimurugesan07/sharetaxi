import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Users, X } from "lucide-react";

import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge, { StatusBadge } from "../../components/Badge";
import { LoadingState, ErrorState } from "../../components/States";

import { formatDate, formatTime } from "../../lib/format";
import { myTrips, updateTripStatus } from "../../api/trips";
import { driverRideRequests } from "../../api/driver";

import {
  STAGES,
  STAGE_LABELS,
  NEXT_ACTION_LABEL,
  BACKEND_STATUS_FOR_STAGE,
  IN_PROGRESS_STAGES,
  getProgress,
  syncProgress,
  advanceStage,
  cancelTrip,
} from "../../lib/tripProgress";
import { startLocationSharing } from "../../lib/locationSharing";
import { bookedSeats } from "../../lib/seats";

import { useToast } from "../../context/ToastContext";

import "./ActiveTrip.css";

export default function ActiveTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [progress, setProgress] = useState(() => getProgress(tripId));
  const [advancing, setAdvancing] = useState(false);
  const [locationState, setLocationState] = useState("idle");
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("Vehicle issue");

  const load = () => {
    setStatus("loading");

    Promise.all([myTrips(), driverRideRequests().catch(() => [])])
      .then(([trips, requests]) => {
        const t = (trips || []).find((x) => x.id === tripId);

        if (!t) {
          return setStatus("error");
        }

        setTrip(t);
        // The backend status wins over whatever this browser remembered.
        setProgress(syncProgress(tripId, t));
        setBookings(
          (requests || []).filter(
            (r) => (r.trip_id ?? r.trip?.id) === tripId && r.status !== "cancelled"
          )
        );
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, [tripId]);

  const stageIndex = STAGES.indexOf(progress.stage);
  const isCancelled = progress.stage === "cancelled";

  // Share the driver's live position while the trip is under way.
  const sharingLocation = status === "success" && IN_PROGRESS_STAGES.includes(progress.stage);

  useEffect(() => {
    if (!sharingLocation) {
      setLocationState("idle");
      return undefined;
    }

    setLocationState("waiting");

    return startLocationSharing(tripId, {
      onPosition: () => setLocationState("sharing"),
      onError: (err) => setLocationState(err?.code === 1 ? "denied" : "unavailable"),
    });
  }, [sharingLocation, tripId]);

  const advance = async () => {
    if (advancing) return;

    const nextStage =
      STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
    const backendStatus = BACKEND_STATUS_FOR_STAGE[nextStage];

    setAdvancing(true);

    try {
      // Backend first: local progress only moves once the server agrees.
      if (backendStatus) {
        await updateTripStatus(tripId, backendStatus);
        setTrip((t) => ({ ...t, status: backendStatus }));
      }

      const updated = advanceStage(tripId);

      setProgress(updated);

      toast.success(STAGE_LABELS[updated.stage]);
    } catch (err) {
      toast.error(err.message || "Unable to update trip status.");
    } finally {
      setAdvancing(false);
    }
  };

  const confirmCancel = async () => {
    try {
      await updateTripStatus(tripId, "cancelled", reason);

      const updated = cancelTrip(tripId, reason);

      setProgress(updated);
      setTrip((t) => ({ ...t, status: "cancelled", cancel_reason: reason }));
      setShowCancel(false);

      toast.success("Trip Cancelled");
    } catch (err) {
      toast.error(err.message || "Unable to cancel trip.");
    }
  };

  if (status === "loading") {
    return <LoadingState label="Loading trip..." />;
  }

  if (status === "error") {
    return (
      <ErrorState
        onRetry={load}
        message="We couldn't find this trip."
      />
    );
  }

  // Simple stylized route path — swap for a real map SDK with live coordinates.
  const pathD = "M 40 220 C 140 40, 260 260, 380 60";

  return (
    <div className="active-trip">
      {/* Main trip information */}
      <div className="active-trip-main">
        <Card className="active-trip-route-card">
          <div className="active-trip-route-header">
            <div className="active-trip-route-info">
              <p className="active-trip-route-title">
                {trip.origin_name} → {trip.destination_name}
              </p>

              <p className="active-trip-route-meta">
                Trip ID: {trip.id.slice(0, 8).toUpperCase()} ·{" "}
                {formatDate(trip.departure_time)},{" "}
                {formatTime(trip.departure_time)}
              </p>
            </div>

            <StatusBadge
              status={
                isCancelled
                  ? "cancelled"
                  : progress.stage === "completed"
                    ? "completed"
                    : "active"
              }
            />
          </div>

          {/* Route visualization */}
          <div className="active-trip-map">
            <svg
              viewBox="0 0 420 300"
              className="active-trip-map-svg"
              aria-label="Trip route"
            >
              <rect
                width="420"
                height="300"
                fill="#E8FAFC"
              />

              <path
                d={pathD}
                fill="none"
                stroke="#08758F"
                strokeOpacity="0.15"
                strokeWidth="10"
                strokeLinecap="round"
              />

              <path
                d={pathD}
                fill="none"
                stroke="#08758F"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="1 10"
              />

              <circle
                cx="40"
                cy="220"
                r="7"
                fill="#1CA652"
                stroke="white"
                strokeWidth="2"
              />

              <circle
                cx="380"
                cy="60"
                r="7"
                fill="#E13B3B"
                stroke="white"
                strokeWidth="2"
              />

              <text
                x="200"
                y="150"
                textAnchor="middle"
                fontSize="24"
              >
                🚕
              </text>
            </svg>

            <div className="active-trip-location-card active-trip-pickup">
              <p className="active-trip-location-label">
                Pickup
              </p>

              <p className="active-trip-location-name">
                {trip.origin_name}
              </p>
            </div>

            <div className="active-trip-location-card active-trip-destination">
              <p className="active-trip-location-label">
                Destination
              </p>

              <p className="active-trip-location-name">
                {trip.destination_name}
              </p>
            </div>
          </div>

          {/* Passenger count */}
          <div className="active-trip-passenger-summary">
            <span className="active-trip-passenger-label">
              <Users />
              Passengers
            </span>

            <span className="active-trip-passenger-count">
              {bookedSeats(trip)} /{" "}
              {trip.total_seats} seats booked
            </span>
          </div>
        </Card>

        {/* Passenger manifest */}
        <Card className="active-trip-manifest-card">
          <p className="active-trip-card-title">Passengers</p>

          {bookings.length === 0 ? (
            <p className="active-trip-manifest-empty">
              No passengers have booked this trip yet.
            </p>
          ) : (
            <ul className="active-trip-manifest">
              {bookings.map((b) => (
                <li key={b.id} className="active-trip-manifest-row">
                  <div className="active-trip-manifest-info">
                    <p className="active-trip-manifest-name">
                      {b.passenger?.name || "Passenger"}
                    </p>
                    <p className="active-trip-manifest-meta">
                      {b.seats_booked} seat{b.seats_booked === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Badge tone={b.status === "confirmed" ? "success" : "yellow"}>
                    {b.status?.replace("_", " ") || "unknown"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cancel trip */}
        {!isCancelled &&
          progress.stage !== "completed" &&
          stageIndex < 3 && (
            <Button
              variant="outline"
              size="sm"
              className="active-trip-cancel-button"
              onClick={() => setShowCancel(true)}
            >
              <X />
              Cancel Trip
            </Button>
          )}
      </div>

      {/* Right column */}
      <div className="active-trip-sidebar">
        {/* Progress */}
        <Card className="active-trip-progress-card">
          <p className="active-trip-card-title">
            Trip Progress
          </p>

          <ol className="active-trip-progress-list">
            {STAGES.map((s, i) => {
              const completed =
                !isCancelled && i <= stageIndex;

              const past =
                !isCancelled && i < stageIndex;

              return (
                <li
                  key={s}
                  className="active-trip-progress-item"
                >
                  <span
                    className={`active-trip-progress-number ${
                      isCancelled
                        ? "active-trip-progress-inactive"
                        : completed
                          ? "active-trip-progress-completed"
                          : "active-trip-progress-inactive"
                    }`}
                  >
                    {!isCancelled && past ? "✓" : i + 1}
                  </span>

                  <span
                    className={`active-trip-progress-label ${
                      completed
                        ? "active-trip-progress-label-active"
                        : "active-trip-progress-label-inactive"
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </span>
                </li>
              );
            })}
          </ol>

          {progress.updated_at && !isCancelled && (
            <p className="active-trip-updated">
              Updated at {formatTime(progress.updated_at)}
            </p>
          )}
        </Card>

        {/* Update status */}
        <Card className="active-trip-status-card">
          <p className="active-trip-card-title">
            Update Trip Status
          </p>

          {isCancelled ? (
            <p className="active-trip-status-message">
              This trip was cancelled ({progress.cancel_reason}).
            </p>
          ) : progress.stage === "completed" ? (
            <p className="active-trip-completed">
              🟢 Trip Completed
            </p>
          ) : (
            <Button
              className="active-trip-update-button"
              size="lg"
              loading={advancing}
              onClick={advance}
            >
              {NEXT_ACTION_LABEL[progress.stage]}
            </Button>
          )}

          {locationState !== "idle" && (
            <p className={`active-trip-location active-trip-location-${locationState}`}>
              <MapPin />
              {locationState === "sharing" && "Sharing your live location with passengers."}
              {locationState === "waiting" && "Getting your location…"}
              {locationState === "denied" &&
                "Location access is blocked. Allow it in your browser so passengers can follow your vehicle."}
              {locationState === "unavailable" &&
                "Couldn't get your location right now. Check GPS and that the page is on HTTPS."}
            </p>
          )}

          <p className="active-trip-status-help">
            Please update the status as per your current location.
            This helps passengers track their ride in real time.
          </p>
        </Card>
      </div>

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div
          className="active-trip-modal"
          onClick={() => setShowCancel(false)}
        >
          <Card
            className="active-trip-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="active-trip-modal-title">
              Cancel this trip?
            </p>

            <p className="active-trip-modal-description">
              Passengers will be notified immediately.
            </p>

            <div className="active-trip-reasons">
              {[
                "Vehicle issue",
                "Emergency",
                "Unable to continue",
                "Other",
              ].map((r) => (
                <label
                  key={r}
                  className="active-trip-reason"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />

                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="active-trip-modal-actions">
              <Button
                variant="outline"
                className="active-trip-modal-button"
                onClick={() => setShowCancel(false)}
              >
                Keep Trip
              </Button>

              <Button
                variant="danger"
                className="active-trip-modal-button"
                onClick={confirmCancel}
              >
                Cancel Trip
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}