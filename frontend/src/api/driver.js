import { request } from "./client";

export const myDriverProfile = () =>
  request({
    method: "GET",
    url: "/drivers/me",
  });

export const updateMyDriverAddress = (data) =>
  request({
    method: "PATCH",
    url: "/drivers/me",
    data,
  });

export const updateMyDriverPayoutMethod = (data) =>
  request({
    method: "PATCH",
    url: "/drivers/payout-method",
    data,
  });

export const setAvailability = (availability) =>
  request({
    method: "PATCH",
    url: "/drivers/availability",
    data: { availability },
  });

export const driverRideRequests = () =>
  request({
    method: "GET",
    url: "/drivers/requests",
  });

export const driverEarnings = () =>
  request({
    method: "GET",
    url: "/drivers/earnings",
  });

// Public listing used by the "Available Drivers" sidebar on the landing page.
// params: { city?, limit?, offset? }
export const listAvailableDrivers = (params) =>
  request({
    method: "GET",
    url: "/drivers/available",
    params,
  });


  export const requestDriverPayout = (amount) =>
  request({
    method: "POST",
    url: "/drivers/wallet/payout",
    data: {
      amount,
    },
  });