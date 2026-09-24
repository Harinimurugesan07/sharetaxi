import re
from datetime import datetime
from sqlalchemy import or_
from app.extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.operator_settlement import OperatorSettlement
from app.models.payment import Payment
from app.models.operator_settlement_transaction import OperatorSettlementTransaction
from app.models.vehicle_expense import VehicleExpense
from app.utils.constants import UserRole, DriverStatus, TripStatus
from app.services.onboarding_service import list_verification_requests, review_document, required_documents_for
from app.models.verification_document import VerificationDocument
from app.models.subscription import Subscription
from app.models.subscription_plan import SubscriptionPlan
from app.models.driver_payout_request import DriverPayoutRequest
from app.services import razorpayx_service
from app.models.driver_wallet import DriverWallet
from app.models.driver_wallet_transaction import DriverWalletTransaction

class AdminServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def create_operator(data):
    required = ["full_name", "email", "phone", "password"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        raise AdminServiceError(f"Missing required fields: {', '.join(missing)}", 422)

    email = data["email"].strip().lower()
    phone = data["phone"].strip()
    if User.query.filter((User.email == email) | (User.phone == phone)).first():
        raise AdminServiceError("An account with this email or phone already exists", 409)

    operator = User(
        full_name=data["full_name"].strip(),
        email=email,
        phone=phone,
        role=UserRole.OPERATOR,
    )
    operator.set_password(data["password"])
    db.session.add(operator)
    db.session.commit()
    return operator


def dashboard_stats():
    return {
        "total_passengers": Customer.query.count(),
        "total_drivers": Driver.query.count(),
        "drivers_pending_verification": Driver.query.filter_by(
            verification_status=DriverStatus.PENDING
        ).count(),
        "drivers_verified": Driver.query.filter_by(
            verification_status=DriverStatus.VERIFIED
        ).count(),
        "total_vehicles": Vehicle.query.count(),
        "vehicles_pending_verification": Vehicle.query.filter_by(is_verified=False).count(),
        "total_trips": Trip.query.count(),
        "trips_scheduled": Trip.query.filter_by(status=TripStatus.SCHEDULED).count(),
        "trips_ongoing": Trip.query.filter_by(status=TripStatus.ONGOING).count(),
        "trips_completed": Trip.query.filter_by(status=TripStatus.COMPLETED).count(),
    }


def list_drivers(status_filter=None):
    query = Driver.query
    if status_filter:
        if status_filter not in DriverStatus.ALL:
            raise AdminServiceError(f"status must be one of {DriverStatus.ALL}", 422)
        query = query.filter_by(verification_status=status_filter)
    return query.order_by(Driver.created_at.desc()).all()


def get_driver_or_404(driver_public_id):
    driver = Driver.query.filter_by(public_id=driver_public_id).first()
    if not driver:
        raise AdminServiceError("Driver not found", 404)
    return driver


def set_driver_verification(driver_public_id, status, notes=None):
    if status not in (DriverStatus.VERIFIED, DriverStatus.REJECTED, DriverStatus.SUSPENDED):
        raise AdminServiceError(
            f"status must be one of ['{DriverStatus.VERIFIED}', '{DriverStatus.REJECTED}', '{DriverStatus.SUSPENDED}']",
            422,
        )
    driver = get_driver_or_404(driver_public_id)
    if status == DriverStatus.VERIFIED:
        latest = {}
        for document in VerificationDocument.query.filter_by(user_id=driver.user_id).order_by(VerificationDocument.created_at.desc()).all():
            latest.setdefault(document.document_type, document)
        required = required_documents_for(driver.user)
        if not required or not all(latest.get(kind) and latest[kind].status == "verified" for kind in required):
            raise AdminServiceError("All required verification documents must be approved first", 409)
    driver.verification_status = status
    driver.verification_notes = notes
    driver.verified_at = datetime.utcnow() if status == DriverStatus.VERIFIED else None
    driver.user.verification_status = "verified" if status == DriverStatus.VERIFIED else status
    driver.user.verification_notes = notes
    driver.user.verified_at = driver.verified_at
    db.session.commit()
    return driver


def list_vehicles(verified_filter=None):
    query = Vehicle.query
    if verified_filter is not None:
        query = query.filter_by(is_verified=verified_filter)
    return query.order_by(Vehicle.created_at.desc()).all()


def set_vehicle_verification(vehicle_public_id, is_verified):
    vehicle = Vehicle.query.filter_by(public_id=vehicle_public_id).first()
    if not vehicle:
        raise AdminServiceError("Vehicle not found", 404)
    vehicle.is_verified = bool(is_verified)
    db.session.commit()
    return vehicle


def list_customers():
    return Customer.query.order_by(Customer.created_at.desc()).all()


def list_trips(status_filter=None):
    query = Trip.query
    if status_filter:
        if status_filter not in TripStatus.ALL:
            raise AdminServiceError(f"status must be one of {TripStatus.ALL}", 422)
        query = query.filter_by(status=status_filter)
    return query.order_by(Trip.departure_time.desc()).all()


def verification_requests(role=None, status=None):
    return list_verification_requests(role, status)


def review_verification_document(admin, document_id, status, reason=None):
    return review_document(admin, document_id, status, reason)


def list_subscriptions(status_filter=None):
    query = Subscription.query.join(User).filter(
        User.role.in_([UserRole.DRIVER, UserRole.OPERATOR])
    )
    if status_filter:
        query = query.filter(Subscription.status == status_filter)
    return query.order_by(Subscription.created_at.desc()).all()


def _slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    slug = slug.strip("-")
    return slug or "plan"


def _plan_feature_list(raw):
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    if isinstance(raw, str):
        return [item.strip() for item in re.split(r"\n|,\s*\|\s*|\|\s*|,\s*", raw) if item.strip()]
    return []


def _normalize_plan_payload(data):
    payload = data or {}
    name = str(payload.get("name") or payload.get("label") or "").strip()
    if not name:
        raise AdminServiceError("Plan name is required", 422)

    price = payload.get("price")
    try:
        price_value = int(float(price)) if price not in (None, "") else 0
    except (TypeError, ValueError):
        raise AdminServiceError("Plan price must be a valid number", 422)

    duration = payload.get("durationDays") if payload.get("durationDays") is not None else payload.get("days")
    try:
        duration_value = int(float(duration)) if duration not in (None, "") else 30
    except (TypeError, ValueError):
        raise AdminServiceError("Plan duration must be a valid number of days", 422)

    fallback_limit = payload.get("limits") or {}
    slug = str(payload.get("slug") or payload.get("id") or _slugify(name)).strip()
    plan_slug = _slugify(slug)

    return {
        "slug": plan_slug,
        "name": name,
        "label": str(payload.get("label") or name).strip() or name,
        "tagline": str(payload.get("tagline") or "Flexible access").strip() or "Flexible access",
        "description": str(payload.get("description") or "").strip(),
        "price": max(0, price_value),
        "duration_days": max(1, duration_value),
        "features": _plan_feature_list(payload.get("features") or payload.get("featureList") or []),
        "popular": bool(payload.get("popular", False)),
        "active": payload.get("active", True) is not False,
        "max_trips": str((fallback_limit.get("maxTrips") if isinstance(fallback_limit, dict) else payload.get("maxTrips")) or "Unlimited").strip() or "Unlimited",
        "priority": str((fallback_limit.get("priority") if isinstance(fallback_limit, dict) else payload.get("priority")) or "Priority placement").strip() or "Priority placement",
        "support": str((fallback_limit.get("support") if isinstance(fallback_limit, dict) else payload.get("support")) or "Priority support").strip() or "Priority support",
    }


def list_subscription_plans():
    return SubscriptionPlan.query.order_by(SubscriptionPlan.price.asc(), SubscriptionPlan.created_at.desc()).all()


def get_subscription_plan_or_404(plan_id):
    plan = SubscriptionPlan.query.filter(
        or_(SubscriptionPlan.slug == str(plan_id), SubscriptionPlan.public_id == str(plan_id))
    ).first()
    if not plan:
        raise AdminServiceError("Subscription plan not found", 404)
    return plan


def create_subscription_plan(data):
    payload = _normalize_plan_payload(data)
    if SubscriptionPlan.query.filter_by(slug=payload["slug"]).first():
        raise AdminServiceError("A plan with this slug already exists", 409)

    plan = SubscriptionPlan(
        slug=payload["slug"],
        name=payload["name"],
        label=payload["label"],
        tagline=payload["tagline"],
        description=payload["description"],
        price=payload["price"],
        duration_days=payload["duration_days"],
        features=str(payload["features"]),
        popular=payload["popular"],
        active=payload["active"],
        max_trips=payload["max_trips"],
        priority=payload["priority"],
        support=payload["support"],
    )
    db.session.add(plan)
    db.session.commit()
    return plan


def update_subscription_plan(plan_id, data):
    plan = get_subscription_plan_or_404(plan_id)
    payload = _normalize_plan_payload({**plan.to_dict(), **(data or {})})

    if payload["slug"] != plan.slug and SubscriptionPlan.query.filter_by(slug=payload["slug"]).first():
        raise AdminServiceError("A plan with this slug already exists", 409)

    plan.slug = payload["slug"]
    plan.name = payload["name"]
    plan.label = payload["label"]
    plan.tagline = payload["tagline"]
    plan.description = payload["description"]
    plan.price = payload["price"]
    plan.duration_days = payload["duration_days"]
    plan.features = str(payload["features"])
    plan.popular = payload["popular"]
    plan.active = payload["active"]
    plan.max_trips = payload["max_trips"]
    plan.priority = payload["priority"]
    plan.support = payload["support"]
    db.session.commit()
    return plan


def delete_subscription_plan(plan_id):
    plan = get_subscription_plan_or_404(plan_id)
    db.session.delete(plan)
    db.session.commit()
    return plan



def financial_summary():
    settlements = OperatorSettlement.query.all()

    transactions = (
        OperatorSettlementTransaction.query
        .filter_by(status="processed")
        .all()
    )

    expenses = (
        VehicleExpense.query
        .filter_by(status="approved")
        .all()
    )

    payments = (
        Payment.query
        .filter_by(status="paid")
        .all()
    )

    total_ride_revenue = sum(
        (payment.gross_amount or 0)
        for payment in payments
    )

    total_admin_amount = sum(
        (payment.admin_amount or 0)
        for payment in payments
    )

    total_operator_share = sum(
        (payment.operator_amount or 0)
        for payment in payments
    )

    total_driver_earnings = sum(
        (payment.driver_amount or 0)
        for payment in payments
    )

    total_driver_paid = sum(
        (transaction.amount or 0)
        for transaction in transactions
    )

    total_vehicle_expenses = sum(
        (expense.amount or 0)
        for expense in expenses
    )

    pending_driver_earnings = sum(
        (settlement.driver_earnings or 0)
        for settlement in settlements
        if settlement.status == "pending"
    )

    settled_operator_share = sum(
        (settlement.operator_share or 0)
        for settlement in settlements
        if settlement.status == "settled"
    )

    net_operator_amount = (
        total_operator_share - total_vehicle_expenses
    )

    return {
        "total_ride_revenue": float(total_ride_revenue),
        "total_admin_amount": float(total_admin_amount),
        "total_driver_earnings": float(total_driver_earnings),
        "total_operator_share": float(total_operator_share),
        "total_driver_paid": float(total_driver_paid),
        "pending_driver_earnings": float(pending_driver_earnings),
        "settled_operator_share": float(settled_operator_share),
        "total_vehicle_expenses": float(total_vehicle_expenses),
        "net_operator_amount": float(net_operator_amount),
    }


def get_driver_payout_requests(status=None):
    """
    Return driver payout requests for the admin.

    Optional status filter:
        pending
        approved
        rejected
        processing
        paid
    """

    query = DriverPayoutRequest.query

    if status:
        query = query.filter_by(
            status=status.strip().lower()
        )

    return (
        query
        .order_by(
            DriverPayoutRequest.created_at.desc()
        )
        .all()
    )


def reject_driver_payout_request(
    payout_request,
    admin_note=None,
):
    """
    Reject a pending payout request and release
    the reserved wallet balance back to the driver.
    """

    from app.models.driver_wallet import DriverWallet
    from app.models.driver_wallet_transaction import (
        DriverWalletTransaction,
    )

    if payout_request.status != "pending":
        raise ValueError(
            "Only pending payout requests can be rejected"
        )

    wallet = (
        DriverWallet.query
        .filter_by(
            driver_id=payout_request.driver_id
        )
        .with_for_update()
        .first()
    )

    if not wallet:
        raise ValueError(
            "Driver wallet not found"
        )

    amount = payout_request.amount

    wallet.available_balance += amount

    payout_request.status = "rejected"
    payout_request.admin_note = (
        admin_note.strip()
        if admin_note
        else "Payout request rejected"
    )
    payout_request.processed_at = datetime.utcnow()

    transaction = DriverWalletTransaction(
        wallet_id=wallet.id,
        driver_id=payout_request.driver_id,
        transaction_type="PAYOUT_RELEASE",
        amount=amount,
        balance_after=wallet.available_balance,
        reference=payout_request.public_id,
        description="Rejected payout amount released",
        status="completed",
    )

    db.session.add(transaction)

    db.session.commit()

    return payout_request, wallet, transaction


def process_driver_payout_request(payout_request):
    if payout_request.status != "approved":
        raise ValueError(
            "Only approved payout requests can be processed"
        )

    payout_request.status = "processing"
    payout_request.payout_error = None
    db.session.commit()

    try:
        response = razorpayx_service.create_payout(
            payout_request
        )

        payout_id = response.get("id")

        if not payout_id:
            raise ValueError(
                "RazorpayX did not return a payout ID"
            )

        payout_request.razorpay_payout_id = payout_id

        razorpay_status = (
            response.get("status") or ""
        ).lower()

        if razorpay_status in (
            "processed",
            "completed",
            "paid",
        ):
            payout_request.status = "paid"

            payout_request.processed_at = datetime.utcnow()

            wallet = (
                DriverWallet.query
                .filter_by(
                    driver_id=payout_request.driver_id
                )
                .with_for_update()
                .first()
            )

            if wallet:
                wallet.total_withdrawn += payout_request.amount

            db.session.commit()

            return payout_request, wallet

        db.session.commit()

        return payout_request, None

    except Exception as error:
        db.session.rollback()

        payout_request = (
            DriverPayoutRequest.query
            .filter_by(id=payout_request.id)
            .with_for_update()
            .first()
        )

        payout_request.status = "failed"
        payout_request.payout_error = str(error)[:1000]
        payout_request.processed_at = datetime.utcnow()

        wallet = (
            DriverWallet.query
            .filter_by(
                driver_id=payout_request.driver_id
            )
            .with_for_update()
            .first()
        )

        if wallet:
            wallet.available_balance += payout_request.amount

            transaction = DriverWalletTransaction(
                wallet_id=wallet.id,
                driver_id=payout_request.driver_id,
                transaction_type="PAYOUT_RELEASE",
                amount=payout_request.amount,
                balance_after=wallet.available_balance,
                reference=payout_request.public_id,
                description="Failed payout amount released",
                status="completed",
            )

            db.session.add(transaction)

        db.session.commit()

        raise ValueError(
            f"Payout failed: {payout_request.payout_error}"
        )

    

def reconcile_driver_payout_request(payout_request):
    """
    Reconcile an existing RazorpayX payout with its current
    provider status.

    This function is only for payout requests that already have
    a RazorpayX payout ID.
    """

    if not payout_request.razorpay_payout_id:
        raise ValueError(
            "RazorpayX payout ID not found"
        )

    if payout_request.status == "paid":
        wallet = (
            DriverWallet.query
            .filter_by(
                driver_id=payout_request.driver_id
            )
            .first()
        )

        return payout_request, wallet

    response = razorpayx_service.get_payout(
        payout_request.razorpay_payout_id
    )

    razorpay_status = (
        response.get("status") or ""
    ).strip().lower()

    success_statuses = {
        "processed",
        "completed",
        "paid",
    }

    in_flight_statuses = {
        "queued",
        "pending",
        "processing",
        "created",
    }

    failed_statuses = {
        "failed",
        "cancelled",
        "canceled",
        "reversed",
    }

    # -----------------------------------------
    # SUCCESS
    # -----------------------------------------

    if razorpay_status in success_statuses:

        payout_request.status = "paid"
        payout_request.payout_error = None
        payout_request.processed_at = datetime.utcnow()

        wallet = (
            DriverWallet.query
            .filter_by(
                driver_id=payout_request.driver_id
            )
            .with_for_update()
            .first()
        )

        if not wallet:
            raise ValueError(
                "Driver wallet not found"
            )

        # Prevent double counting if reconciliation
        # is accidentally called more than once.
        already_withdrawn = (
            DriverWalletTransaction.query
            .filter_by(
                driver_id=payout_request.driver_id,
                reference=payout_request.public_id,
                transaction_type="PAYOUT_COMPLETED",
            )
            .first()
        )

        if not already_withdrawn:
            wallet.total_withdrawn += (
                payout_request.amount
            )

            transaction = DriverWalletTransaction(
                wallet_id=wallet.id,
                driver_id=payout_request.driver_id,
                transaction_type="PAYOUT_COMPLETED",
                amount=-payout_request.amount,
                balance_after=wallet.available_balance,
                reference=payout_request.public_id,
                description="Driver payout completed",
                status="completed",
            )

            db.session.add(transaction)

        db.session.commit()

        return payout_request, wallet

    # -----------------------------------------
    # STILL PROCESSING
    # -----------------------------------------

    if razorpay_status in in_flight_statuses:

        payout_request.status = "processing"
        payout_request.payout_error = None

        db.session.commit()

        return payout_request, None

    # -----------------------------------------
    # FAILURE / REVERSAL
    # -----------------------------------------

    if razorpay_status in failed_statuses:

        wallet = (
            DriverWallet.query
            .filter_by(
                driver_id=payout_request.driver_id
            )
            .with_for_update()
            .first()
        )

        if not wallet:
            raise ValueError(
                "Driver wallet not found"
            )

        payout_request.status = "failed"

        payout_request.payout_error = (
            f"RazorpayX payout status: "
            f"{razorpay_status}"
        )

        payout_request.processed_at = datetime.utcnow()

        # Prevent releasing the same payout twice.
        already_released = (
            DriverWalletTransaction.query
            .filter_by(
                driver_id=payout_request.driver_id,
                reference=payout_request.public_id,
                transaction_type="PAYOUT_RELEASE",
            )
            .first()
        )

        if not already_released:
            wallet.available_balance += (
                payout_request.amount
            )

            transaction = DriverWalletTransaction(
                wallet_id=wallet.id,
                driver_id=payout_request.driver_id,
                transaction_type="PAYOUT_RELEASE",
                amount=payout_request.amount,
                balance_after=wallet.available_balance,
                reference=payout_request.public_id,
                description=(
                    "Failed RazorpayX payout amount released"
                ),
                status="completed",
            )

            db.session.add(transaction)

        db.session.commit()

        return payout_request, wallet

    # -----------------------------------------
    # UNKNOWN PROVIDER STATUS
    # -----------------------------------------

    payout_request.status = "processing"

    payout_request.payout_error = (
        f"Unknown RazorpayX payout status: "
        f"{razorpay_status or 'unknown'}"
    )

    db.session.commit()

    return payout_request, None