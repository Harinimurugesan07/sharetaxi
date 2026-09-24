import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Check, ShieldCheck, Car } from "lucide-react";
import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";
import { getActivePlans } from "../lib/subscription";
import { useAuth } from "../context/AuthContext";
import { isOperatorOwnedDriver } from "../lib/driverType";
import "./Subscribe.css";

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let active = true;

    const syncPlans = async () => {
      const nextPlans = await getActivePlans();
      if (!active) return;
      setPlans(nextPlans);
      setSelected((current) => {
        if (nextPlans.some((plan) => plan.id === current)) {
          return current;
        }
        return nextPlans[0]?.id || "";
      });
    };

    syncPlans();
    return () => { active = false; };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selected) || plans[0] || null,
    [plans, selected]
  );
  const operatorOwnedDriver = isOperatorOwnedDriver(user);
  const redirectTo = location.state?.from?.pathname || (user?.role === "operator" ? "/operator" : "/driver");

  useEffect(() => {
    if (operatorOwnedDriver) {
      navigate(redirectTo, { replace: true });
    }
  }, [operatorOwnedDriver, redirectTo, navigate]);

  const subscribe = () => {
    if (!selectedPlan) return;
    if (operatorOwnedDriver) {
      navigate(redirectTo, { replace: true });
      return;
    }
    navigate(`/subscribe/payment?plan=${selectedPlan.id}`, {
      state: { from: location.state?.from, redirectTo },
    });
  };

  return (
    <div className="subscribe-page">
      <div className="subscribe-container">
        <div className="subscribe-logo-wrap">
          <Logo dark />
        </div>

        <Card className="subscribe-card">
          <div className="subscribe-header">
            <Car className="subscribe-header-icon" />
            <h1 className="subscribe-title">
              {user?.role === "operator" ? "Operator" : "Driver"} Subscription Required
            </h1>
          </div>
          <p className="subscribe-subtitle">
            Your documents are approved. An active subscription is required to{" "}
            {user?.role === "operator" ? "access the operator console" : "go online and accept passengers"}.
            Choose a plan to continue.
          </p>

          {plans.length === 0 ? (
            <p className="subscribe-empty-state">No active plans are available right now. Please check back later.</p>
          ) : (
            <div className="subscribe-plans-grid">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`subscribe-plan-card ${selected === plan.id ? "subscribe-plan-card--selected" : ""}`}
                >
                  {plan.popular && <span className="subscribe-plan-badge">MOST POPULAR</span>}
                  <p className="subscribe-plan-label">{plan.label || plan.name}</p>
                  <p className="subscribe-plan-price">₹{plan.price}</p>
                  <p className="subscribe-plan-tagline">{plan.tagline}</p>
                  <p className="subscribe-plan-details">{plan.durationDays || plan.days} days access</p>
                  <span
                    className={`subscribe-plan-radio ${
                      selected === plan.id ? "subscribe-plan-radio--selected" : ""
                    }`}
                  >
                    {selected === plan.id && <Check className="subscribe-plan-radio-icon" />}
                  </span>
                </button>
              ))}
            </div>
          )}

          <ul className="subscribe-features">
            {(selectedPlan?.features?.length ? selectedPlan.features : [
              "Unlimited trips and ride requests",
              "Priority placement in passenger search results",
              "Full access to earnings & trip analytics",
            ]).map((feature) => (
              <li key={feature} className="subscribe-feature-item">
                <Check className="subscribe-feature-icon" /> {feature}
              </li>
            ))}
          </ul>

          <Button className="subscribe-cta" size="lg" onClick={subscribe} disabled={!selectedPlan}>
            Subscribe & Continue
          </Button>

          <p className="subscribe-secure-note">
            <ShieldCheck className="subscribe-secure-icon" /> Secure checkout. Cancel anytime.
          </p>

          <Link to="/" className="subscribe-back-link">
            Back to Home
          </Link>
        </Card>
      </div>
    </div>
  );
}