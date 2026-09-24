from datetime import datetime

from app.extensions import db
from app.models import TimestampMixin, gen_uuid


DOCUMENT_TYPES = (
    "profile_photo",
    "driving_license",
    "government_id",
    "address_proof",
    "vehicle_rc",
    "insurance",
    "puc",
    "other_vehicle_document",
)
DOCUMENT_STATUSES = ("pending", "verified", "rejected")


class VerificationDocument(db.Model, TimestampMixin):
    __tablename__ = "verification_documents"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    document_type = db.Column(db.String(40), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", foreign_keys=[user_id], backref=db.backref("verification_documents", lazy="dynamic"))
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            "id": self.public_id,
            "document_type": self.document_type,
            "file_url": self.file_url,
            "status": self.status,
            "rejection_reason": self.rejection_reason,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }