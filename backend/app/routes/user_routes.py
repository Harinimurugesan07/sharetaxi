from flask import Blueprint
from app.controllers import user_controller

user_bp = Blueprint("users", __name__)

user_bp.add_url_rule("/profile", view_func=user_controller.update_profile, methods=["PATCH"])
