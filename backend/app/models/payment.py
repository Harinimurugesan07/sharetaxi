from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class Payment(db.Model, TimestampMixin):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    booking_id = db.Column(
        db.Integer,
        db.ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    passenger_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False,
        index=True,
    )

    trip_id = db.Column(
        db.Integer,
        db.ForeignKey("trips.id"),
        nullable=False,
        index=True,
    )

    # Total amount paid by passenger
    gross_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0,
    )

    # Platform / Admin share
    admin_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0,
    )

    # Operator share
    operator_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0,
    )

    # Driver share
    driver_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0,
    )

    razorpay_order_id = db.Column(
        db.String(64),
        nullable=True,
        index=True,
    )

    razorpay_payment_id = db.Column(
        db.String(64),
        nullable=True,
        unique=True,
        index=True,
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="paid",
        index=True,
    )

    paid_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    booking = db.relationship(
        "Booking",
        backref=db.backref(
            "payment",
            uselist=False,
        ),
    )

    passenger = db.relationship(
        "Customer",
        foreign_keys=[passenger_id],
    )

    trip = db.relationship(
        "Trip",
        foreign_keys=[trip_id],
    )

    def to_dict(self):
        return {
            "id": self.public_id,
            "booking_id": (
                self.booking.public_id
                if self.booking
                else None
            ),
            "passenger_id": (
                self.passenger.public_id
                if self.passenger
                else None
            ),
            "trip_id": (
                self.trip.public_id
                if self.trip
                else None
            ),
            "gross_amount": float(self.gross_amount),
            "admin_amount": float(self.admin_amount),
            "operator_amount": float(self.operator_amount),
            "driver_amount": float(self.driver_amount),
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "status": self.status,
            "paid_at": (
                self.paid_at.isoformat()
                if self.paid_at
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }