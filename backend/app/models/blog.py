import re
import uuid
from datetime import datetime

from app.extensions import db


def slugify(title: str) -> str:
    slug = title.strip().lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug or uuid.uuid4().hex[:8]


class Blog(db.Model):
    __tablename__ = "blogs"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(280), nullable=False, unique=True, index=True)

    # Kept as a plain string category for simplicity. Swap for a FK to a
    # `categories` table later if you want managed category CRUD.
    category = db.Column(db.String(120), nullable=False, default="General", index=True)

    author_name = db.Column(db.String(120), nullable=False)
    # Optional link to whichever admin/staff user table you already have.
    author_id = db.Column(db.Integer, nullable=True)

    excerpt = db.Column(db.String(500), nullable=True)
    content = db.Column(db.Text, nullable=False, default="")

    cover_image_url = db.Column(db.String(500), nullable=True)

    # draft -> published -> archived
    status = db.Column(db.String(20), nullable=False, default="draft", index=True)

    # Was this post drafted/assisted by the AI Assistant tab?
    ai_generated = db.Column(db.Boolean, default=False, nullable=False)

    views = db.Column(db.Integer, default=0, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    published_at = db.Column(db.DateTime, nullable=True)

    def touch_publish_state(self, new_status: str):
        if new_status == "published" and self.status != "published":
            self.published_at = datetime.utcnow()
        self.status = new_status

    def to_dict(self, include_content: bool = False):
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "category": self.category,
            "author": self.author_name,
            "authorId": self.author_id,
            "excerpt": self.excerpt,
            "coverImage": self.cover_image_url,
            "status": self.status,
            "aiGenerated": self.ai_generated,
            "views": self.views,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "publishedAt": self.published_at.isoformat() if self.published_at else None,
        }
        if include_content:
            data["content"] = self.content
        return data
