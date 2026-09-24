class UserRole:
    PASSENGER = "passenger"
    DRIVER = "driver"
    ADMIN = "admin"
    OPERATOR = "operator"

    ALL = [PASSENGER, DRIVER, ADMIN, OPERATOR]


class DriverStatus:
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

    ALL = [PENDING, VERIFIED, REJECTED, SUSPENDED]


class DriverAvailability:
    ONLINE = "online"
    OFFLINE = "offline"
    ON_TRIP = "on_trip"

    ALL = [ONLINE, OFFLINE, ON_TRIP]


class VehicleType:
    SEDAN = "sedan"
    SUV = "suv"
    HATCHBACK = "hatchback"
    MINI_VAN = "mini_van"

    ALL = [SEDAN, SUV, HATCHBACK, MINI_VAN]


class TripStatus:
    SCHEDULED = "scheduled"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    ALL = [SCHEDULED, ONGOING, COMPLETED, CANCELLED]


# class BookingStatus:
#     PENDING_PAYMENT = "pending_payment"
#     CONFIRMED = "confirmed"
#     CANCELLED = "cancelled"
#     COMPLETED = "completed"
#     EXPIRED = "expired"

#     ALL = [PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED, EXPIRED]



class BookingStatus:
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    ALL = [PENDING_PAYMENT, CONFIRMED, CANCELLED]


class SeatStatus:
    AVAILABLE = "available"
    LOCKED = "locked"
    BOOKED = "booked"

    ALL = [AVAILABLE, LOCKED, BOOKED]


class PaymentStatus:
    CREATED = "created"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

    ALL = [CREATED, PAID, FAILED, REFUNDED]


class StopType:
    BOARDING = "boarding"
    DROP = "drop"

    ALL = [BOARDING, DROP]


SEAT_LOCK_TTL_SECONDS = 300  # 5 minutes to complete payment before seat lock releases
