import { useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { MapPin, Navigation, Clock, Users, ArrowLeft } from "lucide-react";
import StarRating from "../../components/StarRating";
import { EmptyState } from "../../components/States";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { createBooking } from "../../api/bookings";
import { useToast } from "../../context/ToastContext";
import "./BookRide.css";

export default function BookRide() {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const trip = state?.trip;
  const [seats, setSeats] = useState(state?.seats || 1);
  const [loading, setLoading] = useState(false);

  if (!trip) {
    return (
      <EmptyState
        title="We lost this ride's details"
        description="Search again to pick a shared ride to book."
        action={
          <Link to="/passenger/find-ride" className="br-btn br-btn-primary br-btn-sm">
            Find a Ride
          </Link>
        }
      />
    );
  }

  const total = Number(trip.fare_per_seat) * seats;

  const proceed = async () => {
    setLoading(true);
    try {
      const booking = await createBooking(trip.id, seats);
      navigate(`/passenger/payment/${booking.booking_id || booking.id}`, {
        state: { booking, trip, seats, total },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br-wrap">
      <button onClick={() => navigate(-1)} className="br-back-btn">
        <ArrowLeft className="br-back-icon" /> Back to results
      </button>

      <div className="br-card">
        <p className="br-card-title">Booking confirmation</p>

        <div className="br-route">
          <div className="br-route-point">
            <MapPin className="br-route-icon br-route-icon-origin" />
            <span className="br-route-label">{trip.origin_name}</span>
          </div>
          <div className="br-route-line" />
          <div className="br-route-point br-route-point-end">
            <span className="br-route-label">{trip.destination_name}</span>
            <Navigation className="br-route-icon" />
          </div>
        </div>

        <dl className="br-info-list">
          <div className="br-info-row">
            <dt className="br-info-label">Departure</dt>
            <dd className="br-info-value">{formatDateTime(trip.departure_time)}</dd>
          </div>
          <div className="br-info-row">
            <dt className="br-info-label">Vehicle</dt>
            <dd className="br-info-value">
              {trip.vehicle?.make} {trip.vehicle?.model}
            </dd>
          </div>
          <div className="br-info-row">
            <dt className="br-info-label">Registration</dt>
            <dd className="br-info-value">{trip.vehicle?.registration_number}</dd>
          </div>
          <div className="br-info-row">
            <dt className="br-info-label">Driver</dt>
            <dd className="br-info-value br-info-value-inline">
              {trip.driver_name} <StarRating value={trip.driver_rating || 5} />
            </dd>
          </div>
        </dl>

        <div className="br-seats-row">
          <span className="br-seats-label">
            <Users className="br-seats-icon" /> Seats
          </span>
          <div className="br-seats-control">
            <button
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              className="br-seats-btn"
              type="button"
              aria-label="Decrease seats"
            >
              −
            </button>
            <span className="br-seats-count">{seats}</span>
            <button
              onClick={() => setSeats((s) => Math.min(trip.available_seats, s + 1))}
              className="br-seats-btn"
              type="button"
              aria-label="Increase seats"
            >
              +
            </button>
          </div>
        </div>

        <div className="br-summary">
          <div className="br-summary-row">
            <span>Fare per seat</span>
            <span>{formatCurrency(trip.fare_per_seat)}</span>
          </div>
          <div className="br-summary-row">
            <span>Seats</span>
            <span>× {seats}</span>
          </div>
          <div className="br-summary-row br-summary-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button className="br-btn br-btn-primary br-btn-block" onClick={proceed} disabled={loading}>
          {loading ? "Processing…" : "                      Payment"}
        </button>
      </div>
    </div>
  );
}