from app.models.verification_document import DOCUMENT_TYPES
from app.services.onboarding_service import DRIVER_REQUIRED_DOCUMENTS


def test_driver_document_types_include_address_proof():
    assert "address_proof" in DOCUMENT_TYPES
    assert "address_proof" in DRIVER_REQUIRED_DOCUMENTS
