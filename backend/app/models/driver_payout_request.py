from decimal import Decimal

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class DriverPayoutRequest(db.Model, TimestampMixin):
    __tablename__ = "driver_payout_requests"

    id = db.Column(db.Integer, primary_key=True)

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    driver_id = db.Column(
        db.Integer,
        db.ForeignKey("drivers.id"),
        nullable=False,
        index=True,
    )

    # Snapshot of the operator who should handle this payout.
    # NULL = freelance driver payout -> Admin handles it.
    operator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    # Bank details are snapshotted at request time.
    bank_account_holder_name = db.Column(
        db.String(150),
        nullable=False,
    )

    bank_name = db.Column(
        db.String(150),
        nullable=False,
    )

    bank_account_number = db.Column(
        db.String(50),
        nullable=False,
    )

    bank_ifsc_code = db.Column(
        db.String(20),
        nullable=False,
    )

    # RazorpayX payout reference.
    razorpay_payout_id = db.Column(
        db.String(100),
        nullable=True,
        unique=True,
        index=True,
    )

    # Error/details returned during payout processing.
    payout_error = db.Column(
        db.String(1000),
        nullable=True,
    )

    admin_note = db.Column(
        db.String(500),
        nullable=True,
    )

    operator_note = db.Column(
        db.String(500),
        nullable=True,
    )

    processed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    operator_processed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    driver = db.relationship(
        "Driver",
        foreign_keys=[driver_id],
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
    )

    def to_dict(self):
        return {
            "id": self.public_id,

            "driver_id": (
                self.driver.public_id
                if self.driver
                else None
            ),

            "driver_name": (
                self.driver.user.full_name
                if self.driver
                and self.driver.user
                else None
            ),

            "driver_type": (
                "operator"
                if self.operator_id is not None
                else "freelance"
            ),

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

            "amount": float(
                self.amount or Decimal("0.00")
            ),

            "status": self.status,

            "bank_account_holder_name": (
                self.bank_account_holder_name
            ),

            "bank_name": self.bank_name,

            "bank_account_number_masked": (
                f"********{self.bank_account_number[-4:]}"
                if self.bank_account_number
                and len(self.bank_account_number) >= 4
                else None
            ),

            "bank_ifsc_code": self.bank_ifsc_code,

            "razorpay_payout_id": (
                self.razorpay_payout_id
            ),

            "payout_error": self.payout_error,

            "admin_note": self.admin_note,

            "operator_note": self.operator_note,

            "processed_at": (
                self.processed_at.isoformat()
                if self.processed_at
                else None
            ),

            "operator_processed_at": (
                self.operator_processed_at.isoformat()
                if self.operator_processed_at
                else None
            ),

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }