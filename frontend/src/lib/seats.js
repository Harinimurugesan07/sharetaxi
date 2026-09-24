// Seat model used everywhere a driver-facing screen deals with seats:
//
//   vehicle.total_seats  = every seat in the vehicle, INCLUDING the driver's
//   passenger capacity   = vehicle.total_seats - 1
//   trip.total_seats     = seats OFFERED on that trip (<= passenger capacity)
//   trip.available_seats = offered seats still unbooked
//   seats booked         = trip.total_seats - trip.available_seats
//
// A trip is always created with total_seats === available_seats, so "booked"
// counts real passengers only (never the driver's seat).
export function passengerCapacity(vehicle) {
  const total = Number(vehicle?.total_seats);
  if (!Number.isFinite(total)) return 0;
  return Math.max(total - 1, 1);
}

export function bookedSeats(trip) {
  return Math.max(0, Number(trip?.total_seats) - Number(trip?.available_seats)) || 0;
}
