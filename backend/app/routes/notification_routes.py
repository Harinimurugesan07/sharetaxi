from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.extensions import db
from app.models.user import User
from app.models.notification_token import NotificationToken
from app.utils.response import success_response, error_response

notification_bp = Blueprint("notifications", __name__)


@jwt_required()
@notification_bp.route("/token", methods=["POST"])
def save_token():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return error_response("User not found", 404)

    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    platform = (data.get("platform") or "web").strip() or "web"

    if not token:
        return error_response("FCM token is required", 422)

    existing = NotificationToken.query.filter_by(token=token).first()
    if existing:
        if existing.user_id != user.id:
            existing.user_id = user.id
            existing.platform = platform
            existing.is_active = True
        else:
            existing.platform = platform
            existing.is_active = True
        db.session.commit()
        return success_response({"token": token}, message="Notification token updated")

    db.session.add(
        NotificationToken(
            user_id=user.id,
            token=token,
            platform=platform,
            is_active=True,
        )
    )
    db.session.commit()

    return success_response({"token": token}, message="Notification token saved")


@jwt_required()
@notification_bp.route("/token", methods=["DELETE"])
def delete_token():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    if not token:
        return error_response("Token is required", 422)

    entry = NotificationToken.query.filter_by(token=token, user_id=int(user_id)).first()
    if entry:
        entry.is_active = False
        db.session.commit()

    return success_response(message="Notification token removed")


@jwt_required()
@notification_bp.route("/status", methods=["GET"])
def status():
    user_id = get_jwt_identity()
    tokens = NotificationToken.query.filter_by(user_id=int(user_id), is_active=True).all()
    return success_response({"enabled": bool(tokens), "count": len(tokens)})
