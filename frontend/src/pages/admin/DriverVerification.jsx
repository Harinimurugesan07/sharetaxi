import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Phone, Mail, MapPin, CarFront, Star, BadgeCheck, ShieldAlert } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { StatusBadge } from "../../components/Badge";
import { Input, Select } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { adminListDrivers, adminSetDriverVerification } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import "./AdminTable.css";

export default function DriverVerification() {
  const [drivers, setDrivers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const toast = useToast();

  const load = () => {
    setStatus("loading");
    adminListDrivers(statusFilter || undefined)
      .then((d) => {
        setDrivers(d || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesQuery = !normalizedQuery || (driver.full_name || "").toLowerCase().includes(normalizedQuery);
      let matchesCategory = true;
      if (categoryFilter === "freelance") matchesCategory = (driver.driver_type || (driver.operator_id ? "operator" : "freelance")) === "freelance";
      if (categoryFilter === "operator") matchesCategory = (driver.driver_type || (driver.operator_id ? "operator" : "freelance")) === "operator";
      return matchesQuery && matchesCategory;
    });
  }, [drivers, query, categoryFilter]);

  const act = async (driver, newStatus) => {
    setBusyId(driver.id);
    try {
      await adminSetDriverVerification(driver.id, newStatus);
      toast.success(`${driver.full_name} ${newStatus}`);
      load();
      setSelectedDriver(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-filter-bar">
        <div className="admin-filter-search">
          <Input icon={Search} placeholder="Search drivers..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <div className="admin-segmented-control" role="tablist" aria-label="Driver categories">
        {[
          { value: "all", label: "All drivers" },
          { value: "freelance", label: "Freelancing drivers" },
          { value: "operator", label: "Operator drivers" },
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

      {status === "loading" && <LoadingState label="Loading drivers..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && filtered.length === 0 && <EmptyState title="No drivers found" />}

      {status === "success" && filtered.length > 0 && (
        <Card className="admin-table-card">
          <table className="admin-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((driver) => (
                <tr key={driver.id}>
                  <td className="admin-table-cell-primary">{driver.full_name}</td>
                  <td><StatusBadge status={driver.verification_status} /></td>
                  <td>
                    <div className="admin-row-actions">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDriver(driver)}>
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

      {selectedDriver && (
        <div className="admin-detail-modal-overlay" onClick={() => setSelectedDriver(null)}>
          <Card className="admin-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-modal-header">
              <div>
                <p className="admin-detail-modal-title">{selectedDriver.full_name}</p>
                <p className="admin-detail-modal-subtitle">
                  {selectedDriver.operator_id ? `Operator driver • ${selectedDriver.operator_name}` : "Freelancing driver"}
                </p>
              </div>
              <StatusBadge status={selectedDriver.verification_status} />
            </div>

            <div className="admin-detail-grid">
              <div className="admin-detail-card">
                <div className="admin-detail-item"><Phone /> <span>{selectedDriver.phone || "—"}</span></div>
                <div className="admin-detail-item"><Mail /> <span>{selectedDriver.email || "—"}</span></div>
                <div className="admin-detail-item"><MapPin /> <span>{[selectedDriver.address, selectedDriver.city, selectedDriver.state, selectedDriver.postal_code, selectedDriver.country].filter(Boolean).join(", ") || "—"}</span></div>
              </div>

              <div className="admin-detail-card">
                <div className="admin-detail-item"><CarFront /> <span>License: {selectedDriver.license_number || "—"}</span></div>
                <div className="admin-detail-item"><BadgeCheck /> <span>Trips: {selectedDriver.total_trips ?? 0}</span></div>
                <div className="admin-detail-item"><Star /> <span>Rating: {selectedDriver.average_rating ? Number(selectedDriver.average_rating).toFixed(1) : "—"}</span></div>
                <div className="admin-detail-item"><ShieldAlert /> <span>Verification notes: {selectedDriver.verification_notes || "—"}</span></div>
              </div>
            </div>

            <div className="admin-detail-actions">
              <Button size="sm" variant="subtleSuccess" disabled={busyId === selectedDriver.id} onClick={() => act(selectedDriver, "verified")}>
                Approve
              </Button>
              <Button size="sm" variant="subtleDanger" disabled={busyId === selectedDriver.id} onClick={() => act(selectedDriver, "rejected")}>
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedDriver(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}