from datetime import datetime

from flask import request

from app.extensions import db
from app.models.driver_payout_request import DriverPayoutRequest
from app.models.driver_wallet import DriverWallet
from app.models.driver_wallet_transaction import (
    DriverWalletTransaction,
)
from app.services import razorpayx_service
from app.utils.response import success_response, error_response


def razorpayx_webhook():
    """
    Receive RazorpayX payout webhook events.

    This endpoint does NOT use JWT authentication because
    RazorpayX calls it directly.
    """

    raw_body = request.get_data()

    signature = request.headers.get(
        "X-Razorpay-Signature"
    )

    try:
        payload = (
            razorpayx_service.verify_webhook_signature(
                raw_body,
                signature,
            )
        )

        event = payload.get("event")

        if not event:
            return error_response(
                "Webhook event is missing",
                400,
            )

        payout_entity = (
            payload
            .get("payload", {})
            .get("payout", {})
            .get("entity", {})
        )

        payout_id = payout_entity.get("id")

        if not payout_id:
            return error_response(
                "Payout ID is missing from webhook",
                400,
            )

        payout_request = (
            DriverPayoutRequest.query
            .filter_by(
                razorpay_payout_id=payout_id
            )
            .first()
        )

        # The webhook is valid, but this payout does not
        # belong to a known ShareTaxi payout request.
        if not payout_request:
            return success_response(
                {
                    "received": True,
                    "processed": False,
                },
                message="Webhook received",
            )

        # -----------------------------------------
        # PAYOUT PROCESSED
        # -----------------------------------------

        if event == "payout.processed":

            # Already completed.
            # This makes duplicate webhook delivery harmless.
            if payout_request.status == "paid":
                return success_response(
                    {
                        "received": True,
                        "processed": False,
                        "status": "paid",
                    },
                    message="Payout already completed",
                )

            wallet = (
                DriverWallet.query
                .filter_by(
                    driver_id=payout_request.driver_id
                )
                .with_for_update()
                .first()
            )

            if not wallet:
                db.session.rollback()

                return error_response(
                    "Driver wallet not found",
                    404,
                )

            payout_request.status = "paid"
            payout_request.payout_error = None
            payout_request.processed_at = datetime.utcnow()

            # Prevent duplicate wallet accounting if Razorpay
            # sends the same webhook more than once.
            existing_transaction = (
                DriverWalletTransaction.query
                .filter_by(
                    driver_id=payout_request.driver_id,
                    reference=payout_request.public_id,
                    transaction_type="PAYOUT_COMPLETED",
                )
                .first()
            )

            if not existing_transaction:
                wallet.total_withdrawn += (
                    payout_request.amount
                )

                transaction = DriverWalletTransaction(
                    wallet_id=wallet.id,
                    driver_id=payout_request.driver_id,
                    transaction_type="PAYOUT_COMPLETED",
                    amount=-payout_request.amount,
                    balance_after=wallet.available_balance,
                    reference=payout_request.public_id,
                    description="Driver payout completed",
                    status="completed",
                )

                db.session.add(transaction)

            db.session.commit()

            return success_response(
                {
                    "received": True,
                    "processed": True,
                    "status": "paid",
                },
                message="Payout marked as paid",
            )

        # -----------------------------------------
        # PAYOUT FAILED / REVERSED
        # -----------------------------------------

        if event in (
            "payout.failed",
            "payout.reversed",
        ):

            # Never move an already completed payout backward.
            if payout_request.status == "paid":
                return success_response(
                    {
                        "received": True,
                        "processed": False,
                        "status": "paid",
                    },
                    message="Payout already completed",
                )

            wallet = (
                DriverWallet.query
                .filter_by(
                    driver_id=payout_request.driver_id
                )
                .with_for_update()
                .first()
            )

            if not wallet:
                db.session.rollback()

                return error_response(
                    "Driver wallet not found",
                    404,
                )

            payout_request.status = "failed"

            payout_request.payout_error = (
                payout_entity.get("failure_reason")
                or payout_entity.get("status_details")
                or event
            )

            payout_request.processed_at = (
                datetime.utcnow()
            )

            # Release the reserved balance only once.
            existing_release = (
                DriverWalletTransaction.query
                .filter_by(
                    driver_id=payout_request.driver_id,
                    reference=payout_request.public_id,
                    transaction_type="PAYOUT_RELEASE",
                )
                .first()
            )

            if not existing_release:
                wallet.available_balance += (
                    payout_request.amount
                )

                transaction = DriverWalletTransaction(
                    wallet_id=wallet.id,
                    driver_id=payout_request.driver_id,
                    transaction_type="PAYOUT_RELEASE",
                    amount=payout_request.amount,
                    balance_after=wallet.available_balance,
                    reference=payout_request.public_id,
                    description=(
                        "Failed RazorpayX payout "
                        "amount released"
                    ),
                    status="completed",
                )

                db.session.add(transaction)

            db.session.commit()

            return success_response(
                {
                    "received": True,
                    "processed": True,
                    "status": "failed",
                },
                message="Payout failure processed",
            )

        # -----------------------------------------
        # PAYOUT STILL IN PROGRESS
        # -----------------------------------------

        if event in (
            "payout.queued",
            "payout.initiated",
        ):

            payout_request.status = "processing"
            payout_request.payout_error = None

            db.session.commit()

            return success_response(
                {
                    "received": True,
                    "processed": True,
                    "status": "processing",
                },
                message="Payout remains in processing",
            )

        # -----------------------------------------
        # UNKNOWN EVENT
        # -----------------------------------------

        return success_response(
            {
                "received": True,
                "processed": False,
                "event": event,
            },
            message="Webhook event received",
        )

    except razorpayx_service.RazorpayXServiceError as error:
        db.session.rollback()

        return error_response(
            error.message,
            error.status_code,
        )

    except Exception as error:
        db.session.rollback()

        return error_response(
            str(error),
            400,
        )