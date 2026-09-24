from datetime import datetime
from app.extensions import db
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import BookingStatus


class Booking(db.Model, TimestampMixin):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)

    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, index=True)
    passenger_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, index=True)

    seats_booked = db.Column(db.Integer, nullable=False, default=1)
    fare_total = db.Column(db.Numeric(8, 2), nullable=False)

    status = db.Column(
        db.Enum(*BookingStatus.ALL, name="booking_status"),
        default=BookingStatus.PENDING_PAYMENT,
        nullable=False,
        index=True,
    )

    razorpay_order_id = db.Column(db.String(64), nullable=True)
    razorpay_payment_id = db.Column(db.String(64), nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)

    trip = db.relationship("Trip", backref=db.backref("bookings", lazy="dynamic"))
    passenger = db.relationship("Customer", backref=db.backref("bookings", lazy="dynamic"))

    def to_dict(self):
        customer = self.passenger
        user = customer.user if customer else None

        return {
            "id": self.public_id,
            "trip": self.trip.to_dict() if self.trip else None,
            "passenger": {
                "id": customer.public_id if customer else None,
                "name": user.full_name if user else None,
                "email": user.email if user else None,
                "phone": user.phone if user else None,
            },
            "seats_booked": self.seats_booked,
            "fare_total": float(self.fare_total),
            "status": self.status,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }