from flask import Blueprint
from app.controllers import verification_controller

verification_bp = Blueprint("verification", __name__)

verification_bp.add_url_rule("/me", view_func=verification_controller.list_my_documents, methods=["GET"])
verification_bp.add_url_rule("/upload", view_func=verification_controller.upload_document, methods=["POST"])