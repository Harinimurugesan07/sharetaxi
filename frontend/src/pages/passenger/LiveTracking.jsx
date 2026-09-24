import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, MessageCircle, Share2 } from "lucide-react";
import StarRating from "../../components/StarRating";
import { readBookings, syncBookingsFromServer, updateBookingTripStatus } from "../../lib/bookingsCache";
import { joinTripRoom, leaveTripRoom, getSocket } from "../../lib/socket";
import { routeProgress } from "../../lib/routeProgress";
import "./LiveTracking.css";

const STAGES = ["Driver Assigned", "On the Way", "Arrived", "Trip Started", "Completed"];

export default function LiveTracking() {
  const { tripId } = useParams();
  const [booking, setBooking] = useState(() => readBookings().find((b) => b.trip?.id === tripId) || null);
  const trip = booking?.trip;
  const [stageIndex, setStageIndex] = useState(0);
  const [tripStatus, setTripStatus] = useState(trip?.status || "scheduled");
  const [cancelReason, setCancelReason] = useState(trip?.cancel_reason || "");
  const [driverPos, setDriverPos] = useState(0.28); // 0..1 along the route, for the visual map
  const timerRef = useRef(null);
  const hasLiveFix = useRef(false); // true once a real GPS position has arrived
  const isCancelled = tripStatus === "cancelled";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const bookings = await syncBookingsFromServer();
        if (!cancelled) {
          const nextBooking = bookings.find((b) => b.trip?.id === tripId) || null;
          setBooking(nextBooking);
        }
      } catch {
        if (!cancelled) {
          setBooking(readBookings().find((b) => b.trip?.id === tripId) || null);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => {
    if (!trip?.status) return;

    setTripStatus(trip.status);
    setCancelReason(trip.cancel_reason || "");

    if (trip.status === "cancelled") {
      setStageIndex(-1);
    } else if (trip.status === "completed") {
      setStageIndex(STAGES.length - 1);
    } else if (trip.status === "ongoing") {
      setStageIndex(1);
    } else {
      setStageIndex(0);
    }
  }, [trip?.status, trip?.cancel_reason]);

  // Wire up to the backend's Socket.IO trip room. Falls back to a gentle
  // simulated approach so the map is never static in a demo environment.
  useEffect(() => {
    if (!trip) return;
    joinTripRoom(trip.id);
    const socket = getSocket();

    const onLocation = (payload) => {
      // Real GPS from the driver: place the marker from actual coordinates.
      const progress = routeProgress(trip, payload);
      if (progress !== null) {
        hasLiveFix.current = true;
        setDriverPos(Math.min(0.95, Math.max(0.02, progress)));
        return;
      }
      // No usable coordinates: keep nudging the marker so the map isn't frozen.
      setDriverPos((p) => Math.min(0.95, p + 0.03));
    };
    const onArriving = () => {
      setTripStatus("ongoing");
      setStageIndex(2);
    };
    const onStarted = () => {
      setTripStatus("ongoing");
      setStageIndex(1);
    };
    const onCompleted = () => {
      setTripStatus("completed");
      setStageIndex(4);
    };
    const onTripStatusUpdated = (payload) => {
      const nextStatus = payload?.new_status || payload?.status || payload?.trip?.status;

      if (!nextStatus) return;

      const newReason = payload?.reason || null;
      updateBookingTripStatus(tripId, nextStatus, newReason);

      setCancelReason(newReason || "");
      setTripStatus(nextStatus);

      if (nextStatus === "cancelled") {
        setStageIndex(-1);
        return;
      }

      if (nextStatus === "completed") {
        setStageIndex(4);
      } else if (nextStatus === "ongoing") {
        setStageIndex(1);
      } else {
        setStageIndex(0);
      }
    };

    const onTripCancelled = (payload) => {
      const newReason = payload?.reason || "The driver cancelled this trip.";
      updateBookingTripStatus(tripId, "cancelled", newReason);
      setCancelReason(newReason);
      setTripStatus("cancelled");
    };

    socket.on("driver:location", onLocation);
    socket.on("trip:driver_arriving", onArriving);
    socket.on("trip:started", onStarted);
    socket.on("trip:completed", onCompleted);
    socket.on("trip_status_updated", onTripStatusUpdated);
    socket.on("trip:cancelled", onTripCancelled);

    timerRef.current = setInterval(() => {
      if (hasLiveFix.current) return; // real positions replace the simulation
      setDriverPos((p) => (p < 0.9 ? p + 0.015 : p));
    }, 2500);

    return () => {
      clearInterval(timerRef.current);
      socket.off("driver:location", onLocation);
      socket.off("trip:driver_arriving", onArriving);
      socket.off("trip:started", onStarted);
      socket.off("trip:completed", onCompleted);
      socket.off("trip_status_updated", onTripStatusUpdated);
      socket.off("trip:cancelled", onTripCancelled);
      leaveTripRoom(trip.id);
    };
  }, [trip]);

  if (!trip) {
    return (
      <div className="lt-card lt-empty">
        We couldn't find this ride. Head back to My Rides to track an active trip.
      </div>
    );
  }

  const progressTitle = isCancelled ? "Trip Cancelled" : "Trip Progress";

  // Simple curved-path visual map (not a real geocoded map) — swap the <svg>
  // below for Google Maps / Mapbox with the trip's real lat/lng in production.
  const pathD = "M 40 220 C 140 40, 260 260, 380 60";
  const point = (t) => {
    // crude cubic bezier point approximation for the demo path
    const p0 = [40, 220], p1 = [140, 40], p2 = [260, 260], p3 = [380, 60];
    const u = 1 - t;
    const x = u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0];
    const y = u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1];
    return [x, y];
  };
  const [cx, cy] = point(driverPos);

  return (
    <div className="lt-grid">
      <div className="lt-card lt-map-card">
        <div className="lt-map">
          <svg viewBox="0 0 420 300" className="lt-map-svg">
            <rect width="420" height="300" fill="#EAF1FE" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 40} x2="420" y2={i * 40} stroke="#D3E0F7" strokeWidth="1" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 42} y1="0" x2={i * 42} y2="300" stroke="#D3E0F7" strokeWidth="1" />
            ))}
            <path d={pathD} fill="none" stroke="#1542C2" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 10" />
            <path d={pathD} fill="none" stroke="#1542C2" strokeOpacity="0.15" strokeWidth="10" strokeLinecap="round" />
            <circle cx="40" cy="220" r="7" fill="#1CA652" stroke="white" strokeWidth="2" />
            <circle cx="380" cy="60" r="7" fill="#E13B3B" stroke="white" strokeWidth="2" />
            <g transform={`translate(${cx}, ${cy})`}>
              <circle r="12" fill="#F5B400" stroke="#0B1F4D" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fontSize="12">🚕</text>
            </g>
          </svg>
          <div className="lt-map-tag lt-map-tag-left">
            <p className="lt-map-tag-label">Pickup</p>
            <p className="lt-map-tag-value">{trip.origin_name}</p>
          </div>
          <div className="lt-map-tag lt-map-tag-right">
            <p className="lt-map-tag-label">Destination</p>
            <p className="lt-map-tag-value">{trip.destination_name}</p>
          </div>
          <div className="lt-eta-tag">
            <p className="lt-eta-label">ETA</p>
            <p className="lt-eta-value">{Math.max(2, Math.round((1 - driverPos) * 12))} min away</p>
          </div>
        </div>
      </div>

      <div className="lt-side">
        <div className="lt-card">
          <div className="lt-driver-head">
            <div className="lt-driver-avatar">{trip.driver_name?.[0] || "D"}</div>
            <div>
              <p className="lt-driver-name">{trip.driver_name}</p>
              <StarRating value={trip.driver_rating || 5} />
            </div>
          </div>
          <div className="lt-vehicle-box">
            <p className="lt-vehicle-name">
              {trip.vehicle?.make} {trip.vehicle?.model} · {trip.vehicle?.color}
            </p>
            <p className="lt-vehicle-reg">{trip.vehicle?.registration_number}</p>
          </div>
          <div className="lt-actions">
            <button className="lt-action-btn">
              <Phone className="lt-action-icon" /> Call
            </button>
            <button className="lt-action-btn">
              <MessageCircle className="lt-action-icon" /> Message
            </button>
            <button className="lt-action-btn">
              <Share2 className="lt-action-icon" /> Share
            </button>
          </div>
        </div>

        <div className="lt-card">
          <p className="lt-progress-title">{progressTitle}</p>
          {isCancelled ? (
            <div className="lt-progress-cancelled">
              This trip was cancelled by the driver{cancelReason ? `: ${cancelReason}` : "."}
            </div>
          ) : (
            <ol className="lt-progress-list">
              {STAGES.map((s, i) => (
                <li key={s} className="lt-progress-item">
                  <span className={`lt-progress-dot ${i <= stageIndex ? "lt-progress-dot-done" : ""}`}>
                    {i < stageIndex ? "✓" : i + 1}
                  </span>
                  <span className={`lt-progress-label ${i <= stageIndex ? "lt-progress-label-done" : ""}`}>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}