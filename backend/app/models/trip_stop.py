from app.extensions import db
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import StopType


class TripStop(db.Model, TimestampMixin):
    """
    An ordered boarding or drop point along a trip's route, between its
    origin and destination. Passengers pick one boarding stop and one drop
    stop from these (or the origin/destination themselves) at booking time.
    """
    __tablename__ = "trip_stops"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, index=True)

    name = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    stop_type = db.Column(db.Enum(*StopType.ALL, name="stop_type"), nullable=False)
    sequence_order = db.Column(db.Integer, nullable=False)
    estimated_time = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.public_id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "stop_type": self.stop_type,
            "sequence_order": self.sequence_order,
            "estimated_time": self.estimated_time.isoformat() if self.estimated_time else None,
        }