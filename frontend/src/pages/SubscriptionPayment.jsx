import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";
import { getActivePlans } from "../lib/subscription";
import { createSubscriptionOrder, verifySubscriptionPayment } from "../api/onboarding";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isOperatorOwnedDriver } from "../lib/driverType";
import "./SubscriptionPayment.css";

export default function SubscriptionPayment() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let active = true;

    const syncPlans = async () => {
      const nextPlans = await getActivePlans();
      if (!active) return;
      setPlans(nextPlans);
    };

    syncPlans();
    return () => { active = false; };
  }, []);

  const plan = useMemo(() => {
    const requestedPlan = searchParams.get("plan");
    return plans.find((item) => item.id === requestedPlan) || plans.find((item) => item.active !== false) || plans[0] || null;
  }, [plans, searchParams]);

  const redirectTo = location.state?.redirectTo || (user?.role === "operator" ? "/operator" : "/driver");
  const operatorOwnedDriver = isOperatorOwnedDriver(user);

  useEffect(() => {
    if (operatorOwnedDriver) {
      navigate(redirectTo, { replace: true });
    }
  }, [operatorOwnedDriver, redirectTo, navigate]);

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const pay = async (event) => {
    event.preventDefault();
    if (operatorOwnedDriver) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (!plan) return;
    setLoading(true);
    try {
      const checkoutLoaded = await loadRazorpay();
      if (!checkoutLoaded) throw new Error("Payment gateway could not load. Please try again.");
      const order = await createSubscriptionOrder(plan.id);
      const razorpay = new window.Razorpay({
        key: order.razorpay_key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "ShareTaxi",
        description: `${plan.label || plan.name} subscription`,
        prefill: { name: user?.full_name, email: user?.email, contact: user?.phone },
        theme: { color: "#08758F" },
        handler: async (response) => {
          try {
            await verifySubscriptionPayment({
              plan: plan.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshUser();
            toast.success("Payment successful. Subscription activated!");
            navigate(redirectTo, { replace: true });
          } catch (error) {
            toast.error(error.message);
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });
      razorpay.open();
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-logo-wrap">
          <Logo dark />
        </div>

        <Card className="payment-card">
          <Link
            to="/subscribe"
            state={{ from: location.state?.from }}
            className="payment-back-link"
          >
            <ArrowLeft className="payment-back-icon" /> Change plan
          </Link>

          <div className="payment-header">
            <CreditCard className="payment-header-icon" />
            <h1 className="payment-title">Complete payment</h1>
          </div>
          <p className="payment-subtitle">
            Activate your {user?.role === "operator" ? "operator" : "driver"} subscription to enter your dashboard.
          </p>

          {!plan ? (
            <p className="payment-empty-state">No active subscription plan is available right now.</p>
          ) : (
            <>
              <div className="payment-plan-summary">
                <div className="payment-plan-row">
                  <span className="payment-plan-name">{plan.label || plan.name} plan</span>
                  <span className="payment-plan-price">₹{plan.price}</span>
                </div>
                <p className="payment-plan-meta">
                  Access for {plan.durationDays || plan.days} days · {plan.tagline}
                </p>
              </div>

              <form onSubmit={pay} className="payment-form">
                <p className="payment-note">
                  Click below to open Razorpay secure checkout. Card, UPI, and wallet details are entered securely in the payment window.
                </p>
                <Button type="submit" className="payment-cta" size="lg" loading={loading}>
                  Open Secure Checkout · Pay ₹{plan.price}
                </Button>
              </form>
            </>
          )}

          <p className="payment-secure-note">
            <ShieldCheck className="payment-secure-icon" /> Secure checkout. Cancel anytime.
          </p>
        </Card>
      </div>
    </div>
  );
}