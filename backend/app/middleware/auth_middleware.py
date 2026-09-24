from datetime import datetime
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.utils.response import error_response


def role_required(*allowed_roles):
    """
    Usage:
        @role_required("driver")
        @role_required("admin", "driver")
    Must be stacked ABOVE a route that already expects a valid JWT;
    this decorator verifies the JWT itself, so no need to also add
    @jwt_required() separately.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in allowed_roles:
                return error_response("You do not have permission to perform this action", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def any_authenticated_user(fn):
    """Just requires a valid access token, any role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper


def verified_subscribed_required(fn):
    """Require verification and a subscription unless a driver belongs to an operator."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        from app.models.user import User
        from app.models.driver import Driver
        from flask_jwt_extended import get_jwt_identity
        user = User.query.get(int(get_jwt_identity()))
        if not user or user.verification_status != "verified":
            return error_response("Document verification is required before portal access", 403)

        # Operator-created drivers are covered by their operator's service
        # arrangement and are settled through the operator, not individually.
        if user.is_operator_owned_driver():
            return fn(*args, **kwargs)

        if user.subscription_status == "active" and user.subscription_expires_at and user.subscription_expires_at < datetime.utcnow():
            user.subscription_status = "expired"
            from app.extensions import db
            db.session.commit()
        if user.subscription_status != "active":
            return error_response("An active subscription is required before portal access", 403)
        return fn(*args, **kwargs)
    return wrapper
