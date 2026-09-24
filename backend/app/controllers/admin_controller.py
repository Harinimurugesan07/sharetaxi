from datetime import datetime
from flask import request
from app.extensions import db
from flask_jwt_extended import get_jwt_identity
from app.middleware.auth_middleware import role_required
from app.services import admin_service, onboarding_service
from app.services.admin_service import AdminServiceError
from app.utils.response import success_response, error_response
from app.utils.constants import UserRole
from app.models.user import User
from app.utils.validators import is_valid_email, is_valid_password, is_valid_phone
from app.models.driver_payout_request import DriverPayoutRequest

def _driver_admin_dict(driver):
    data = driver.to_dict(include_documents=True)
    data["full_name"] = driver.user.full_name if driver.user else None
    data["email"] = driver.user.email if driver.user else None
    data["phone"] = driver.user.phone if driver.user else None
    data["address"] = driver.address
    data["city"] = driver.city
    data["state"] = driver.state
    data["postal_code"] = driver.postal_code
    data["country"] = driver.country
    data["is_active"] = driver.user.is_active if driver.user else None
    data["driver_type"] = "operator" if driver.operator_id is not None else "freelance"
    data["vehicles"] = [v.to_dict() for v in driver.vehicles]
    return data


def _customer_admin_dict(customer):
    data = customer.to_dict()
    data["full_name"] = customer.user.full_name if customer.user else None
    data["email"] = customer.user.email if customer.user else None
    data["phone"] = customer.user.phone if customer.user else None
    data["is_active"] = customer.user.is_active if customer.user else None
    return data


def _vehicle_admin_dict(vehicle):
    data = vehicle.to_dict()
    data["driver_name"] = vehicle.driver.user.full_name if vehicle.driver and vehicle.driver.user else None
    data["driver_id"] = vehicle.driver.public_id if vehicle.driver else None
    data["operator_id"] = vehicle.driver.operator.public_id if vehicle.driver and vehicle.driver.operator else None
    data["operator_name"] = vehicle.driver.operator.full_name if vehicle.driver and vehicle.driver.operator else None
    return data


@role_required(UserRole.ADMIN)
def dashboard():
    return success_response(admin_service.dashboard_stats())


@role_required(UserRole.ADMIN)
def create_operator():
    data = request.get_json(silent=True) or {}
    if data.get("email") and not is_valid_email(data["email"]):
        return error_response("Please provide a valid email address", 422)
    if data.get("phone") and not is_valid_phone(data["phone"]):
        return error_response("Please provide a valid 10-digit mobile number", 422)
    if data.get("password") and not is_valid_password(data["password"]):
        return error_response("Password must be at least 8 characters and include a letter and a number", 422)
    try:
        operator = admin_service.create_operator(data)
    except AdminServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response(operator.to_dict(), message="Operator created", status_code=201)


@role_required(UserRole.ADMIN)
def list_drivers():
    status_filter = request.args.get("status")
    try:
        drivers = admin_service.list_drivers(status_filter)
    except AdminServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response([_driver_admin_dict(d) for d in drivers])


@role_required(UserRole.ADMIN)
def update_driver_verification(driver_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    notes = data.get("notes")

    if not status:
        return error_response("status is required", 422)

    try:
        driver = admin_service.set_driver_verification(driver_id, status, notes)
    except AdminServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        _driver_admin_dict(driver), message=f"Driver verification set to {driver.verification_status}"
    )


@role_required(UserRole.ADMIN)
def list_vehicles():
    verified_param = request.args.get("verified")
    verified_filter = None
    if verified_param is not None:
        verified_filter = verified_param.lower() in ("true", "1", "yes")

    vehicles = admin_service.list_vehicles(verified_filter)
    return success_response([_vehicle_admin_dict(v) for v in vehicles])


@role_required(UserRole.ADMIN)
def update_vehicle_verification(vehicle_id):
    data = request.get_json(silent=True) or {}
    if "is_verified" not in data:
        return error_response("is_verified is required", 422)

    try:
        vehicle = admin_service.set_vehicle_verification(vehicle_id, data["is_verified"])
    except AdminServiceError as e:
        return error_response(e.message, e.status_code)

    return success_response(
        _vehicle_admin_dict(vehicle),
        message=f"Vehicle {'verified' if vehicle.is_verified else 'unverified'}",
    )


