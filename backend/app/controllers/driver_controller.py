from flask import request
from flask_jwt_extended import get_jwt_identity

from app.middleware.auth_middleware import (
    role_required,
    verified_subscribed_required,
)

from app.services import driver_service
from app.services.driver_service import DriverServiceError

from app.utils.response import (
    success_response,
    error_response,
)

from app.utils.constants import UserRole

from app.services import driver_wallet_service
from app.services.driver_wallet_service import DriverWalletServiceError

from app.models.driver import Driver


@role_required(UserRole.DRIVER)
def get_my_profile():
    user_id = get_jwt_identity()

    try:
        driver = driver_service.get_driver_by_user_id(
            int(user_id)
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(
        driver.to_dict(include_documents=True)
    )


@role_required(UserRole.DRIVER)
def update_my_profile():
    data = request.get_json(silent=True) or {}

    try:
        driver = driver_service.update_address(
            int(get_jwt_identity()),
            data,
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(
        driver.to_dict(include_documents=True),
        message="Profile updated",
    )


@role_required(UserRole.DRIVER)
def update_payout_method():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    try:
        driver = driver_service.update_payout_method(
            user_id,
            data,
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(
        driver.to_dict(include_documents=True),
        message="Payout method updated",
    )


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def update_availability():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    new_status = data.get("availability")

    try:
        driver = driver_service.set_availability(
            int(user_id),
            new_status,
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(
        driver.to_dict(),
        message=f"You are now {driver.availability}",
    )


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def ride_requests():
    user_id = get_jwt_identity()

    try:
        bookings = driver_service.list_ride_requests(
            int(user_id)
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(
        [
            booking.to_dict()
            for booking in bookings
        ]
    )


@role_required(UserRole.DRIVER)
@verified_subscribed_required
def earnings():
    try:
        data = driver_service.get_earnings(
            int(get_jwt_identity())
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response(data)


def list_available_drivers():
    """
    Public: list currently online, verified drivers,
    optionally filtered by city.

    Query params:
    city   - optional
    limit  - default 20, max 50
    offset - default 0

    NOTE:
    This endpoint is intentionally public.
    """

    city = request.args.get("city")

    try:
        limit = int(
            request.args.get(
                "limit",
                20,
            )
        )
    except (TypeError, ValueError):
        limit = 20

    try:
        offset = int(
            request.args.get(
                "offset",
                0,
            )
        )
    except (TypeError, ValueError):
        offset = 0

    try:
        drivers, total = driver_service.list_available_drivers(
            city=city,
            limit=limit,
            offset=offset,
        )
    except DriverServiceError as e:
        return error_response(
            e.message,
            e.status_code,
        )

    return success_response({
        "drivers": [
            driver.to_public_dict()
            for driver in drivers
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    })


@role_required(UserRole.DRIVER)
def wallet():
    driver_user_id = int(
        get_jwt_identity()
    )

    try:
        driver = Driver.query.filter_by(
            user_id=driver_user_id
        ).first()

        if not driver:
            raise DriverWalletServiceError(
                "Driver profile not found",
                404,
            )

        wallet = driver_wallet_service.get_wallet(
            driver
        )

    except DriverWalletServiceError as error:
        return error_response(
            error.message,
            error.status_code,
        )

    return success_response(
        wallet.to_dict()
    )


@role_required(UserRole.DRIVER)
def wallet_transactions():
    driver_user_id = int(
        get_jwt_identity()
    )

    try:
        driver = Driver.query.filter_by(
            user_id=driver_user_id
        ).first()

        if not driver:
            raise DriverWalletServiceError(
                "Driver profile not found",
                404,
            )

        transactions = driver_wallet_service.get_transactions(
            driver
        )

    except DriverWalletServiceError as error:
        return error_response(
            error.message,
            error.status_code,
        )

    return success_response(
        [
            transaction.to_dict()
            for transaction in transactions
        ]
    )

@role_required(UserRole.DRIVER)
def request_payout():
    driver_user_id = int(
        get_jwt_identity()
    )

    data = request.get_json(silent=True) or {}
    amount = data.get("amount")

    if amount is None:
        return error_response(
            "Payout amount is required",
            422,
        )

    try:
        driver = Driver.query.filter_by(
            user_id=driver_user_id
        ).first()

        if not driver:
            raise DriverWalletServiceError(
                "Driver profile not found",
                404,
            )

        payout_request, wallet, transaction = (
            driver_wallet_service.request_payout(
                driver,
                amount,
            )
        )

    except DriverWalletServiceError as error:
        return error_response(
            error.message,
            error.status_code,
        )

    return success_response(
        {
            "payout_request": payout_request.to_dict(),
            "wallet": wallet.to_dict(),
            "transaction": transaction.to_dict(),
        },
        message="Payout request submitted",
        status_code=201,
    )