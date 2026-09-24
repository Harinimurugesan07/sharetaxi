from datetime import datetime
import re

from app.extensions import db

from app.models.booking import Booking
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.payment import Payment
from app.models.operator_settlement import OperatorSettlement
from app.models.operator_settlement_transaction import (
    OperatorSettlementTransaction,
)
from app.models.driver_wallet import DriverWallet
from app.models.driver_wallet_transaction import DriverWalletTransaction
from app.models.driver_payout_request import DriverPayoutRequest

from app.utils.constants import DriverAvailability, DriverStatus
from app.utils.validators import is_valid_license_number


class DriverServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_driver_by_user_id(user_id):
    driver = Driver.query.filter_by(user_id=user_id).first()

    if not driver:
        raise DriverServiceError(
            "Driver profile not found",
            404,
        )

    return driver


def update_address(user_id, data):
    driver = get_driver_by_user_id(user_id)

    address_fields = [
        "address",
        "city",
        "state",
        "postal_code",
        "country",
    ]

    missing = [
        field
        for field in address_fields
        if not str(data.get(field, "")).strip()
    ]

    if missing:
        raise DriverServiceError(
            f"Missing required fields: {', '.join(missing)}",
            422,
        )

    if (
        "license_number" in data
        and str(data.get("license_number", "")).strip()
    ):
        license_number = str(
            data["license_number"]
        ).strip()

        if not is_valid_license_number(license_number):
            raise DriverServiceError(
                "License number must be in DL-XXXXXXXXXXXX format",
                422,
            )

        if Driver.query.filter(
            Driver.license_number == license_number,
            Driver.id != driver.id,
        ).first():
            raise DriverServiceError(
                "This license number is already registered",
                409,
            )

        driver.license_number = license_number

    if (
        "license_expiry" in data
        and data.get("license_expiry") is not None
    ):
        try:
            driver.license_expiry = datetime.fromisoformat(
                str(data["license_expiry"]).replace(
                    "Z",
                    "+00:00",
                )
            ).date()
        except ValueError as exc:
            raise DriverServiceError(
                "Please provide a valid license expiry date",
                422,
            ) from exc

    if (
        "license_photo_url" in data
        and data.get("license_photo_url") is not None
    ):
        driver.license_photo_url = (
            str(data["license_photo_url"]).strip()
            or None
        )

    for field in address_fields:
        setattr(
            driver,
            field,
            data[field].strip(),
        )

    db.session.commit()

    return driver


def update_payout_method(user_id, data):
    driver = get_driver_by_user_id(user_id)

    # ========================================================
    # PAYOUT METHOD
    # ========================================================

    payout_method = str(
        data.get("payout_method", "bank")
    ).strip().lower()

    if payout_method != "bank":
        raise DriverServiceError(
            "Only bank payout method is currently supported",
            422,
        )

    # ========================================================
    # BASIC FIELDS
    # ========================================================

    account_holder_name = str(
        data.get(
            "bank_account_holder_name",
            "",
        )
    ).strip()

    bank_name = str(
        data.get(
            "bank_name",
            "",
        )
    ).strip()

    account_number = str(
        data.get(
            "bank_account_number",
            "",
        )
    ).strip()

    ifsc_code = str(
        data.get(
            "bank_ifsc_code",
            "",
        )
    ).strip().upper()

    missing = []

    if not account_holder_name:
        missing.append(
            "bank_account_holder_name"
        )

    if not bank_name:
        missing.append(
            "bank_name"
        )

    if not account_number:
        missing.append(
            "bank_account_number"
        )

    if not ifsc_code:
        missing.append(
            "bank_ifsc_code"
        )

    if missing:
        raise DriverServiceError(
            f"Missing required fields: {', '.join(missing)}",
            422,
        )

    # ========================================================
    # ACCOUNT HOLDER NAME VALIDATION
    # ========================================================

    if len(account_holder_name) > 150:
        raise DriverServiceError(
            "Account holder name is too long",
            422,
        )

    if not re.fullmatch(
        r"[A-Za-z .'-]+",
        account_holder_name,
    ):
        raise DriverServiceError(
            "Account holder name contains invalid characters",
            422,
        )

    # ========================================================
    # BANK NAME VALIDATION
    # ========================================================

    if len(bank_name) > 150:
        raise DriverServiceError(
            "Bank name is too long",
            422,
        )

    # ========================================================
    # BANK ACCOUNT NUMBER VALIDATION
    # ========================================================

    if not account_number.isdigit():
        raise DriverServiceError(
            "Bank account number must contain only digits",
            422,
        )

    if len(account_number) < 9 or len(account_number) > 18:
        raise DriverServiceError(
            "Please provide a valid bank account number",
            422,
        )

    # ========================================================
    # IFSC VALIDATION
    #
    # Standard Indian IFSC format:
    # 4 letters + 0 + 6 alphanumeric characters
    # Example: SBIN0001234
    # ========================================================

    if not re.fullmatch(
        r"[A-Z]{4}0[A-Z0-9]{6}",
        ifsc_code,
    ):
        raise DriverServiceError(
            "Please provide a valid 11-character IFSC code",
            422,
        )

    # ========================================================
    # SAVE PAYOUT DETAILS
    # ========================================================

    driver.payout_method = payout_method

    driver.bank_account_holder_name = (
        account_holder_name
    )

    driver.bank_name = bank_name

    driver.bank_account_number = (
        account_number
    )

    driver.bank_ifsc_code = (
        ifsc_code
    )

    db.session.commit()

    return driver


