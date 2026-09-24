import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { operatorTrips } from "../../api/operator";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    operatorTrips("cancelled").then((trips) => setAlerts(trips || [])).catch(() => setAlerts([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {alerts.map((trip) => (
          <Card key={trip.id} className="flex items-center justify-between border-danger-100 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-50">
                <AlertTriangle className="h-4 w-4 text-danger-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-800">
                  Trip cancelled: {trip.origin_name} → {trip.destination_name}
                </p>
                <p className="mt-0.5 text-xs text-navy-400">
                  {trip.driver_name} · {trip.cancelled_at ? new Date(trip.cancelled_at).toLocaleString() : "-"}
                </p>
              </div>
            </div>
            <Badge tone="danger">cancelled</Badge>
          </Card>
        ))}
        {alerts.length === 0 && <p className="text-sm text-navy-400">No cancelled trips found.</p>}
      </div>
    </div>
  );
}
