import uuid
from datetime import datetime

from app.extensions import db
from .blog import Blog, slugify



class TimestampMixin:
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


def gen_uuid():
    return str(uuid.uuid4())


# Import models after TimestampMixin and gen_uuid are defined
from .vehicle_expense import VehicleExpense
from .driver_wallet import DriverWallet
from .driver_wallet_transaction import DriverWalletTransaction
from app.models.driver_payout_request import DriverPayoutRequest
from .operator_wallet_transaction import OperatorWalletTransaction
from .operator_wallet import OperatorWallet
from .payment import Payment
from .payment_split_setting import PaymentSplitSetting


__all__ = [
    "Blog",
    "slugify",
    "TimestampMixin",
    "gen_uuid",
    "VehicleExpense",
    "DriverWallet",
    "DriverWalletTransaction",
    "OperatorWallet",
    "Payment",
    "OperatorWalletTransaction",
    "DriverPayoutRequest",
    "PaymentSplitSetting",
]