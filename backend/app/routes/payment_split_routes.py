from flask import Blueprint

from app.controllers.payment_split_controller import (
    get_payment_split_settings,
    update_payment_split_settings,
)

payment_split_bp = Blueprint(
    "payment_split",
    __name__,
    url_prefix="/api/v1/admin/payment-split",
)

payment_split_bp.add_url_rule(
    "",
    view_func=get_payment_split_settings,
    methods=["GET"],
)

payment_split_bp.add_url_rule(
    "",
    view_func=update_payment_split_settings,
    methods=["PUT"],
)