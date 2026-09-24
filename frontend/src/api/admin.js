import { request } from "./client";

export const adminDashboard = () => request({ method: "GET", url: "/admin/dashboard" });

export const adminListDrivers = (status) =>
  request({ method: "GET", url: "/admin/drivers", params: status ? { status } : {} });

export const adminSetDriverVerification = (driverId, status, notes) =>
  request({
    method: "PATCH",
    url: `/admin/drivers/${driverId}/verification`,
    data: { status, notes },
  });

export const adminListVehicles = (verified) =>
  request({
    method: "GET",
    url: "/admin/vehicles",
    params: verified !== undefined ? { verified } : {},
  });

export const adminSetVehicleVerification = (vehicleId, is_verified) =>
  request({
    method: "PATCH",
    url: `/admin/vehicles/${vehicleId}/verification`,
    data: { is_verified },
  });

export const adminListCustomers = () => request({ method: "GET", url: "/admin/customers" });

export const adminListTrips = (status) =>
  request({ method: "GET", url: "/admin/trips", params: status ? { status } : {} });

export const adminListVerificationRequests = (params = {}) =>
  request({ method: "GET", url: "/admin/verification-requests", params });

export const adminReviewVerificationDocument = (documentId, status, reason) =>
  request({
    method: "PATCH",
    url: `/admin/verification-documents/${documentId}`,
    data: { status, reason },
  });

export const adminReviewVerificationRequest = (userId, status, reason) =>
  request({
    method: "PATCH",
    url: `/admin/verification-requests/${userId}`,
    data: { status, reason },
  });

export const adminListSubscriptions = (status) =>
  request({ method: "GET", url: "/admin/subscriptions", params: status ? { status } : {} });

export const adminListSubscriptionPlans = () => request({ method: "GET", url: "/admin/subscription-plans" });

export const adminCreateSubscriptionPlan = (payload) =>
  request({ method: "POST", url: "/admin/subscription-plans", data: payload });

export const adminUpdateSubscriptionPlan = (planId, payload) =>
  request({ method: "PATCH", url: `/admin/subscription-plans/${planId}`, data: payload });

export const adminDeleteSubscriptionPlan = (planId) =>
  request({ method: "DELETE", url: `/admin/subscription-plans/${planId}` });

export const adminFinancialSummary = () =>
  request({
    method: "GET",
    url: "/admin/financial-summary",
  });


  export const adminDriverPayoutRequests = (status = "pending") =>
  request({
    method: "GET",
    url: "/admin/driver-payouts",
    params: {
      status,
    },
  });

export const adminApproveDriverPayout = (payoutRequestId) =>
  request({
    method: "PATCH",
    url: `/admin/driver-payouts/${payoutRequestId}/approve`,
  });

export const adminRejectDriverPayout = (
  payoutRequestId,
  adminNote = ""
) =>
  request({
    method: "PATCH",
    url: `/admin/driver-payouts/${payoutRequestId}/reject`,
    data: {
      admin_note: adminNote,
    },
  });

  export const adminProcessDriverPayout = (payoutRequestId) =>
  request({
    method: "PATCH",
    url: `/admin/driver-payouts/${payoutRequestId}/process`,
  });

  export const adminReconcileDriverPayout = (
  payoutRequestId
) =>
  request({
    method: "PATCH",
    url: `/admin/driver-payouts/${payoutRequestId}/reconcile`,
  });

  export const getAdminPaymentSplitSettings = () =>
  request({
    method: "GET",
    url: "/admin/payment-split",
  });

export const updateAdminPaymentSplitSettings = (data) =>
  request({
    method: "PUT",
    url: "/admin/payment-split",
    data,
  });