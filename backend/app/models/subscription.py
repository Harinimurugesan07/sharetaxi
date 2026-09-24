from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class Subscription(db.Model, TimestampMixin):
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    plan = db.Column(db.String(40), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="inactive", index=True)
    payment_reference = db.Column(db.String(120), nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref=db.backref("subscriptions", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.public_id,
            "plan": self.plan,
            "status": self.status,
            "payment_reference": self.payment_reference,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }