from flask import Blueprint
from app.controllers import admin_controller


admin_bp = Blueprint("admin", __name__)

admin_bp.add_url_rule("/dashboard", view_func=admin_controller.dashboard, methods=["GET"])
admin_bp.add_url_rule("/operators", view_func=admin_controller.create_operator, methods=["POST"])

admin_bp.add_url_rule("/drivers", view_func=admin_controller.list_drivers, methods=["GET"])
admin_bp.add_url_rule(
    "/drivers/<driver_id>/verification",
    view_func=admin_controller.update_driver_verification,
    methods=["PATCH"],
)
admin_bp.add_url_rule("/subscriptions", view_func=admin_controller.list_subscriptions, methods=["GET"])
admin_bp.add_url_rule("/subscription-plans", view_func=admin_controller.list_subscription_plans, methods=["GET"])
admin_bp.add_url_rule("/subscription-plans", view_func=admin_controller.create_subscription_plan, methods=["POST"])
admin_bp.add_url_rule("/subscription-plans/<plan_id>", view_func=admin_controller.get_subscription_plan, methods=["GET"])
admin_bp.add_url_rule("/subscription-plans/<plan_id>", view_func=admin_controller.update_subscription_plan, methods=["PUT", "PATCH"])
admin_bp.add_url_rule("/subscription-plans/<plan_id>", view_func=admin_controller.delete_subscription_plan, methods=["DELETE"])

admin_bp.add_url_rule("/vehicles", view_func=admin_controller.list_vehicles, methods=["GET"])
admin_bp.add_url_rule(
    "/vehicles/<vehicle_id>/verification",
    view_func=admin_controller.update_vehicle_verification,
    methods=["PATCH"],
)

admin_bp.add_url_rule("/customers", view_func=admin_controller.list_customers, methods=["GET"])
admin_bp.add_url_rule("/trips", view_func=admin_controller.list_trips, methods=["GET"])
admin_bp.add_url_rule("/verification-requests", view_func=admin_controller.list_verification_requests, methods=["GET"])
admin_bp.add_url_rule(
    "/verification-requests/<user_id>",
    view_func=admin_controller.review_verification_request,
    methods=["PATCH"],
)
admin_bp.add_url_rule(
    "/verification-documents/<document_id>",
    view_func=admin_controller.review_verification_document,
    methods=["PATCH"],
)


admin_bp.add_url_rule(
    "/financial-summary",
    view_func=admin_controller.financial_summary,
    methods=["GET"]
)
admin_bp.add_url_rule(
    "/report-breakdown",
    view_func=admin_controller.report_breakdown,
    methods=["GET"],
)


admin_bp.add_url_rule(
    "/driver-payouts",
    view_func=admin_controller.list_driver_payout_requests,
    methods=["GET"],
)

admin_bp.add_url_rule(
    "/driver-payouts/<string:payout_request_id>/approve",
    view_func=admin_controller.approve_driver_payout_request,
    methods=["PATCH"],
)

admin_bp.add_url_rule(
    "/driver-payouts/<string:payout_request_id>/reject",
    view_func=admin_controller.reject_driver_payout_request,
    methods=["PATCH"],
)

admin_bp.add_url_rule(
    "/driver-payouts/<string:payout_request_id>/process",
    view_func=admin_controller.process_driver_payout_request,
    methods=["PATCH"],
)

admin_bp.add_url_rule(
    "/driver-payouts/<string:payout_request_id>/reconcile",
    view_func=admin_controller.reconcile_driver_payout_request,
    methods=["PATCH"],
)