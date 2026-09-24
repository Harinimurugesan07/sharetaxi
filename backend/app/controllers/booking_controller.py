from flask import request, current_app
from flask_jwt_extended import get_jwt_identity
from app.middleware.auth_middleware import role_required
from app.services import booking_service
from app.services.booking_service import BookingServiceError
from app.utils.response import success_response, error_response
from app.utils.constants import UserRole


@role_required(UserRole.PASSENGER)
def create_booking():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    trip_id = data.get("trip_id")
    seats = data.get("seats", 1)
    if not trip_id:
        return error_response("trip_id is required", 422)

    try:
        booking, order = booking_service.create_booking_with_order(int(user_id), trip_id, int(seats))
    except BookingServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response({
        "booking_id": booking.public_id,
        "razorpay_order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "razorpay_key_id": current_app.config["RAZORPAY_KEY_ID"],
    }, message="Booking created, proceed to payment", status_code=201)


@role_required(UserRole.PASSENGER)
def verify_payment():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    required = ["booking_id", "razorpay_payment_id", "razorpay_order_id", "razorpay_signature"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 422)

    try:
        booking = booking_service.verify_and_confirm_payment(
            int(user_id), data["booking_id"], data["razorpay_payment_id"],
            data["razorpay_order_id"], data["razorpay_signature"],
        )
    except BookingServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(booking.to_dict(), message="Payment verified, booking confirmed")


@role_required(UserRole.PASSENGER)
def list_my_bookings():
    user_id = get_jwt_identity()
    try:
        bookings = booking_service.get_passenger_bookings(int(user_id))
    except BookingServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response([booking.to_dict() for booking in bookings])