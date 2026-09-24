from datetime import datetime
from decimal import Decimal

from flask import current_app

from app.extensions import db, socketio
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.trip_status_history import TripStatusHistory
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.operator_settlement import OperatorSettlement
from app.services import (
    driver_wallet_service,
    operator_wallet_service,
)
from app.services.notification_service import NotificationService
from app.utils.constants import (
    BookingStatus,
    DriverAvailability,
    TripStatus,
)


class TripStatusServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


_ALLOWED_TRANSITIONS = {
    TripStatus.SCHEDULED: {
        TripStatus.ONGOING,
        TripStatus.CANCELLED,
    },
    TripStatus.ONGOING: {
        TripStatus.COMPLETED,
        TripStatus.CANCELLED,
    },
    TripStatus.COMPLETED: set(),
    TripStatus.CANCELLED: set(),
}


def update_trip_status(
    user_id,
    trip_public_id,
    new_status,
    reason=None,
):
    if new_status not in TripStatus.ALL:
        raise TripStatusServiceError(
            f"status must be one of {TripStatus.ALL}",
            422,
        )

    trip = Trip.query.filter_by(
        public_id=trip_public_id
    ).first()

    if not trip:
        raise TripStatusServiceError(
            "Trip not found",
            404,
        )

    driver = Driver.query.filter_by(
        id=trip.driver_id,
        user_id=user_id,
    ).first()

    if not driver:
        raise TripStatusServiceError(
            "Only the trip-owning driver can update this trip",
            403,
        )

    if new_status not in _ALLOWED_TRANSITIONS[trip.status]:
        raise TripStatusServiceError(
            f"Cannot change trip status from "
            f"'{trip.status}' to '{new_status}'",
            409,
        )

    old_status = trip.status
    changed_at = datetime.utcnow()

    trip.status = new_status

    if new_status == TripStatus.ONGOING:
        trip.started_at = changed_at
        driver.availability = DriverAvailability.ON_TRIP

    elif new_status == TripStatus.COMPLETED:
        trip.completed_at = changed_at

        if driver.availability == DriverAvailability.ON_TRIP:
            driver.availability = DriverAvailability.ONLINE

    elif new_status == TripStatus.CANCELLED:
        trip.cancelled_at = changed_at

        if driver.availability == DriverAvailability.ON_TRIP:
            driver.availability = DriverAvailability.ONLINE

    history = TripStatusHistory(
        trip=trip,
        changed_by_user_id=user_id,
        old_status=old_status,
        new_status=new_status,
        changed_at=changed_at,
        reason=reason,
    )

    db.session.add(history)

    # ---------------------------------------------------------
    # FINANCIAL PROCESSING WHEN TRIP IS COMPLETED
    # ---------------------------------------------------------

    if new_status == TripStatus.COMPLETED:

        # -----------------------------------------------------
        # GET SUCCESSFUL PAYMENT RECORDS
        # -----------------------------------------------------

        payments = (
            Payment.query
            .filter_by(
                trip_id=trip.id,
                status="paid",
            )
            .all()
        )

        ride_revenue = sum(
            (
                payment.gross_amount
                or Decimal("0")
            )
            for payment in payments
        )

        driver_payment_amount = sum(
            (
                payment.driver_amount
                or Decimal("0")
            )
            for payment in payments
        )

        operator_payment_amount = sum(
            (
                payment.operator_amount
                or Decimal("0")
            )
            for payment in payments
        )

        # -----------------------------------------------------
        # OPERATOR DRIVER
        # -----------------------------------------------------

        if driver.operator_id is not None:

            existing_settlement = (
                OperatorSettlement.query
                .filter_by(
                    trip_id=trip.id
                )
                .first()
            )

            if not existing_settlement:

                db.session.add(
                    OperatorSettlement(
                        operator_id=driver.operator_id,
                        driver_id=driver.id,
                        trip_id=trip.id,
                        ride_revenue=ride_revenue,
                        driver_earnings=driver_payment_amount,
                        operator_share=operator_payment_amount,
                    )
                )
            if operator_payment_amount > 0:
                operator_wallet_service.add_earning(
                operator=driver.operator,
                amount=operator_payment_amount,
                reference=trip.public_id,
                description=(
                    f"Operator share for completed trip "
                    f"{trip.public_id}"
                ),
                commit=False,
            )

        # -----------------------------------------------------
        # FREELANCE / OWN DRIVER
        # -----------------------------------------------------

        else:

            if driver_payment_amount > 0:
                driver_wallet_service.add_earning(
                    driver=driver,
                    amount=driver_payment_amount,
                    reference=trip.public_id,
                    description=(
                        f"Earning for completed trip "
                        f"{trip.public_id}"
                    ),
                    commit=False,
                )

    # ---------------------------------------------------------
    # COMMIT TRIP STATUS + HISTORY + FINANCIAL TRANSACTION
    # TOGETHER AS ONE DATABASE TRANSACTION.
    # ---------------------------------------------------------

    db.session.commit()

    # ---------------------------------------------------------
    # SEND NOTIFICATIONS
    # ---------------------------------------------------------

    confirmed_bookings = (
        Booking.query
        .filter_by(
            trip_id=trip.id,
            status=BookingStatus.CONFIRMED,
        )
        .all()
    )

    for booking in confirmed_bookings:
        if (
            booking.passenger
            and booking.passenger.user
        ):
            NotificationService.send_to_user(
                booking.passenger.user_id,
                "Ride update",
                f"Your trip status is now {new_status}.",
                {
                    "type": "trip_status_updated",
                    "trip_id": trip.public_id,
                    "status": new_status,
                },
            )

    # ---------------------------------------------------------
    # SOCKET.IO PAYLOAD
    # ---------------------------------------------------------

    payload = {
        "trip_id": trip.public_id,
        "old_status": old_status,
        "new_status": new_status,
        "reason": reason,
        "changed_at": changed_at.isoformat(),
        "trip": trip.to_dict(
            include_stops=True
        ),
    }

    socketio.emit(
        "trip_status_updated",
        payload,
        room=f"trip:{trip.public_id}",
    )

    socketio.emit(
        "trip_status_updated",
        payload,
        room="operator_dashboard",
    )

    event_map = {
        TripStatus.ONGOING: "trip:started",
        TripStatus.COMPLETED: "trip:completed",
        TripStatus.CANCELLED: "trip:cancelled",
    }

    if new_status in event_map:
        socketio.emit(
            event_map[new_status],
            payload,
            room=f"trip:{trip.public_id}",
        )

    return trip