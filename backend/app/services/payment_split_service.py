from decimal import Decimal, InvalidOperation

from app.extensions import db
from app.models.payment_split_setting import PaymentSplitSetting


class PaymentSplitServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_active_settings():
    settings = (
        PaymentSplitSetting.query
        .filter_by(is_active=True)
        .first()
    )

    if settings:
        return settings

    settings = PaymentSplitSetting(
        freelance_admin_rate=Decimal("0.10"),
        operator_admin_rate=Decimal("0.10"),
        operator_share_rate=Decimal("0.10"),
        is_active=True,
    )

    db.session.add(settings)
    db.session.commit()

    return settings


def validate_rate(value, field_name):
    try:
        rate = Decimal(str(value))
    except (TypeError, ValueError, InvalidOperation):
        raise PaymentSplitServiceError(
            f"{field_name} must be a valid percentage",
            422,
        )

    if rate < Decimal("0") or rate > Decimal("1"):
        raise PaymentSplitServiceError(
            f"{field_name} must be between 0% and 100%",
            422,
        )

    return rate


def validate_split_rates(
    freelance_admin_rate,
    operator_admin_rate,
    operator_share_rate,
):
    freelance_admin_rate = validate_rate(
        freelance_admin_rate,
        "Freelance admin rate",
    )

    operator_admin_rate = validate_rate(
        operator_admin_rate,
        "Operator admin rate",
    )

    operator_share_rate = validate_rate(
        operator_share_rate,
        "Operator share rate",
    )

    if (
        operator_admin_rate + operator_share_rate
        > Decimal("1")
    ):
        raise PaymentSplitServiceError(
            "Operator admin rate and operator share rate cannot exceed 100%",
            422,
        )

    return (
        freelance_admin_rate,
        operator_admin_rate,
        operator_share_rate,
    )


def update_settings(
    freelance_admin_rate,
    operator_admin_rate,
    operator_share_rate,
):
    (
        freelance_admin_rate,
        operator_admin_rate,
        operator_share_rate,
    ) = validate_split_rates(
        freelance_admin_rate,
        operator_admin_rate,
        operator_share_rate,
    )

    settings = get_active_settings()

    settings.freelance_admin_rate = freelance_admin_rate
    settings.operator_admin_rate = operator_admin_rate
    settings.operator_share_rate = operator_share_rate

    db.session.commit()

    return settings