import { useEffect, useState } from "react";
import { Plus, Car, ShieldCheck, ShieldAlert, X, FileText } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { Field, Input, Select } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { VehicleType } from "../../lib/constants";
import { myVehicles, addVehicle } from "../../api/vehicles";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { isOperatorOwnedDriver } from "../../lib/driverType";
import { passengerCapacity } from "../../lib/seats";

import "./Vehicles.css";

const emptyForm = { registration_number: "", vehicle_type: "sedan", make: "", model: "", year: "", color: "", total_seats: 4 };

export default function Vehicles() {
  const { user } = useAuth();
  // Operator-owned drivers drive the vehicle their operator assigned: read-only.
  const operatorOwned = isOperatorOwnedDriver(user);
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    setStatus("loading");
    myVehicles()
      .then((v) => {
        setVehicles(v || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  const formatRegistrationNumber = (value) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const chunks = [cleaned.slice(0, 2), cleaned.slice(2, 4), cleaned.slice(4, 6), cleaned.slice(6, 10)];
    return chunks.filter(Boolean).join(" ");
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: key === "registration_number" ? formatRegistrationNumber(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addVehicle({ ...form, year: form.year ? Number(form.year) : undefined, total_seats: Number(form.total_seats) });
      toast.success("Vehicle added. Pending approval.", "Vehicle Added");
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="driver-vehicles">
      <div className="driver-vehicles-toolbar">
        <p>{operatorOwned ? "Vehicle assigned to you by your operator" : "Vehicles you drive on ShareTaxi"}</p>
        {!operatorOwned && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus /> Add Vehicle
          </Button>
        )}
      </div>

      {status === "loading" && <LoadingState label="Loading your vehicles..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && vehicles.length === 0 && (
        <EmptyState
          title={operatorOwned ? "No vehicle assigned yet" : "No vehicles added yet"}
          description={operatorOwned ? "Your operator will assign a vehicle to you." : "Add a vehicle to start creating trips."}
        />
      )}
      {status === "success" && vehicles.length > 0 && (
        <div className="driver-vehicles-grid">
          {vehicles.map((v) => (
            <Card key={v.id} className="driver-vehicle-card">
              <div className="driver-vehicle-card-header">
                <div className="driver-vehicle-card-info">
                  <div className="driver-vehicle-card-icon">
                    <Car />
                  </div>
                  <div>
                    <p>{v.make} {v.model}</p>
                    <span>{v.registration_number}</span>
                  </div>
                </div>
                {v.is_verified ? (
                  <Badge tone="success"><ShieldCheck className="driver-vehicle-badge-icon" /> Verified</Badge>
                ) : (
                  <Badge tone="neutral"><ShieldAlert className="driver-vehicle-badge-icon" /> Pending</Badge>
                )}
              </div>
              <div className="driver-vehicle-details">
                <Info label="Type" value={v.vehicle_type} />
                <Info label="Year" value={v.year || "—"} />
                <Info label="Color" value={v.color || "—"} />
                <Info label="Passenger Seats" value={passengerCapacity(v)} />
              </div>

              {/* RC/Insurance reflect real backend fields; PUC/Permit aren't
                  modeled on the backend yet, so they're shown as pending
                  until those document types exist on the Vehicle model. */}
              <div className="driver-vehicle-docs">
                <DocChip label="RC" state={v.rc_document_url ? (v.is_verified ? "verified" : "pending") : "missing"} />
                <DocChip label="Insurance" state={v.insurance_document_url ? (v.is_verified ? "verified" : "pending") : "missing"} />
                <DocChip label="PUC" state="pending" />
                <DocChip label="Permit" state="pending" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && !operatorOwned && (
        <div className="driver-vehicle-modal-overlay" onClick={() => setShowForm(false)}>
          <Card className="driver-vehicle-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="driver-vehicle-modal-header">
              <p>Add Vehicle</p>
              <button onClick={() => setShowForm(false)} className="driver-vehicle-modal-close">
                <X />
              </button>
            </div>
            <form onSubmit={submit} className="driver-vehicle-form">
              <Field label="Registration Number" required>
                <Input required value={form.registration_number} onChange={set("registration_number")} placeholder="TN 09 AB 1234" />
              </Field>
              <div className="driver-vehicle-form-row">
                <Field label="Vehicle Type" required>
                  <Select required value={form.vehicle_type} onChange={set("vehicle_type")}>
                    {Object.values(VehicleType).map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Total Seats" required hint="Including the driver's seat">
                  <Input type="number" min="1" required value={form.total_seats} onChange={set("total_seats")} />
                </Field>
              </div>
              <div className="driver-vehicle-form-row">
                <Field label="Make" required>
                  <Input required value={form.make} onChange={set("make")} placeholder="Toyota" />
                </Field>
                <Field label="Model" required>
                  <Input required value={form.model} onChange={set("model")} placeholder="Etios" />
                </Field>
              </div>
              <div className="driver-vehicle-form-row">
                <Field label="Year">
                  <Input type="number" value={form.year} onChange={set("year")} placeholder="2022" />
                </Field>
                <Field label="Color">
                  <Input value={form.color} onChange={set("color")} placeholder="White" />
                </Field>
              </div>
              <Button type="submit" className="driver-vehicle-submit" loading={saving}>Add Vehicle</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function DocChip({ label, state }) {
  const stateClass = {
    verified: "driver-doc-chip-verified",
    pending: "driver-doc-chip-pending",
    missing: "driver-doc-chip-missing",
  };
  const text = { verified: "Verified", pending: "Pending", missing: "Not Uploaded" };
  return (
    <div className={`driver-doc-chip ${stateClass[state]}`}>
      <p>{label}</p>
      <p className="driver-doc-chip-status">{text[state]}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="driver-vehicle-info-tile">
      <p className="driver-vehicle-info-label">{label}</p>
      <p className="driver-vehicle-info-value">{value}</p>
    </div>
  );
}