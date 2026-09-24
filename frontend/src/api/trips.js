import { request } from "./client";

export const createTrip = (data) => request({ method: "POST", url: "/trips", data });
export const myTrips = () => request({ method: "GET", url: "/trips/mine" });
export const availableTrips = () => request({ method: "GET", url: "/trips/available" });
export const searchMatches = (data) =>
  request({ method: "POST", url: "/matching/search", data });
export const updateTripStatus = (tripId, status, reason) =>
  request({ method: "PATCH", url: `/trips/${tripId}/status`, data: { status, reason } });
