import { request } from "./client";

export const operatorLogin = (identifier, password) =>
  request({ method: "POST", url: "/auth/operator/login", data: { identifier, password } });

export const operatorDashboard = () => request({ method: "GET", url: "/operator/dashboard" });

export const operatorLiveTrips = () => request({ method: "GET", url: "/operator/trips/live" });

export const operatorTrips = (status) =>
  request({ method: "GET", url: "/operator/trips", params: status ? { status } : {} });

export const operatorTrip = (tripId) =>
  request({ method: "GET", url: `/operator/trips/${tripId}` });

export const operatorDrivers = () => request({ method: "GET", url: "/operator/drivers" });

export const operatorDriver = (driverId) =>
  request({ method: "GET", url: `/operator/drivers/${driverId}` });

export const operatorPassengers = () => request({ method: "GET", url: "/operator/passengers" });

export const operatorRideRequests = () =>
  request({ method: "GET", url: "/operator/ride-requests" });

export const operatorSettlements = () =>
  request({ method: "GET", url: "/operator/settlements" });

export const operatorSettleSettlement = (settlementId) =>
  request({ method: "PATCH", url: `/operator/settlements/${settlementId}` });

export const operatorCreateDriver = (data) =>
  request({ method: "POST", url: "/operator/drivers", data });

export const operatorDeleteDriver = (driverId) =>
  request({ method: "DELETE", url: `/operator/drivers/${driverId}` });

export const operatorUploadDriverDocument = (driverId, documentType, file) => {
  const data = new FormData();
  data.append("document_type", documentType);
  data.append("file", file);
  return request({ method: "POST", url: `/operator/drivers/${driverId}/documents`, data });
};

export const operatorCreateTrip = (data) =>
  request({ method: "POST", url: "/operator/trips", data });

export const operatorCreateVehicle = (data) =>
  request({ method: "POST", url: "/operator/vehicles", data });

export const operatorVehicles = () =>
  request({ method: "GET", url: "/operator/vehicles" });


export const operatorWallet = () =>
  request({ method: "GET", url: "/operator/wallet" });

export const requestOperatorPayout = (amount) =>
  request({ method: "POST", url: "/operator/wallet/payout", data: { amount } });

export const withdrawOperatorPayout = (payoutRequestId) =>
  request({ method: "POST", url: `/operator/wallet/payout/${payoutRequestId}/withdraw` });

export const operatorFinancialSummary = () =>
  request({ method: "GET", url: "/operator/financial-summary" });

export const operatorPayoutRequests = (status) =>
  request({
    method: "GET",
    url: "/operator/payouts",
    params: status ? { status } : {},
  });