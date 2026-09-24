from datetime import datetime
from app.extensions import db
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import TripStatus


class Trip(db.Model, TimestampMixin):
    """A shared-taxi trip a driver creates, with an origin, destination, and stops."""
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)

    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=False, index=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)

    origin_name = db.Column(db.String(200), nullable=False)
    origin_lat = db.Column(db.Float, nullable=False)
    origin_lng = db.Column(db.Float, nullable=False)

    destination_name = db.Column(db.String(200), nullable=False)
    destination_lat = db.Column(db.Float, nullable=False)
    destination_lng = db.Column(db.Float, nullable=False)

    departure_time = db.Column(db.DateTime, nullable=False, index=True)
    estimated_arrival_time = db.Column(db.DateTime, nullable=True)

    total_seats = db.Column(db.Integer, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    fare_per_seat = db.Column(db.Numeric(8, 2), nullable=False)

    status = db.Column(
        db.Enum(*TripStatus.ALL, name="trip_status"),
        default=TripStatus.SCHEDULED,
        nullable=False,
        index=True,
    )

    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)

    driver = db.relationship("Driver", backref=db.backref("trips", lazy="dynamic"))
    vehicle = db.relationship("Vehicle")
    stops = db.relationship(
        "TripStop", backref="trip", lazy="joined",
        order_by="TripStop.sequence_order", cascade="all, delete-orphan"
    )
    status_history = db.relationship(
        "TripStatusHistory", backref="trip", lazy="dynamic",
        order_by="TripStatusHistory.changed_at.desc()", cascade="all, delete-orphan"
    )

    def to_dict(self, include_stops=False):
        data = {
            "id": self.public_id,
            "driver_id": self.driver.public_id if self.driver else None,
            "driver_name": self.driver.user.full_name if self.driver and self.driver.user else None,
            "operator_id": self.driver.operator.public_id if self.driver and self.driver.operator else None,
            "operator_name": self.driver.operator.full_name if self.driver and self.driver.operator else None,
            "driver_rating": float(self.driver.average_rating) if self.driver else None,
            "vehicle": self.vehicle.to_dict() if self.vehicle else None,
            "origin_name": self.origin_name,
            "origin_lat": self.origin_lat,
            "origin_lng": self.origin_lng,
            "destination_name": self.destination_name,
            "destination_lat": self.destination_lat,
            "destination_lng": self.destination_lng,
            "departure_time": self.departure_time.isoformat() if self.departure_time else None,
            "estimated_arrival_time": (
                self.estimated_arrival_time.isoformat() if self.estimated_arrival_time else None
            ),
            "total_seats": self.total_seats,
            "available_seats": self.available_seats,
            "fare_per_seat": float(self.fare_per_seat),
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
        }
        if include_stops:
            data["stops"] = [s.to_dict() for s in self.stops]
        return data