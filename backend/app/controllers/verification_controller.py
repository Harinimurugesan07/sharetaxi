from flask import current_app, request
from flask_jwt_extended import get_jwt_identity

from app.middleware.auth_middleware import role_required
from app.services import verification_service
from app.services.verification_service import VerificationServiceError
from app.utils.response import success_response, error_response
from app.utils.constants import UserRole

ALLOWED_DOCUMENT_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}


@role_required(UserRole.DRIVER)
def list_my_documents():
    user_id = int(get_jwt_identity())
    docs = verification_service.list_my_documents(user_id)
    return success_response([d.to_dict() for d in docs])


@role_required(UserRole.DRIVER)
def upload_document():
    user_id = int(get_jwt_identity())
    document_type = request.form.get("document_type")
    file = request.files.get("file")

    try:
        document = verification_service.upload_or_resubmit_document(
            user_id=user_id,
            document_type=document_type,
            file_storage=file,
            upload_folder=current_app.config["UPLOAD_FOLDER"],
            allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS,
        )
    except VerificationServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(document.to_dict(), message="Document uploaded and sent for review")