from flask import request
from flask_jwt_extended import get_jwt_identity

from app.middleware.auth_middleware import (
    role_required,
    verified_subscribed_required,
)
from app.services import operator_service, operator_wallet_service
from app.services.operator_service import OperatorServiceError
from app.models.driver_payout_request import DriverPayoutRequest
from app.models.user import User
from app.utils.constants import UserRole
from app.utils.response import error_response, success_response


def _handle_error(error):
    return error_response(error.message, error.status_code)


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def dashboard():
    operator_id = int(get_jwt_identity())
    return success_response(operator_service.dashboard_stats(operator_id))


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def live_trips():
    operator_id = int(get_jwt_identity())
    return success_response(
        [
            operator_service._trip_dict(trip)
            for trip in operator_service.list_live_trips(operator_id)
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def trips():
    operator_id = int(get_jwt_identity())
    try:
        items = operator_service.list_trips(
            request.args.get("status"),
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        [
            operator_service._trip_dict(trip)
            for trip in items
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def trip_detail(trip_id):
    operator_id = int(get_jwt_identity())
    try:
        trip = operator_service.get_trip(trip_id, operator_id)
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        operator_service._trip_dict(
            trip,
            include_details=True,
        )
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def drivers():
    operator_id = int(get_jwt_identity())

    return success_response(
        [
            operator_service._driver_dict(driver)
            for driver in operator_service.list_drivers(operator_id)
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def driver_detail(driver_id):
    operator_id = int(get_jwt_identity())

    try:
        driver = operator_service.get_driver(
            driver_id,
            operator_id=operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        operator_service._driver_dict(
            driver,
            include_details=True,
        )
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def delete_driver(driver_id):
    operator_id = int(get_jwt_identity())

    try:
        operator_service.delete_driver(
            driver_id,
            operator_id=operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        {},
        message="Driver deleted successfully",
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def passengers():
    operator_id = int(get_jwt_identity())

    return success_response(
        [
            operator_service._passenger_dict(
                passenger,
                operator_id=operator_id,
            )
            for passenger in operator_service.list_passengers(operator_id)
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def ride_requests():
    operator_id = int(get_jwt_identity())

    return success_response(
        [
            operator_service._booking_dict(booking)
            for booking in operator_service.list_ride_requests(operator_id)
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def settlements():
    operator_id = int(get_jwt_identity())

    return success_response(
        [
            settlement.to_dict()
            for settlement in operator_service.list_settlements(operator_id)
        ]
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def settle_settlement(settlement_id):
    operator_id = int(get_jwt_identity())

    try:
        settlement = operator_service.settle_settlement(
            settlement_id,
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        settlement.to_dict(),
        message="Settlement marked as settled",
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def create_driver():
    operator_id = int(get_jwt_identity())

    try:
        user, driver, vehicle = operator_service.create_driver(
            request.get_json(silent=True) or {},
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        {
            "user": user.to_dict(),
            "driver": operator_service._driver_dict(
                driver,
                include_details=True,
            ),
            "vehicle": vehicle.to_dict() if vehicle else None,
        },
        message="Driver created and pending verification",
        status_code=201,
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def upload_driver_document(driver_id):
    operator_id = int(get_jwt_identity())

    try:
        document = operator_service.submit_driver_document(
            driver_id,
            request.form.get("document_type"),
            request.files.get("file"),
            operator_id=operator_id,
        )
    except Exception as error:
        return _handle_error(error)

    return success_response(
        document.to_dict(),
        message="Driver document submitted",
        status_code=201,
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def create_trip():
    operator_id = int(get_jwt_identity())

    try:
        trip = operator_service.create_trip(
            request.get_json(silent=True) or {},
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        operator_service._trip_dict(trip),
        message="Trip created",
        status_code=201,
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def create_vehicle():
    operator_id = int(get_jwt_identity())

    try:
        vehicle = operator_service.create_vehicle(
            request.get_json(silent=True) or {},
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        vehicle.to_dict(),
        message="Vehicle created",
        status_code=201,
    )


# ============================================================
# GET OPERATOR VEHICLES
# ============================================================

@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def vehicles():
    operator_id = int(get_jwt_identity())

    try:
        vehicle_list = operator_service.operator_vehicles(operator_id)
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        [
            vehicle.to_dict()
            for vehicle in vehicle_list
        ],
        message="Operator vehicles retrieved successfully",
    )


# ============================================================
# OPERATOR EXPENSES
# ============================================================

@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def create_expense():
    operator_id = int(get_jwt_identity())

    try:
        expense = operator_service.create_expense(
            request.get_json(silent=True) or {},
            operator_id,
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        expense.to_dict(),
        message="Vehicle expense added successfully",
        status_code=201,
    )


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def expenses():
    operator_id = int(get_jwt_identity())

    try:
        items = operator_service.list_expenses(operator_id)
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(
        [
            expense.to_dict()
            for expense in items
        ]
    )


# ============================================================
# OPERATOR FINANCIAL SUMMARY
# ============================================================

@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def financial_summary():
    operator_id = int(get_jwt_identity())

    try:
        summary = operator_service.financial_summary(operator_id)
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response(summary)


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def payout_requests():
    operator_id = int(get_jwt_identity())
    try:
        requests = operator_service.list_driver_payout_requests(
            operator_id,
            request.args.get("status"),
        )
    except OperatorServiceError as error:
        return _handle_error(error)

    return success_response([item.to_dict() for item in requests])


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def wallet():
    operator_id = int(get_jwt_identity())

    from app.models.user import User

    operator = User.query.get(operator_id)

    if not operator:
        return error_response("Operator not found", 404)

    wallet = operator_wallet_service.get_wallet(operator)

    return success_response({
        "wallet": wallet.to_dict(),
        "transactions": [
            transaction.to_dict()
            for transaction in operator_wallet_service.get_transactions(operator)
        ],
        "payouts": [
            payout.to_dict()
            for payout in DriverPayoutRequest.query.filter_by(
                operator_id=operator.id
            ).order_by(DriverPayoutRequest.created_at.desc()).all()
        ],
    })


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def request_wallet_payout():
    operator = User.query.get(int(get_jwt_identity()))
    try:
        payout_request, wallet, transaction = operator_wallet_service.request_payout(
            operator, (request.get_json(silent=True) or {}).get("amount")
        )
    except operator_wallet_service.OperatorWalletServiceError as error:
        return _handle_error(error)
    return success_response({
        "payout_request": payout_request.to_dict(),
        "wallet": wallet.to_dict(),
        "transaction": transaction.to_dict(),
    }, message="Payout request submitted", status_code=201)


@role_required(UserRole.OPERATOR)
@verified_subscribed_required
def withdraw_wallet_payout(payout_request_id):
    operator = User.query.get(int(get_jwt_identity()))
    payout_request = DriverPayoutRequest.query.filter_by(
        public_id=payout_request_id, operator_id=operator.id, driver_id=None
    ).first()
    if not payout_request:
        return error_response("Payout request not found", 404)
    try:
        payout_request, wallet, transaction = operator_wallet_service.complete_payout(
            operator, payout_request
        )
    except operator_wallet_service.OperatorWalletServiceError as error:
        return _handle_error(error)
    return success_response({
        "payout_request": payout_request.to_dict(),
        "wallet": wallet.to_dict(),
        "transaction": transaction.to_dict(),
    }, message="Payout withdrawn")