import { request } from "./client";

export const getOnboardingStatus = () => request({ method: "GET", url: "/onboarding/status" });

export const getSubscription = () => request({ method: "GET", url: "/onboarding/subscription" });

export const getSubscriptionPlans = () => request({ method: "GET", url: "/onboarding/plans" });

export const submitVerificationDocument = (documentType, file) => {
  const data = new FormData();
  data.append("document_type", documentType);
  data.append("file", file);
  return request({ method: "POST", url: "/onboarding/documents", data });
};

export const createSubscriptionOrder = (plan) =>
  request({ method: "POST", url: "/onboarding/subscription/order", data: { plan } });

export const verifySubscriptionPayment = (data) =>
  request({ method: "POST", url: "/onboarding/subscription/verify", data });