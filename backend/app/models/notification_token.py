from app.extensions import db
from app.models import TimestampMixin, gen_uuid


class NotificationToken(db.Model, TimestampMixin):
    __tablename__ = "notification_tokens"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    platform = db.Column(db.String(30), nullable=False, default="web")
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)

    user = db.relationship("User", backref=db.backref("notification_tokens", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.public_id,
            "user_id": self.user_id,
            "token": self.token,
            "platform": self.platform,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
