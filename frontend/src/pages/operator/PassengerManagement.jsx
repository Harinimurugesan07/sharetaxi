import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { operatorPassengers } from "../../api/operator";
import "./OperatorTable.css";

export default function PassengerManagement() {
  const [passengers, setPassengers] = useState([]);
  useEffect(() => {
    operatorPassengers().then((data) => setPassengers(data || [])).catch(() => setPassengers([]));
  }, []);

  return (
    <div className="operator-page">
      <Card className="operator-table-card">
        <table className="operator-table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Phone</th>
              <th>Current Trip</th>
              <th>Seats</th>
              <th>Ride History</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p) => (
              <tr key={p.id}>
                <td className="operator-table-cell-primary">{p.full_name}</td>
                <td>{p.phone}</td>
                <td>{p.active_trip?.id || "-"}</td>
                <td>{p.active_trip?.passenger_count || "-"}</td>
                <td>{p.total_rides} rides</td>
                <td><Badge tone={p.is_active ? "success" : "danger"}>{p.is_active ? "Active" : "Inactive"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}