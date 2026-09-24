from flask import jsonify, request

from app.services.payment_split_service import (
    PaymentSplitServiceError,
    get_active_settings,
    update_settings,
)


def get_payment_split_settings():
    try:
        settings = get_active_settings()

        return jsonify({
            "success": True,
            "data": settings.to_dict(),
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "message": "Failed to load payment split settings",
        }), 500


def update_payment_split_settings():
    try:
        data = request.get_json(silent=True) or {}

        settings = update_settings(
            freelance_admin_rate=data.get("freelance_admin_rate"),
            operator_admin_rate=data.get("operator_admin_rate"),
            operator_share_rate=data.get("operator_share_rate"),
        )

        return jsonify({
            "success": True,
            "message": "Payment split settings updated successfully",
            "data": settings.to_dict(),
        }), 200

    except PaymentSplitServiceError as exc:
        return jsonify({
            "success": False,
            "message": exc.message,
        }), exc.status_code

    except Exception:
        return jsonify({
            "success": False,
            "message": "Failed to update payment split settings",
        }), 500