def set_availability(user_id, new_status):
    if new_status not in (
        DriverAvailability.ONLINE,
        DriverAvailability.OFFLINE,
    ):
        raise DriverServiceError(
            "Availability must be 'online' or 'offline'",
            422,
        )

    driver = get_driver_by_user_id(user_id)

    if driver.verification_status != DriverStatus.VERIFIED:
        raise DriverServiceError(
            "Your account must be verified by an admin before going online",
            403,
        )

    if (
        driver.availability == DriverAvailability.ON_TRIP
        and new_status == DriverAvailability.OFFLINE
    ):
        raise DriverServiceError(
            "Cannot go offline while on an active trip",
            409,
        )

    driver.availability = new_status

    db.session.commit()

    return driver


def list_ride_requests(user_id):
    driver = get_driver_by_user_id(user_id)

    return (
        Booking.query
        .join(
            Trip,
            Booking.trip_id == Trip.id,
        )
        .filter(
            Trip.driver_id == driver.id
        )
        .order_by(
            Booking.created_at.desc()
        )
        .all()
    )


def get_earnings(user_id):
    driver = get_driver_by_user_id(user_id)

    if driver.operator_id is None:
        wallet = DriverWallet.query.filter_by(driver_id=driver.id).first()
        transactions = DriverWalletTransaction.query.filter_by(
            driver_id=driver.id,
        ).order_by(DriverWalletTransaction.created_at.desc()).all()
        payouts = DriverPayoutRequest.query.filter_by(
            driver_id=driver.id,
        ).order_by(DriverPayoutRequest.created_at.desc()).all()
        return {
            "driver_type": "freelance",
            "summary": {
                "total_earnings": float(wallet.total_earned if wallet else 0),
                "pending_settlement": float(
                    sum(
                        (payout.amount or 0)
                        for payout in payouts
                        if payout.status in ("pending", "approved", "processing")
                    )
                ),
                "settled_amount": float(
                    sum(
                        (payout.amount or 0)
                        for payout in payouts
                        if payout.status == "paid"
                    )
                ),
                "total_commission": float(
                    sum(
                        (payment.admin_amount or 0)
                        for payment in Payment.query.join(
                            Trip, Payment.trip_id == Trip.id
                        ).filter(
                            Trip.driver_id == driver.id,
                            Payment.status == "paid",
                        ).all()
                    )
                ),
            },
            "records": [],
            "transactions": [transaction.to_dict() for transaction in transactions],
            "payouts": [payout.to_dict() for payout in payouts],
        }

    records = (
        OperatorSettlement.query
        .filter_by(driver_id=driver.id)
        .order_by(
            OperatorSettlement.created_at.desc()
        )
        .all()
    )

    transactions = (
        OperatorSettlementTransaction.query
        .filter_by(driver_id=driver.id)
        .order_by(
            OperatorSettlementTransaction.processed_at.desc()
        )
        .all()
    )

    return {
        "driver_type": "operator",

        "operator_id": (
            driver.operator.public_id
            if driver.operator
            else None
        ),

        "operator_name": (
            driver.operator.full_name
            if driver.operator
            else None
        ),

        "summary": {
            "total_earnings": float(
                sum(
                    (
                        record.driver_earnings or 0
                    )
                    for record in records
                )
            ),

            "pending_settlement": float(
                sum(
                    (
                        record.driver_earnings or 0
                    )
                    for record in records
                    if record.status == "pending"
                )
            ),

            "settled_amount": float(
                sum(
                    (
                        transaction.amount or 0
                    )
                    for transaction in transactions
                    if transaction.status == "processed"
                )
            ),
            "total_commission": float(
                sum(
                    (record.ride_revenue or 0)
                    - (record.driver_earnings or 0)
                    - (record.operator_share or 0)
                    for record in records
                )
            ),
        },

        "records": [
            record.to_dict()
            for record in records
        ],

        "transactions": [
            transaction.to_dict()
            for transaction in transactions
        ],
        "payouts": [],
    }


def list_available_drivers(
    city=None,
    limit=20,
    offset=0,
):
    """
    Public listing of online, verified drivers,
    optionally filtered by city.

    Returns (drivers, total_count).
    """

    limit = max(
        1,
        min(
            int(limit or 20),
            50,
        ),
    )

    offset = max(
        0,
        int(offset or 0),
    )

    query = Driver.query.filter_by(
        availability=DriverAvailability.ONLINE,
        verification_status=DriverStatus.VERIFIED,
    )

    if city:
        query = query.filter(
            Driver.city.ilike(
                f"%{city.strip()}%"
            )
        )

    query = query.order_by(
        Driver.average_rating.desc(),
        Driver.total_trips.desc(),
    )

    total = query.count()

    drivers = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    return drivers, total