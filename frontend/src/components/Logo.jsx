import { Car } from "lucide-react";
import "./Logo.css";

export default function Logo({ dark = false }) {
  return (
    <div className={`logo ${dark ? "logo-dark" : "logo-light"}`}>
      <div className="logo-mark">
        <Car className="logo-car" size={20} strokeWidth={2.5} />
      </div>

      <div className="logo-content">
        <span className="logo-name">ShareTaxi</span>
        <span className="logo-tagline">Share. Ride. Save.</span>
      </div>
    </div>
  );
}