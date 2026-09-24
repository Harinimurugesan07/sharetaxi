from flask import Blueprint
from app.controllers import vehicle_controller

vehicle_bp = Blueprint("vehicles", __name__)

vehicle_bp.add_url_rule("", view_func=vehicle_controller.add_vehicle, methods=["POST"])
vehicle_bp.add_url_rule("/mine", view_func=vehicle_controller.list_my_vehicles, methods=["GET"])
