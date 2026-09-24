from flask import Blueprint
from app.controllers import onboarding_controller

onboarding_bp = Blueprint("onboarding", __name__)
onboarding_bp.add_url_rule("/status", view_func=onboarding_controller.get_status, methods=["GET"])
onboarding_bp.add_url_rule("/documents", view_func=onboarding_controller.submit_document, methods=["POST"])
onboarding_bp.add_url_rule("/plans", view_func=onboarding_controller.get_subscription_plans, methods=["GET"])
onboarding_bp.add_url_rule("/subscription", view_func=onboarding_controller.get_subscription, methods=["GET"])
onboarding_bp.add_url_rule("/subscription/order", view_func=onboarding_controller.create_subscription_order, methods=["POST"])
onboarding_bp.add_url_rule("/subscription/verify", view_func=onboarding_controller.verify_subscription_payment, methods=["POST"])