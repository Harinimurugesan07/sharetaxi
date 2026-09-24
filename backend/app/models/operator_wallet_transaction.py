from decimal import Decimal

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class OperatorWalletTransaction(db.Model, TimestampMixin):
    __tablename__ = "operator_wallet_transactions"

    id = db.Column(db.Integer, primary_key=True)

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    wallet_id = db.Column(
        db.Integer,
        db.ForeignKey("operator_wallets.id"),
        nullable=False,
        index=True,
    )

    operator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    transaction_type = db.Column(
        db.String(30),
        nullable=False,
        index=True,
    )

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    balance_after = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    reference = db.Column(
        db.String(120),
        nullable=True,
    )

    description = db.Column(
        db.String(500),
        nullable=True,
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="completed",
        index=True,
    )

    wallet = db.relationship(
        "OperatorWallet",
        backref=db.backref(
            "transactions",
            lazy="dynamic",
        ),
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
    )

    def to_dict(self):
        return {
            "id": self.public_id,
            "wallet_id": (
                self.wallet.public_id
                if self.wallet
                else None
            ),
            "operator_id": (
                self.operator.public_id
                if self.operator
                else None
            ),
            "transaction_type": self.transaction_type,
            "amount": float(
                self.amount or Decimal("0.00")
            ),
            "balance_after": float(
                self.balance_after or Decimal("0.00")
            ),
            "reference": self.reference,
            "description": self.description,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }