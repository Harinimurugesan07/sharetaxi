import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { operatorDrivers, operatorRideRequests } from "../../api/operator";
import "./TripAssignment.css";

export default function TripAssignment() {
  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    Promise.all([operatorRideRequests(), operatorDrivers()]).then(([nextRequests, nextDrivers]) => {
      setRequests(nextRequests || []);
      setDrivers(nextDrivers || []);
    }).catch(() => {});
  }, []);
  const availableDrivers = drivers.filter((driver) => driver.availability === "online");

  return (
    <div className="trip-assign-page">
      <div className="trip-assign-grid">
        {requests.map((r) => (
          <Card key={r.id} className="trip-assign-card">
            <div className="trip-assign-header">
              <p className="trip-assign-route">{r.trip?.origin_name} → {r.trip?.destination_name}</p>
            </div>
            <p className="trip-assign-meta">Passenger: {r.passenger?.name} · Requested seats: {r.seats_booked}</p>
            <p className="trip-assign-note">{availableDrivers.length} online driver(s) available. Driver assignment is managed by the dispatch service.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}