@role_required(UserRole.ADMIN)
def list_customers():
    customers = admin_service.list_customers()
    return success_response([_customer_admin_dict(c) for c in customers])


@role_required(UserRole.ADMIN)
def list_trips():
    status_filter = request.args.get("status")
    try:
        trips = admin_service.list_trips(status_filter)
    except AdminServiceError as e:
        return error_response(e.message, e.status_code)
    return success_response([t.to_dict(include_stops=True) for t in trips])


@role_required(UserRole.ADMIN)
def list_verification_requests():
    role = request.args.get("role")
    status = request.args.get("status")
    try:
        users = admin_service.verification_requests(role, status)
    except Exception as error:
        return error_response(str(error), 422)
    return success_response([
        {
            **user.to_dict(),
            "driver_profile": (
                {
                    **user.driver_profile.to_dict(),
                    "driver_type": "operator" if user.driver_profile.operator_id is not None else "freelance",
                }
                if user.driver_profile
                else None
            ),
            "documents": [document.to_dict() for document in user.verification_documents.order_by("created_at").all()],
        }
        for user in users
    ])


@role_required(UserRole.ADMIN)
def review_verification_document(document_id):
    data = request.get_json(silent=True) or {}
    try:
        admin = User.query.get(int(get_jwt_identity()))
        document = admin_service.review_verification_document(
            admin, document_id, data.get("status"), data.get("reason")
        )
    except Exception as error:
        status_code = getattr(error, "status_code", 422)
        return error_response(getattr(error, "message", str(error)), status_code)
    return success_response(document.to_dict(), message="Verification document reviewed")


@role_required(UserRole.ADMIN)
def review_verification_request(user_id):
    data = request.get_json(silent=True) or {}
    try:
        admin = User.query.get(int(get_jwt_identity()))
        user = onboarding_service.review_user_documents(
            admin, user_id, data.get("status"), data.get("reason")
        )
    except Exception as error:
        status_code = getattr(error, "status_code", 422)
        return error_response(getattr(error, "message", str(error)), status_code)
    return success_response(user.to_dict(), message=f"Verification set to {user.verification_status}")


@role_required(UserRole.ADMIN)
def list_subscriptions():
    subscriptions = admin_service.list_subscriptions(request.args.get("status"))
    return success_response([
        {
            **subscription.to_dict(),
            "user": {
                "id": subscription.user.public_id,
                "full_name": subscription.user.full_name,
                "email": subscription.user.email,
                "phone": subscription.user.phone,
                "role": subscription.user.role,
                "verification_status": subscription.user.verification_status,
                "subscription_status": subscription.user.subscription_status,
            },
        }
        for subscription in subscriptions
    ])


@role_required(UserRole.ADMIN)
def list_subscription_plans():
    plans = admin_service.list_subscription_plans()
    return success_response([plan.to_dict() for plan in plans])


@role_required(UserRole.ADMIN)
def create_subscription_plan():
    data = request.get_json(silent=True) or {}
    try:
        plan = admin_service.create_subscription_plan(data)
    except AdminServiceError as error:
        return error_response(error.message, error.status_code)
    return success_response(plan.to_dict(), message="Subscription plan created", status_code=201)


@role_required(UserRole.ADMIN)
def get_subscription_plan(plan_id):
    try:
        plan = admin_service.get_subscription_plan_or_404(plan_id)
    except AdminServiceError as error:
        return error_response(error.message, error.status_code)
    return success_response(plan.to_dict())


@role_required(UserRole.ADMIN)
def update_subscription_plan(plan_id):
    data = request.get_json(silent=True) or {}
    try:
        plan = admin_service.update_subscription_plan(plan_id, data)
    except AdminServiceError as error:
        return error_response(error.message, error.status_code)
    return success_response(plan.to_dict(), message="Subscription plan updated")


@role_required(UserRole.ADMIN)
def delete_subscription_plan(plan_id):
    try:
        admin_service.delete_subscription_plan(plan_id)
    except AdminServiceError as error:
        return error_response(error.message, error.status_code)
    return success_response(None, message="Subscription plan deleted")




