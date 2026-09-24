import razorpay
import hashlib
import hmac
import json

from flask import current_app


class RazorpayXServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _razorpayx_client():
    key_id = current_app.config.get("RAZORPAYX_KEY_ID")
    key_secret = current_app.config.get("RAZORPAYX_KEY_SECRET")

    if not key_id or not key_secret:
        raise RazorpayXServiceError(
            "RazorpayX payout credentials are not configured",
            500,
        )

    return razorpay.Client(
        auth=(
            key_id,
            key_secret,
        )
    )


def create_payout(payout_request):
    """
    Create a RazorpayX payout for an approved driver payout request.

    Important:
    This function only creates the provider payout.
    It does not decide the final application status.
    """

    account_number = current_app.config.get(
        "RAZORPAYX_ACCOUNT_NUMBER"
    )

    if not account_number:
        raise RazorpayXServiceError(
            "RazorpayX account number is not configured",
            500,
        )

    if payout_request.status != "approved":
        raise RazorpayXServiceError(
            "Only approved payout requests can be processed",
            409,
        )

    # Never create another provider payout if one already exists.
    if payout_request.razorpay_payout_id:
        raise RazorpayXServiceError(
            "A RazorpayX payout has already been created for this request",
            409,
        )

    amount_paise = int(
        round(
            float(payout_request.amount) * 100
        )
    )

    if amount_paise <= 0:
        raise RazorpayXServiceError(
            "Payout amount must be greater than 0",
            422,
        )

    reference_id = (
        f"driver_payout_{payout_request.public_id}"
    )

    payload = {
        "account_number": account_number,

        "fund_account": {
            "account_type": "bank_account",

            "bank_account": {
                "name": payout_request.bank_account_holder_name,
                "ifsc": payout_request.bank_ifsc_code,
                "account_number": payout_request.bank_account_number,
            },

            "contact": {
                "name": payout_request.bank_account_holder_name,
                "type": "customer",
            },
        },

        "amount": amount_paise,
        "currency": "INR",

        "mode": "IMPS",
        "purpose": "payout",

        "queue_if_low_balance": True,

        "reference_id": reference_id,

        "narration": "ShareTaxi driver payout",
    }

    try:
        client = _razorpayx_client()

        response = client.post(
            "/v1/payouts",
            payload,
        )

    except Exception as error:
        raise RazorpayXServiceError(
            f"RazorpayX payout failed: {error}",
            502,
        )

    if not isinstance(response, dict):
        raise RazorpayXServiceError(
            "Invalid response received from RazorpayX",
            502,
        )

    payout_id = response.get("id")

    if not payout_id:
        raise RazorpayXServiceError(
            "RazorpayX did not return a payout ID",
            502,
        )

    return response

def get_payout(payout_id):
    """
    Fetch the current status of an existing RazorpayX payout.
    """

    if not payout_id:
        raise RazorpayXServiceError(
            "RazorpayX payout ID is required",
            422,
        )

    try:
        client = _razorpayx_client()

        response = client.get(
            f"/v1/payouts/{payout_id}"
        )

    except Exception as error:
        raise RazorpayXServiceError(
            f"Unable to fetch RazorpayX payout: {error}",
            502,
        )

    if not isinstance(response, dict):
        raise RazorpayXServiceError(
            "Invalid response received from RazorpayX",
            502,
        )

    return response


def verify_webhook_signature(raw_body, signature):
    """
    Verify that a RazorpayX webhook was signed by Razorpay.

    Razorpay signs the raw webhook request body using HMAC-SHA256.
    """

    webhook_secret = current_app.config.get(
        "RAZORPAYX_WEBHOOK_SECRET"
    )

    if not webhook_secret:
        raise RazorpayXServiceError(
            "RazorpayX webhook secret is not configured",
            500,
        )

    if not signature:
        raise RazorpayXServiceError(
            "RazorpayX webhook signature is missing",
            401,
        )

    if not raw_body:
        raise RazorpayXServiceError(
            "RazorpayX webhook body is empty",
            400,
        )

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        signature,
    ):
        raise RazorpayXServiceError(
            "Invalid RazorpayX webhook signature",
            401,
        )

    try:
        return json.loads(
            raw_body.decode("utf-8")
        )
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise RazorpayXServiceError(
            "Invalid RazorpayX webhook payload",
            400,
        )