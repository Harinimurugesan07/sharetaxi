import { useEffect, useState } from "react";
import { Ticket, Plus, ArrowUpRight, CheckCircle2, Send, Receipt, X } from "lucide-react";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { readBookings } from "../../lib/bookingsCache";
import "./Wallet.css";

const QUICK_AMOUNTS = [200, 500, 1000];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function rideTime(trip) {
  if (!trip?.departure_time) return "--:--";
  const d = new Date(trip.departure_time);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// The backend doesn't yet expose a wallet/ledger endpoint, so balance and
// history are derived locally from confirmed bookings for demo purposes.
export default function Wallet() {
  const bookings = readBookings().filter((b) => b.status === "confirmed");
  const spent = bookings.reduce((sum, b) => sum + Number(b.fare_total || 0), 0);
  const [topUp, setTopUp] = useState(false);
  const clock = useClock();

  return (
    <div className="wa-wrap">
      <section className="db-panel">
        <div className="db-row-head">
          <span className="db-brand">
            <Ticket />
            Wallet
          </span>
          <span className="db-clock">{clock}</span>
        </div>

        <p className="db-balance-label">Available balance</p>
        <p className="db-balance-amount">{formatCurrency(0)}</p>
        <p className="db-balance-note">
          Ride fares are deducted from here automatically. Top-ups will connect to the payments API once it's live.
        </p>

        <div className="db-actions">
          <button className="db-action db-action--primary" onClick={() => setTopUp(true)}>
            <Plus />
            Top up
          </button>
          <button className="db-action" disabled>
            <Send />
            Send
          </button>
          <button className="db-action" disabled>
            <Receipt />
            Statement
          </button>
        </div>

        <div className="db-divider" />

        <div className="db-stats">
          <div className="db-stat">
            <span className="db-stat-icon db-stat-icon--red">
              <ArrowUpRight />
            </span>
            <div>
              <p className="db-stat-label">Spent on rides</p>
              <p className="db-stat-value">{formatCurrency(spent)}</p>
            </div>
          </div>
          <div className="db-stat">
            <span className="db-stat-icon db-stat-icon--green">
              <CheckCircle2 />
            </span>
            <div>
              <p className="db-stat-label">Rides paid for</p>
              <p className="db-stat-value">{bookings.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="db-manifest">
        <p className="db-manifest-title">Recent activity</p>
        {bookings.length === 0 ? (
          <div className="db-empty">
            <span className="db-empty-icon-wrap">
              <Receipt className="db-empty-icon" />
            </span>
            <p className="db-empty-text">No rides logged yet</p>
            <p className="db-empty-subtext">Ride payments will show up here once you book a trip.</p>
          </div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="db-tx-row">
              <span className="db-tx-time">{rideTime(b.trip)}</span>
              <p className="db-tx-route">
                {b.trip?.origin_name} → {b.trip?.destination_name}
              </p>
              <span className="db-tx-amount">−{formatCurrency(b.fare_total)}</span>
            </div>
          ))
        )}
      </div>

      {topUp && (
        <div className="db-modal-overlay" onClick={() => setTopUp(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-main">
              <button className="db-modal-close" onClick={() => setTopUp(false)} aria-label="Close">
                <X />
              </button>
              <p className="db-modal-eyebrow">Wallet top-up</p>
              <p className="db-modal-title">Add money to your wallet</p>
              <p className="db-modal-desc">
                This will connect to the payments API once it's available. Pick an amount to preview the flow.
              </p>
              <div className="db-modal-amounts">
                {QUICK_AMOUNTS.map((amount) => (
                  <button key={amount} className="db-amount-chip" disabled>
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
              <div className="db-modal-buttons">
                <button className="db-btn db-btn-ghost" onClick={() => setTopUp(false)}>
                  Cancel
                </button>
                <button className="db-btn db-btn-primary" onClick={() => setTopUp(false)}>
                  Got it
                </button>
              </div>
            </div>
            <div className="db-modal-stub" aria-hidden="true">
              <span>WALLET · TOP UP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}