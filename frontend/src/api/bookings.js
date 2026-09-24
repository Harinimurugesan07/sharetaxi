import { request } from "./client";

export const listMyBookings = () =>
  request({ method: "GET", url: "/bookings/mine" });

export const createBooking = (trip_id, seats) =>
  request({ method: "POST", url: "/bookings", data: { trip_id, seats } });

export const verifyPayment = (payload) =>
  request({ method: "POST", url: "/bookings/verify", data: payload });
