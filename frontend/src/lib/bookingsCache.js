// Lightweight client-side cache of the current passenger's bookings.
//
// NOTE: the backend currently exposes POST /bookings and POST /bookings/verify
// but no GET /bookings/mine list endpoint. Until one exists, My Rides reads
// from this local cache (populated right after a successful payment) so the
// UI has something real to show. Swap `readBookings()`/`saveBooking()` for a
// single `GET /bookings/mine` call as soon as that route is added.
const KEY = "st_bookings_cache";

export function readBookings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export async function syncBookingsFromServer() {
  try {
    const { listMyBookings } = await import("../api/bookings");
    const bookings = (await listMyBookings()) || [];
    localStorage.setItem(KEY, JSON.stringify(bookings));
    return bookings;
  } catch {
    return readBookings();
  }
}

export function saveBooking(booking) {
  const all = readBookings().filter((b) => b.id !== booking.id);
  all.unshift(booking);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateBookingTripStatus(tripId, status, reason = null) {
  const all = readBookings().map((booking) => {
    if (booking.trip?.id !== tripId) {
      return booking;
    }

    return {
      ...booking,
      trip: {
        ...booking.trip,
        status,
        cancel_reason: status === "cancelled" ? reason || booking.trip?.cancel_reason || null : null,
      },
      status: status === "cancelled" ? "cancelled" : booking.status,
    };
  });

  localStorage.setItem(KEY, JSON.stringify(all));
}
