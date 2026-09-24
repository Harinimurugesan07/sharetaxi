from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from flask import current_app

from app.extensions import db
from app.models.booking import Booking
from app.models.trip import Trip
from app.models.customer import Customer
from app.models.payment import Payment
from app.services.notification_service import NotificationService
from app.services.payment_split_service import get_active_settings
from app.utils.constants import BookingStatus, TripStatus


class BookingServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _razorpay_client():
    return razorpay.Client(
        auth=(
            current_app.config["RAZORPAY_KEY_ID"],
            current_app.config["RAZORPAY_KEY_SECRET"],
        )
    )


def create_booking_with_order(
    user_id,
    trip_public_id,
    seats_requested,
):
    passenger = Customer.query.filter_by(
        user_id=user_id
    ).first()

    if not passenger:
        raise BookingServiceError(
            "Passenger profile not found",
            404,
        )

    trip = Trip.query.filter_by(
        public_id=trip_public_id
    ).first()

    if not trip:
        raise BookingServiceError(
            "Trip not found",
            404,
        )

    if trip.status != TripStatus.SCHEDULED:
        raise BookingServiceError(
            "This trip is no longer accepting bookings",
            409,
        )

    if (
        seats_requested < 1
        or seats_requested > trip.available_seats
    ):
        raise BookingServiceError(
            f"Only {trip.available_seats} seat(s) left on this trip",
            422,
        )

    fare_total = (
        float(trip.fare_per_seat)
        * seats_requested
    )

    amount_paise = int(
        round(fare_total * 100)
    )

    order = _razorpay_client().order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
        }
    )

    booking = Booking(
        trip_id=trip.id,
        passenger_id=passenger.id,
        seats_booked=seats_requested,
        fare_total=fare_total,
        status=BookingStatus.PENDING_PAYMENT,
        razorpay_order_id=order["id"],
    )

    db.session.add(booking)
    db.session.commit()

    return booking, order


def _calculate_payment_split(gross_amount, trip):
    """
    Calculate the payment split using the active admin settings.

    Freelance driver trip:
        Admin    = freelance_admin_rate
        Operator = 0%
        Driver   = remaining amount

    Operator-managed driver trip:
        Admin    = operator_admin_rate
        Operator = operator_share_rate
        Driver   = remaining amount
    """

    gross_amount = Decimal(
        str(gross_amount or 0)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    if not trip:
        raise BookingServiceError(
            "Trip information is required for payment split",
            400,
        )

    if not trip.driver:
        raise BookingServiceError(
            "Trip driver information is required for payment split",
            400,
        )

    settings = get_active_settings()

    # Operator-managed driver trip
    if trip.driver.operator_id is not None:
        admin_rate = Decimal(
            str(settings.operator_admin_rate or 0)
        )

        operator_rate = Decimal(
            str(settings.operator_share_rate or 0)
        )

    # Freelance driver trip
    else:
        admin_rate = Decimal(
            str(settings.freelance_admin_rate or 0)
        )

        operator_rate = Decimal("0")

    total_rate = admin_rate + operator_rate

    if total_rate > Decimal("1"):
        raise BookingServiceError(
            "Invalid payment split configuration",
            500,
        )

    admin_amount = (
        gross_amount * admin_rate
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    operator_amount = (
        gross_amount * operator_rate
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    driver_amount = (
        gross_amount
        - admin_amount
        - operator_amount
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    return (
        gross_amount,
        admin_amount,
        operator_amount,
        driver_amount,
    )


def verify_and_confirm_payment(
    user_id,
    booking_public_id,
    payment_id,
    order_id,
    signature,
):
    passenger = Customer.query.filter_by(
        user_id=user_id
    ).first()

    if not passenger:
        raise BookingServiceError(
            "Passenger profile not found",
            404,
        )

    booking = Booking.query.filter_by(
        public_id=booking_public_id,
        passenger_id=passenger.id,
    ).first()

    if not booking:
        raise BookingServiceError(
            "Booking not found",
            404,
        )

    # Make sure this Razorpay order belongs to this booking.
    if booking.razorpay_order_id != order_id:
        raise BookingServiceError(
            "Payment order does not match this booking",
            400,
        )

    # Check whether a Payment record already exists.
    existing_payment = Payment.query.filter_by(
        booking_id=booking.id
    ).first()

    # Idempotent retry when our Payment record already exists.
    if existing_payment:
        if (
            existing_payment.razorpay_payment_id
            and existing_payment.razorpay_payment_id != payment_id
        ):
            raise BookingServiceError(
                "Payment does not match this booking",
                400,
            )

        return booking

    # Remember whether this booking was already confirmed
    # by the old payment flow.
    was_already_confirmed = (
        booking.status == BookingStatus.CONFIRMED
    )

    # Always verify the Razorpay signature before creating
    # a Payment record.
    try:
        _razorpay_client().utility.verify_payment_signature(
            {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            }
        )

    except razorpay.errors.SignatureVerificationError:
        raise BookingServiceError(
            "Payment verification failed",
            400,
        )

    trip = booking.trip

    if not trip:
        raise BookingServiceError(
            "Trip not found for this booking",
            404,
        )

    # Only check/decrease seats for a booking that was still
    # pending payment.
    #
    # Old confirmed bookings already had their seats decreased,
    # so we must NOT decrease them again.
    if not was_already_confirmed:
        if booking.seats_booked > trip.available_seats:
            raise BookingServiceError(
                "Not enough seats left to confirm this booking",
                409,
            )

    (
        gross_amount,
        admin_amount,
        operator_amount,
        driver_amount,
    ) = _calculate_payment_split(
        booking.fare_total,
        trip,
    )

    paid_at = datetime.utcnow()

    payment = Payment(
        booking_id=booking.id,
        passenger_id=passenger.id,
        trip_id=trip.id,
        gross_amount=gross_amount,
        admin_amount=admin_amount,
        operator_amount=operator_amount,
        driver_amount=driver_amount,
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        status="paid",
        paid_at=paid_at,
    )

    db.session.add(payment)

    # Only decrease available seats if this booking was not
    # already confirmed by the old flow.
    if not was_already_confirmed:
        trip.available_seats -= booking.seats_booked

    booking.status = BookingStatus.CONFIRMED
    booking.razorpay_payment_id = payment_id
    booking.paid_at = paid_at

    db.session.commit()

    NotificationService.send_to_user(
        user_id,
        "Booking confirmed",
        (
            f"Your ride for {trip.origin_name} "
            f"to {trip.destination_name} is confirmed."
        ),
        {
            "type": "booking_confirmed",
            "booking_id": booking.public_id,
            "trip_id": trip.public_id,
        },
    )

    return booking


def get_passenger_bookings(user_id):
    passenger = Customer.query.filter_by(
        user_id=user_id
    ).first()

    if not passenger:
        raise BookingServiceError(
            "Passenger profile not found",
            404,
        )

    return (
        Booking.query
        .filter_by(passenger_id=passenger.id)
        .order_by(Booking.created_at.desc())
        .all()
    )