import os
import uuid

from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.verification_document import VerificationDocument, DOCUMENT_TYPES
from app.services import driver_service


class VerificationServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _save_file(file_storage, upload_folder, allowed_extensions):
    if not file_storage or file_storage.filename == "":
        raise VerificationServiceError("No file provided", 400)

    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in allowed_extensions:
        raise VerificationServiceError(
            f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(allowed_extensions))}", 400
        )

    os.makedirs(upload_folder, exist_ok=True)
    filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
    file_storage.save(os.path.join(upload_folder, filename))
    return f"/uploads/{filename}"


def list_my_documents(user_id):
    return (
        VerificationDocument.query.filter_by(user_id=user_id)
        .order_by(VerificationDocument.created_at.desc())
        .all()
    )


def upload_or_resubmit_document(user_id, document_type, file_storage, upload_folder, allowed_extensions):
    if document_type not in DOCUMENT_TYPES:
        raise VerificationServiceError(
            f"Invalid document_type. Must be one of: {', '.join(DOCUMENT_TYPES)}", 400
        )

    file_url = _save_file(file_storage, upload_folder, allowed_extensions)

    existing = VerificationDocument.query.filter_by(
        user_id=user_id, document_type=document_type
    ).first()

    if existing:
        # Resubmission: overwrite the previous attempt and send it back to
        # "pending" so it re-enters the review queue, clearing the old
        # rejection so the UI doesn't show a stale reason next to a new file.
        existing.file_url = file_url
        existing.status = "pending"
        existing.rejection_reason = None
        existing.reviewed_by = None
        existing.reviewed_at = None
        document = existing
    else:
        document = VerificationDocument(
            user_id=user_id,
            document_type=document_type,
            file_url=file_url,
            status="pending",
        )
        db.session.add(document)

    db.session.commit()
    _reopen_driver_review_if_rejected(user_id)
    return document


def _reopen_driver_review_if_rejected(user_id):
    """
    If the driver's overall status was 'rejected', a fresh document upload
    should move them back to 'pending' rather than leaving the dashboard
    stuck showing 'Rejected' after they've already fixed it. Best-effort:
    never let a hiccup here fail the upload itself.
    """
    try:
        driver = driver_service.get_driver_by_user_id(user_id)
    except Exception:
        return
    if driver and getattr(driver, "verification_status", None) == "rejected":
        driver.verification_status = "pending"
        db.session.commit()