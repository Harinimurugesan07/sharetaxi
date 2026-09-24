import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Car, UserRound } from "lucide-react";

import Logo from "../../components/Logo";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { roleLandingPath } from "../../lib/access";

import "./Login.css";

export default function Login() {
  const [params] = useSearchParams();

  const initialRole =
    params.get("role") === "driver" ? "driver" : "passenger";

  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginPassenger, loginDriver } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user =
        role === "driver"
          ? await loginDriver(identifier, password)
          : await loginPassenger(identifier, password);

      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}!`);

      navigate(roleLandingPath(user));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { key: "passenger", label: "Passenger", icon: UserRound },
    { key: "driver", label: "Driver", icon: Car },
  ];

  return (
    <div className="login-page">

      {/* Background blobs */}
      <div className="login-blob login-blob-bottom" />
      <div className="login-blob login-blob-top" />

      {/* Header */}
      <div className="login-page-header">
        <Logo dark />
      </div>

      <div className="login-content">

        {/* =========================================
            LEFT — text content
        ========================================= */}
        <div className="login-intro">
          <span className="login-intro-badge">
            SHARE • RIDE • SAVE
          </span>

          <h2 className="login-intro-title">
            Your ride is a tap away
          </h2>

          <p className="login-intro-text">
            Book a shared seat or call a driver — one account
            for every ShareTaxi trip.
          </p>
        </div>

        {/* =========================================
            RIGHT — floating card
        ========================================= */}
        <div className="login-card">

          <h1 className="login-card-title">Welcome Back</h1>
          <p className="login-card-subtitle">Log in to continue your journey</p>

          {/* Role selector */}
          <div className="login-role-selector" role="tablist" aria-label="Login as">
            {roleOptions.map((item) => {
              const Icon = item.icon;
              const active = role === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRole(item.key)}
                  className={`login-role-button ${
                    active ? "login-role-button-active" : ""
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <form className="login-form" onSubmit={onSubmit}>

            {/* Email / Mobile */}
            <div className="login-field">
              <Field label="Email or Mobile Number" required>
                <Input
                  icon={Mail}
                  type="text"
                  required
                  placeholder="you@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </Field>
            </div>

            {/* Password */}
            <div className="login-field">
              <Field label="Password" required>
                <div className="login-password-wrapper">
                  <Input
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="login-password-toggle"
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </Field>
            </div>

            {/* Remember / Forgot */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="login-checkbox" />
                <span>Keep me logged in</span>
              </label>

              <button type="button" className="login-forgot">
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <span className="login-error-icon">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Login button */}
            <Button
              type="submit"
              className="login-submit-button"
              size="lg"
              loading={loading}
            >
              Log In as {role === "driver" ? "Driver" : "Passenger"}
            </Button>

          </form>

          {/* Footer */}
          <div className="login-card-footer">
            <p className="login-need-help">
              <Link to="/#blog">Return to blog section</Link>
            </p>

            <p className="login-signup-text">
              You are not a member?{" "}
              <Link to={`/signup?role=${role}`} className="login-signup-link">
                Register as {role === "driver" ? "Driver" : "Passenger"}
              </Link>
            </p>

            <div className="login-special-access">
              <span>Admin?</span>
              <Link to="/admin/login">Sign in here</Link>
              <span className="login-access-separator">·</span>
              <span>Operator?</span>
              <Link to="/operator/login">Sign in here</Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}