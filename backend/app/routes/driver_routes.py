from flask import Blueprint

from app.controllers import driver_controller


driver_bp = Blueprint("drivers", __name__)


driver_bp.add_url_rule(
    "/me",
    view_func=driver_controller.get_my_profile,
    methods=["GET"],
)

driver_bp.add_url_rule(
    "/me",
    view_func=driver_controller.update_my_profile,
    methods=["PATCH"],
)

driver_bp.add_url_rule(
    "/payout-method",
    view_func=driver_controller.update_payout_method,
    methods=["PATCH"],
)

driver_bp.add_url_rule(
    "/availability",
    view_func=driver_controller.update_availability,
    methods=["PATCH"],
)

driver_bp.add_url_rule(
    "/requests",
    view_func=driver_controller.ride_requests,
    methods=["GET"],
)

driver_bp.add_url_rule(
    "/earnings",
    view_func=driver_controller.earnings,
    methods=["GET"],
)

driver_bp.add_url_rule(
    "/available",
    view_func=driver_controller.list_available_drivers,
    methods=["GET"],
)

driver_bp.add_url_rule(
    "/wallet",
    view_func=driver_controller.wallet,
    methods=["GET"],
)

driver_bp.add_url_rule(
    "/wallet/transactions",
    view_func=driver_controller.wallet_transactions,
    methods=["GET"],
)


driver_bp.add_url_rule(
    "/wallet/payout",
    view_func=driver_controller.request_payout,
    methods=["POST"],
)
driver_bp.add_url_rule(
    "/wallet/payouts",
    view_func=driver_controller.payout_requests,
    methods=["GET"],
)
driver_bp.add_url_rule(
    "/wallet/payout/<string:payout_request_id>/withdraw",
    view_func=driver_controller.withdraw_payout,
    methods=["POST"],
)