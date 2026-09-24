import json

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class SubscriptionPlan(db.Model, TimestampMixin):
    __tablename__ = "subscription_plans"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    slug = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False, index=True)
    label = db.Column(db.String(120), nullable=False)
    tagline = db.Column(db.String(180), nullable=True, default="Flexible access")
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Integer, nullable=False, default=0)
    duration_days = db.Column(db.Integer, nullable=False, default=30)
    features = db.Column(db.Text, nullable=False, default="[]")
    popular = db.Column(db.Boolean, default=False, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    max_trips = db.Column(db.String(80), nullable=True, default="Unlimited")
    priority = db.Column(db.String(120), nullable=True, default="Priority placement")
    support = db.Column(db.String(120), nullable=True, default="Priority support")

    def feature_list(self):
        raw = self.features or "[]"
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError):
            parsed = [item.strip() for item in str(raw).split("\n") if item.strip()]

        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
        return []

    def to_dict(self):
        return {
            "id": self.slug,
            "slug": self.slug,
            "public_id": self.public_id,
            "name": self.name,
            "label": self.label,
            "tagline": self.tagline,
            "description": self.description,
            "price": self.price,
            "days": self.duration_days,
            "durationDays": self.duration_days,
            "features": self.feature_list(),
            "popular": self.popular,
            "active": self.active,
            "maxTrips": self.max_trips or "Unlimited",
            "priority": self.priority or "Priority placement",
            "support": self.support or "Priority support",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
