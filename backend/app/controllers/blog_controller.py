"""
Blog controller — the only layer that touches Flask's `request` object or
builds responses. Parses input, delegates to the service layer, and maps
service-level exceptions to HTTP status codes. Keep route handlers here thin
and free of business logic.
"""
from flask import current_app, jsonify, request

from app.services import blog_service
from app.services.blog_service import NotFoundError, ValidationError


def _error(message, status):
    return jsonify({"error": message}), status


# ---------- list / read ----------

def list_blogs():
    result = blog_service.list_blogs(
        search=request.args.get("search", "").strip(),
        category=request.args.get("category", "all"),
        status=request.args.get("status", "all"),
        page=request.args.get("page", default=1, type=int),
        per_page=request.args.get("per_page", default=20, type=int),
    )
    return jsonify(result)


def list_categories():
    return jsonify({"categories": blog_service.list_categories()})


def get_blog(blog_id):
    try:
        blog = blog_service.get_blog(blog_id)
    except NotFoundError as exc:
        return _error(str(exc), 404)
    return jsonify(blog.to_dict(include_content=True))


# ---------- create / update / delete ----------

def create_blog():
    data = request.get_json(force=True) or {}
    try:
        blog = blog_service.create_blog(data)
    except ValidationError as exc:
        return _error(str(exc), 400)
    return jsonify(blog.to_dict(include_content=True)), 201


def update_blog(blog_id):
    data = request.get_json(force=True) or {}
    try:
        blog = blog_service.update_blog(blog_id, data)
    except NotFoundError as exc:
        return _error(str(exc), 404)
    except ValidationError as exc:
        return _error(str(exc), 400)
    return jsonify(blog.to_dict(include_content=True))


def delete_blog(blog_id):
    try:
        blog_service.delete_blog(blog_id)
    except NotFoundError as exc:
        return _error(str(exc), 404)
    return jsonify({"success": True})


# ---------- cover image upload ----------

def upload_cover():
    file = request.files.get("file")
    try:
        url = blog_service.save_cover_image(
            file,
            upload_folder=current_app.config["UPLOAD_FOLDER"],
            allowed_extensions=current_app.config["ALLOWED_IMAGE_EXTENSIONS"],
        )
    except ValidationError as exc:
        return _error(str(exc), 400)
    return jsonify({"url": url}), 201


# ---------- AI assistant ----------

def ai_generate():
    data = request.get_json(force=True) or {}
    try:
        draft = blog_service.generate_draft(
            topic=data.get("topic", "").strip(),
            tone=data.get("tone", "friendly"),
            keywords=data.get("keywords"),
            category=data.get("category"),
            model=current_app.config.get("ANTHROPIC_MODEL"),
        )
    except ValidationError as exc:
        return _error(str(exc), 400)
    except (RuntimeError, ValueError) as exc:
        # Missing API key, upstream API error, or unparseable AI response
        return _error(str(exc), 502)
    return jsonify(draft)


def ai_generate_and_save():
    data = request.get_json(force=True) or {}
    try:
        blog = blog_service.generate_and_save_draft(
            topic=data.get("topic", "").strip(),
            author_name=data.get("author", "").strip(),
            author_id=data.get("authorId"),
            tone=data.get("tone", "friendly"),
            keywords=data.get("keywords"),
            category=data.get("category"),
            model=current_app.config.get("ANTHROPIC_MODEL"),
        )
    except ValidationError as exc:
        return _error(str(exc), 400)
    except (RuntimeError, ValueError) as exc:
        return _error(str(exc), 502)
    return jsonify(blog.to_dict(include_content=True)), 201
