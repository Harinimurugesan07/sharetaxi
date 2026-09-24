from flask import Blueprint
from app.controllers import booking_controller

booking_bp = Blueprint("bookings", __name__)
booking_bp.add_url_rule("", view_func=booking_controller.create_booking, methods=["POST"])
booking_bp.add_url_rule("/mine", view_func=booking_controller.list_my_bookings, methods=["GET"])
booking_bp.add_url_rule("/verify", view_func=booking_controller.verify_payment, methods=["POST"])