from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class OperatorSettlement(db.Model, TimestampMixin):
    """Settlement amount owed by an operator for one completed operator trip."""
    __tablename__ = "operator_settlements"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    operator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=False, index=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, unique=True, index=True)
    ride_revenue = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    driver_earnings = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    operator_share = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    settled_at = db.Column(db.DateTime, nullable=True)

    operator = db.relationship("User", foreign_keys=[operator_id])
    driver = db.relationship("Driver", foreign_keys=[driver_id])
    trip = db.relationship("Trip", foreign_keys=[trip_id])

    def to_dict(self):
        return {
            "id": self.public_id,
            "operator_id": self.operator.public_id if self.operator else None,
            "operator_name": self.operator.full_name if self.operator else None,
            "driver_id": self.driver.public_id if self.driver else None,
            "driver_name": self.driver.user.full_name if self.driver and self.driver.user else None,
            "trip_id": self.trip.public_id if self.trip else None,
            "route": (
                f"{self.trip.origin_name} -> {self.trip.destination_name}"
                if self.trip else None
            ),
            "amount": float(self.driver_earnings),
            "ride_revenue": float(self.ride_revenue),
            "driver_earnings": float(self.driver_earnings),
            "operator_share": float(self.operator_share),
            "status": self.status,
            "settled_at": self.settled_at.isoformat() if self.settled_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "transactions": [transaction.to_dict() for transaction in self.transactions.order_by("processed_at").all()],
        }