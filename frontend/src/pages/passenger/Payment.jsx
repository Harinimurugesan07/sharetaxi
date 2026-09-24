import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Smartphone, CreditCard, Wallet as WalletIcon, ShieldCheck } from "lucide-react";
import { EmptyState } from "../../components/States";
import { formatCurrency } from "../../lib/format";
import { verifyPayment } from "../../api/bookings";
import { saveBooking } from "../../lib/bookingsCache";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Payment.css";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const methods = [
  { key: "upi", label: "UPI", icon: Smartphone, desc: "Pay via any UPI app" },
  { key: "card", label: "Card", icon: CreditCard, desc: "Credit or debit card" },
  { key: "wallet", label: "Wallet", icon: WalletIcon, desc: "ShareTaxi Wallet" },
];

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);

  const { booking, trip, seats, total } = state || {};

  if (!booking) {
    return (
      <EmptyState
        title="No booking to pay for"
        description="Book a ride first, then come back here to complete payment."
        action={
          <Link to="/passenger/find-ride" className="pay-btn pay-btn-primary pay-btn-sm">
            Find a Ride
          </Link>
        }
      />
    );
  }

  const pay = async () => {
    setPaying(true);
    const ok = await loadRazorpayScript();
    if (!ok || !booking.razorpay_key_id) {
      toast.error("Payment gateway could not load. Please try again.");
      setPaying(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: booking.razorpay_key_id,
      order_id: booking.razorpay_order_id,
      amount: booking.amount,
      currency: booking.currency || "INR",
      name: "ShareTaxi",
      description: `${trip.origin_name} → ${trip.destination_name}`,
      prefill: { name: user?.full_name, email: user?.email, contact: user?.phone },
      theme: { color: "#1542C2" },
      method: { upi: method === "upi", card: method === "card", wallet: method === "wallet", netbanking: false },
      handler: async (response) => {
        try {
          const confirmed = await verifyPayment({
            booking_id: booking.booking_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          saveBooking(confirmed);
          navigate(`/passenger/booking-success/${confirmed.booking_id || confirmed.id}`, {
            state: { booking: confirmed },
          });
        } catch (err) {
          toast.error(err.message);
        } finally {
          setPaying(false);
        }
      },
      modal: { ondismiss: () => setPaying(false) },
    });
    rzp.on("payment.failed", () => {
      toast.error("Payment failed. Please try again.");
      setPaying(false);
    });
    rzp.open();
  };

  return (
    <div className="pay-wrap">
      <div className="pay-card">
        <p className="pay-card-title">Booking Summary</p>
        <div className="pay-summary">
          <div className="pay-summary-row">
            <span>Trip</span>
            <span className="pay-summary-value">
              {trip.origin_name} → {trip.destination_name}
            </span>
          </div>
          <div className="pay-summary-row">
            <span>Passenger</span>
            <span className="pay-summary-value">{user?.full_name}</span>
          </div>
          <div className="pay-summary-row">
            <span>Seats</span>
            <span className="pay-summary-value">{seats}</span>
          </div>
        </div>
        <div className="pay-total-box">
          <span className="pay-total-label">Total Amount</span>
          <span className="pay-total-amount">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="pay-card">
        <p className="pay-card-title">Payment Method</p>
        <div className="pay-methods">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`pay-method ${method === m.key ? "pay-method-active" : ""}`}
              type="button"
            >
              <span className="pay-method-icon-wrap">
                <m.icon className="pay-method-icon" />
              </span>
              <span className="pay-method-text">
                <span className="pay-method-label">{m.label}</span>
                <span className="pay-method-desc">{m.desc}</span>
              </span>
              <span className={`pay-radio ${method === m.key ? "pay-radio-active" : ""}`} />
            </button>
          ))}
        </div>

        <p className="pay-secure-note">
          <ShieldCheck className="pay-secure-icon" /> Payments are processed securely via Razorpay.
        </p>

        <button className="pay-btn pay-btn-primary pay-btn-block" disabled={paying} onClick={pay}>
          {paying ? "Processing…" : `Pay ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );
}