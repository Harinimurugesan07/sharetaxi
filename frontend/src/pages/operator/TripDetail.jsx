import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { operatorTrip } from "../../api/operator";
import "./TripDetail.css";

const STAGES = ["Driver Assigned", "On the Way", "Arrived", "Trip Started", "Completed"];
const stageIndexFor = { scheduled: 0, ongoing: 3, completed: 4, cancelled: -1 };

export default function TripDetail() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    operatorTrip(tripId).then(setTrip).catch(() => setTrip(null));
  }, [tripId]);

  if (!trip) {
    return <Card className="td-not-found">Trip not found.</Card>;
  }

  const stageIndex = stageIndexFor[trip.status] ?? 2;

  return (
    <div className="td-wrap">
      <Link to="/operator/trips" className="td-back-link">
        <ArrowLeft className="td-back-icon" /> Back to Trip Management
      </Link>

      <div className="td-grid">
        <div className="td-main-col">
          <Card className="td-card">
            <div className="td-summary-top">
              <div>
                <p className="td-trip-id">{trip.id}</p>
                <p className="td-route">{trip.origin_name} → {trip.destination_name}</p>
              </div>
              <Badge tone={trip.status === "completed" ? "success" : trip.status === "cancelled" ? "danger" : "navy"}>
                {trip.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="td-info-grid">
              <Info label="Driver" value={trip.driver_name} />
              <Info label="Passengers" value={trip.passenger_count} />
              <Info label="Departure" value={trip.departure_time ? new Date(trip.departure_time).toLocaleString() : "-"} />
              <Info label="Seats" value={`${trip.available_seats}/${trip.total_seats}`} />
            </div>

            <div className="td-coords-grid">
              <Info label="Pickup coordinates" value={`${trip.origin_lat}, ${trip.origin_lng}`} />
              <Info label="Drop coordinates" value={`${trip.destination_lat}, ${trip.destination_lng}`} />
            </div>
          </Card>

          <Card className="td-card">
            <p className="td-card-title">Activity Log</p>
            {(trip.status_history || []).length === 0 ? (
              <p className="td-log-empty">No activity recorded yet.</p>
            ) : (
              <ul className="td-log-list">
                {trip.status_history.map((a) => (
                  <li key={a.id} className="td-log-item">
                    <span className="td-log-dot" />
                    <div className="td-log-body">
                      <span className="td-log-time">{new Date(a.changed_at).toLocaleString()}</span>
                      <span className="td-log-transition">
                        {a.old_status || "created"} → <strong>{a.new_status}</strong>
                        {a.reason ? <span className="td-log-reason"> — {a.reason}</span> : null}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="td-card td-timeline-card">
          <p className="td-card-title">Trip Timeline</p>
          <ol className="td-timeline-list">
            {STAGES.map((s, i) => {
              const state = i < stageIndex ? "done" : i === stageIndex ? "current" : "upcoming";
              return (
                <li key={s} className={`td-timeline-item td-timeline-item--${state}`}>
                  <span className="td-timeline-marker">
                    {state === "done" ? "✓" : state === "current" ? "●" : "○"}
                  </span>
                  {i < STAGES.length - 1 && <span className="td-timeline-connector" />}
                  <span className="td-timeline-label">{s}</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="td-info-tile">
      <p className="td-info-label">{label}</p>
      <p className="td-info-value">{value}</p>
    </div>
  );
}