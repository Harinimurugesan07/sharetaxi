import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CreditCard } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getSubscription } from "../api/onboarding";
import "./SubscriptionDetails.css";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function SubscriptionDetails() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const roleLabel = user?.role === "operator" ? "Operator" : "Driver";

  useEffect(() => {
    getSubscription()
      .then(setSubscription)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const active = subscription?.status === "active" && new Date(subscription.expires_at) > new Date();
  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at) - new Date()) / 86400000))
    : 0;

  return (
    <div className="subscription-page">
      <Card className="subscription-card">
        <div className="subscription-header">
          <div>
            <p className="subscription-title"><CreditCard /> Subscription details</p>
            <p className="subscription-subtitle">Your {roleLabel} subscription and access status.</p>
          </div>
          <span className={`subscription-status-pill ${active ? "subscription-status-pill--active" : "subscription-status-pill--expired"}`}>{active ? "Active" : "Expired"}</span>
        </div>

        {loading ? (
          <p className="subscription-loading">Loading subscription details...</p>
        ) : error ? (
          <p className="subscription-error">{error}</p>
        ) : subscription?.plan ? (
          <div className="subscription-details-grid">
            <div className="subscription-detail-tile">
              <p className="subscription-detail-label">Plan</p>
              <p className="subscription-detail-value">{subscription.plan}</p>
            </div>
            <div className="subscription-detail-tile">
              <p className="subscription-detail-label">Account type</p>
              <p className="subscription-detail-value subscription-detail-value--plain">{roleLabel}</p>
              <p className="subscription-detail-note">ShareTaxi access</p>
            </div>
            <div className="subscription-date-row"><CalendarDays /> Started {formatDate(subscription.started_at)}</div>
            <div className="subscription-date-row"><CalendarDays /> Expires {formatDate(subscription.expires_at)}</div>
          </div>
        ) : (
          <p className="subscription-empty">No subscription record was found for this account.</p>
        )}

        {active && <p className="subscription-remaining-banner"><CheckCircle2 /> {daysRemaining} days remaining.</p>}
        <Button className="subscription-action-btn" onClick={() => window.location.assign("/subscribe")}>{active ? "Change or renew plan" : "Choose a plan"}</Button>
      </Card>
    </div>
  );
}