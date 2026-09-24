

import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import DriverLayout from "./components/DriverLayout";
import FreelanceOnly from "./components/driver/FreelanceOnly";
import OperatorLayout from "./components/OperatorLayout";
import PassengerLayout from "./components/PassengerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PortalAccess from "./components/PortalAccess";
import SubscriptionAccess from "./components/SubscriptionAccess";

import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { About, HowItWorks, Safety } from "./pages/SimplePage";
import Subscribe from "./pages/Subscribe";
import SubscriptionDetails from "./pages/SubscriptionDetails";
import SubscriptionPayment from "./pages/SubscriptionPayment";

import AdminLogin from "./pages/auth/AdminLogin";
import Login from "./pages/auth/Login";
import OperatorLogin from "./pages/auth/OperatorLogin";
import OperatorRegister from "./pages/auth/OperatorRegister";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminTrips from "./pages/admin/AdminTrips";
import Customers from "./pages/admin/Customers";
import DriverVerification from "./pages/admin/DriverVerification";
import Reports from "./pages/admin/Reports";
import VehicleVerification from "./pages/admin/VehicleVerification";

import ActiveTrip from "./pages/driver/ActiveTrip";
import DriverDashboard from "./pages/driver/Dashboard";
import CreateTrip from "./pages/driver/CreateTrip";
import Earnings from "./pages/driver/Earnings";
import DriverProfile from "./pages/driver/Profile";
import RideRequests from "./pages/driver/RideRequests";
import DriverTrips from "./pages/driver/Trips";
import Vehicles from "./pages/driver/Vehicles";

import Alerts from "./pages/operator/Alerts";
import OperatorDashboard from "./pages/operator/Dashboard";
import OperatorExpenses from "./pages/operator/Expenses";
import DriverMonitoring from "./pages/operator/DriverMonitoring";
import LiveOperations from "./pages/operator/LiveOperations";
import PassengerManagement from "./pages/operator/PassengerManagement";
import OperatorProfile from "./pages/operator/Profile";
import OperatorReports from "./pages/operator/Reports";
import OperatorRideRequests from "./pages/operator/RideRequests";
import TripAssignment from "./pages/operator/TripAssignment";
import TripDetail from "./pages/operator/TripDetail";
import TripManagement from "./pages/operator/TripManagement";
import OperatorVehicles from "./pages/operator/Vehicles";

import BookingSuccess from "./pages/passenger/BookingSuccess";
import BookRide from "./pages/passenger/BookRide";
import PassengerDashboard from "./pages/passenger/Dashboard";
import FindRide from "./pages/passenger/FindRide";
import LiveTracking from "./pages/passenger/LiveTracking";
import MyRides from "./pages/passenger/MyRides";
import Payment from "./pages/passenger/Payment";
import PassengerProfile from "./pages/passenger/Profile";
import PassengerSettings from "./pages/passenger/Settings";
import Wallet from "./pages/passenger/Wallet";

import OnboardingVerification from "./pages/OnboardingVerification";
import VerificationRequests from "./pages/admin/VerificationRequests";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminSubscriptionPlans from "./pages/admin/SubscriptionPlans";
import BlogManagement from "./pages/BlogManagement";

import OperatorCreateDriver from "./pages/operator/CreateDriver";
import OperatorCreateTrip from "./pages/operator/CreateTrip";
import OperatorSettlements from "./pages/operator/Settlements";
import OperatorWallet from "./pages/operator/Wallet";
import PayoutRequests from "./pages/admin/PayoutRequests";


function ProtectedArea({ role }) {
  return (
    <ProtectedRoute role={role}>
      {role === "driver" || role === "operator" ? (
        <PortalAccess>
          <Outlet />
        </PortalAccess>
      ) : (
        <Outlet />
      )}
    </ProtectedRoute>
  );
}


