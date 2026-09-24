import { io } from "socket.io-client";
import { API_BASE_URL } from "../api/client";

let socket = null;

// Event names shared with the backend's tracking_socket.py.
// Driver -> server:
export const DRIVER_LOCATION_EVENT = "driver:location";
export const DRIVER_STATUS_EVENT = "driver:status_update";

// Connects a single shared Socket.IO client authenticated with the current
// access token, per the backend's `trip:{public_id}` room convention.
export function getSocket() {
  const token = localStorage.getItem("st_access_token");

  if (!socket) {
    const socketUrl = API_BASE_URL.replace(/\/api(?:\/v1)?\/?$/, "");
    socket = io(socketUrl, {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
    });
  } else if (!socket.connected) {
    // Pick up a refreshed / new access token on the next (re)connect.
    socket.auth = { token };
  }

  return socket;
}

// Drop the shared connection (e.g. on logout) so the next user never
// inherits the previous user's authenticated socket.
export function resetSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function joinTripRoom(tripPublicId) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("join_trip", { trip_id: tripPublicId });
}

export function leaveTripRoom(tripPublicId) {
  const s = getSocket();
  s.emit("leave_trip", { trip_id: tripPublicId });
}

export function joinOperatorRoom() {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("join_operator");
}
