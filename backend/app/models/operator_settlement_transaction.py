from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class OperatorSettlementTransaction(db.Model, TimestampMixin):
    __tablename__ = "operator_settlement_transactions"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    settlement_id = db.Column(
        db.Integer,
        db.ForeignKey("operator_settlements.id"),
        nullable=False,
        unique=True,
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

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False,
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="processed",
        index=True,
    )

    processed_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    reference = db.Column(
        db.String(120),
        nullable=True,
    )

    settlement = db.relationship(
        "OperatorSettlement",
        backref=db.backref(
            "transactions",
            lazy="dynamic",
        ),
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
    )

    driver = db.relationship(
        "Driver",
        foreign_keys=[driver_id],
    )

    def to_dict(self):
        return {
            "id": self.public_id,
            "settlement_id": (
                self.settlement.public_id
                if self.settlement
                else None
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
            "amount": float(self.amount or 0),
            "status": self.status,
            "processed_at": (
                self.processed_at.isoformat()
                if self.processed_at
                else None
            ),
            "reference": self.reference,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }