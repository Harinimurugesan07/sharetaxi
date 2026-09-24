import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { EmptyState, ErrorState, LoadingState } from "../../components/States";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { driverRideRequests } from "../../api/driver";

import "./RideRequests.css";

const toneByStatus = {
  pending_payment: "yellow",
  confirmed: "success",
  cancelled: "danger",
};

export default function RideRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const data = await driverRideRequests();
      setRequests(data || []);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") {
    return <LoadingState label="Loading bookings..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="ride-requests">
      <Card className="ride-requests-note">
        Passenger bookings on your trips appear here. Seats are confirmed automatically once the passenger pays.
      </Card>

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No bookings yet"
          description="When passengers book seats on your trips, they will show up here."
        />
      ) : (
        <div className="ride-requests-grid">
          {requests.map((request) => (
            <Card key={request.id} className="ride-request-card">
              <div className="ride-request-header">
                <p className="ride-request-passenger">{request.passenger?.name || "Passenger"}</p>
                <Badge tone={toneByStatus[request.status] || "neutral"}>
                  {request.status?.replace("_", " ") || "Unknown"}
                </Badge>
              </div>

              <p className="ride-request-route">
                {request.trip?.origin_name} → {request.trip?.destination_name}
              </p>

              <div className="ride-request-metadata">
                <span>{request.seats_booked} seat(s)</span>
                <span>{formatCurrency(request.fare_total)}</span>
              </div>

              <div className="ride-request-details">
                <p>Booked on {formatDateTime(request.created_at)}</p>
                <p>Departure: {formatDateTime(request.trip?.departure_time)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}