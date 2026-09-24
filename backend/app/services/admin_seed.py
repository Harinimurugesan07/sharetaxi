# from sqlalchemy.exc import SQLAlchemyError

# from app.extensions import db
# from app.models.user import User
# from app.utils.constants import UserRole
# from app.utils.validators import is_valid_email, is_valid_phone, is_valid_password


# def seed_admin_from_env(app):
#     """Create the configured admin once, if all admin seed values are present."""
#     values = {
#         "full_name": app.config.get("ADMIN_NAME", "").strip(),
#         "email": app.config.get("ADMIN_EMAIL", "").strip().lower(),
#         "phone": app.config.get("ADMIN_PHONE", "").strip(),
#         "password": app.config.get("ADMIN_PASSWORD", ""),
#     }

#     if not any(values.values()):
#         return False

#     missing = [name for name, value in values.items() if not value]
#     if missing:
#         raise ValueError(
#             "Admin seeding requires ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, "
#             f"and ADMIN_PASSWORD. Missing: {', '.join(missing)}"
#         )

#     if not is_valid_email(values["email"]):
#         raise ValueError("ADMIN_EMAIL is not valid")
#     if not is_valid_phone(values["phone"]):
#         raise ValueError("ADMIN_PHONE must be a valid 10-digit Indian mobile number")
#     if not is_valid_password(values["password"]):
#         raise ValueError("ADMIN_PASSWORD must contain at least 8 characters, a letter, and a number")

#     try:
#         existing = User.query.filter_by(email=values["email"]).first()
#     except SQLAlchemyError:
#         db.session.rollback()
#         app.logger.warning("Admin seed skipped because the users table does not exist yet")
#         return False

#     if existing:
#         app.logger.info("Admin seed skipped; user %s already exists", values["email"])
#         return False

#     admin = User(
#         full_name=values["full_name"],
#         email=values["email"],
#         phone=values["phone"],
#         role=UserRole.ADMIN,
#         is_email_verified=True,
#         is_phone_verified=True,
#     )
#     admin.set_password(values["password"])
#     db.session.add(admin)
#     db.session.commit()
#     app.logger.info("Admin account created: %s", values["email"])
#     return True




from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.user import User
from app.utils.constants import UserRole
from app.utils.validators import (
    is_valid_email,
    is_valid_phone,
    is_valid_password,
)


def seed_admin_from_env(app):
    """Create the configured admin once, if all admin seed values are present."""

    values = {
        "full_name": app.config.get("ADMIN_NAME", "").strip(),
        "email": app.config.get("ADMIN_EMAIL", "").strip().lower(),
        "phone": app.config.get("ADMIN_PHONE", "").strip(),
        "password": app.config.get("ADMIN_PASSWORD", ""),
    }

    # No admin seed configuration provided
    if not any(values.values()):
        return False

    missing = [name for name, value in values.items() if not value]

    if missing:
        raise ValueError(
            "Admin seeding requires ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, "
            f"and ADMIN_PASSWORD. Missing: {', '.join(missing)}"
        )

    # Validate email
    if not is_valid_email(values["email"]):
        raise ValueError("ADMIN_EMAIL is not valid")

    # Validate phone
    if not is_valid_phone(values["phone"]):
        raise ValueError(
            "ADMIN_PHONE must be a valid 10-digit Indian mobile number"
        )

    # Validate password
    if not is_valid_password(values["password"]):
        raise ValueError(
            "ADMIN_PASSWORD must contain at least 8 characters, "
            "a letter, and a number"
        )

    try:
        # Check both email AND phone.
        existing_by_email = User.query.filter_by(
            email=values["email"]
        ).first()

        existing_by_phone = User.query.filter_by(
            phone=values["phone"]
        ).first()

    except SQLAlchemyError:
        db.session.rollback()

        app.logger.warning(
            "Admin seed skipped because the users table does not exist yet"
        )

        return False

    # Admin/email already exists
    if existing_by_email:
        app.logger.info(
            "Admin seed skipped; email %s already exists",
            values["email"],
        )
        return False

    # Phone number already belongs to another user
    if existing_by_phone:
        app.logger.warning(
            "Admin seed skipped; phone %s already belongs to user %s",
            values["phone"],
            existing_by_phone.email,
        )
        return False

    # Safe to create the admin
    admin = User(
        full_name=values["full_name"],
        email=values["email"],
        phone=values["phone"],
        role=UserRole.ADMIN,
        is_email_verified=True,
        is_phone_verified=True,
    )

    admin.set_password(values["password"])

    db.session.add(admin)

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        app.logger.exception("Failed to create admin account")
        raise

    app.logger.info(
        "Admin account created: %s",
        values["email"],
    )

    return True