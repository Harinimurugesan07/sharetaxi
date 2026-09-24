import { useLocation, Link, Navigate } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { formatCurrency, formatDateTime } from "../../lib/format";
import "./BookingSuccess.css";

export default function BookingSuccess() {
  const { state } = useLocation();
  const booking = state?.booking;
  if (!booking) return <Navigate to="/passenger" replace />;
  const trip = booking.trip;

  function downloadReceipt() {
    const pdf = new jsPDF();
    const rows = [
      ["Booking ID", booking.id],
      ["Route", `${trip.origin_name} -> ${trip.destination_name}`],
      ["Driver", trip.driver_name],
      ["Vehicle", `${trip.vehicle?.make} ${trip.vehicle?.model} - ${trip.vehicle?.registration_number}`],
      ["Date & Time", formatDateTime(trip.departure_time)],
      ["Seats", String(booking.seats_booked)],
      ["Total Paid", `INR ${Number(booking.fare_total || 0).toLocaleString("en-IN")}`],
    ];

    pdf.setFontSize(20);
    pdf.setTextColor(21, 66, 194);
    pdf.text("ShareTaxi Receipt", 20, 25);
    pdf.setDrawColor(21, 66, 194);
    pdf.line(20, 31, 190, 31);
    pdf.setFontSize(11);
    pdf.setTextColor(40, 40, 40);

    rows.forEach(([label, value], index) => {
      const y = 48 + index * 18;
      pdf.setTextColor(100, 100, 100);
      pdf.text(label, 20, y);
      pdf.setTextColor(20, 20, 20);
      pdf.text(String(value || "-"), 75, y);
      pdf.setDrawColor(225, 225, 225);
      pdf.line(20, y + 6, 190, y + 6);
    });

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Thank you for riding with ShareTaxi.", 20, 190);
    pdf.save(`sharetaxi-receipt-${booking.id}.pdf`);
  }

  return (
    <div className="bs-wrap">
      <div className="bs-card">
        <div className="bs-icon-ring">
          <CheckCircle2 className="bs-icon" />
        </div>

        <h2 className="bs-title">Booking Confirmed</h2>
        <p className="bs-subtitle">Your seats are locked in. Have a great trip!</p>

        <div className="bs-details">
          <Row label="Booking ID" value={booking.id} />
          <Row label="Route" value={`${trip.origin_name} → ${trip.destination_name}`} />
          <Row label="Driver" value={trip.driver_name} />
          <Row
            label="Vehicle"
            value={`${trip.vehicle?.make} ${trip.vehicle?.model} · ${trip.vehicle?.registration_number}`}
          />
          <Row label="Date & Time" value={formatDateTime(trip.departure_time)} />
          <Row label="Seats" value={booking.seats_booked} />
          <Row label="Total Paid" value={formatCurrency(booking.fare_total)} highlight />
        </div>

        <div className="bs-actions">
          <Link to={`/passenger/track/${trip.id}`} className="bs-btn bs-btn-primary">
            Track This Ride
          </Link>
          <button className="bs-btn bs-btn-accent" onClick={downloadReceipt}>
            <Download className="bs-btn-icon" />
            Receipt
          </button>
        </div>

        <Link to="/passenger" className="bs-back-link">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`bs-row ${highlight ? "bs-row-highlight" : ""}`}>
      <span className="bs-row-label">{label}</span>
      <span className="bs-row-value">{value}</span>
    </div>
  );
}