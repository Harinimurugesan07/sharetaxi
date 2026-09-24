from datetime import datetime

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class VehicleExpense(db.Model, TimestampMixin):
    """Expense recorded against a vehicle operated by an operator."""

    __tablename__ = "vehicle_expenses"

    id = db.Column(db.Integer, primary_key=True)

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    operator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    driver_id = db.Column(
        db.Integer,
        db.ForeignKey("drivers.id"),
        nullable=False,
        index=True,
    )

    vehicle_id = db.Column(
        db.Integer,
        db.ForeignKey("vehicles.id"),
        nullable=False,
        index=True,
    )

    expense_type = db.Column(
        db.String(30),
        nullable=False,
        index=True,
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
    )

    expense_date = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    description = db.Column(
        db.String(500),
        nullable=True,
    )

    receipt_url = db.Column(
        db.String(500),
        nullable=True,
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="approved",
        index=True,
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
    )

    driver = db.relationship(
        "Driver",
        foreign_keys=[driver_id],
    )

    vehicle = db.relationship(
        "Vehicle",
        foreign_keys=[vehicle_id],
    )

    def to_dict(self):
        return {
            "id": self.public_id,

            "operator_id": (
                self.operator.public_id
                if self.operator
                else None
            ),

            "operator_name": (
                self.operator.full_name
                if self.operator
                else None
            ),

            "driver_id": (
                self.driver.public_id
                if self.driver
                else None
            ),

            "driver_name": (
                self.driver.user.full_name
                if self.driver and self.driver.user
                else None
            ),

            "vehicle_id": (
                self.vehicle.public_id
                if self.vehicle
                else None
            ),

            "registration_number": (
                self.vehicle.registration_number
                if self.vehicle
                else None
            ),

            "expense_type": self.expense_type,

            "amount": float(self.amount),

            "expense_date": (
                self.expense_date.isoformat()
                if self.expense_date
                else None
            ),

            "description": self.description,

            "receipt_url": self.receipt_url,

            "status": self.status,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }