import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Field, Input, Select } from "../../components/Field";
import { operatorCreateVehicle, operatorDrivers } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import "./OperatorVehicles.css";

// Vehicle creation is allowed for operators; verification actions remain admin-only.
export default function OperatorVehicles() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ driver_id: "", registration_number: "", vehicle_type: "sedan", make: "", model: "", total_seats: 4, year: "", color: "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const load = () => operatorDrivers().then((data) => setDrivers(data || [])).catch(() => setDrivers([]));
  useEffect(() => {
    load();
  }, []);
  const formatRegistrationNumber = (value) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const chunks = [cleaned.slice(0, 2), cleaned.slice(2, 4), cleaned.slice(4, 6), cleaned.slice(6, 10)];
    return chunks.filter(Boolean).join(" ");
  };
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: key === "registration_number" ? formatRegistrationNumber(event.target.value) : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await operatorCreateVehicle({ ...form, total_seats: Number(form.total_seats), year: form.year ? Number(form.year) : null });
      toast.success("Vehicle created.", "Vehicle Created");
      setForm({ driver_id: "", registration_number: "", vehicle_type: "sedan", make: "", model: "", total_seats: 4, year: "", color: "" });
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-vehicles-page">
      <Card className="operator-vehicles-form-card">
        <h2 className="operator-vehicles-title">Create Vehicle</h2>
        <p className="operator-vehicles-subtitle">Add a vehicle to a verified driver’s account.</p>
        <form onSubmit={submit} className="operator-vehicles-form-grid">
          <Field label="Driver" required>
            <Select required value={form.driver_id} onChange={set("driver_id")}>
              <option value="">Select driver</option>
              {drivers.filter((driver) => driver.verification_status === "verified").map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}
            </Select>
          </Field>
          <Field label="Registration" required><Input required value={form.registration_number} onChange={set("registration_number")} placeholder="TN 01 AB 1234" /></Field>
          <Field label="Vehicle type" required>
            <Select required value={form.vehicle_type} onChange={set("vehicle_type")}>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="hatchback">Hatchback</option>
              <option value="mini_van">Mini van</option>
            </Select>
          </Field>
          <Field label="Total seats" required><Input type="number" min="1" max="60" required value={form.total_seats} onChange={set("total_seats")} /></Field>
          <Field label="Make" required><Input required value={form.make} onChange={set("make")} placeholder="Toyota" /></Field>
          <Field label="Model" required><Input required value={form.model} onChange={set("model")} placeholder="Etios" /></Field>
          <Field label="Year"><Input type="number" value={form.year} onChange={set("year")} placeholder="2024" /></Field>
          <Field label="Color"><Input value={form.color} onChange={set("color")} placeholder="White" /></Field>
          <div className="operator-vehicles-form-submit-wrap"><Button type="submit" loading={saving}>Create Vehicle</Button></div>
        </form>
      </Card>
      <div className="operator-vehicles-list-grid">
        {drivers.filter((d) => d.vehicle).map((d) => (
          <Card key={d.vehicle.id} className="operator-vehicle-card">
            <p className="operator-vehicle-name">{d.vehicle.make} {d.vehicle.model}</p>
            <p className="operator-vehicle-reg">{d.vehicle.registration_number}</p>
            <div className="operator-vehicle-row">
              <span className="operator-vehicle-driver">Driver: {d.full_name}</span>
              <Badge tone={d.vehicle.is_verified ? "success" : "neutral"}>{d.vehicle.is_verified ? "Verified" : "Pending"}</Badge>
            </div>
            <p className="operator-vehicle-seats">Total seats: {d.vehicle.total_seats}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}