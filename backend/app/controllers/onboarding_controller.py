from flask import current_app, request
from flask_jwt_extended import get_jwt_identity

from app.middleware.auth_middleware import role_required
from app.models.user import User
from app.services import onboarding_service
from app.services.onboarding_service import OnboardingError
from app.utils.constants import UserRole
from app.utils.response import error_response, success_response


def _user():
    return User.query.get(int(get_jwt_identity()))


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def get_status():
    return success_response(onboarding_service.get_onboarding(_user()))


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def submit_document():
    try:
        document = onboarding_service.submit_document(
            _user(), request.form.get("document_type"), request.files.get("file")
        )
    except OnboardingError as error:
        return error_response(error.message, error.status_code)
    return success_response(document.to_dict(), message="Document submitted", status_code=201)


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def activate_subscription():
    data = request.get_json(silent=True) or {}
    try:
        subscription = onboarding_service.activate_subscription(
            _user(), data.get("plan"), data.get("payment_reference")
        )
    except OnboardingError as error:
        return error_response(error.message, error.status_code)
    return success_response(subscription.to_dict(), message="Subscription activated")


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def create_subscription_order():
    try:
        order = onboarding_service.create_subscription_order(_user(), (request.get_json(silent=True) or {}).get("plan"))
    except OnboardingError as error:
        return error_response(error.message, error.status_code)
    return success_response({
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "razorpay_key_id": current_app.config["RAZORPAY_KEY_ID"],
    }, message="Subscription payment order created", status_code=201)


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def verify_subscription_payment():
    data = request.get_json(silent=True) or {}
    try:
        subscription = onboarding_service.verify_subscription_payment(
            _user(), data.get("plan"), data.get("razorpay_payment_id"),
            data.get("razorpay_order_id"), data.get("razorpay_signature"),
        )
    except OnboardingError as error:
        return error_response(error.message, error.status_code)
    return success_response(subscription.to_dict(), message="Payment verified and subscription activated")


@role_required(UserRole.DRIVER, UserRole.OPERATOR)
def get_subscription():
    user = _user()
    return success_response({
        "status": user.subscription_status,
        "plan": user.subscription_plan,
        "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
    })


def get_subscription_plans():
    plans = onboarding_service.get_active_subscription_plans()
    return success_response([plan.to_dict() for plan in plans])