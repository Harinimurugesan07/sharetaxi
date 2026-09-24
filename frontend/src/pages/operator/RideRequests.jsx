import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { operatorRideRequests } from "../../api/operator";
import "./OperatorRideRequests.css";

export default function OperatorRideRequests() {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    operatorRideRequests().then((data) => setRequests(data || [])).catch(() => setRequests([]));
  }, []);

  return (
    <div className="ride-requests-page">
      <div className="ride-requests-grid">
        {requests.map((r) => (
          <Card key={r.id} className="ride-request-card">
            <div className="ride-request-header">
              <div className="ride-request-user-block">
                <span className="ride-request-label">Passenger</span>
                <p className="ride-request-passenger">{r.passenger?.name || "Unknown passenger"}</p>
              </div>
              <Badge tone="yellow">{r.status}</Badge>
            </div>

            <div className="ride-request-section">
              <span className="ride-request-label">Driver</span>
              <p className="ride-request-driver">{r.trip?.driver_name || "Driver unavailable"}</p>
            </div>

            <div className="ride-request-section">
              <span className="ride-request-label">Trip</span>
              <p className="ride-request-route">{r.trip?.origin_name || "-"} → {r.trip?.destination_name || "-"}</p>
            </div>

            <div className="ride-request-meta-grid">
              <div>
                <span className="ride-request-label">Seats</span>
                <p>{r.seats_booked}</p>
              </div>
              <div>
                <span className="ride-request-label">Fare</span>
                <p>₹{Number(r.fare_total || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="ride-request-label">Departure</span>
                <p>{r.trip?.departure_time ? new Date(r.trip.departure_time).toLocaleString() : "-"}</p>
              </div>
            </div>

            <div className="ride-request-footer">
              <span className="ride-request-label">Requested</span>
              <p>{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}