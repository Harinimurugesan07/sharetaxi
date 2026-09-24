import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Settings, Users } from "lucide-react";

import Logo from "../../components/Logo";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import RoleSwitch from "../../components/RoleSwitch";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import "./AdminLogin.css";

const perks = [
  {
    icon: Users,
    text: "Oversee passengers, drivers & operators",
  },
  {
    icon: Settings,
    text: "Configure platform-wide settings",
  },
  {
    icon: ShieldCheck,
    text: "Restricted, audited access",
  },
];

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginAdmin(identifier, password);

      toast.success("Welcome back, Admin");
      navigate("/admin");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      {/* Background blobs */}
      <div className="admin-login-blob admin-login-blob-bottom" />
      <div className="admin-login-blob admin-login-blob-top" />

      {/* Header */}
      <div className="admin-login-page-header">
        <Logo dark />
      </div>

      <div className="admin-login-content">

        {/* =========================================
            LEFT — text intro + perks
        ========================================= */}
        <div className="admin-login-intro">
          <span className="admin-login-intro-badge">
            <span />
            ADMIN PORTAL
          </span>

          <h2 className="admin-login-intro-title">
            Restricted Access,
            <br />
            <span>Full Control</span>
          </h2>

          <p className="admin-login-intro-text">
            This area is reserved for ShareTaxi administrators managing the
            platform.
          </p>

          <ul className="admin-login-perks">
            {perks.map((perk) => {
              const Icon = perk.icon;

              return (
                <li key={perk.text}>
                  <span className="admin-login-perk-icon">
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
        <main className="admin-login-form-panel">
          <div className="admin-login-form-container">

            {/* Mobile logo */}
            <div className="admin-login-mobile-logo">
              <Logo dark />
            </div>

            {/* Card */}
            <div className="admin-login-card">
              <div className="admin-login-header">
                <span className="admin-login-header-label">RESTRICTED ACCESS</span>
                <h1>Admin Login</h1>
                <p>Restricted access for ShareTaxi administrators.</p>
              </div>

              <RoleSwitch active="admin" />

              <form className="admin-login-form" onSubmit={onSubmit}>
                <Field label="Email or Phone" required>
                  <Input
                    icon={Mail}
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@example.com"
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
                  <div className="admin-login-error" role="alert">
                    <span className="admin-login-error-icon">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="admin-login-submit"
                  size="lg"
                  loading={loading}
                >
                  Login to Admin Panel
                </Button>
              </form>

              <p className="admin-login-back-text">
                Not an admin?{" "}
                <Link to="/login" className="admin-login-back-link">
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