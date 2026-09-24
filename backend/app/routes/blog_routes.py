"""
Blog routes — URL -> controller wiring only. No request parsing, no DB
access, no business logic here; that all lives in controllers/ and
services/ respectively.
"""
from flask import Blueprint
from app.controllers import blog_controller as ctrl

blog_bp = Blueprint("blogs", __name__, url_prefix="/api/blogs")

blog_bp.add_url_rule("", view_func=ctrl.list_blogs, methods=["GET"])
blog_bp.add_url_rule("", view_func=ctrl.create_blog, methods=["POST"])

blog_bp.add_url_rule("/categories", view_func=ctrl.list_categories, methods=["GET"])

blog_bp.add_url_rule("/<int:blog_id>", view_func=ctrl.get_blog, methods=["GET"])
blog_bp.add_url_rule("/<int:blog_id>", view_func=ctrl.update_blog, methods=["PUT", "PATCH"])
blog_bp.add_url_rule("/<int:blog_id>", view_func=ctrl.delete_blog, methods=["DELETE"])

blog_bp.add_url_rule("/upload-cover", view_func=ctrl.upload_cover, methods=["POST"])

blog_bp.add_url_rule("/ai-generate", view_func=ctrl.ai_generate, methods=["POST"])
blog_bp.add_url_rule("/ai-generate/save", view_func=ctrl.ai_generate_and_save, methods=["POST"])
