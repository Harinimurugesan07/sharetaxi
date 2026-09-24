import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, Mail, Lock, BarChart3, Users, ShieldCheck } from "lucide-react";

import Logo from "../../components/Logo";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import RoleSwitch from "../../components/RoleSwitch";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import "./OperatorLogin.css";

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

export default function OperatorLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginOperator } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginOperator(identifier, password);

      toast.success("Welcome back");
      navigate("/operator");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="operator-login-page">

      {/* Background blobs */}
      <div className="operator-login-blob operator-login-blob-bottom" />
      <div className="operator-login-blob operator-login-blob-top" />

      {/* Header */}
      <div className="operator-login-page-header">
        <Logo dark />
      </div>

      <div className="operator-login-content">

        {/* =========================================
            LEFT — text intro + perks
        ========================================= */}
        <div className="operator-login-intro">
          <span className="operator-login-intro-badge">
            <span />
            OPERATOR PORTAL
          </span>

          <h2 className="operator-login-intro-title">
            Run Your Fleet,
            <br />
            <span>All in One Place</span>
          </h2>

          <p className="operator-login-intro-text">
            Log in to manage drivers, trips, and payouts across your fleet.
          </p>

          <ul className="operator-login-perks">
            {perks.map((perk) => {
              const Icon = perk.icon;

              return (
                <li key={perk.text}>
                  <span className="operator-login-perk-icon">
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
        <main className="operator-login-form-panel">
          <div className="operator-login-form-container">

            {/* Mobile logo */}
            <div className="operator-login-mobile-logo">
              <Logo dark />
            </div>

            {/* Card */}
            <div className="operator-login-card">
              <div className="operator-login-header">
                <span className="operator-login-header-label">OPERATOR ACCESS</span>
                <h1>Operator Login</h1>
                <p>Access your ShareTaxi operator dashboard.</p>
              </div>

              <RoleSwitch active="operator" />

              <form className="operator-login-form" onSubmit={onSubmit}>
                <Field label="Email or Phone" required>
                  <Input
                    icon={Mail}
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="operator@example.com"
                  />
                </Field>

                <Field label="Password" required>
                  <Input
                    icon={Lock}
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                </Field>

                {error && (
                  <div className="operator-login-error" role="alert">
                    <span className="operator-login-error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="operator-login-submit"
                  size="lg"
                  loading={loading}
                >
                  Log In
                </Button>
              </form>

              <p className="operator-login-footer">
                New operator?{" "}
                <Link to="/operator/register" className="operator-login-footer-link">
                  Create an account
                </Link>
              </p>

              <p className="operator-login-back-text">
                Not an operator?{" "}
                <Link to="/login" className="operator-login-back-link">
                  Go to main login
                </Link>
              </p>
            </div>

          </div>
        </main>

      </div>

    </div>
  );
}