function App() {
  return (
    <Routes>

      {/* Public Routes */}

      <Route path="/" element={<Landing />} />

      <Route
        path="/how-it-works"
        element={<HowItWorks />}
      />

      <Route
        path="/safety"
        element={<Safety />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Register />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/operator/login"
        element={<OperatorLogin />}
      />

      <Route
        path="/operator/register"
        element={<OperatorRegister />}
      />

      {/* Subscription: verified freelance drivers and operators only */}

      <Route element={<SubscriptionAccess />}>

        <Route
          path="/subscribe"
          element={<Subscribe />}
        />

        <Route
          path="/subscription/details"
          element={<SubscriptionDetails />}
        />

        <Route
          path="/subscribe/payment"
          element={<SubscriptionPayment />}
        />

        <Route
          path="/subscription/payment"
          element={<SubscriptionPayment />}
        />

      </Route>

      <Route
        path="/onboarding/verification"
        element={
          <ProtectedRoute>
            <OnboardingVerification />
          </ProtectedRoute>
        }
      />


      {/* Passenger Routes */}

      <Route element={<ProtectedArea role="passenger" />}>

        <Route
          path="/passenger"
          element={<PassengerLayout />}
        >

          <Route
            index
            element={<PassengerDashboard />}
          />

          <Route
            path="find-ride"
            element={<FindRide />}
          />

          <Route
            path="book/:tripId"
            element={<BookRide />}
          />

          <Route
            path="payment/:bookingId"
            element={<Payment />}
          />

          <Route
            path="booking-success/:bookingId"
            element={<BookingSuccess />}
          />

          <Route
            path="my-rides"
            element={<MyRides />}
          />

          <Route
            path="wallet"
            element={<Wallet />}
          />

          <Route
            path="profile"
            element={<PassengerProfile />}
          />

          <Route
            path="settings"
            element={<PassengerSettings />}
          />

          <Route
            path="track/:tripId"
            element={<LiveTracking />}
          />

        </Route>

      </Route>


      {/* Driver Routes */}

      <Route element={<ProtectedArea role="driver" />}>

        <Route
          path="/driver"
          element={<DriverLayout />}
        >

          <Route
            index
            element={<DriverDashboard />}
          />

          {/* Both driver types */}

          <Route
            path="trips"
            element={<DriverTrips />}
          />

          <Route
            path="requests"
            element={<RideRequests />}
          />

          <Route
            path="vehicles"
            element={<Vehicles />}
          />

          <Route
            path="earnings"
            element={<Earnings />}
          />

          <Route
            path="profile"
            element={<DriverProfile />}
          />

          <Route
            path="active-trip/:tripId"
            element={<ActiveTrip />}
          />

          {/* Freelance drivers only: operator-owned drivers only run
              trips their operator assigns and never pay a subscription */}

          <Route element={<FreelanceOnly />}>

            <Route
              path="create-trip"
              element={<CreateTrip />}
            />

            <Route
              path="settings/subscription"
              element={<SubscriptionDetails />}
            />

          </Route>

          {/* Verification lives in onboarding; the old portal page is gone */}

          <Route
            path="verification"
            element={<Navigate to="/driver" replace />}
          />

        </Route>

      </Route>


      {/* Admin Routes */}

      {/* Admin Routes */}
<Route element={<ProtectedArea role="admin" />}>
  <Route
    path="/admin"
    element={<AdminLayout />}
  >
    <Route
      index
      element={<AdminDashboard />}
    />

    <Route
      path="drivers"
      element={<DriverVerification />}
    />

    <Route
      path="verification"
      element={<VerificationRequests />}
    />

    <Route
      path="subscription-plans"
      element={<AdminSubscriptionPlans />}
    />

    <Route
      path="subscriptions"
      element={<AdminSubscriptions />}
    />

    <Route
      path="blogs"
      element={<BlogManagement />}
    />

    <Route
      path="vehicles"
      element={<VehicleVerification />}
    />

    <Route
      path="trips"
      element={<AdminTrips />}
    />

    <Route
      path="customers"
      element={<Customers />}
    />

    <Route
      path="reports"
      element={<Reports />}
    />

    <Route
      path="payout-requests"
      element={<PayoutRequests />}
    />
  </Route>
</Route>


      {/* Operator Routes */}

      <Route element={<ProtectedArea role="operator" />}>

        <Route
          path="/operator"
          element={<OperatorLayout />}
        >

          <Route
            index
            element={<OperatorDashboard />}
          />

          <Route
            path="live"
            element={<LiveOperations />}
          />

          <Route
            path="trips"
            element={<TripManagement />}
          />

          <Route
            path="trips/:tripId"
            element={<TripDetail />}
          />

          <Route
            path="trips/new"
            element={<OperatorCreateTrip />}
          />

          <Route
            path="drivers"
            element={<DriverMonitoring />}
          />

          <Route
            path="drivers/new"
            element={<OperatorCreateDriver />}
          />

          <Route
            path="passengers"
            element={<PassengerManagement />}
          />

          <Route
            path="requests"
            element={<OperatorRideRequests />}
          />

          <Route
            path="settlements"
            element={<OperatorSettlements />}
          />
          <Route
  path="wallet"
  element={<OperatorWallet />}
/>

          <Route
            path="expenses"
            element={<OperatorExpenses />}
          />

          <Route
            path="assignments"
            element={<TripAssignment />}
          />

          <Route
            path="vehicles"
            element={<OperatorVehicles />}
          />

          <Route
            path="alerts"
            element={<Alerts />}
          />

          <Route
            path="reports"
            element={<OperatorReports />}
          />

          <Route
            path="profile"
            element={<OperatorProfile />}
          />

          <Route
            path="settings/subscription"
            element={<SubscriptionDetails />}
          />

        </Route>

      </Route>


      {/* 404 */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}


export default App;