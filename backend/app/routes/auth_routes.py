from flask import Blueprint
from app.controllers import auth_controller
from app.utils.constants import UserRole

auth_bp = Blueprint("auth", __name__)

# Passenger auth
auth_bp.add_url_rule(
    "/passenger/register", view_func=auth_controller.register_passenger, methods=["POST"]
)
auth_bp.add_url_rule(
    "/passenger/login",
    endpoint="passenger_login",
    view_func=lambda: auth_controller.login(expected_role=UserRole.PASSENGER),
    methods=["POST"],
)

# Driver auth
auth_bp.add_url_rule(
    "/driver/register", view_func=auth_controller.register_driver, methods=["POST"]
)
auth_bp.add_url_rule(
    "/operator/register", view_func=auth_controller.register_operator, methods=["POST"]
)
auth_bp.add_url_rule(
    "/driver/login",
    endpoint="driver_login",
    view_func=lambda: auth_controller.login(expected_role=UserRole.DRIVER),
    methods=["POST"],
)

# Admin auth (admins are seeded/created directly in DB, not self-registered)
auth_bp.add_url_rule(
    "/admin/login",
    endpoint="admin_login",
    view_func=lambda: auth_controller.login(expected_role=UserRole.ADMIN),
    methods=["POST"],
)
auth_bp.add_url_rule(
    "/operator/login",
    endpoint="operator_login",
    view_func=auth_controller.login_operator,
    methods=["POST"],
)

# Shared
auth_bp.add_url_rule("/refresh", view_func=auth_controller.refresh, methods=["POST"])
auth_bp.add_url_rule("/me", view_func=auth_controller.me, methods=["GET"])