@role_required(UserRole.ADMIN)
def financial_summary():
    try:
        summary = admin_service.financial_summary()

    except AdminServiceError as error:
        return error_response(
            error.message,
            error.status_code
        )

    return success_response(summary)


@role_required(UserRole.ADMIN)
def report_breakdown():
    try:
        return success_response(admin_service.paginated_report_breakdown(request.args))
    except (AdminServiceError, ValueError) as error:
        return error_response(getattr(error, "message", str(error)), getattr(error, "status_code", 422))


@role_required(UserRole.ADMIN)
def list_driver_payout_requests():
    status = request.args.get("status")

    try:
        requests = admin_service.get_driver_payout_requests(
            status=status
        )
    except Exception as e:
        return error_response(
            str(e),
            400,
        )

    return success_response(
        [
            payout_request.to_dict()
            for payout_request in requests
        ]
    )



@role_required(UserRole.ADMIN)
def approve_driver_payout_request(payout_request_id):
    try:
        payout_request = DriverPayoutRequest.query.filter_by(
            public_id=payout_request_id
        ).first()

        if not payout_request:
            return error_response(
                "Payout request not found",
                404,
            )

        if payout_request.status != "pending":
            return error_response(
                "Only pending payout requests can be approved",
                409,
            )

        payout_request.status = "approved"
        payout_request.admin_note = "Payout approved"
        payout_request.processed_at = datetime.utcnow()

        db.session.commit()

        return success_response(
            payout_request.to_dict(),
            message="Payout request approved",
        )

    except Exception as e:
        db.session.rollback()
        return error_response(
            str(e),
            400,
        )


@role_required(UserRole.ADMIN)
def reject_driver_payout_request(payout_request_id):
    data = request.get_json(silent=True) or {}

    admin_note = data.get("admin_note")

    try:
        payout_request = DriverPayoutRequest.query.filter_by(
            public_id=payout_request_id
        ).first()

        if not payout_request:
            return error_response(
                "Payout request not found",
                404,
            )

        payout_request, wallet, transaction = (
            admin_service.reject_driver_payout_request(
                payout_request,
                admin_note=admin_note,
            )
        )

        return success_response(
            {
                "payout_request": payout_request.to_dict(),
                "wallet": wallet.to_dict(),
                "transaction": transaction.to_dict(),
            },
            message="Payout request rejected",
        )

    except ValueError as e:
        db.session.rollback()

        return error_response(
            str(e),
            409,
        )

    except Exception as e:
        db.session.rollback()

        return error_response(
            str(e),
            400,
        )



@role_required(UserRole.ADMIN)
def process_driver_payout_request(payout_request_id):
    try:
        payout_request = DriverPayoutRequest.query.filter_by(
            public_id=payout_request_id
        ).first()

        if not payout_request:
            return error_response(
                "Payout request not found",
                404,
            )

        payout_request, wallet = (
            admin_service.process_driver_payout_request(
                payout_request
            )
        )

        return success_response(
            {
                "payout_request": payout_request.to_dict(),
                "wallet": wallet.to_dict() if wallet else None,
            },
            message="Payout processing started",
        )

    except ValueError as e:
        db.session.rollback()

        return error_response(
            str(e),
            409,
        )

    except Exception as e:
        db.session.rollback()

        return error_response(
            str(e),
            400,
        )



@role_required(UserRole.ADMIN)
def reconcile_driver_payout_request(payout_request_id):
    try:
        payout_request = DriverPayoutRequest.query.filter_by(
            public_id=payout_request_id
        ).first()

        if not payout_request:
            return error_response(
                "Payout request not found",
                404,
            )

        if not payout_request.razorpay_payout_id:
            return error_response(
                "RazorpayX payout ID not found",
                409,
            )

        payout_request, wallet = (
            admin_service.reconcile_driver_payout_request(
                payout_request
            )
        )

        return success_response(
            {
                "payout_request": payout_request.to_dict(),
                "wallet": (
                    wallet.to_dict()
                    if wallet
                    else None
                ),
            },
            message="Payout status reconciled",
        )

    except ValueError as e:
        db.session.rollback()

        return error_response(
            str(e),
            409,
        )

    except Exception as e:
        db.session.rollback()

        return error_response(
            str(e),
            400,
        )