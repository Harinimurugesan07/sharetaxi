from decimal import Decimal

from app.extensions import db
from app.models.operator_wallet import OperatorWallet
from app.models.operator_wallet_transaction import (
    OperatorWalletTransaction,
)


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
    except (TypeError, ValueError):
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