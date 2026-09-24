from flask import Blueprint
from app.controllers import operator_controller


operator_bp = Blueprint("operator", __name__)

operator_bp.add_url_rule("/dashboard", view_func=operator_controller.dashboard, methods=["GET"])
operator_bp.add_url_rule("/trips/live", view_func=operator_controller.live_trips, methods=["GET"])
operator_bp.add_url_rule("/trips", view_func=operator_controller.trips, methods=["GET"])
operator_bp.add_url_rule("/trips/<trip_id>", view_func=operator_controller.trip_detail, methods=["GET"])
operator_bp.add_url_rule("/drivers", view_func=operator_controller.drivers, methods=["GET"])
operator_bp.add_url_rule("/drivers/<driver_id>", view_func=operator_controller.driver_detail, methods=["GET"])
operator_bp.add_url_rule("/drivers/<driver_id>", view_func=operator_controller.delete_driver, methods=["DELETE"])
operator_bp.add_url_rule("/passengers", view_func=operator_controller.passengers, methods=["GET"])
operator_bp.add_url_rule("/ride-requests", view_func=operator_controller.ride_requests, methods=["GET"])
operator_bp.add_url_rule("/settlements", view_func=operator_controller.settlements, methods=["GET"])
operator_bp.add_url_rule("/settlements/<settlement_id>", view_func=operator_controller.settle_settlement, methods=["PATCH"])
operator_bp.add_url_rule("/drivers", view_func=operator_controller.create_driver, methods=["POST"])
operator_bp.add_url_rule("/drivers/<driver_id>/documents", view_func=operator_controller.upload_driver_document, methods=["POST"])
operator_bp.add_url_rule("/trips", view_func=operator_controller.create_trip, methods=["POST"])
operator_bp.add_url_rule("/vehicles", view_func=operator_controller.create_vehicle, methods=["POST"])
operator_bp.add_url_rule(
    "/vehicles",
    view_func=operator_controller.vehicles,
    methods=["GET"]
)
operator_bp.add_url_rule(
    "/expenses",
    view_func=operator_controller.create_expense,
    methods=["POST"]
)


operator_bp.add_url_rule(
    "/expenses",
    view_func=operator_controller.expenses,
    methods=["GET"]
)


operator_bp.add_url_rule(
    "/financial-summary",
    view_func=operator_controller.financial_summary,
    methods=["GET"]
)

operator_bp.add_url_rule(
    "/payouts",
    view_func=operator_controller.payout_requests,
    methods=["GET"],
)

operator_bp.add_url_rule(
    "/wallet",
    view_func=operator_controller.wallet,
    methods=["GET"]
)