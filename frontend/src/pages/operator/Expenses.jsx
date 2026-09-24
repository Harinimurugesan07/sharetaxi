import { useEffect, useMemo, useState } from "react";

import {
  Fuel,
  Wrench,
  Hammer,
  ShieldCheck,
  Ticket,
  ParkingCircle,
  MoreHorizontal,
  Plus,
  Minus,
  Receipt,
  Car,
  User,
  IndianRupee,
} from "lucide-react";

import Card from "../../components/Card";
import { LoadingState, ErrorState } from "../../components/States";

import { formatCurrency, formatDate } from "../../lib/format";

import {
  createOperatorExpense,
  getOperatorExpenses,
} from "../../api/operatorExpenses";

import {
  operatorDrivers,
  operatorVehicles,
} from "../../api/operator";

import "./Expenses.css";

// Each expense type carries its own icon and accent color so the
// history list and breakdown cards are scannable by shape/color,
// not just by text.
const EXPENSE_TYPE_META = {
  FUEL: { label: "Fuel", icon: Fuel, color: "#D97706" },
  MAINTENANCE: { label: "Maintenance", icon: Wrench, color: "#2563EB" },
  REPAIR: { label: "Repair", icon: Hammer, color: "#DC2626" },
  INSURANCE: { label: "Insurance", icon: ShieldCheck, color: "#059669" },
  TOLL: { label: "Toll", icon: Ticket, color: "#7C3AED" },
  PARKING: { label: "Parking", icon: ParkingCircle, color: "#0891B2" },
  OTHER: { label: "Other", icon: MoreHorizontal, color: "#64748B" },
};

const EXPENSE_TYPES = Object.keys(EXPENSE_TYPE_META);

const INITIAL_FORM = {
  expense_type: "FUEL",
  amount: "",
  description: "",
  vehicle_id: "",
  driver_id: "",
};

function getList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
}

function getVehicleId(vehicle) {
  return vehicle?.public_id || vehicle?.id || "";
}

function getDriverId(driver) {
  return driver?.public_id || driver?.id || "";
}

function getVehicleLabel(vehicle) {
  return (
    vehicle?.registration_number ||
    vehicle?.vehicle_number ||
    vehicle?.plate_number ||
    vehicle?.registration_no ||
    vehicle?.name ||
    vehicle?.model ||
    getVehicleId(vehicle)
  );
}

function getDriverLabel(driver) {
  if (driver?.full_name) {
    return driver.full_name;
  }

  if (driver?.name) {
    return driver.name;
  }

  if (driver?.driver_name) {
    return driver.driver_name;
  }

  if (driver?.user?.full_name) {
    return driver.user.full_name;
  }

  if (driver?.user?.name) {
    return driver.user.name;
  }

  if (driver?.email) {
    return driver.email;
  }

  return getDriverId(driver);
}

