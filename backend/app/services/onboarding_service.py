from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

import razorpay
from flask import current_app
from werkzeug.utils import secure_filename
import cloudinary
import cloudinary.uploader

from app.extensions import db
from app.models.user import User
from app.models.verification_document import (
    DOCUMENT_STATUSES,
    DOCUMENT_TYPES,
    VerificationDocument,
)
from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.utils.constants import UserRole


DRIVER_REQUIRED_DOCUMENTS = {
    "profile_photo",
    "driving_license",
    "government_id",
    "address_proof",
}
OPERATOR_REQUIRED_DOCUMENTS = {"profile_photo", "government_id", "other_vehicle_document"}
PLAN_DAYS = {"weekly": 7, "monthly": 30, "yearly": 365}
PLAN_PRICES = {"weekly": 199, "monthly": 599, "yearly": 4999}


def get_active_subscription_plans():
    return SubscriptionPlan.query.filter_by(active=True).order_by(SubscriptionPlan.price.asc()).all()


def get_subscription_plan_by_slug(plan_slug):
    if not plan_slug:
        return None
    return SubscriptionPlan.query.filter_by(slug=str(plan_slug), active=True).first()


class OnboardingError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def required_documents_for(user):
    if user.role == UserRole.DRIVER:
        return DRIVER_REQUIRED_DOCUMENTS
    if user.role == UserRole.OPERATOR:
        return OPERATOR_REQUIRED_DOCUMENTS
    return set()


def get_onboarding(user):
    documents = VerificationDocument.query.filter_by(user_id=user.id).order_by(
        VerificationDocument.document_type.asc(), VerificationDocument.created_at.desc()
    ).all()
    latest = {}
    for document in documents:
        latest.setdefault(document.document_type, document)
    return {
        "verification_status": user.verification_status,
        "verification_notes": user.verification_notes,
        "verified_at": user.verified_at.isoformat() if user.verified_at else None,
        "subscription_status": user.subscription_status,
        "subscription_plan": user.subscription_plan,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "required_documents": sorted(required_documents_for(user)),
        "documents": [document.to_dict() for document in latest.values()],
    }


def submit_document(user, document_type, uploaded_file):
    if user.role not in (UserRole.DRIVER, UserRole.OPERATOR):
        raise OnboardingError("Only driver and operator accounts require verification", 403)
    if document_type not in DOCUMENT_TYPES:
        raise OnboardingError(f"document_type must be one of {DOCUMENT_TYPES}", 422)
    if not uploaded_file or not uploaded_file.filename:
        raise OnboardingError("A document file is required", 422)

    extension = Path(secure_filename(uploaded_file.filename)).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".pdf"}:
        raise OnboardingError("Documents must be JPG, PNG, or PDF files", 422)

    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )
    if not all((cloudinary.config().cloud_name, cloudinary.config().api_key, cloudinary.config().api_secret)):
        raise OnboardingError("Cloudinary storage is not configured on the server", 503)

    try:
        upload_result = cloudinary.uploader.upload(
            uploaded_file,
            resource_type="raw" if extension == ".pdf" else "image",
            folder=f"sharetaxi/verification/{user.public_id}",
            public_id=f"{document_type}-{uuid4().hex}",
            use_filename=False,
            unique_filename=False,
            overwrite=False,
        )
    except Exception as error:
        raise OnboardingError(f"Document upload failed: {error}", 502) from error

    existing = VerificationDocument.query.filter_by(
        user_id=user.id, document_type=document_type
    ).order_by(VerificationDocument.created_at.desc()).first()
    document = VerificationDocument(
        user_id=user.id,
        document_type=document_type,
        file_url=upload_result["secure_url"],
        status="pending",
        rejection_reason=None,
    )
    db.session.add(document)
    user.verification_status = "pending"
    user.verification_notes = None
    if existing and existing.status == "rejected":
        existing.status = "replaced"
    db.session.commit()
    return document


def recompute_verification(user):
    required = required_documents_for(user)
    latest = {}
    documents = VerificationDocument.query.filter_by(user_id=user.id).order_by(
        VerificationDocument.created_at.desc()
    ).all()
    for document in documents:
        latest.setdefault(document.document_type, document)

    if any(latest.get(kind) and latest[kind].status == "rejected" for kind in required):
        user.verification_status = "rejected"
    elif required and all(latest.get(kind) and latest[kind].status == "verified" for kind in required):
        user.verification_status = "verified"
        user.verification_notes = None
        user.verified_at = datetime.utcnow()
    else:
        user.verification_status = "pending"
        user.verified_at = None
    if user.driver_profile:
        user.driver_profile.verification_status = user.verification_status
        user.driver_profile.verification_notes = user.verification_notes
        user.driver_profile.verified_at = user.verified_at
    db.session.commit()
    return user


def review_document(admin, document_public_id, status, reason=None):
    if status not in DOCUMENT_STATUSES:
        raise OnboardingError(f"status must be one of {DOCUMENT_STATUSES}", 422)
    if status == "rejected" and not (reason or "").strip():
        raise OnboardingError("A rejection reason is required", 422)
    document = VerificationDocument.query.filter_by(public_id=document_public_id).first()
    if not document:
        raise OnboardingError("Verification document not found", 404)
    document.status = status
    document.rejection_reason = reason.strip() if reason else None
    document.reviewed_by = admin.id
    document.reviewed_at = datetime.utcnow()
    if status == "rejected":
        document.user.verification_notes = document.rejection_reason
    recompute_verification(document.user)
    return document


