import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Navigation,
  CalendarDays,
  Clock,
  Users,
  IndianRupee,
  Car,
  Plus,
  X,
  Check,
} from "lucide-react";

import Card from "../../components/Card";
import Button from "../../components/Button";
import { Field, Input, Select } from "../../components/Field";
import LocationPicker from "../../components/LocationPicker";
import { geocodeLocation } from "../../api/geocoding";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { myVehicles } from "../../api/vehicles";
import { createTrip } from "../../api/trips";
import { passengerCapacity } from "../../lib/seats";
import { useToast } from "../../context/ToastContext";

import "./CreateTrip.css";

const STEPS = ["Trip Details", "Route & Stops", "Vehicle", "Review"];

export default function CreateTrip() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    stops: [],
    date: "",
    time: "",
    vehicle_id: "",
    total_seats: 4,
    available_seats: 4,
    fare_per_seat: "",
  });

  const [stopInput, setStopInput] = useState("");
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  useEffect(() => {
    myVehicles()
      .then((v) => {
        setVehicles(v || []);

        if (v?.length) {
          setForm((f) => ({
            ...f,
            vehicle_id: v[0].id,
            total_seats: passengerCapacity(v[0]),
            available_seats: passengerCapacity(v[0]),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

  // Seats offered on this trip: 1..passenger capacity (driver seat excluded).
  const offeredSeats = Number(form.available_seats);
  const seatsAreValid =
    Number.isInteger(offeredSeats) &&
    offeredSeats >= 1 &&
    offeredSeats <= Number(form.total_seats);

  const canNext = () => {
    if (step === 0) {
      return (
        form.origin &&
        form.destination &&
        form.date &&
        form.time
      );
    }

    if (step === 1) return true;

    if (step === 2) {
      return form.vehicle_id && form.fare_per_seat && seatsAreValid;
    }

    return true;
  };

  const addStop = () => {
    if (!stopInput.trim()) return;

    setForm((f) => ({
      ...f,
      stops: [...f.stops, stopInput.trim()],
    }));

    setStopInput("");
  };

  const removeStop = (i) => {
    setForm((f) => ({
      ...f,
      stops: f.stops.filter((_, idx) => idx !== i),
    }));
  };

  const submit = async () => {
    setLoading(true);

    try {
      const origin =
        originLocation || (await geocodeLocation(form.origin));

      const destination =
        destinationLocation ||
        (await geocodeLocation(form.destination));

      if (!origin || !destination || !form.vehicle_id) {
        throw new Error("Please complete all required fields.");
      }

      if (!seatsAreValid) {
        throw new Error(
          `Seats must be a whole number between 1 and ${form.total_seats}.`
        );
      }

      // Intermediate stops are located on the map so passengers can be
      // matched to them; a stop we can't find is reported, never dropped.
      const stops = [];

      for (const [index, stopName] of form.stops.entries()) {
        const located = await geocodeLocation(stopName);

        if (!located) {
          throw new Error(
            `We couldn't find "${stopName}" on the map. Edit or remove that stop.`
          );
        }

        stops.push({
          name: located.name,
          lat: located.lat,
          lng: located.lng,
          sequence: index + 1,
        });
      }

      const result = await createTrip({
        vehicle_id: form.vehicle_id,

        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,

        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,

        departure_time: `${form.date}T${form.time}:00`,

        // total_seats = seats OFFERED on this trip, so seats booked is always
        // total_seats - available_seats (the driver's own seat never counts).
        total_seats: offeredSeats,
        available_seats: offeredSeats,
        fare_per_seat: Number(form.fare_per_seat),

        ...(stops.length > 0 && { stops }),
      });

      const departureDate = formatDateTime(`${form.date}T${form.time}:00`);
      toast.success(
        `Trip published for ${form.origin} → ${form.destination} on ${departureDate}.`,
        "Trip Published"
      );
      navigate("/driver/trips");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(
    (v) => v.id === form.vehicle_id
  );

  return (
    <div className="create-trip-page">
      <div className="create-trip-layout">

        {/* LEFT STEPPER */}
        <Card className="create-trip-sidebar-card">
          <div className="create-trip-sidebar-header">
            <p className="create-trip-title">Create Trip</p>

            <p className="create-trip-description">
              Set up your shared ride in four steps.
            </p>
          </div>

          <div className="create-trip-steps">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`create-trip-step ${
                  i === step
                    ? "create-trip-step-active"
                    : i < step
                    ? "create-trip-step-completed"
                    : "create-trip-step-upcoming"
                }`}
              >
                <span className="create-trip-step-number">
                  {i < step ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="create-trip-step-label">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* TRIP SUMMARY */}
          <div className="create-trip-glance">
            <p className="create-trip-glance-title">
              Trip at a glance
            </p>

            <p className="create-trip-glance-location">
              {form.origin || "Pickup location"}
            </p>

            <div className="create-trip-glance-arrow">↓</div>

            <p className="create-trip-glance-location">
              {form.destination || "Destination"}
            </p>

            {(form.date || form.time) && (
              <p className="create-trip-glance-date">
                {form.date} {form.time}
              </p>
            )}
          </div>
        </Card>

        {/* MAIN CONTENT */}
        <Card className="create-trip-content-card">

          {/* STEP HEADER */}
          <div className="create-trip-content-header">
            <div>
              <span className="create-trip-step-counter">
                Step {step + 1} of {STEPS.length}
              </span>

              <h2>{STEPS[step]}</h2>

              <p>
                {step === 0 &&
                  "Enter your pickup point, destination and departure time."}

                {step === 1 &&
                  "Add optional pickup points along your route."}

                {step === 2 &&
                  "Choose your vehicle and configure available seats."}

                {step === 3 &&
                  "Review your trip details before publishing."}
              </p>
            </div>

            <div className="create-trip-progress">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={
                    i <= step
                      ? "create-trip-progress-active"
                      : ""
                  }
                />
              ))}
            </div>
          </div>

          {/* STEP 0 */}
          {step === 0 && (
            <div className="create-trip-form">

              <Field label="Pickup Location" required>
                <LocationPicker
                  icon={MapPin}
                  value={form.origin}
                  onChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      origin: value,
                    }))
                  }
                  onSelect={setOriginLocation}
                  placeholder="Search pickup location"
                />
              </Field>

              <Field label="Destination" required>
                <LocationPicker
                  icon={Navigation}
                  value={form.destination}
                  onChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      destination: value,
                    }))
                  }
                  onSelect={setDestinationLocation}
                  placeholder="Search destination"
                />
              </Field>

              <div className="create-trip-two-column">
                <Field label="Date" required>
                  <Input
                    icon={CalendarDays}
                    type="date"
                    required
                    value={form.date}
                    onChange={set("date")}
                  />
                </Field>

                <Field label="Time" required>
                  <Input
                    icon={Clock}
                    type="time"
                    required
                    value={form.time}
                    onChange={set("time")}
                  />
                </Field>
              </div>

            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="create-trip-form">

              <Field
                label="Add Stops (Optional)"
                hint="Passengers along the way can join at these points."
              >
                <div className="create-trip-stop-input">
                  <Input
                    placeholder="Add stop location"
                    value={stopInput}
                    onChange={(e) =>
                      setStopInput(e.target.value)
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStop}
                    aria-label="Add stop"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </Field>

              {form.stops.length > 0 && (
                <ul className="create-trip-stop-list">
                  {form.stops.map((s, i) => (
                    <li
                      key={i}
                      className="create-trip-stop-item"
                    >
                      <div className="create-trip-stop-info">
                        <span className="create-trip-stop-number">
                          {i + 1}
                        </span>

                        <span>{s}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStop(i)}
                        className="create-trip-remove-stop"
                        aria-label={`Remove ${s}`}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="create-trip-route-preview">
                <div className="create-trip-route-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <span className="create-trip-route-label">
                    Route preview
                  </span>

                  <p>
                    {form.origin || "Origin"}
                    <span className="create-trip-route-arrow">
                      →
                    </span>

                    {form.stops.length > 0
                      ? `${form.stops.length} stop(s)`
                      : ""}

                    {form.stops.length > 0 && (
                      <span className="create-trip-route-arrow">
                        →
                      </span>
                    )}

                    {form.destination || "Destination"}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="create-trip-form">

              <Field label="Select Vehicle" required>
                <Select
                  icon={Car}
                  required
                  value={form.vehicle_id}
                  onChange={(e) => {
                    const v = vehicles.find(
                      (x) => x.id === e.target.value
                    );

                    setForm((f) => ({
                      ...f,
                      vehicle_id: e.target.value,
                      total_seats: v
                        ? passengerCapacity(v)
                        : f.total_seats,
                      available_seats: v
                        ? passengerCapacity(v)
                        : f.available_seats,
                    }));
                  }}
                >
                  <option value="">
                    Choose a vehicle
                  </option>

                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ·{" "}
                      {v.registration_number}
                    </option>
                  ))}
                </Select>

                {vehicles.length === 0 && (
                  <p className="create-trip-field-error">
                    Add a vehicle first from the Vehicles page.
                  </p>
                )}
              </Field>

              {selectedVehicle && (
                <div className="create-trip-selected-vehicle">
                  <div className="create-trip-vehicle-icon">
                    <Car size={22} />
                  </div>

                  <div>
                    <p>
                      {selectedVehicle.make}{" "}
                      {selectedVehicle.model}
                    </p>

                    <span>
                      {selectedVehicle.registration_number}
                    </span>
                  </div>
                </div>
              )}

              <div className="create-trip-two-column">

                <Field
                  label="Available Seats"
                  required
                  hint={`Up to ${form.total_seats} (driver seat excluded)`}
                >
                  <Input
                    icon={Users}
                    type="number"
                    min="1"
                    max={form.total_seats}
                    required
                    value={form.available_seats}
                    onChange={set("available_seats")}
                  />
                </Field>

                <Field label="Fare per Seat" required>
                  <Input
                    icon={IndianRupee}
                    type="number"
                    min="1"
                    required
                    placeholder="150"
                    value={form.fare_per_seat}
                    onChange={set("fare_per_seat")}
                  />
                </Field>

              </div>

              <div className="create-trip-info-box">
                <Users size={18} />

                <div>
                  <strong>
                    {form.available_seats} seats available
                  </strong>

                  <p>
                    You can adjust the number of seats passengers
                    can book.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="create-trip-review">

              {/* ROUTE */}
              <div className="create-trip-review-route">
                <div className="create-trip-review-heading">
                  <MapPin size={18} />
                  <span>Trip route</span>
                </div>

                <div className="create-trip-review-route-content">
                  <div className="create-trip-review-location">
                    <span className="create-trip-review-dot pickup" />

                    <div>
                      <small>Pickup</small>
                      <strong>{form.origin}</strong>
                    </div>
                  </div>

                  {form.stops.length > 0 && (
                    <div className="create-trip-review-stops">
                      {form.stops.map((stop, index) => (
                        <div
                          key={index}
                          className="create-trip-review-location"
                        >
                          <span className="create-trip-review-dot stop" />

                          <div>
                            <small>
                              Stop {index + 1}
                            </small>

                            <strong>{stop}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="create-trip-review-location">
                    <span className="create-trip-review-dot destination" />

                    <div>
                      <small>Destination</small>
                      <strong>{form.destination}</strong>
                    </div>
                  </div>
                </div>

                <div className="create-trip-review-time">
                  <CalendarDays size={17} />

                  <span>
                    {formatDateTime(
                      `${form.date}T${form.time}:00`
                    )}
                  </span>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="create-trip-review-grid">

                <div className="create-trip-review-card">
                  <div className="create-trip-review-card-icon">
                    <Car size={18} />
                  </div>

                  <div>
                    <span>Vehicle</span>

                    <strong>
                      {selectedVehicle
                        ? `${selectedVehicle.make} ${selectedVehicle.model}`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="create-trip-review-card">
                  <div className="create-trip-review-card-icon">
                    <Users size={18} />
                  </div>

                  <div>
                    <span>Available Seats</span>

                    <strong>
                      {form.available_seats}
                    </strong>
                  </div>
                </div>

                <div className="create-trip-review-card create-trip-review-fare">
                  <div className="create-trip-review-card-icon">
                    <IndianRupee size={18} />
                  </div>

                  <div>
                    <span>Fare per seat</span>

                    <strong>
                      {formatCurrency(form.fare_per_seat)}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="create-trip-review-notice">
                <Check size={18} />

                <span>
                  Review your details carefully before creating
                  the trip. Passengers will be able to see this
                  trip once it is published.
                </span>
              </div>

            </div>
          )}

          {/* NAVIGATION */}
          <div className="create-trip-actions">

            {step > 0 && (
              <Button
                variant="outline"
                className="create-trip-action-button"
                onClick={() =>
                  setStep((s) => s - 1)
                }
              >
                Back
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                className="create-trip-action-button create-trip-next-button"
                disabled={!canNext()}
                onClick={() =>
                  setStep((s) => s + 1)
                }
              >
                Continue
              </Button>
            ) : (
              <Button
                className="create-trip-action-button create-trip-next-button"
                loading={loading}
                onClick={submit}
              >
                Create Trip
              </Button>
            )}

          </div>

        </Card>
      </div>
    </div>
  );
}