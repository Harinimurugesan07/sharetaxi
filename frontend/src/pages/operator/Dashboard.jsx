import { useEffect, useMemo, useState } from "react";
import {
  Radio, CalendarClock, Car, CheckCircle2, Route, MapPin,
} from "lucide-react";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { operatorDashboard, operatorLiveTrips } from "../../api/operator";
import { getSocket, joinOperatorRoom } from "../../lib/socket";
import "./Dashboard.css";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DONUT_COLORS = ["#2F80ED", "#FFC107", "#17A398", "#C7D1DE"];

function statusTone(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "red";
  if (s.includes("complete") || s.includes("arrived")) return "green";
  if (s.includes("board") || s.includes("pending")) return "yellow";
  return "blue";
}

function buildCalendarCells(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

// Optional: pass real alerts (e.g. driver flags, request timeouts) from your
// notifications API once one exists. Renders a clean empty state until then.
export default function OperatorDashboard({ alerts = [] }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [liveTrips, setLiveTrips] = useState([]);
  const [now] = useState(new Date());

  useEffect(() => {
    const load = () => Promise.all([operatorDashboard(), operatorLiveTrips()]).then(([nextStats, trips]) => {
      setStats(nextStats);
      setLiveTrips(trips || []);
    });
    load().catch(() => {});
    const socket = getSocket();
    joinOperatorRoom();
    const refresh = () => load().catch(() => {});
    socket.on("trip_status_updated", refresh);
    if (!socket.connected) socket.connect();
    return () => socket.off("trip_status_updated", refresh);
  }, []);

  const statCards = [
    { label: "Active trips", value: stats?.active_trips, icon: Radio, tone: "blue" },
    { label: "Scheduled", value: stats?.scheduled_trips, icon: CalendarClock, tone: "yellow" },
    { label: "Available drivers", value: stats?.available_drivers, icon: Car, tone: "teal" },
    { label: "Completed today", value: stats?.completed_today, icon: CheckCircle2, tone: "green" },
  ];

  const tripMix = [
    { label: "Active", value: stats?.active_trips ?? 0, color: "var(--fx-blue)" },
    { label: "Scheduled", value: stats?.scheduled_trips ?? 0, color: "var(--fx-yellow)" },
    { label: "Completed", value: stats?.completed_today ?? 0, color: "var(--fx-green)" },
    { label: "Cancelled", value: stats?.cancelled_today ?? 0, color: "var(--fx-red)" },
  ];
  const maxMix = Math.max(1, ...tripMix.map((m) => m.value));

  // Top destinations, derived from the live trips we already have — no extra API needed.
  const donutSegments = useMemo(() => {
    const counts = {};
    liveTrips.forEach((t) => {
      const key = t.destination_name || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 3).map(([label, count]) => ({ label, count }));
    const otherCount = sorted.slice(3).reduce((sum, [, c]) => sum + c, 0);
    if (otherCount > 0) top.push({ label: "Other", count: otherCount });
    const total = top.reduce((s, r) => s + r.count, 0) || 1;
    let cumulative = 0;
    return top.map((seg, i) => {
      const pct = seg.count / total;
      const withOffset = { ...seg, pct, offset: cumulative, color: DONUT_COLORS[i % DONUT_COLORS.length] };
      cumulative += pct;
      return withOffset;
    });
  }, [liveTrips]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const calendarCells = buildCalendarCells(now);

  return (
    <div className="fleet-dash">
      <div className="fleet-dash__stats">
        {statCards.map((s) => (
          <div key={s.label} className="fleet-dash__stat-card">
            <span className={`fleet-dash__stat-icon fleet-dash__stat-icon--${s.tone}`}>
              <s.icon />
            </span>
            <div>
              <p className="fleet-dash__stat-label">{s.label}</p>
              <p className="fleet-dash__stat-value">{s.value ?? "–"}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="fleet-dash__row fleet-dash__row--chart">
        <div className="fleet-dash__panel">
          <div className="fleet-dash__panel-head">
            <p className="fleet-dash__panel-title">Today's trip mix</p>
          </div>
          <div className="fleet-dash__chart">
            {tripMix.map((m) => (
              <div key={m.label} className="fleet-dash__chart-col">
                <span className="fleet-dash__chart-value">{m.value}</span>
                <div
                  className="fleet-dash__chart-bar"
                  style={{ height: `${(m.value / maxMix) * 100}%`, background: m.color }}
                />
                <span className="fleet-dash__chart-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fleet-dash__panel">
          <p className="fleet-dash__calendar-head">
            {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <div className="fleet-dash__calendar-grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="fleet-dash__calendar-weekday">{w}</span>
            ))}
            {calendarCells.map((day, i) => (
              <span
                key={i}
                className={`fleet-dash__calendar-day${day === null ? " fleet-dash__calendar-day--empty" : ""}${day === now.getDate() ? " fleet-dash__calendar-day--today" : ""}`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="fleet-dash__row fleet-dash__row--split">
        <div className="fleet-dash__panel">
          <div className="fleet-dash__panel-head">
            <p className="fleet-dash__panel-title">Top destinations</p>
          </div>
          {donutSegments.length === 0 ? (
            <p className="fleet-dash__alert-empty">No trips running to chart yet.</p>
          ) : (
            <div className="fleet-dash__donut">
              <svg className="fleet-dash__donut-svg" width="110" height="110" viewBox="0 0 100 100">
                <g transform="rotate(-90 50 50)">
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.label}
                      cx="50" cy="50" r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${seg.pct * circumference} ${circumference}`}
                      strokeDashoffset={-seg.offset * circumference}
                    />
                  ))}
                </g>
                <text x="50" y="47" className="fleet-dash__donut-center" fontSize="15" fontWeight="700" fill="var(--fx-ink)">
                  {liveTrips.length}
                </text>
                <text x="50" y="61" className="fleet-dash__donut-center" fontSize="7" fill="var(--fx-body)">
                  live trips
                </text>
              </svg>
              <div className="fleet-dash__donut-legend">
                {donutSegments.map((seg) => (
                  <div key={seg.label} className="fleet-dash__donut-legend-item">
                    <span className="fleet-dash__donut-dot" style={{ background: seg.color }} />
                    <MapPin size={12} color="var(--fx-body)" />
                    {seg.label}
                    <span className="fleet-dash__donut-pct">{Math.round(seg.pct * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fleet-dash__panel">
          <div className="fleet-dash__panel-head">
            <p className="fleet-dash__panel-title">Alerts</p>
          </div>
          {alerts.length === 0 ? (
            <p className="fleet-dash__alert-empty">You're all caught up — no alerts right now.</p>
          ) : (
            <div>
              {alerts.map((a) => (
                <div key={a.id} className="fleet-dash__alert-item">
                  <span
                    className="fleet-dash__alert-dot"
                    style={{ background: a.tone === "red" ? "var(--fx-red)" : a.tone === "yellow" ? "var(--fx-yellow)" : "var(--fx-blue)" }}
                  />
                  <div>
                    <p className="fleet-dash__alert-message">{a.message}</p>
                    <p className="fleet-dash__alert-time">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="fleet-dash__panel">
        <div className="fleet-dash__panel-head">
          <p className="fleet-dash__panel-title">
            <Route size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} /> Trips in progress
          </p>
          <span className="fleet-dash__trips-count">{liveTrips.length} running</span>
        </div>

        {liveTrips.length === 0 ? (
          <p className="fleet-dash__trips-empty">No trips are running right now.</p>
        ) : (
          <div className="fleet-dash__trip-list">
            {liveTrips.map((t, i) => {
              const tone = statusTone(t.status);
              return (
                <div key={t.id} className="fleet-dash__trip-row">
                  <span className="fleet-dash__trip-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fleet-dash__route-line">
                    <span className="fleet-dash__route-dot" />
                    <span className="fleet-dash__route-track" />
                    <span className="fleet-dash__route-dot fleet-dash__route-dot--end" />
                  </span>
                  <div className="fleet-dash__trip-body">
                    <p className="fleet-dash__trip-route-text">{t.origin_name} → {t.destination_name}</p>
                    <p className="fleet-dash__trip-meta">{t.driver_name} · {t.passenger_count} passengers</p>
                  </div>
                  <span className={`fleet-dash__trip-status fleet-dash__trip-status--${tone}`}>
                    <span className="fleet-dash__trip-status-dot" />
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}