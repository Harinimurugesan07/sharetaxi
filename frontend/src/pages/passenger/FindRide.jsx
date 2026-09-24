import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Navigation, CalendarDays, Clock, Users, Car } from "lucide-react";
import { Field, Select, Input } from "../../components/Field";
import LocationPicker from "../../components/LocationPicker";
import Badge, { StatusBadge } from "../../components/Badge";
import StarRating from "../../components/StarRating";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { formatCurrency, formatTime } from "../../lib/format";
import { searchMatches } from "../../api/trips";
import { geocodeLocation } from "../../api/geocoding";
import "./FindRide.css";

export default function FindRide() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [date, setDate] = useState(params.get("date") || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(params.get("time") || "10:00");
  const [seats, setSeats] = useState(1);

  const [status, setStatus] = useState("idle"); // idle | loading | success | error | empty
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const runSearch = async (e) => {
    e?.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const origin = fromLocation || (await geocodeLocation(from));
      const destination = toLocation || (await geocodeLocation(to));
      if (!origin || !destination) {
        throw new Error("Please choose both a pickup and a drop location.");
      }
      const departure_time = `${date}T${time}:00`;
      const data = await searchMatches({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        departure_time,
        seats_needed: Number(seats),
      });
      setResults(data || []);
      setStatus(data && data.length ? "success" : "empty");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (from && to) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fr-wrap">
      <div className="fr-card fr-search-card">
        <form onSubmit={runSearch} className="fr-search-form">
          <Field label="Pickup Location">
            <LocationPicker icon={MapPin} value={from} onChange={setFrom} onSelect={setFromLocation} placeholder="Search pickup location" />
          </Field>
          <Field label="Destination">
            <LocationPicker icon={Navigation} value={to} onChange={setTo} onSelect={setToLocation} placeholder="Search destination" />
          </Field>
          <Field label="Date">
            <Input icon={CalendarDays} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Departure Time">
            <Input icon={Clock} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Passengers">
            <Select icon={Users} value={seats} onChange={(e) => setSeats(e.target.value)}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "seat" : "seats"}
                </option>
              ))}
            </Select>
          </Field>
          <div className="fr-search-submit">
            <button type="submit" className="fr-btn fr-btn-primary fr-btn-block" disabled={status === "loading"}>
              {status === "loading" ? "Searching…" : "Search Rides"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <p className="fr-section-title">Available Rides</p>

        {status === "idle" && (
          <EmptyState title="Search for a route" description="Choose a pickup and destination above to see matching shared rides." />
        )}
        {status === "loading" && <LoadingState label="Finding available rides..." />}
        {status === "error" && <ErrorState message={error} onRetry={runSearch} />}
        {status === "empty" && (
          <EmptyState
            title="No shared rides found for this route"
            description="Try a different time, or check back closer to your travel date."
          />
        )}
        {status === "success" && (
          <div className="fr-results">
            {results.map(({ trip, match_percent }) => (
              <div key={trip.id} className="fr-card fr-result-card">
                <div className="fr-result-top">
                  <div>
                    <p className="fr-result-route">
                      {trip.origin_name} <span className="fr-arrow">→</span> {trip.destination_name}
                    </p>
                    <div className="fr-result-meta">
                      <span className="fr-meta-item">
                        <Clock className="fr-meta-icon" /> {formatTime(trip.departure_time)}
                      </span>
                      {trip.estimated_arrival_time && <span>ETA {formatTime(trip.estimated_arrival_time)}</span>}
                      <span className="fr-meta-item">
                        <Car className="fr-meta-icon" /> {trip.vehicle?.make} {trip.vehicle?.model}
                      </span>
                    </div>
                  </div>
                  <div className="fr-result-badges">
                    {match_percent != null && <Badge tone="yellow">{Math.round(match_percent)}% match</Badge>}
                    <StatusBadge status={trip.status} />
                  </div>
                </div>

                <div className="fr-result-bottom">
                  <div className="fr-driver-block">
                    <div className="fr-driver-info">
                      <div className="fr-driver-avatar">{trip.driver_name?.[0] || "D"}</div>
                      <div>
                        <p className="fr-driver-name">{trip.driver_name}</p>
                        <StarRating value={trip.driver_rating || 5} />
                      </div>
                    </div>
                    <div className="fr-vehicle-meta">
                      {trip.vehicle?.registration_number} · {trip.available_seats} seats available
                    </div>
                  </div>
                  <div className="fr-fare-block">
                    <div className="fr-fare">
                      <p className="fr-fare-amount">{formatCurrency(trip.fare_per_seat)}</p>
                      <p className="fr-fare-label">per seat</p>
                    </div>
                    <button
                      className="fr-btn fr-btn-primary"
                      disabled={trip.available_seats < Number(seats) || trip.status !== "scheduled"}
                      onClick={() => navigate(`/passenger/book/${trip.id}`, { state: { trip, seats: Number(seats) } })}
                    >
                      {trip.status !== "scheduled" || trip.available_seats < Number(seats) ? "Unavailable" : "Book Ride"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}