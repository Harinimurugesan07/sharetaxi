from flask import Blueprint

from app.controllers import razorpayx_controller


razorpayx_bp = Blueprint(
    "razorpayx",
    __name__,
)


razorpayx_bp.add_url_rule(
    "/webhook",
    view_func=razorpayx_controller.razorpayx_webhook,
    methods=["POST"],
)