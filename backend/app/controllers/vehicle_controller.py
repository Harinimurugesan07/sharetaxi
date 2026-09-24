from flask import request
from flask_jwt_extended import get_jwt_identity
from app.middleware.auth_middleware import role_required, verified_subscribed_required
from app.services import vehicle_service
from app.services.vehicle_service import VehicleServiceError
from app.utils.response import success_response, error_response
from app.utils.validators import validate_required_fields
from app.utils.constants import UserRole


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def add_vehicle():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    missing = validate_required_fields(
        data, ["registration_number", "vehicle_type", "make", "model", "total_seats"]
    )
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 422)

    try:
        vehicle = vehicle_service.add_vehicle(int(user_id), data)
    except VehicleServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(vehicle.to_dict(), message="Vehicle added", status_code=201)


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def list_my_vehicles():
    user_id = get_jwt_identity()
    try:
        vehicles = vehicle_service.list_my_vehicles(int(user_id))
    except VehicleServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response([v.to_dict() for v in vehicles])
