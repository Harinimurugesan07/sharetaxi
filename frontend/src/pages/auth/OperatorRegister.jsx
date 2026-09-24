import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Phone,
  Radar,
  User,
  ShieldCheck,
  BarChart3,
  Users,
} from "lucide-react";

import Logo from "../../components/Logo";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";

import "./OperatorRegister.css";

const perks = [
  {
    icon: BarChart3,
    text: "Manage your fleet from one dashboard",
  },
  {
    icon: Users,
    text: "Onboard and oversee drivers with ease",
  },
  {
    icon: ShieldCheck,
    text: "Verified, compliant operations",
  },
];

export default function OperatorRegister() {
  const { registerOperator } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerOperator({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      navigate("/onboarding/verification", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="operator-register-page">

      {/* Background blobs */}
      <div className="operator-register-blob operator-register-blob-bottom" />
      <div className="operator-register-blob operator-register-blob-top" />

      {/* Header */}
      <div className="operator-register-page-header">
        <Logo dark />
      </div>

      <div className="operator-register-content">

        {/* =========================================
            LEFT — text intro + perks
        ========================================= */}
        <div className="operator-register-intro">
          <span className="operator-register-intro-badge">
            <span />
            OPERATOR PORTAL
          </span>

          <h2 className="operator-register-intro-title">
            Run Your Fleet,
            <br />
            <span>All in One Place</span>
          </h2>

          <p className="operator-register-intro-text">
            Register your operator account, then activate your subscription
            to start managing drivers, trips, and payouts.
          </p>

          <ul className="operator-register-perks">
            {perks.map((perk) => {
              const Icon = perk.icon;

              return (
                <li key={perk.text}>
                  <span className="operator-register-perk-icon">
                    <Icon />
                  </span>
                  <span>{perk.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* =========================================
            RIGHT — floating card
        ========================================= */}
        <main className="operator-register-form-panel">
          <div className="operator-register-form-container">

            {/* Mobile logo */}
            <div className="operator-register-mobile-logo">
              <Logo dark />
            </div>

            {/* Card */}
            <div className="operator-register-card">
              <div className="operator-register-header">
                <span className="operator-register-header-label">GET STARTED</span>
                <h1>Create Operator Account</h1>
                <p>Register first, then activate your operator subscription.</p>
              </div>

              <form className="operator-register-form" onSubmit={submit}>
                <div className="operator-register-grid-two">
                  <Field label="Full Name" required>
                    <Input
                      icon={User}
                      required
                      value={form.full_name}
                      onChange={set("full_name")}
                      placeholder="Your name"
                    />
                  </Field>

                  <Field label="Email" required>
                    <Input
                      icon={Mail}
                      type="email"
                      required
                      value={form.email}
                      onChange={set("email")}
                      placeholder="operator@example.com"
                    />
                  </Field>
                </div>

                <Field label="Mobile Number" required>
                  <Input
                    icon={Phone}
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="10-digit mobile number"
                  />
                </Field>

                <div className="operator-register-grid-two">
                  <Field
                    label="Password"
                    required
                    hint="At least 8 characters, with a letter and a number"
                  >
                    <Input
                      icon={Lock}
                      type="password"
                      required
                      value={form.password}
                      onChange={set("password")}
                      placeholder="Create a password"
                    />
                  </Field>

                  <Field label="Confirm Password" required>
                    <Input
                      icon={Lock}
                      type="password"
                      required
                      value={form.confirm}
                      onChange={set("confirm")}
                      placeholder="Repeat your password"
                    />
                  </Field>
                </div>

                {error && (
                  <div className="operator-register-error">
                    <span className="operator-register-error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="operator-register-submit"
                  size="lg"
                  loading={loading}
                >
                  Create Account
                </Button>
              </form>

              <p className="operator-register-footer">
                Already registered?{" "}
                <Link to="/operator/login" className="operator-register-footer-link">
                  Operator Login
                </Link>
              </p>
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}