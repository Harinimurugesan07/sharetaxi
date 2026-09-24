from decimal import Decimal, InvalidOperation

from app.extensions import db
from app.models.driver_wallet import DriverWallet
from app.models.driver_wallet_transaction import DriverWalletTransaction
from app.models.driver_payout_request import DriverPayoutRequest


class DriverWalletServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_or_create_wallet(driver, commit=True):
    """
    Get the driver's wallet.
    If the wallet does not exist, create it.
    """
    wallet = DriverWallet.query.filter_by(
        driver_id=driver.id
    ).first()

    if wallet:
        return wallet

    wallet = DriverWallet(
        driver_id=driver.id,
        available_balance=Decimal("0.00"),
        total_earned=Decimal("0.00"),
        total_withdrawn=Decimal("0.00"),
    )

    db.session.add(wallet)

    if commit:
        db.session.commit()
    else:
        db.session.flush()

    return wallet


def get_wallet(driver):
    """
    Return the driver's wallet.
    A wallet is automatically created if it does not exist.
    """
    return get_or_create_wallet(driver)


def add_earning(
    driver,
    amount,
    reference=None,
    description=None,
    commit=True,
):
    """
    Add an earning to a freelance driver's wallet.
    """

    if driver.operator_id is not None:
        raise DriverWalletServiceError(
            "Wallet earnings are only available for freelance drivers",
            409,
        )

    try:
        amount = Decimal(str(amount))
    except (TypeError, ValueError, InvalidOperation):
        raise DriverWalletServiceError(
            "Amount must be a valid number",
            422,
        )

    if amount <= 0:
        raise DriverWalletServiceError(
            "Amount must be greater than 0",
            422,
        )

    wallet = get_or_create_wallet(
        driver,
        commit=commit,
    )

    wallet.available_balance += amount
    wallet.total_earned += amount

    transaction = DriverWalletTransaction(
        wallet_id=wallet.id,
        driver_id=driver.id,
        transaction_type="RIDE_EARNING",
        amount=amount,
        balance_after=wallet.available_balance,
        reference=reference,
        description=description or "Ride earning",
        status="completed",
    )

    db.session.add(transaction)

    if commit:
        db.session.commit()

    return wallet, transaction


def request_payout(driver, amount):
    """
    Create a pending payout request.

    The requested amount is reserved immediately by reducing
    available_balance.

    total_earned is NOT changed.

    The driver's bank details are snapshotted into the payout
    request so that later changes to the driver's profile do not
    affect an already-created payout request.
    """

    try:
        amount = Decimal(str(amount))
    except (TypeError, ValueError, InvalidOperation):
        raise DriverWalletServiceError(
            "Amount must be a valid number",
            422,
        )

    amount = amount.quantize(Decimal("0.01"))

    if amount <= 0:
        raise DriverWalletServiceError(
            "Payout amount must be greater than 0",
            422,
        )

    # Bank payout details must be configured first.
    if driver.payout_method != "bank":
        raise DriverWalletServiceError(
            "Please configure your bank payout method first",
            422,
        )

    required_bank_fields = {
        "bank_account_holder_name": driver.bank_account_holder_name,
        "bank_name": driver.bank_name,
        "bank_account_number": driver.bank_account_number,
        "bank_ifsc_code": driver.bank_ifsc_code,
    }

    missing = [
        field
        for field, value in required_bank_fields.items()
        if not value
    ]

    if missing:
        raise DriverWalletServiceError(
            "Please complete your bank payout details first",
            422,
        )

    # Prevent multiple pending payout requests.
    existing_pending = (
        DriverPayoutRequest.query
        .filter_by(
            driver_id=driver.id,
            status="pending",
        )
        .first()
    )

    if existing_pending:
        raise DriverWalletServiceError(
            "You already have a pending payout request",
            409,
        )

    # Lock the wallet row while checking and reserving balance.
    wallet = (
        DriverWallet.query
        .filter_by(driver_id=driver.id)
        .with_for_update()
        .first()
    )

    if not wallet:
        raise DriverWalletServiceError(
            "Driver wallet not found",
            404,
        )

    available_balance = Decimal(
        str(wallet.available_balance or "0.00")
    )

    if amount > available_balance:
        raise DriverWalletServiceError(
            f"Insufficient wallet balance. "
            f"Available balance is ₹{available_balance:.2f}",
            422,
        )

    # Reserve the payout amount.
    wallet.available_balance -= amount

    payout_request = DriverPayoutRequest(
        driver_id=driver.id,
        amount=amount,
        status="pending",
        bank_account_holder_name=driver.bank_account_holder_name,
        bank_name=driver.bank_name,
        bank_account_number=driver.bank_account_number,
        bank_ifsc_code=driver.bank_ifsc_code,
    )

    db.session.add(payout_request)

    # Flush so payout_request.public_id is available
    # before creating the transaction reference.
    db.session.flush()

    # Record the payout reservation in wallet transaction history.
    transaction = DriverWalletTransaction(
        wallet_id=wallet.id,
        driver_id=driver.id,
        transaction_type="PAYOUT_REQUEST",
        amount=-amount,
        balance_after=wallet.available_balance,
        reference=payout_request.public_id,
        description="Payout requested",
        status="completed",
    )

    db.session.add(transaction)

    db.session.commit()

    return payout_request, wallet, transaction


def get_transactions(driver):
    """
    Return the driver's wallet transactions.
    """
    wallet = get_or_create_wallet(driver)

    return (
        DriverWalletTransaction.query
        .filter_by(driver_id=driver.id)
        .order_by(
            DriverWalletTransaction.created_at.desc()
        )
        .all()
    )