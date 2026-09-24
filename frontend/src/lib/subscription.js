// Driver/Operator subscription plan catalog.
//
// Plans live in the backend database and are managed from the admin plan page.
// Subscription *status* (active / expired / expiry date) comes from the session
// user (/auth/me) and /onboarding/subscription, never from local storage.
import { getSubscriptionPlans } from "../api/onboarding";

function normalizePlan(plan = {}, fallbackId = "monthly") {
  const id = String(plan.id || plan.slug || fallbackId).trim() || fallbackId;
  const name = String(plan.name || plan.label || "Subscription plan").trim() || "Subscription plan";
  const price = Number(plan.price ?? 0);
  const rawDays = Number(plan.durationDays ?? plan.days ?? 30);
  const durationDays = Number.isFinite(rawDays) ? Math.max(1, Math.round(rawDays)) : 30;
  const features = Array.isArray(plan.features)
    ? plan.features.map((feature) => String(feature).trim()).filter(Boolean)
    : typeof plan.features === "string"
      ? plan.features
          .split(/\n|,/)
          .map((feature) => feature.trim())
          .filter(Boolean)
      : [];

  return {
    id,
    name,
    label: String(plan.label || name).trim() || name,
    slug: id,
    price: Number.isFinite(price) ? price : 0,
    days: durationDays,
    durationDays,
    tagline: String(plan.tagline || "Flexible access").trim() || "Flexible access",
    description: String(plan.description || "").trim(),
    features: features.length ? features : [
      "Unlimited trips and ride requests",
      "Priority placement in passenger search results",
      "Full access to earnings & trip analytics",
    ],
    popular: Boolean(plan.popular),
    active: plan.active !== false,
    limits: {
      maxTrips: String(plan.maxTrips ?? plan.limits?.maxTrips ?? "Unlimited"),
      priority: String(plan.priority ?? plan.limits?.priority ?? "Priority placement"),
      support: String(plan.support ?? plan.limits?.support ?? "Priority support"),
    },
  };
}

export async function getPlans() {
  try {
    const plans = await getSubscriptionPlans();
    const normalized = Array.isArray(plans) ? plans.map((plan) => normalizePlan(plan, plan.id)) : [];
    return normalized.filter((plan) => plan && plan.name);
  } catch {
    return [];
  }
}

export async function getActivePlans() {
  const plans = await getPlans();
  return plans.filter((plan) => plan.active !== false);
}
