from flask import Blueprint
from app.controllers import trip_controller

trip_bp = Blueprint("trips", __name__)

trip_bp.add_url_rule("", view_func=trip_controller.create_trip, methods=["POST"])
trip_bp.add_url_rule("/mine", view_func=trip_controller.list_my_trips, methods=["GET"])
trip_bp.add_url_rule("/available", view_func=trip_controller.list_available_trips, methods=["GET"])
trip_bp.add_url_rule("/<trip_id>/status", view_func=trip_controller.update_status, methods=["PATCH"])