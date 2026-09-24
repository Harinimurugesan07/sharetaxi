from flask import request
from flask_jwt_extended import get_jwt_identity
from app.middleware.auth_middleware import role_required, verified_subscribed_required
from app.services import trip_service
from app.services.trip_service import TripServiceError
from app.services import trip_status_service
from app.services.trip_status_service import TripStatusServiceError
from app.utils.response import success_response, error_response
from app.utils.validators import validate_required_fields
from app.utils.constants import UserRole
from flask_jwt_extended import jwt_required

@role_required(UserRole.DRIVER)
@verified_subscribed_required
def create_trip():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    required = [
        "vehicle_id", "origin_name", "origin_lat", "origin_lng",
        "destination_name", "destination_lat", "destination_lng",
        "departure_time", "available_seats", "fare_per_seat",
    ]
    missing = validate_required_fields(data, required)
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 422)

    try:
        trip = trip_service.create_trip(int(user_id), data)
    except TripServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        trip.to_dict(include_stops=True),
        message="Trip published successfully.",
        status_code=201,
    )


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def list_my_trips():
    user_id = get_jwt_identity()
    try:
        trips = trip_service.get_driver_trips(int(user_id))
    except TripServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response([t.to_dict() for t in trips])

@jwt_required()
def list_available_trips():
    try:
        trips = trip_service.get_available_trips()
    except TripServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response([t.to_dict(include_stops=True) for t in trips])


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def update_status(trip_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    if not data.get("status"):
        return error_response("status is required", 422)

    try:
        trip = trip_status_service.update_trip_status(
            int(user_id), trip_id, data["status"], data.get("reason")
        )
    except TripStatusServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(trip.to_dict(include_stops=True), message="Trip status updated")