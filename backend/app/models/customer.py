from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class Customer(db.Model, TimestampMixin):
    """Passenger-specific profile data, 1:1 with User (role='passenger')."""
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    gender = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    pincode = db.Column(db.String(20), nullable=True)

    emergency_contact_name = db.Column(db.String(120), nullable=True)
    emergency_contact_phone = db.Column(db.String(15), nullable=True)

    id_type = db.Column(db.String(50), nullable=True)
    id_number = db.Column(db.String(80), nullable=True)

    total_rides = db.Column(db.Integer, default=0, nullable=False)
    average_rating = db.Column(db.Numeric(2, 1), default=5.0, nullable=False)

    @staticmethod
    def _is_filled(value):
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        return True

    def profile_completion_percentage(self, user=None):
        user = user or self.user
        if user is None:
            return 0
        required_fields = [
            user.full_name,
            user.email,
            user.phone,
            self.gender,
            self.date_of_birth,
            self.address,
            self.city,
            self.state,
            self.pincode,
            self.emergency_contact_name,
            self.emergency_contact_phone,
            self.id_type,
            self.id_number,
        ]
        filled = sum(1 for value in required_fields if self._is_filled(value))
        total = len(required_fields)
        if total == 0:
            return 0
        return int(round((filled / total) * 100))

    def to_dict(self):
        summary = {
            "percentage": self.profile_completion_percentage(self.user),
            "completed": self.profile_completion_percentage(self.user),
            "total": 13,
        }
        if self.user:
            completed = 0
            required_fields = [
                self.user.full_name,
                self.user.email,
                self.user.phone,
                self.gender,
                self.date_of_birth,
                self.address,
                self.city,
                self.state,
                self.pincode,
                self.emergency_contact_name,
                self.emergency_contact_phone,
                self.id_type,
                self.id_number,
            ]
            completed = sum(1 for value in required_fields if self._is_filled(value))
            summary = {
                "percentage": int(round((completed / len(required_fields)) * 100)) if required_fields else 0,
                "completed": completed,
                "total": len(required_fields),
            }
        return {
            "id": self.public_id,
            "gender": self.gender,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "pincode": self.pincode,
            "emergency_contact_name": self.emergency_contact_name,
            "emergency_contact_phone": self.emergency_contact_phone,
            "id_type": self.id_type,
            "id_number": self.id_number,
            "total_rides": self.total_rides,
            "average_rating": float(self.average_rating) if self.average_rating is not None else None,
            "profile_completion_percentage": summary["percentage"],
            "profile_completion": summary,
        }
