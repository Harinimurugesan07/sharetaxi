export const TripStatus = { SCHEDULED: "scheduled", ONGOING: "ongoing", COMPLETED: "completed", CANCELLED: "cancelled" };
export const BookingStatus = { PENDING_PAYMENT: "pending_payment", CONFIRMED: "confirmed", CANCELLED: "cancelled" };
export const DriverAvailability = { ONLINE: "online", OFFLINE: "offline", ON_TRIP: "on_trip" };
export const DriverStatus = { PENDING: "pending", VERIFIED: "verified", REJECTED: "rejected", SUSPENDED: "suspended" };
export const VehicleType = { SEDAN: "sedan", SUV: "suv", HATCHBACK: "hatchback", MINI_VAN: "mini_van" };

// Preset pickup/drop points used to drive the location pickers without a
// geocoding API. Swap for a places-autocomplete integration in production.
export const POPULAR_LOCATIONS = [
  { name: "Chennai Central", lat: 13.0827, lng: 80.2707 },
  { name: "Chennai International Airport", lat: 12.9941, lng: 80.1709 },
  { name: "Airport Metro, Chennai", lat: 12.9809, lng: 80.1642 },
  { name: "T. Nagar, Chennai", lat: 13.0418, lng: 80.2341 },
  { name: "OMR, Chennai", lat: 12.8996, lng: 80.2274 },
  { name: "Velachery, Chennai", lat: 12.9784, lng: 80.2209 },
  { name: "Adyar, Chennai", lat: 13.0012, lng: 80.2565 },
  { name: "Tambaram, Chennai", lat: 12.9249, lng: 80.1000 },
  { name: "Anna Nagar, Chennai", lat: 13.0850, lng: 80.2101 },
  { name: "Thoraipakkam, Chennai", lat: 12.9430, lng: 80.2340 },
];
