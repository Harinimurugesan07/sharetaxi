import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  IdCard,
  Car,
  UserRound,
  ShieldCheck,
  MapPin,
  PiggyBank,
} from "lucide-react";

import Logo from "../../components/Logo";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import "./Register.css";

const perks = [
  {
    icon: PiggyBank,
    text: "Save on every shared ride",
  },
  {
    icon: ShieldCheck,
    text: "Verified drivers & vehicles",
  },
  {
    icon: MapPin,
    text: "Live tracking, pickup to drop",
  },
];

export default function Register() {
  const [params] = useSearchParams();

  const initialRole =
    params.get("role") === "driver" ? "driver" : "passenger";

  const [role, setRole] = useState(initialRole);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    license_number: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { registerPassenger, registerDriver } = useAuth();

  const navigate = useNavigate();
  const toast = useToast();

  const formatLicenseNumber = (value) => {
    const cleaned = value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 21);
    const match = cleaned.match(/^(.*?)(\d{0,14})$/i);
    if (!match) return cleaned;
    const prefix = (match[1] || "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    const digits = (match[2] || "").replace(/\D/g, "");
    if (!prefix && !digits) return "";
    if (digits) return `${prefix ? `${prefix}-` : ""}${digits}`;
    return prefix;
  };

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: key === "license_number" ? formatLicenseNumber(e.target.value) : e.target.value,
    }));

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };

      const user =
        role === "driver"
          ? await registerDriver({
              ...payload,
              license_number: form.license_number,
              address: form.address,
              city: form.city,
              state: form.state,
              postal_code: form.postal_code,
              country: form.country,
            })
          : await registerPassenger(payload);

      toast.success(
        `Welcome to ShareTaxi, ${user.full_name.split(" ")[0]}!`
      );

      navigate(
        role === "driver"
          ? "/onboarding/verification"
          : "/passenger"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* Background blobs */}
      <div className="register-blob register-blob-bottom" />
      <div className="register-blob register-blob-top" />

      {/* Header */}
      <div className="register-page-header">
        <Logo dark />
      </div>

      <div className="register-content">

        {/* =========================================
            LEFT — text intro + perks (no dark panel)
        ========================================= */}
        <div className="register-intro">

          <span className="register-intro-badge">
            <span />
            JOIN SHARETAXI
          </span>

          <h2 className="register-intro-title">
            Share Your Ride,
            <br />
            <span>Share Your Journey</span>
          </h2>

          <p className="register-intro-text">
            Join thousands of passengers and drivers already
            saving on every trip across 10+ cities.
          </p>

          <ul className="register-perks">
            {perks.map((p) => {
              const Icon = p.icon;

              return (
                <li key={p.text}>
                  <span className="register-perk-icon">
                    <Icon />
                  </span>
                  <span>{p.text}</span>
                </li>
              );
            })}
          </ul>

        </div>

        {/* =========================================
            RIGHT — floating card
        ========================================= */}
        <main className="register-form-panel">

          <div className="register-form-container">

            {/* Mobile logo */}
            <div className="register-mobile-logo">
              <Logo dark />
            </div>

            {/* Card */}
            <div className="register-card">

              {/* Header */}
              <div className="register-header">
                <span className="register-header-label">
                  GET STARTED
                </span>

                <h1>Create Your Account</h1>

                <p>Join the ShareTaxi ride-sharing community</p>
              </div>

              {/* Role selector */}
              <div className="register-role-selector">
                {[
                  { key: "passenger", label: "Passenger", icon: UserRound },
                  { key: "driver", label: "Driver", icon: Car },
                ].map((r) => {
                  const Icon = r.icon;
                  const active = role === r.key;

                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`register-role-button ${
                        active ? "register-role-button-active" : ""
                      }`}
                    >
                      <Icon />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Registration form */}
              <form className="register-form" onSubmit={onSubmit}>

                {/* Full name + Email */}
                <div className="register-grid-two">
                  <Field label="Full Name" required>
                    <Input
                      icon={User}
                      required
                      placeholder="Your name"
                      value={form.full_name}
                      onChange={set("full_name")}
                    />
                  </Field>

                  <Field label="Email" required>
                    <Input
                      icon={Mail}
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </Field>
                </div>

                {/* Phone + License */}
                <div
                  className={
                    role === "driver"
                      ? "register-grid-two"
                      : "register-grid-one"
                  }
                >
                  <Field label="Mobile Number" required>
                    <Input
                      icon={Phone}
                      required
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      onChange={set("phone")}
                    />
                  </Field>

                  {role === "driver" && (
                    <Field
                      label="Driving License Number"
                      required
                      hint="Format: DL-XXXXXXXXXXXX"
                    >
                      <Input
                        icon={IdCard}
                        required
                        placeholder="DL-0420110149646"
                        value={form.license_number}
                        onChange={set("license_number")}
                      />
                    </Field>
                  )}
                </div>

                {/* Password + Confirm */}
                <div className="register-grid-two">
                  <Field
                    label="Password"
                    required
                    hint="At least 8 characters, with a letter and a number"
                  >
                    <Input
                      icon={Lock}
                      type="password"
                      required
                      placeholder="Create a password"
                      value={form.password}
                      onChange={set("password")}
                    />
                  </Field>

                  <Field label="Confirm Password" required>
                    <Input
                      icon={Lock}
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={form.confirm}
                      onChange={set("confirm")}
                    />
                  </Field>
                </div>

                {/* Driver address */}
                {role === "driver" && (
                  <div className="register-address-section">

                    <div className="register-section-heading">
                      <span className="register-section-icon">
                        <MapPin />
                      </span>
                      <span>Address details</span>
                    </div>

                    <div className="register-grid-two">
                      <Field label="Address" required>
                        <Input
                          required
                          placeholder="Street address"
                          value={form.address}
                          onChange={set("address")}
                        />
                      </Field>

                      <Field label="City" required>
                        <Input
                          required
                          placeholder="City"
                          value={form.city}
                          onChange={set("city")}
                        />
                      </Field>

                      <Field label="State" required>
                        <Input
                          required
                          placeholder="State"
                          value={form.state}
                          onChange={set("state")}
                        />
                      </Field>

                      <Field label="Postal Code" required>
                        <Input
                          required
                          placeholder="Postal code"
                          value={form.postal_code}
                          onChange={set("postal_code")}
                        />
                      </Field>

                      <Field label="Country" required>
                        <Input
                          required
                          placeholder="Country"
                          value={form.country}
                          onChange={set("country")}
                        />
                      </Field>
                    </div>

                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="register-error">
                    <span className="register-error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="register-submit"
                  size="lg"
                  loading={loading}
                >
                  Sign Up
                </Button>

              </form>

              {/* Login */}
              <p className="register-login-text">
                Already have an account?{" "}
                <Link
                  to={`/login?role=${role}`}
                  className="register-login-link"
                >
                  Login
                </Link>
              </p>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}