# ShareTaxi — Web

A React + Tailwind web app for ShareTaxi, matching the mobile app's yellow/navy
brand identity end-to-end: landing page -> passenger auth/booking/payment/live
tracking -> driver dashboard -> admin panel.

## Getting started

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL to point at your Flask API
npm run dev
```

Open http://localhost:5173. Build for production with `npm run build` (output
in `dist/`), preview it with `npm run preview`.

## Connecting to your backend

Everything in `src/api/*.js` calls your Flask routes directly and unwraps the
`{ success, message, data }` envelope from `app/utils/response.py`:

| Frontend module      | Backend routes it calls |
|-----------------------|--------------------------|
| `api/auth.js`         | `/auth/passenger/register`, `/auth/driver/register`, `/auth/passenger/login`, `/auth/driver/login`, `/auth/admin/login`, `/auth/me` |
| `api/trips.js`        | `/trips` (create), `/trips/mine`, `/trips/available`, `/matching/search` |
| `api/bookings.js`     | `/bookings`, `/bookings/verify` |
| `api/vehicles.js`     | `/vehicles`, `/vehicles/mine` |
| `api/driver.js`       | `/drivers/me`, `/drivers/availability` |
| `api/users.js`        | `/users/profile` |
| `api/admin.js`        | `/admin/dashboard`, `/admin/drivers`, `/admin/vehicles`, `/admin/customers`, `/admin/trips` |

Auth: `src/api/client.js` attaches the JWT access token to every request and
transparently retries once via `/auth/refresh` on a 401, matching what
`flask_jwt_extended` expects. Tokens live in `localStorage`.

Live tracking: `src/lib/socket.js` connects to Socket.IO at your API's origin
(the `/api` suffix is stripped automatically) and joins the `trip:{public_id}`
room `tracking_socket.py` already defines, listening for `driver:location`,
`trip:driver_arriving`, `trip:started`, `trip:completed`.

Payments: the Payment page loads Razorpay Checkout.js and opens it with the
`order_id` / `amount` / `razorpay_key_id` your `create_booking` endpoint
returns, then posts the checkout result straight to `/bookings/verify`. You
need real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` values configured on the
backend for a payment to complete end-to-end.

**Enable CORS** on the backend for your dev origin (`CORS_ORIGINS` in
`app/config.py`), or requests from `localhost:5173` will be blocked.

## Known gaps vs. the backend (flagged in code, not hidden)

Two screens in the design brief need a backend endpoint that doesn't exist
yet in the codebase you provided:

- **My Rides** (passenger): there's no `GET /bookings/mine`, so bookings are
  cached in `localStorage` right after a successful payment
  (`src/lib/bookingsCache.js`). Add that endpoint and swap the cache read for
  a real fetch.
- **Ride Requests** (driver): booking creation confirms a seat immediately on
  payment -- there's no accept/decline step or endpoint listing incoming
  bookings for a driver's trips. The page (`src/pages/driver/RideRequests.jsx`)
  is wired for that flow and will light up as soon as something like
  `GET /drivers/requests` exists.

Everything else -- auth, trip creation/search, booking + payment, live
tracking, vehicle management, and all three admin verification/management
screens -- calls the real backend routes directly.

## Structure

```
src/
  api/            # one file per backend resource, thin wrappers over axios
  components/     # shared UI kit + layouts (Button, Card, DashboardLayout, ...)
  context/        # AuthContext (JWT session), ToastContext (success/error UI)
  lib/            # api client, socket client, formatting, constants
  pages/
    auth/         # Login, Register, AdminLogin
    passenger/    # Dashboard, FindRide, BookRide, Payment, MyRides, LiveTracking, ...
    driver/       # Dashboard, CreateTrip, Trips, RideRequests, Vehicles, Earnings, Profile
    admin/        # Dashboard, DriverVerification, VehicleVerification, Customers, AdminTrips, Reports
```

## Design tokens

Defined in `tailwind.config.js`: `yellow-*` (primary, ~#FFC928), `navy-*`
(secondary, ~#0B3D78 / #082B55 dark), `bg` (#F5F9FD), `success`/`danger` for
status states. Fully responsive: sidebar nav collapses to a bottom bar +
slide-in drawer under the `lg` breakpoint.