function getTypeMeta(type) {
  return EXPENSE_TYPE_META[type] || EXPENSE_TYPE_META.OTHER;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  const loadData = async () => {
    try {
      setStatus("loading");
      setError("");

      const [expenseResponse, vehicleResponse, driverResponse] =
        await Promise.all([
          getOperatorExpenses(),
          operatorVehicles(),
          operatorDrivers(),
        ]);

      setExpenses(getList(expenseResponse));
      setVehicles(getList(vehicleResponse));
      setDrivers(getList(driverResponse));

      setStatus("success");
    } catch (err) {
      console.error("Failed to load operator expense data:", err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to load operator expense data."
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Resolve raw vehicle_id / driver_id on each expense row to a
  // human-readable label, reusing the same lookups the form uses.
  const vehicleLabelById = useMemo(() => {
    const map = new Map();
    vehicles.forEach((vehicle) => {
      const id = getVehicleId(vehicle);
      if (id) {
        map.set(id, getVehicleLabel(vehicle));
      }
    });
    return map;
  }, [vehicles]);

  const driverLabelById = useMemo(() => {
    const map = new Map();
    drivers.forEach((driver) => {
      const id = getDriverId(driver);
      if (id) {
        map.set(id, getDriverLabel(driver));
      }
    });
    return map;
  }, [drivers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const amount = Number(form.amount);

    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        expense_type: form.expense_type,
        amount,
        description: form.description.trim() || null,
        vehicle_id: form.vehicle_id || null,
        driver_id: form.driver_id || null,
      };

      await createOperatorExpense(payload);

      setMessage("Expense added.");

      setForm(INITIAL_FORM);

      await loadData();
    } catch (err) {
      console.error("Failed to create operator expense:", err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to add expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, expense) => total + Number(expense?.amount || 0),
      0
    );
  }, [expenses]);

  // Breakdown by type, largest first, for the summary cards.
  const breakdown = useMemo(() => {
    const totals = new Map();

    expenses.forEach((expense) => {
      const type = expense?.expense_type || "OTHER";
      const amount = Number(expense?.amount || 0);
      totals.set(type, (totals.get(type) || 0) + amount);
    });

    return Array.from(totals.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  if (status === "loading") {
    return <LoadingState label="Loading operator expenses..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={loadData} />;
  }

  return (
    <div className="operator-expenses-page">
      {/* =========================================
          HEADER
      ========================================== */}

      <div className="operator-expenses-header">
        <div>
          <h1 className="operator-expenses-title">Vehicle Expenses</h1>

          <p className="operator-expenses-subtitle">
            Track fuel, maintenance, repairs and other operating expenses.
          </p>
        </div>

        <button
          type="button"
          className="operator-expense-add-button"
          onClick={() => setFormOpen((open) => !open)}
        >
          {formOpen ? <Minus size={16} /> : <Plus size={16} />}
          {formOpen ? "Close form" : "Add expense"}
        </button>
      </div>

      {/* =========================================
          SUMMARY CARDS
      ========================================== */}

      <div className="operator-expense-summary-grid">
        <Card className="operator-expense-total-card">
          <span className="operator-expense-total-label">
            Total expenses
          </span>
          <strong className="operator-expense-total-value">
            {formatCurrency(totalExpenses)}
          </strong>
          <span className="operator-expense-total-count">
            {expenses.length} {expenses.length === 1 ? "record" : "records"}
          </span>
        </Card>

        {breakdown.map(({ type, amount }) => {
          const meta = getTypeMeta(type);
          const TypeIcon = meta.icon;
          const share = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

          return (
            <Card key={type} className="operator-expense-stat-card">
              <div className="operator-expense-stat-top">
                <span
                  className="operator-expense-stat-icon"
                  style={{
                    background: `${meta.color}1A`,
                    color: meta.color,
                  }}
                >
                  <TypeIcon size={16} />
                </span>
                <span className="operator-expense-stat-label">
                  {meta.label}
                </span>
              </div>

              <strong className="operator-expense-stat-value">
                {formatCurrency(amount)}
              </strong>

              <div className="operator-expense-stat-bar">
                <div
                  className="operator-expense-stat-bar-fill"
                  style={{
                    width: `${Math.max(share, 3)}%`,
                    background: meta.color,
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* =========================================
          ADD EXPENSE (collapsed by default)
      ========================================== */}

      {formOpen && (
        <Card className="operator-expense-form-card">
          <div className="operator-expense-form-card-header">
            <h2>New expense</h2>
            <p>Log a cost against a vehicle or driver.</p>
          </div>

          <form className="operator-expense-form" onSubmit={handleSubmit}>
            {/* Expense Type */}

            <div className="operator-expense-field">
              <label htmlFor="expense_type">Expense type</label>

              <select
                id="expense_type"
                name="expense_type"
                value={form.expense_type}
                onChange={handleChange}
                disabled={saving}
              >
                {EXPENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getTypeMeta(type).label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}

            <div className="operator-expense-field">
              <label htmlFor="amount">Amount</label>

              <div className="operator-expense-input-wrapper">
                <IndianRupee size={16} />

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Vehicle */}

            <div className="operator-expense-field">
              <label htmlFor="vehicle_id">Vehicle</label>

              <div className="operator-expense-input-wrapper">
                <Car size={16} />

                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Select vehicle (optional)</option>

                  {vehicles.map((vehicle) => {
                    const vehicleId = getVehicleId(vehicle);

                    if (!vehicleId) {
                      return null;
                    }

                    return (
                      <option key={vehicleId} value={vehicleId}>
                        {getVehicleLabel(vehicle)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Driver */}

            <div className="operator-expense-field">
              <label htmlFor="driver_id">Driver</label>

              <div className="operator-expense-input-wrapper">
                <User size={16} />

                <select
                  id="driver_id"
                  name="driver_id"
                  value={form.driver_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Select driver (optional)</option>

                  {drivers.map((driver) => {
                    const driverId = getDriverId(driver);

                    if (!driverId) {
                      return null;
                    }

                    return (
                      <option key={driverId} value={driverId}>
                        {getDriverLabel(driver)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Description */}

            <div className="operator-expense-field operator-expense-field-full">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Enter expense details..."
                value={form.description}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* Success */}

            {message && (
              <div className="operator-expense-success">{message}</div>
            )}

            {/* Error */}

            {error && <div className="operator-expense-error">{error}</div>}

            {/* Submit */}

            <div className="operator-expense-actions">
              <button
                type="submit"
                disabled={saving}
                className="operator-expense-submit"
              >
                <Plus size={18} />
                {saving ? "Adding..." : "Save expense"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* =========================================
          EXPENSE HISTORY
      ========================================== */}

      <Card className="operator-expense-history-card">
  <div className="operator-expense-card-header">
    <div className="operator-expense-icon">
      <Receipt size={20} />
    </div>

    <div className="operator-expense-card-header-text">
      <h2>Expense history</h2>
      <p>Previously recorded operator expenses.</p>
    </div>
  </div>

        {expenses.length === 0 ? (
          <div className="operator-expense-empty">
            <Receipt size={34} />
            <p>No expenses recorded yet.</p>
            <span>Add one to start tracking spend.</span>
          </div>
        ) : (
          <div className="operator-expense-list">
            {expenses.map((expense) => {
              const meta = getTypeMeta(expense?.expense_type);
              const TypeIcon = meta.icon;

              const vehicleLabel =
                expense?.vehicle_id &&
                (vehicleLabelById.get(expense.vehicle_id) ||
                  expense.vehicle_id);

              const driverLabel =
                expense?.driver_id &&
                (driverLabelById.get(expense.driver_id) ||
                  expense.driver_id);

              return (
                <div
                  key={
                    expense?.id ||
                    expense?.public_id ||
                    `${expense?.expense_type}-${expense?.created_at}`
                  }
                  className="operator-expense-row"
                  style={{ "--row-accent": meta.color }}
                >
                  <div
                    className="operator-expense-row-icon"
                    style={{
                      background: `${meta.color}1A`,
                      color: meta.color,
                    }}
                  >
                    <TypeIcon size={18} />
                  </div>

                  <div className="operator-expense-row-info">
                    <strong>{meta.label}</strong>

                    <span>{expense?.description || "No description"}</span>

                    <div className="operator-expense-row-meta">
                      {expense?.created_at && (
                        <small>{formatDate(expense.created_at)}</small>
                      )}

                      {vehicleLabel && (
                        <small className="operator-expense-row-meta-tag">
                          <Car size={11} /> {vehicleLabel}
                        </small>
                      )}

                      {driverLabel && (
                        <small className="operator-expense-row-meta-tag">
                          <User size={11} /> {driverLabel}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="operator-expense-row-amount">
                    {formatCurrency(expense?.amount || 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}