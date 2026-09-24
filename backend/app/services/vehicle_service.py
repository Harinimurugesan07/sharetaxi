from app.extensions import db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.utils.constants import VehicleType
from app.utils.validators import is_valid_registration_number


class VehicleServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def add_vehicle(user_id, data):
    driver = Driver.query.filter_by(user_id=user_id).first()
    if not driver:
        raise VehicleServiceError("Driver profile not found", 404)

    if data.get("vehicle_type") not in VehicleType.ALL:
        raise VehicleServiceError(f"vehicle_type must be one of {VehicleType.ALL}", 422)

    registration_number = data["registration_number"].strip().upper()
    if not is_valid_registration_number(registration_number):
        raise VehicleServiceError("Registration number must be in TN 09 AB 1234 format", 422)

    if Vehicle.query.filter_by(registration_number=registration_number.replace(" ", "")).first():
        raise VehicleServiceError("A vehicle with this registration number already exists", 409)

    try:
        total_seats = int(data["total_seats"])
        if total_seats < 1 or total_seats > 60:
            raise ValueError
    except (KeyError, ValueError, TypeError):
        raise VehicleServiceError("total_seats must be a valid number between 1 and 60", 422)

    vehicle = Vehicle(
        driver_id=driver.id,
        registration_number=registration_number.replace(" ", ""),
        vehicle_type=data["vehicle_type"],
        make=data["make"].strip(),
        model=data["model"].strip(),
        year=data.get("year"),
        color=data.get("color"),
        total_seats=total_seats,
    )
    db.session.add(vehicle)
    db.session.commit()
    return vehicle


def list_my_vehicles(user_id):
    driver = Driver.query.filter_by(user_id=user_id).first()
    if not driver:
        raise VehicleServiceError("Driver profile not found", 404)
    return driver.vehicles.all()
