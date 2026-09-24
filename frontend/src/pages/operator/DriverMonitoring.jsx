import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import StarRating from "../../components/StarRating";
import { operatorDrivers, operatorDriver, operatorDeleteDriver } from "../../api/operator";
import "./OperatorTable.css";
import "./DriverMonitoring.css";

export default function DriverMonitoring() {
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refreshDrivers = () => {
    operatorDrivers().then((data) => setDrivers(data || [])).catch(() => setDrivers([]));
  };

  useEffect(() => {
    refreshDrivers();
  }, []);

  const handleDelete = async (driverId, fullName) => {
    if (!window.confirm(`Delete driver ${fullName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(driverId);
    try {
      await operatorDeleteDriver(driverId);
      setSelected(null);
      refreshDrivers();
    } catch (error) {
      window.alert(error.message || "Unable to delete driver");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="operator-page">
      <Card className="operator-table-card">
        <table className="operator-table" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Status</th>
              <th>Vehicle</th>
              <th>Seats</th>
              <th>Verification</th>
              <th>Rating</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="operator-table-row-clickable" onClick={() => operatorDriver(d.id).then(setSelected).catch(() => {})}>
                <td className="operator-table-cell-primary driver-name-cell">
                  <span className="driver-avatar">
                    {d.full_name?.[0] || "D"}
                  </span>
                  {d.full_name}
                </td>
                <td><Badge tone={d.availability === "online" ? "success" : d.availability === "on_trip" ? "navy" : "neutral"}>{d.availability}</Badge></td>
                <td>{d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : "-"}<br /><span className="operator-table-cell-muted">{d.vehicle?.registration_number}</span></td>
                <td>{d.current_trip?.available_seats ?? "-"}</td>
                <td>
                  <Badge tone={d.verification_status === "verified" ? "success" : "neutral"}>{d.verification_status}</Badge>
                </td>
                <td><StarRating value={d.rating || 0} /></td>
                <td onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="driver-delete-button"
                    onClick={() => handleDelete(d.id, d.full_name)}
                    disabled={deletingId === d.id}
                  >
                    {deletingId === d.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {selected && (
        <Card className="driver-detail-card">
          <div className="driver-detail-header">
            <div><h2 className="driver-detail-name">{selected.full_name}</h2><p className="driver-detail-meta">{selected.email} · {selected.phone}</p></div>
            <button type="button" onClick={() => setSelected(null)} className="driver-detail-close">Close</button>
          </div>
          <div className="driver-detail-grid">
            <div>
              <p className="driver-detail-section-title">Assigned trips</p>
              <div className="driver-detail-list">
                {(selected.assigned_trips || []).map((trip) => (
                  <div key={trip.id} className="driver-detail-trip-item">
                    <p className="driver-detail-trip-route">{trip.origin_name} → {trip.destination_name}</p>
                    <p className="driver-detail-trip-meta">{trip.status} · {trip.available_seats} seats available · {trip.departure_time}</p>
                  </div>
                ))}
                {!selected.assigned_trips?.length && <p className="driver-detail-empty">No trips assigned.</p>}
              </div>
            </div>
            <div>
              <p className="driver-detail-section-title">Verification documents</p>
              <div className="driver-detail-list">
                {(selected.verification_documents || []).map((document) => (
                  <div key={document.id} className="driver-detail-doc-item">
                    <span>{document.document_type}</span>
                    <Badge tone={document.status === "verified" ? "success" : document.status === "rejected" ? "danger" : "neutral"}>{document.status}</Badge>
                  </div>
                ))}
              </div>
              <p className="driver-detail-info-line">License: {selected.license_number || "-"}</p>
              <p className="driver-detail-info-line">Address: {[selected.address, selected.city, selected.state, selected.postal_code, selected.country].filter(Boolean).join(", ") || "-"}</p>
              <p className="driver-detail-info-line">Notes: {selected.verification_notes || "-"}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}