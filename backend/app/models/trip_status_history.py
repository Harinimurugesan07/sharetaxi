from app.extensions import db
from app.models import TimestampMixin


class TripStatusHistory(db.Model, TimestampMixin):
    __tablename__ = "trip_status_history"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, index=True)
    changed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    old_status = db.Column(db.String(20), nullable=True)
    new_status = db.Column(db.String(20), nullable=False)
    changed_at = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.Text, nullable=True)

    changed_by = db.relationship("User", backref=db.backref("trip_status_changes", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "old_status": self.old_status,
            "new_status": self.new_status,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
            "reason": self.reason,
            "changed_by_user_id": self.changed_by.public_id if self.changed_by else None,
            "changed_by_name": self.changed_by.full_name if self.changed_by else None,
        }
