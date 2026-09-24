import { useEffect, useMemo, useState } from "react";
import { Search, Eye, CarFront, UserRound, ShieldCheck, CalendarRange } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { Input, Select } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { adminListVehicles, adminSetVehicleVerification } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import "./AdminTable.css";

export default function VehicleVerification() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const toast = useToast();

  const load = () => {
    setStatus("loading");
    const verified = filter === "" ? undefined : filter === "verified";
    adminListVehicles(verified)
      .then((v) => {
        setVehicles(v || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const act = async (vehicle, verified) => {
    setBusyId(vehicle.id);
    try {
      await adminSetVehicleVerification(vehicle.id, verified);
      toast.success(`${vehicle.registration_number} ${verified ? "verified" : "unverified"}`);
      load();
      setSelectedVehicle(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesQuery = !normalizedQuery || (vehicle.registration_number || "").toLowerCase().includes(normalizedQuery);
      let matchesCategory = true;
      if (categoryFilter === "freelance") matchesCategory = !vehicle.operator_id;
      if (categoryFilter === "operator") matchesCategory = Boolean(vehicle.operator_id);
      return matchesQuery && matchesCategory;
    });
  }, [vehicles, query, categoryFilter]);

  return (
    <div className="admin-page">
      <div className="admin-filter-bar">
        <div className="admin-filter-search">
          <Input icon={Search} placeholder="Search by registration..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
          <option value="">All vehicles</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </Select>
      </div>

      <div className="admin-segmented-control" role="tablist" aria-label="Vehicle categories">
        {[
          { value: "all", label: "All vehicles" },
          { value: "freelance", label: "Freelancing vehicles" },
          { value: "operator", label: "Operator vehicles" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`admin-segmented-button ${categoryFilter === tab.value ? "admin-segmented-button--active" : ""}`}
            onClick={() => setCategoryFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "loading" && <LoadingState label="Loading vehicles..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && filtered.length === 0 && <EmptyState title="No vehicles found" />}

      {status === "success" && filtered.length > 0 && (
        <Card className="admin-table-card">
          <table className="admin-table" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                <th>Registration</th>
                <th>Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="admin-table-cell-primary">{vehicle.registration_number}</td>
                  <td>{vehicle.driver_name || "—"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedVehicle(vehicle)}>
                        <Eye />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selectedVehicle && (
        <div className="admin-detail-modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <Card className="admin-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-modal-header">
              <div>
                <p className="admin-detail-modal-title">{selectedVehicle.registration_number}</p>
                <p className="admin-detail-modal-subtitle">
                  {selectedVehicle.operator_id ? `Operator vehicle • ${selectedVehicle.operator_name}` : "Freelancing vehicle"}
                </p>
              </div>
              <Badge tone={selectedVehicle.is_verified ? "success" : "neutral"}>{selectedVehicle.is_verified ? "Verified" : "Unverified"}</Badge>
            </div>

            <div className="admin-detail-grid">
              <div className="admin-detail-card">
                <div className="admin-detail-item"><CarFront /> <span>{selectedVehicle.vehicle_type}</span></div>
                <div className="admin-detail-item"><UserRound /> <span>{selectedVehicle.driver_name || "—"}</span></div>
                <div className="admin-detail-item"><ShieldCheck /> <span>{selectedVehicle.is_active ? "Active" : "Inactive"}</span></div>
              </div>

              <div className="admin-detail-card">
                <div className="admin-detail-item"><span className="admin-detail-key">Make / Model</span><span>{selectedVehicle.make} {selectedVehicle.model}</span></div>
                <div className="admin-detail-item"><span className="admin-detail-key">Year</span><span>{selectedVehicle.year || "—"}</span></div>
                <div className="admin-detail-item"><span className="admin-detail-key">Seats</span><span>{selectedVehicle.total_seats || "—"}</span></div>
                <div className="admin-detail-item"><CalendarRange /> <span>Insurance expiry: {selectedVehicle.insurance_expiry || "—"}</span></div>
              </div>
            </div>

            <div className="admin-detail-actions">
              <Button size="sm" variant="subtleSuccess" disabled={busyId === selectedVehicle.id} onClick={() => act(selectedVehicle, true)}>
                Verify
              </Button>
              <Button size="sm" variant="subtleDanger" disabled={busyId === selectedVehicle.id} onClick={() => act(selectedVehicle, false)}>
                Unverify
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedVehicle(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}