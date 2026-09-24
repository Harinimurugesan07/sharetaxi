from datetime import datetime

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.services import auth_service
from app.services.auth_service import AuthError
from app.utils.response import success_response, error_response
from app.utils.validators import (
    is_valid_email, is_valid_phone, is_valid_password, is_valid_license_number,
    validate_required_fields,
)
from app.utils.constants import UserRole
from app.models.user import User


def _validate_registration_payload(data, extra_required=None):
    required = ["full_name", "email", "phone", "password"] + (extra_required or [])
    missing = validate_required_fields(data, required)
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    if not is_valid_email(data["email"]):
        return "Please provide a valid email address"
    if not is_valid_phone(data["phone"]):
        return "Please provide a valid 10-digit mobile number"
    if "license_number" in data and not is_valid_license_number(data["license_number"]):
        return "License number must be in DL-XXXXXXXXXXXX format"
    if not is_valid_password(data["password"]):
        return "Password must be at least 8 characters and include a letter and a number"
    return None


def register_passenger():
    data = request.get_json(silent=True) or {}
    error = _validate_registration_payload(data)
    if error:
        return error_response(error, 422)

    try:
        user, access_token, refresh_token = auth_service.register_passenger(data)
    except AuthError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        message="Registration successful",
        status_code=201,
    )


def register_driver():
    data = request.get_json(silent=True) or {}
    error = _validate_registration_payload(
        data, 
        extra_required=[
        "license_number",
        "address",
        "city",
        "state",
        "postal_code",
        "country",
    ],
)
    if error:
        return error_response(error, 422)

    try:
        user, access_token, refresh_token = auth_service.register_driver(data)
    except AuthError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        message="Driver registration successful. Your account is pending verification.",
        status_code=201,
    )


def register_operator():
    data = request.get_json(silent=True) or {}
    error = _validate_registration_payload(data)
    if error:
        return error_response(error, 422)

    try:
        user, access_token, refresh_token = auth_service.register_operator(data)
    except AuthError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        message="Operator registration successful. Choose a subscription to continue.",
        status_code=201,
    )


def login(expected_role=None):
    data = request.get_json(silent=True) or {}
    missing = validate_required_fields(data, ["identifier", "password"])
    if missing:
        return error_response("Email/phone and password are required", 422)

    try:
        user, access_token, refresh_token = auth_service.login(
            data["identifier"], data["password"], expected_role=expected_role
        )
    except AuthError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        {"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token},
        message="Login successful",
    )


def login_operator():
    data = request.get_json(silent=True) or {}
    missing = validate_required_fields(data, ["identifier", "password"])
    if missing:
        return error_response("Email/phone and password are required", 422)

    try:
        user, access_token, refresh_token = auth_service.login(
            data["identifier"], data["password"], expected_role=UserRole.OPERATOR
        )
    except AuthError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        {
            **user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Operator login successful",
    )


@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    try:
        access_token = auth_service.refresh_access_token(user_id)
    except AuthError as e:
        return error_response(e.message, e.status_code)
    return success_response({"access_token": access_token}, message="Token refreshed")


@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return error_response("User not found", 404)

    payload = user.to_dict()
    if user.subscription_status == "active" and user.subscription_expires_at and user.subscription_expires_at < datetime.utcnow():
        user.subscription_status = "expired"
        from app.extensions import db
        db.session.commit()
        payload["subscription_status"] = "expired"
    payload["profile_completion_percentage"] = user.profile_completion_percentage()
    payload["profile_completion"] = user.profile_completion_summary()

    if user.role == UserRole.PASSENGER and user.customer_profile:
        payload["profile"] = user.customer_profile.to_dict()
    elif user.role == UserRole.DRIVER and user.driver_profile:
        payload["profile"] = user.driver_profile.to_dict(include_documents=True)
    elif user.role == UserRole.OPERATOR:
        payload["profile"] = {
            "profile_completion_percentage": user.profile_completion_percentage(),
            "profile_completion": user.profile_completion_summary(),
        }

    if user.role in (UserRole.DRIVER, UserRole.OPERATOR):
        from app.services.onboarding_service import get_onboarding
        payload["onboarding"] = get_onboarding(user)

    return success_response(payload)