def review_user_documents(admin, user_public_id, status, reason=None):
    if status not in DOCUMENT_STATUSES:
        raise OnboardingError(f"status must be one of {DOCUMENT_STATUSES}", 422)
    if status == "rejected" and not (reason or "").strip():
        raise OnboardingError("A rejection reason is required", 422)

    user = User.query.filter_by(public_id=user_public_id).first()
    if not user or user.role not in (UserRole.DRIVER, UserRole.OPERATOR):
        raise OnboardingError("Verification request not found", 404)

    documents = VerificationDocument.query.filter_by(user_id=user.id).all()
    if not documents:
        raise OnboardingError("The user has not submitted any documents", 409)

    reviewed_at = datetime.utcnow()
    clean_reason = reason.strip() if reason else None
    for document in documents:
        document.status = status
        document.rejection_reason = clean_reason
        document.reviewed_by = admin.id
        document.reviewed_at = reviewed_at

    user.verification_status = status
    user.verification_notes = clean_reason
    user.verified_at = reviewed_at if status == "verified" else None
    if user.driver_profile:
        user.driver_profile.verification_status = status
        user.driver_profile.verification_notes = clean_reason
        user.driver_profile.verified_at = user.verified_at
    db.session.commit()
    return user


def list_verification_requests(role=None, status=None):
    query = User.query.filter(User.role.in_([UserRole.DRIVER, UserRole.OPERATOR]))
    if role:
        query = query.filter_by(role=role)
    if status:
        query = query.filter_by(verification_status=status)
    return query.order_by(User.created_at.desc()).all()


def _razorpay_client():
    if not current_app.config["RAZORPAY_KEY_ID"] or not current_app.config["RAZORPAY_KEY_SECRET"]:
        raise OnboardingError("Razorpay is not configured on the server", 503)
    return razorpay.Client(
        auth=(current_app.config["RAZORPAY_KEY_ID"], current_app.config["RAZORPAY_KEY_SECRET"])
    )


def create_subscription_order(user, plan):
    if user.role not in (UserRole.DRIVER, UserRole.OPERATOR):
        raise OnboardingError("Subscriptions are only available to drivers and operators", 403)
    if user.is_operator_owned_driver():
        raise OnboardingError("Subscription is not required for operator-owned drivers", 403)
    if user.verification_status != "verified":
        raise OnboardingError("Your documents must be verified before subscribing", 403)

    selected_plan = get_subscription_plan_by_slug(plan)
    if not selected_plan:
        raise OnboardingError("Selected plan is not available", 422)

    try:
        return _razorpay_client().order.create({
            "amount": selected_plan.price * 100,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {"user_id": str(user.id), "plan": selected_plan.slug},
        })
    except Exception as error:
        raise OnboardingError(f"Unable to create payment order: {error}", 502) from error


def verify_subscription_payment(user, plan, payment_id, order_id, signature):
    if not payment_id or not order_id or not signature:
        raise OnboardingError("Payment details are incomplete", 422)

    selected_plan = get_subscription_plan_by_slug(plan)
    if not selected_plan:
        raise OnboardingError("Selected plan is not available", 422)

    try:
        client = _razorpay_client()
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
        order = client.order.fetch(order_id)
        if order.get("amount") != selected_plan.price * 100 or order.get("currency") != "INR":
            raise OnboardingError("Payment amount does not match the selected plan", 400)
    except razorpay.errors.SignatureVerificationError as error:
        raise OnboardingError("Payment verification failed", 400) from error
    except OnboardingError:
        raise
    except Exception as error:
        raise OnboardingError(f"Unable to verify payment: {error}", 502) from error

    return activate_subscription(user, selected_plan.slug, payment_id)


def activate_subscription(user, plan, payment_reference=None):
    if user.role not in (UserRole.DRIVER, UserRole.OPERATOR):
        raise OnboardingError("Subscriptions are only available to drivers and operators", 403)
    if user.is_operator_owned_driver():
        raise OnboardingError("Subscription is not required for operator-owned drivers", 403)
    if user.verification_status != "verified":
        raise OnboardingError("Your documents must be verified before subscribing", 403)

    selected_plan = get_subscription_plan_by_slug(plan)
    if not selected_plan:
        raise OnboardingError("Selected plan is not available", 422)

    started = datetime.utcnow()
    expires = started + timedelta(days=selected_plan.duration_days)
    subscription = Subscription(
        user_id=user.id,
        plan=selected_plan.slug,
        status="active",
        payment_reference=payment_reference,
        started_at=started,
        expires_at=expires,
    )
    db.session.add(subscription)
    user.subscription_status = "active"
    user.subscription_plan = selected_plan.slug
    user.subscription_started_at = started
    user.subscription_expires_at = expires
    db.session.commit()
    return subscription


def expire_subscriptions():
    now = datetime.utcnow()
    users = User.query.filter(
        User.subscription_status == "active",
        User.subscription_expires_at < now,
    ).all()
    for user in users:
        user.subscription_status = "expired"
        latest = user.subscriptions.order_by(Subscription.created_at.desc()).first()
        if latest:
            latest.status = "expired"
    db.session.commit()
