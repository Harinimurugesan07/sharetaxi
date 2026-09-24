from flask import Blueprint
from app.controllers import matching_controller

matching_bp = Blueprint("matching", __name__)

matching_bp.add_url_rule("/search", view_func=matching_controller.search_matches, methods=["POST"])