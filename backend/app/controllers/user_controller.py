from datetime import datetime

from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.utils.response import success_response, error_response
from app.utils.validators import is_valid_email, is_valid_phone


@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return error_response("User not found", 404)

    data = request.get_json(silent=True) or {}

    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()

    if "email" in data and data["email"].strip():
        email = data["email"].strip().lower()
        if not is_valid_email(email):
            return error_response("Please provide a valid email address", 422)
        if email != user.email and User.query.filter_by(email=email).first():
            return error_response("This email is already in use", 409)
        user.email = email

    if "phone" in data and data["phone"].strip():
        phone = data["phone"].strip()
        if not is_valid_phone(phone):
            return error_response("Please provide a valid 10-digit mobile number", 422)
        if phone != user.phone and User.query.filter_by(phone=phone).first():
            return error_response("This phone number is already in use", 409)
        user.phone = phone
        user.is_phone_verified = False

    if "profile_photo_url" in data:
        user.profile_photo_url = data["profile_photo_url"]

    profile_data = data.get("profile") if isinstance(data.get("profile"), dict) else {}
    if user.customer_profile:
        customer: Customer = user.customer_profile
        for field in [
            "gender",
            "address",
            "city",
            "state",
            "pincode",
            "emergency_contact_name",
            "emergency_contact_phone",
            "id_type",
            "id_number",
        ]:
            if field in profile_data:
                value = profile_data[field]
                if field == "date_of_birth" and value:
                    try:
                        customer.date_of_birth = datetime.strptime(value, "%Y-%m-%d").date()
                    except ValueError:
                        return error_response("Please provide a valid date of birth", 422)
                elif value is not None:
                    setattr(customer, field, str(value).strip() if isinstance(value, str) else value)

        if "date_of_birth" in profile_data:
            value = profile_data["date_of_birth"]
            if value:
                try:
                    customer.date_of_birth = datetime.strptime(value, "%Y-%m-%d").date()
                except ValueError:
                    return error_response("Please provide a valid date of birth", 422)
            else:
                customer.date_of_birth = None

    db.session.commit()

    payload = user.to_dict()
    if user.customer_profile:
        payload["profile"] = user.customer_profile.to_dict()
    elif user.role == UserRole.OPERATOR:
        payload["profile"] = {
            "profile_completion_percentage": user.profile_completion_percentage(),
            "profile_completion": user.profile_completion_summary(),
        }
    return success_response(payload, message="Profile updated")
