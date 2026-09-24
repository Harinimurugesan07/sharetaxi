from decimal import Decimal

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class OperatorWallet(db.Model, TimestampMixin):
    __tablename__ = "operator_wallets"

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
        unique=True,
        nullable=False,
        index=True,
    )

    available_balance = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    total_earned = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    total_withdrawn = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
        backref=db.backref(
            "wallet",
            uselist=False,
        ),
    )

    def to_dict(self):
        return {
            "id": self.public_id,
            "operator_id": (
                self.operator.public_id
                if self.operator
                else None
            ),
            "available_balance": float(
                self.available_balance or 0
            ),
            "total_earned": float(
                self.total_earned or 0
            ),
            "total_withdrawn": float(
                self.total_withdrawn or 0
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }