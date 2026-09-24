import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  CalendarDays, Clock, MapPin, Navigation, User, Car, Users, Wallet,
  Plus, X, Search, Eye,
} from "lucide-react";
import Button from "../../components/Button";
import { Field, Input, Select } from "../../components/Field";
import LocationPicker from "../../components/LocationPicker";
import {
  operatorCreateTrip, operatorDrivers, operatorDriver, operatorTrips,
} from "../../api/operator";
import { geocodeLocation } from "../../api/geocoding";
import { useToast } from "../../context/ToastContext";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { passengerCapacity } from "../../lib/seats";
import "./OperatorForms.css";
import "./CreateTrip.css";

const statusFilters = ["All", "scheduled", "ongoing", "completed", "cancelled"];

export default function CreateTrip() {
  const toast = useToast();

  // Trip list state
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal + form state
  const [showModal, setShowModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ driver_id: "", vehicle_id: "", origin: "", destination: "", date: "", time: "", available_seats: 4, fare_per_seat: "" });
  const [locations, setLocations] = useState({ origin: null, destination: null });

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === form.driver_id) || null,
    [drivers, form.driver_id]
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === form.vehicle_id) || null,
    [vehicles, form.vehicle_id]
  );

  const loadTrips = () => {
    setTripsLoading(true);
    operatorTrips()
      .then((data) => setTrips(data || []))
      .catch(() => setTrips([]))
      .finally(() => setTripsLoading(false));
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    operatorDrivers().then((items) => setDrivers((items || []).filter((driver) => driver.verification_status === "verified"))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    setForm((current) => {
      const nextSeats = Number(current.available_seats) || 0;
      const capacity = passengerCapacity(selectedVehicle);
      if (nextSeats <= capacity) return current;
      return { ...current, available_seats: capacity };
    });
  }, [selectedVehicle]);

  useEffect(() => {
    if (!showModal) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [showModal]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const chooseDriver = async (event) => {
    const driver_id = event.target.value;
    setForm((current) => ({ ...current, driver_id, vehicle_id: "" }));
    if (!driver_id) return setVehicles([]);
    const driver = await operatorDriver(driver_id);
    setVehicles((driver.vehicles || []).filter((vehicle) => vehicle.is_active));
  };

  const resetForm = () => {
    setForm({ driver_id: "", vehicle_id: "", origin: "", destination: "", date: "", time: "", available_seats: 4, fare_per_seat: "" });
    setLocations({ origin: null, destination: null });
    setVehicles([]);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!selectedVehicle) {
      toast.error("Please select a vehicle before creating the trip.");
      return;
    }

    const availableSeats = Number(form.available_seats);
    const capacity = passengerCapacity(selectedVehicle);
    if (!Number.isInteger(availableSeats) || availableSeats < 1 || availableSeats > capacity) {
      toast.error(`Available seats must be between 1 and ${capacity} (the driver's seat is excluded).`);
      return;
    }

    const farePerSeat = Number(form.fare_per_seat);
    if (!Number.isFinite(farePerSeat) || farePerSeat <= 0) {
      toast.error("Fare per seat must be greater than zero.");
      return;
    }

    setFormLoading(true);
    try {
      const origin = locations.origin || await geocodeLocation(form.origin);
      const destination = locations.destination || await geocodeLocation(form.destination);
      await operatorCreateTrip({
        driver_id: form.driver_id,
        vehicle_id: form.vehicle_id,
        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        departure_time: `${form.date}T${form.time}:00`,
        available_seats: availableSeats,
        fare_per_seat: farePerSeat,
      });
      toast.success("Trip created and assigned.", "Trip Created");
      closeModal();
      loadTrips();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const departurePreview = useMemo(() => {
    if (!form.date || !form.time) return null;
    const parsed = new Date(`${form.date}T${form.time}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [form.date, form.time]);

  const seats = Number(form.available_seats) || 0;
  const farePerSeat = Number(form.fare_per_seat) || 0;
  const estimatedTotal = seats * farePerSeat;

  const filteredTrips = useMemo(() => {
    let list = trips;
    if (statusFilter !== "All") list = list.filter((t) => t.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.id, t.origin_name, t.destination_name, t.driver_name]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }
    return list;
  }, [trips, statusFilter, search]);

  const modalRoot = typeof document !== "undefined" ? document.getElementById("modal-root") : null;

  return (
    <div className="ct-page">
      <div className="ct-page-header">
        <div>
          <h2 className="ct-page-title">Trips</h2>
          <p className="ct-page-subtitle">{trips.length} trip{trips.length === 1 ? "" : "s"} created</p>
        </div>
        <div className="ct-page-actions">
          <div className="ct-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search trip, route or driver"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Trip
          </Button>
        </div>
      </div>

      <div className="ct-chip-row">
        {statusFilters.map((s) => (
          <button
            key={s}
            className={`ct-chip ${statusFilter === s ? "ct-chip--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "All" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="ct-list-card">
        {tripsLoading ? (
          <div className="ct-list-empty">Loading trips…</div>
        ) : filteredTrips.length === 0 ? (
          <div className="ct-list-empty">
            <p>No trips found.</p>
            <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Create your first trip
            </Button>
          </div>
        ) : (
          <table className="ct-trip-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Departs</th>
                <th>Seats</th>
                <th>Fare</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="ct-trip-cell">
                      <span className="ct-trip-avatar"><Car size={16} /></span>
                      <div className="ct-trip-cell-text">
                        <p className="ct-trip-route">{t.origin_name} → {t.destination_name}</p>
                        <p className="ct-trip-sub">{t.driver_name || "Unassigned"}</p>
                      </div>
                    </div>
                  </td>
                  <td>{t.departure_time ? formatDateTime(t.departure_time) : "—"}</td>
                  <td>{t.available_seats ?? "—"}</td>
                  <td>{t.fare_per_seat ? formatCurrency(t.fare_per_seat) : "—"}</td>
                  <td>
                    <span className={`ct-status ct-status--${t.status || "scheduled"}`}>
                      {t.status || "scheduled"}
                    </span>
                  </td>
                  <td>
                    <Button as={Link} to={`/operator/trips/${t.id}`} size="sm" variant="outline">
                      <Eye size={14} /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && modalRoot && createPortal(
        <div className="ct-modal-overlay" onClick={closeModal}>
          <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ct-modal-header">
              <div className="ct-modal-title-wrap">
                <Car size={18} />
                <h3>Create Trip</h3>
              </div>
              <button className="ct-modal-close" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="ct-modal-body">
              <div className="ct-split">
                <section className="ct-form-pane">
                  <div className="ct-form-pane-inner">
                    <div className="ct-form-header">
                      <p className="ct-form-subtitle">Assign a verified driver and vehicle to a new scheduled trip.</p>
                    </div>

                    <form onSubmit={submit} className="create-trip-form">
                      <div className="op-form-grid-2">
                        <Field label="Driver" required>
                          <Select required value={form.driver_id} onChange={chooseDriver}>
                            <option value="">Select driver</option>
                            {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}
                          </Select>
                        </Field>
                        <Field label="Vehicle" required>
                          <Select required value={form.vehicle_id} onChange={set("vehicle_id")} disabled={!form.driver_id}>
                            <option value="">Select vehicle</option>
                            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} · {vehicle.registration_number}</option>)}
                          </Select>
                        </Field>
                      </div>
                      <Field label="Pickup" required>
                        <LocationPicker icon={MapPin} value={form.origin} onChange={(value) => setForm((current) => ({ ...current, origin: value }))} onSelect={(value) => setLocations((current) => ({ ...current, origin: value }))} />
                      </Field>
                      <Field label="Destination" required>
                        <LocationPicker icon={Navigation} value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} onSelect={(value) => setLocations((current) => ({ ...current, destination: value }))} />
                      </Field>
                      <div className="op-form-grid-2">
                        <Field label="Date" required><Input icon={CalendarDays} type="date" required value={form.date} onChange={set("date")} /></Field>
                        <Field label="Time" required><Input icon={Clock} type="time" required value={form.time} onChange={set("time")} /></Field>
                        <Field label="Available seats" required><Input type="number" min="1" max={selectedVehicle ? passengerCapacity(selectedVehicle) : 1} required value={form.available_seats} onChange={set("available_seats")} /></Field>
                        <Field label="Fare per seat" required><Input type="number" min="1" required value={form.fare_per_seat} onChange={set("fare_per_seat")} /></Field>
                      </div>
                      <Button type="submit" className="op-submit-full" size="lg" loading={formLoading}>Create Assigned Trip</Button>
                    </form>
                  </div>
                </section>

                <aside className="ct-summary-pane">
                  <div className="ct-summary-pane-inner">
                    <div className="ct-summary-header">
                      <p className="ct-summary-eyebrow">Trip summary</p>
                      <p className="ct-summary-subtitle">A live preview of what you're about to create.</p>
                    </div>

                    <div className="ct-summary-block">
                      <div className="ct-summary-row">
                        <User className="ct-summary-icon" />
                        <div>
                          <p className="ct-summary-label">Driver</p>
                          <p className={`ct-summary-value ${!selectedDriver ? "is-placeholder" : ""}`}>
                            {selectedDriver ? selectedDriver.full_name : "Not selected yet"}
                          </p>
                        </div>
                      </div>
                      <div className="ct-summary-row">
                        <Car className="ct-summary-icon" />
                        <div>
                          <p className="ct-summary-label">Vehicle</p>
                          <p className={`ct-summary-value ${!selectedVehicle ? "is-placeholder" : ""}`}>
                            {selectedVehicle
                              ? `${selectedVehicle.make} ${selectedVehicle.model} · ${selectedVehicle.registration_number}`
                              : "Not selected yet"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ct-summary-divider" />

                    <div className="ct-summary-route">
                      <div className="ct-route-line" aria-hidden="true">
                        <span className="ct-route-dot ct-route-dot-start" />
                        <span className="ct-route-track" />
                        <span className="ct-route-dot ct-route-dot-end" />
                      </div>
                      <div className="ct-summary-route-stops">
                        <p className={`ct-summary-value ${!form.origin ? "is-placeholder" : ""}`}>
                          {form.origin || "Pickup location"}
                        </p>
                        <p className={`ct-summary-value ${!form.destination ? "is-placeholder" : ""}`}>
                          {form.destination || "Destination"}
                        </p>
                      </div>
                    </div>

                    <div className="ct-summary-divider" />

                    <div className="ct-summary-block">
                      <div className="ct-summary-row">
                        <CalendarDays className="ct-summary-icon" />
                        <div>
                          <p className="ct-summary-label">Departs</p>
                          <p className={`ct-summary-value ${!departurePreview ? "is-placeholder" : ""}`}>
                            {departurePreview ? formatDateTime(departurePreview.toISOString()) : "Date and time not set"}
                          </p>
                        </div>
                      </div>
                      <div className="ct-summary-row">
                        <Users className="ct-summary-icon" />
                        <div>
                          <p className="ct-summary-label">Seats</p>
                          <p className="ct-summary-value">{seats || 0} available</p>
                        </div>
                      </div>
                    </div>

                    <div className="ct-summary-total">
                      <div className="ct-summary-total-label">
                        <Wallet className="ct-summary-icon" />
                        Estimated total revenue
                      </div>
                      <p className="ct-summary-total-value">
                        {farePerSeat > 0 ? formatCurrency(estimatedTotal) : "—"}
                      </p>
                      {farePerSeat > 0 && (
                        <p className="ct-summary-total-note">
                          {seats} seat{seats === 1 ? "" : "s"} × {formatCurrency(farePerSeat)} per seat
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </div>
  );
}