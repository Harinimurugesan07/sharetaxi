"""
Blog service — all business logic and DB access lives here. Controllers
call into this layer; this layer never touches `request` or builds Flask
responses, so it can be reused (scripts, tests, a future admin CLI) without
Flask in the loop.
"""
import os
import uuid

from sqlalchemy import or_
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.blog import Blog, slugify
from app.services import ai_service


class NotFoundError(Exception):
    pass


class ValidationError(Exception):
    pass


# ---------- reads ----------

def list_blogs(search="", category="all", status="all", page=1, per_page=20):
    query = Blog.query

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Blog.title.ilike(like),
                Blog.category.ilike(like),
                Blog.author_name.ilike(like),
            )
        )

    if category and category != "all":
        query = query.filter(Blog.category == category)

    if status and status != "all":
        query = query.filter(Blog.status == status)

    query = query.order_by(Blog.created_at.desc())
    pagination = query.paginate(page=page, per_page=min(per_page, 100), error_out=False)

    return {
        "items": [b.to_dict() for b in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "perPage": pagination.per_page,
        "totalPages": pagination.pages,
    }


def list_categories():
    rows = db.session.query(Blog.category).distinct().all()
    return sorted({r[0] for r in rows if r[0]})


def get_blog(blog_id):
    blog = Blog.query.get(blog_id)
    if not blog:
        raise NotFoundError(f"Blog {blog_id} not found")
    return blog


# ---------- writes ----------

def _unique_slug(title, existing_id=None):
    base = slugify(title)
    slug = base
    counter = 1
    while True:
        q = Blog.query.filter_by(slug=slug)
        if existing_id is not None:
            q = q.filter(Blog.id != existing_id)
        if not q.first():
            return slug
        counter += 1
        slug = f"{base}-{counter}"


def create_blog(data: dict) -> Blog:
    title = (data.get("title") or "").strip()
    author_name = (data.get("author") or "").strip()
    if not title or not author_name:
        raise ValidationError("title and author are required")

    blog = Blog(
        title=title,
        slug=_unique_slug(title),
        category=(data.get("category") or "General").strip(),
        author_name=author_name,
        author_id=data.get("authorId"),
        excerpt=(data.get("excerpt") or "").strip() or None,
        content=data.get("content") or "",
        cover_image_url=data.get("coverImage"),
        ai_generated=bool(data.get("aiGenerated", False)),
    )
    blog.touch_publish_state(data.get("status", "draft"))

    db.session.add(blog)
    db.session.commit()
    return blog


def update_blog(blog_id, data: dict) -> Blog:
    blog = get_blog(blog_id)

    new_title = data.get("title")
    if new_title and new_title.strip() and new_title != blog.title:
        blog.title = new_title.strip()
        blog.slug = _unique_slug(blog.title, existing_id=blog.id)

    field_map = {
        "category": "category",
        "author": "author_name",
        "excerpt": "excerpt",
        "content": "content",
        "coverImage": "cover_image_url",
    }
    for field, attr in field_map.items():
        if field in data:
            setattr(blog, attr, data[field])

    if "authorId" in data:
        blog.author_id = data["authorId"]

    if "status" in data:
        blog.touch_publish_state(data["status"])

    db.session.commit()
    return blog


def delete_blog(blog_id):
    blog = get_blog(blog_id)
    db.session.delete(blog)
    db.session.commit()


# ---------- cover image upload ----------

def save_cover_image(file_storage, upload_folder, allowed_extensions):
    if not file_storage or file_storage.filename == "":
        raise ValidationError("No file provided")

    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in allowed_extensions:
        raise ValidationError("Invalid or missing image file")

    os.makedirs(upload_folder, exist_ok=True)
    filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
    file_storage.save(os.path.join(upload_folder, filename))

    return f"/uploads/blog_covers/{filename}"


# ---------- AI assistant ----------

def generate_draft(topic, tone="friendly", keywords=None, category=None, model=None):
    if not topic or not topic.strip():
        raise ValidationError("topic is required")
    return ai_service.generate_blog_draft(
        topic=topic, tone=tone, keywords=keywords, target_category=category, model=model
    )


def generate_and_save_draft(topic, author_name, author_id=None, tone="friendly",
                             keywords=None, category=None, model=None):
    if not topic or not topic.strip():
        raise ValidationError("topic is required")
    if not author_name or not author_name.strip():
        raise ValidationError("author is required")

    draft = ai_service.generate_blog_draft(
        topic=topic, tone=tone, keywords=keywords, target_category=category, model=model
    )

    blog = Blog(
        title=draft["title"],
        slug=_unique_slug(draft["title"]),
        category=draft.get("category", "General"),
        author_name=author_name,
        author_id=author_id,
        excerpt=draft.get("excerpt"),
        content=draft.get("content", ""),
        ai_generated=True,
    )
    blog.touch_publish_state("draft")

    db.session.add(blog)
    db.session.commit()
    return blog
