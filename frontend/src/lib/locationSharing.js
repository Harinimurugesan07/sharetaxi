// Streams the driver's GPS position to the trip's Socket.IO room so passengers
// see the real vehicle instead of a simulated one.
//
// Browsers only expose geolocation on HTTPS (localhost is exempt) and only
// after the driver grants permission.
import { getSocket, joinTripRoom, leaveTripRoom, DRIVER_LOCATION_EVENT } from "./socket";

const MIN_INTERVAL_MS = 4000;

export function isLocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

// Returns a stop() function. Callbacks:
//   onPosition(payload) - each time a position is sent
//   onError(error)      - GeolocationPositionError (code 1 = permission denied) or Error
export function startLocationSharing(tripId, { onPosition, onError } = {}) {
  if (!isLocationSupported()) {
    onError?.(new Error("Location is not supported on this device."));
    return () => {};
  }

  joinTripRoom(tripId);
  const socket = getSocket();
  let lastSentAt = 0;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now();
      if (now - lastSentAt < MIN_INTERVAL_MS) return;
      lastSentAt = now;

      const { latitude, longitude, heading, speed, accuracy } = position.coords;
      const payload = {
        trip_id: tripId,
        lat: latitude,
        lng: longitude,
        heading,
        speed,
        accuracy,
        timestamp: position.timestamp,
      };

      // volatile: a position that can't be delivered right now is worthless later.
      socket.volatile.emit(DRIVER_LOCATION_EVENT, payload);
      onPosition?.(payload);
    },
    (error) => onError?.(error),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
    leaveTripRoom(tripId);
  };
}
