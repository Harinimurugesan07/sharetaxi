from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class Location(db.Model, TimestampMixin):
    """
    A reusable point on the map — used both as a free-text/lat-lng result from
    location search (autocomplete) and as the origin/destination/stop points
    referenced by trips. Not every location needs to be reused; passengers can
    also just pass raw lat/lng for their search without creating a row here.
    """
    __tablename__ = "locations"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)

    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=True, index=True)

    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.public_id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }