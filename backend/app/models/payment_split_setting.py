from decimal import Decimal

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class PaymentSplitSetting(db.Model, TimestampMixin):
    __tablename__ = "payment_split_settings"

    id = db.Column(db.Integer, primary_key=True)

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    freelance_admin_rate = db.Column(
        db.Numeric(5, 4),
        nullable=False,
        default=Decimal("0.10"),
    )

    operator_admin_rate = db.Column(
        db.Numeric(5, 4),
        nullable=False,
        default=Decimal("0.10"),
    )

    operator_share_rate = db.Column(
        db.Numeric(5, 4),
        nullable=False,
        default=Decimal("0.10"),
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    def to_dict(self):
        return {
            "id": self.public_id,
            "freelance_admin_rate": float(
                self.freelance_admin_rate or 0
            ),
            "freelance_driver_rate": float(
                Decimal("1.00")
                - Decimal(str(self.freelance_admin_rate or 0))
            ),
            "operator_admin_rate": float(
                self.operator_admin_rate or 0
            ),
            "operator_share_rate": float(
                self.operator_share_rate or 0
            ),
            "operator_driver_rate": float(
                Decimal("1.00")
                - Decimal(str(self.operator_admin_rate or 0))
                - Decimal(str(self.operator_share_rate or 0))
            ),
            "is_active": self.is_active,
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