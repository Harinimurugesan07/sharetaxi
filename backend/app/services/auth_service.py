from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from app.extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.driver import Driver
from app.utils.constants import UserRole
from app.utils.validators import is_valid_license_number


class AuthError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _issue_tokens(user):
    extra_claims = {"role": user.role, "public_id": user.public_id}
    access_token = create_access_token(identity=str(user.id), additional_claims=extra_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=extra_claims)
    return access_token, refresh_token


def register_passenger(data):
    if User.query.filter(
        (User.email == data["email"]) | (User.phone == data["phone"])
    ).first():
        raise AuthError("An account with this email or phone already exists", 409)

    user = User(
        full_name=data["full_name"].strip(),
        email=data["email"].strip().lower(),
        phone=data["phone"].strip(),
        role=UserRole.PASSENGER,
    )
    user.set_password(data["password"])

    customer = Customer(user=user)

    db.session.add(user)
    db.session.add(customer)
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return user, access_token, refresh_token


def register_driver(data):
    if User.query.filter(
        (User.email == data["email"]) | (User.phone == data["phone"])
    ).first():
        raise AuthError("An account with this email or phone already exists", 409)

    license_number = data["license_number"].strip()
    if not is_valid_license_number(license_number):
        raise AuthError("License number must be in DL-XXXXXXXXXXXX format", 422)

    if Driver.query.filter_by(license_number=license_number).first():
        raise AuthError("This license number is already registered", 409)

    user = User(
        full_name=data["full_name"].strip(),
        email=data["email"].strip().lower(),
        phone=data["phone"].strip(),
        role=UserRole.DRIVER,
    )
    user.set_password(data["password"])

    driver = Driver(
        user=user,
        operator_id=None,
        license_number=license_number,
        address=data["address"].strip(),
        city=data["city"].strip(),
        state=data["state"].strip(),
        postal_code=data["postal_code"].strip(),
        country=data["country"].strip(),
        license_expiry=data.get("license_expiry"),
        license_photo_url=data.get("license_photo_url"),
)
    user.verification_status = "pending"
    user.subscription_status = "inactive"

    db.session.add(user)
    db.session.add(driver)
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return user, access_token, refresh_token


def register_operator(data):
    if User.query.filter(
        (User.email == data["email"]) | (User.phone == data["phone"])
    ).first():
        raise AuthError("An account with this email or phone already exists", 409)

    user = User(
        full_name=data["full_name"].strip(),
        email=data["email"].strip().lower(),
        phone=data["phone"].strip(),
        role=UserRole.OPERATOR,
    )
    user.set_password(data["password"])
    user.verification_status = "pending"
    user.subscription_status = "inactive"
    db.session.add(user)
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return user, access_token, refresh_token


def login(email_or_phone, password, expected_role=None):
    identifier = email_or_phone.strip().lower()
    user = User.query.filter(
        (User.email == identifier) | (User.phone == email_or_phone.strip())
    ).first()

    if not user or not user.check_password(password):
        raise AuthError("Invalid credentials", 401)

    if not user.is_active:
        raise AuthError("This account has been deactivated", 403)

    if expected_role and user.role != expected_role:
        raise AuthError(f"This login is only for {expected_role} accounts", 403)

    user.last_login_at = datetime.utcnow()
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return user, access_token, refresh_token


def refresh_access_token(user_id):
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        raise AuthError("Invalid user", 401)
    extra_claims = {"role": user.role, "public_id": user.public_id}
    return create_access_token(identity=str(user.id), additional_claims=extra_claims)
