from datetime import datetime
from app.extensions import db
from app.models.trip import Trip
from app.models.trip_stop import TripStop
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.utils.constants import DriverStatus, StopType, TripStatus


class TripServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def create_trip(user_id, data):
    driver = Driver.query.filter_by(user_id=user_id).first()
    if not driver:
        raise TripServiceError("Driver profile not found", 404)

    if driver.verification_status != DriverStatus.VERIFIED:
        raise TripServiceError("Your account must be verified before creating trips", 403)

    vehicle = Vehicle.query.filter_by(
        public_id=data.get("vehicle_id"), driver_id=driver.id
    ).first()
    if not vehicle:
        raise TripServiceError("Vehicle not found for this driver", 404)

    try:
        departure_time = datetime.fromisoformat(data["departure_time"])
    except (KeyError, ValueError):
        raise TripServiceError(
            "departure_time must be a valid ISO 8601 datetime, e.g. 2026-09-10T08:30:00", 422
        )

    try:
        available_seats = int(data["available_seats"])
        if available_seats < 1 or available_seats > vehicle.total_seats:
            raise ValueError
    except (KeyError, ValueError, TypeError):
        raise TripServiceError(
            f"available_seats must be between 1 and {vehicle.total_seats} for this vehicle", 422
        )

    try:
        fare_per_seat = float(data["fare_per_seat"])
        if fare_per_seat <= 0:
            raise ValueError
    except (KeyError, ValueError, TypeError):
        raise TripServiceError("fare_per_seat must be a positive number", 422)

    trip = Trip(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        origin_name=data["origin_name"],
        origin_lat=float(data["origin_lat"]),
        origin_lng=float(data["origin_lng"]),
        destination_name=data["destination_name"],
        destination_lat=float(data["destination_lat"]),
        destination_lng=float(data["destination_lng"]),
        departure_time=departure_time,
        total_seats=vehicle.total_seats,
        available_seats=available_seats,
        fare_per_seat=fare_per_seat,
    )
    db.session.add(trip)
    db.session.flush()  # assign trip.id before attaching stops

    for i, stop_data in enumerate(data.get("stops", [])):
        if stop_data.get("stop_type") not in StopType.ALL:
            db.session.rollback()
            raise TripServiceError(f"stop_type must be one of {StopType.ALL}", 422)
        db.session.add(
            TripStop(
                trip_id=trip.id,
                name=stop_data["name"],
                latitude=float(stop_data["latitude"]),
                longitude=float(stop_data["longitude"]),
                stop_type=stop_data["stop_type"],
                sequence_order=i,
            )
        )

    db.session.commit()
    return trip


def get_driver_trips(user_id):
    driver = Driver.query.filter_by(user_id=user_id).first()
    if not driver:
        raise TripServiceError("Driver profile not found", 404)
    return driver.trips.order_by(Trip.departure_time.desc()).all()


def get_available_trips():
    return (
        Trip.query
        .filter(
            Trip.status == TripStatus.SCHEDULED,
            Trip.available_seats > 0,
            Trip.departure_time >= datetime.utcnow(),
        )
        .order_by(Trip.departure_time.asc())
        .all()
    )