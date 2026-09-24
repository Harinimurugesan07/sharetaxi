import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { operatorLiveTrips } from "../../api/operator";
import { getSocket, joinOperatorRoom } from "../../lib/socket";
import "./LiveOperations.css";

export default function LiveOperations() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const load = () => operatorLiveTrips().then((data) => setTrips(data || []));
    load().catch(() => {});
    const socket = getSocket();
    joinOperatorRoom();
    const refresh = () => load().catch(() => {});
    socket.on("trip_status_updated", refresh);
    if (!socket.connected) socket.connect();
    return () => socket.off("trip_status_updated", refresh);
  }, []);

  return (
    <div className="live-ops">
      <div className="live-ops-grid">
        <Card className="live-ops-map-card">
          <p className="live-ops-card-title">Live trip coordinates</p>
          <div className="live-ops-coords-grid">
            {trips.map((trip) => (
              <div key={trip.id} className="live-ops-coord-item">
                <p className="live-ops-coord-driver">{trip.driver_name}</p>
                <p className="live-ops-coord-line">Pickup: {trip.origin_lat}, {trip.origin_lng}</p>
                <p className="live-ops-coord-line">Drop: {trip.destination_lat}, {trip.destination_lng}</p>
              </div>
            ))}
            {trips.length === 0 && <p className="live-ops-empty">No active trips.</p>}
          </div>
        </Card>

        <Card className="live-ops-list-card">
          <p className="live-ops-card-title">Active Trips</p>
          <div className="live-ops-trip-list">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => navigate(`/operator/trips/${trip.id}`)}
                className="live-ops-trip-btn focus-ring"
              >
                <div className="live-ops-trip-header">
                  <span className="live-ops-trip-id">{trip.id}</span>
                  <Badge tone="navy">{trip.status}</Badge>
                </div>
                <p className="live-ops-trip-route">{trip.origin_name} → {trip.destination_name}</p>
                <p className="live-ops-trip-driver">Driver: {trip.driver_name}</p>
                <div className="live-ops-trip-footer">
                  <span>{trip.passenger_count} passengers</span>
                  <span>{trip.available_seats} seats available</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}