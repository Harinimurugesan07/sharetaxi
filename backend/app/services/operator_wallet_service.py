from datetime import datetime
from decimal import Decimal, InvalidOperation

from app.extensions import db
from app.models.operator_wallet import OperatorWallet
from app.models.operator_wallet_transaction import (
    OperatorWalletTransaction,
)
from app.models.driver_payout_request import DriverPayoutRequest


class OperatorWalletServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_or_create_wallet(operator, commit=True):
    wallet = OperatorWallet.query.filter_by(
        operator_id=operator.id
    ).first()

    if wallet:
        return wallet

    wallet = OperatorWallet(
        operator_id=operator.id,
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


def get_wallet(operator):
    return get_or_create_wallet(operator)


def add_earning(
    operator,
    amount,
    reference=None,
    description=None,
    commit=True,
):
    try:
        amount = Decimal(str(amount))
    except (TypeError, ValueError, InvalidOperation):
        raise OperatorWalletServiceError(
            "Amount must be a valid number",
            422,
        )

    if amount <= 0:
        raise OperatorWalletServiceError(
            "Amount must be greater than 0",
            422,
        )

    wallet = get_or_create_wallet(
        operator,
        commit=commit,
    )

    wallet.available_balance += amount
    wallet.total_earned += amount

    transaction = OperatorWalletTransaction(
        wallet_id=wallet.id,
        operator_id=operator.id,
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


def get_transactions(operator):
    wallet = get_or_create_wallet(operator)

    return (
        OperatorWalletTransaction.query
        .filter_by(operator_id=operator.id)
        .order_by(
            OperatorWalletTransaction.created_at.desc()
        )
        .all()
    )


def request_payout(operator, amount):
    try:
        amount = Decimal(str(amount)).quantize(Decimal("0.01"))
    except (TypeError, ValueError):
        raise OperatorWalletServiceError("Amount must be a valid number", 422)

    if amount <= 0:
        raise OperatorWalletServiceError("Payout amount must be greater than 0", 422)

    if DriverPayoutRequest.query.filter_by(
        operator_id=operator.id, driver_id=None, status="pending"
    ).first():
        raise OperatorWalletServiceError("You already have a pending payout request", 409)

    wallet = (
        OperatorWallet.query.filter_by(operator_id=operator.id)
        .with_for_update().first()
    )
    if not wallet:
        raise OperatorWalletServiceError("Operator wallet not found", 404)

    available = Decimal(str(wallet.available_balance or "0.00"))
    if amount > available:
        raise OperatorWalletServiceError(
            f"Insufficient wallet balance. Available balance is ₹{available:.2f}", 422
        )

    wallet.available_balance -= amount
    payout_request = DriverPayoutRequest(
        driver_id=None,
        operator_id=operator.id,
        amount=amount,
        status="pending",
        bank_account_holder_name=operator.full_name,
        bank_name="Manual approval",
        bank_account_number="N/A",
        bank_ifsc_code="N/A",
    )
    db.session.add(payout_request)
    db.session.flush()
    transaction = OperatorWalletTransaction(
        wallet_id=wallet.id,
        operator_id=operator.id,
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


def complete_payout(operator, payout_request):
    if payout_request.status != "approved" or payout_request.driver_id is not None:
        raise OperatorWalletServiceError("Only approved operator payouts can be withdrawn", 409)
    wallet = OperatorWallet.query.filter_by(operator_id=operator.id).with_for_update().first()
    if not wallet:
        raise OperatorWalletServiceError("Operator wallet not found", 404)
    payout_request.status = "paid"
    payout_request.processed_at = datetime.utcnow()
    wallet.total_withdrawn += payout_request.amount
    transaction = OperatorWalletTransaction(
        wallet_id=wallet.id,
        operator_id=operator.id,
        transaction_type="PAYOUT_COMPLETED",
        amount=-payout_request.amount,
        balance_after=wallet.available_balance,
        reference=payout_request.public_id,
        description="Payout withdrawn",
        status="completed",
    )
    db.session.add(transaction)
    db.session.commit()
    return payout_request, wallet, transaction