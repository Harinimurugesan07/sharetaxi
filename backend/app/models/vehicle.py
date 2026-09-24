from app.extensions import db
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import VehicleType


class Vehicle(db.Model, TimestampMixin):
    __tablename__ = "vehicles"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=False, index=True)

    registration_number = db.Column(db.String(20), unique=True, nullable=False)
    vehicle_type = db.Column(db.Enum(*VehicleType.ALL, name="vehicle_type"), nullable=False)
    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=True)
    color = db.Column(db.String(30), nullable=True)

    total_seats = db.Column(db.Integer, nullable=False)
    rc_document_url = db.Column(db.String(500), nullable=True)
    insurance_document_url = db.Column(db.String(500), nullable=True)
    insurance_expiry = db.Column(db.Date, nullable=True)

    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.public_id,
            "registration_number": self.registration_number,
            "vehicle_type": self.vehicle_type,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "color": self.color,
            "total_seats": self.total_seats,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
        }
