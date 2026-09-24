import os
from typing import Any

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except Exception:  # pragma: no cover - optional dependency until installed
    firebase_admin = None
    credentials = None
    messaging = None


class NotificationService:
    @staticmethod
    def build_notification_payload(title: str, body: str, data: dict | None = None):
        payload = {
            "notification": {
                "title": title,
                "body": body,
            },
            "data": data or {},
        }
        return payload

    @staticmethod
    def _initialize_app():
        if firebase_admin is None:
            return False

        if not firebase_admin._apps:
            project_id = os.getenv("FIREBASE_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

            if service_account_json:
                import json
                service_account = json.loads(service_account_json)
                credentials_obj = credentials.Certificate(service_account)
                firebase_admin.initialize_app(credentials_obj, {"projectId": project_id} if project_id else None)
                return True

            if project_id:
                firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": project_id})
                return True

            return False

        return True

    @staticmethod
    def send_to_token(token: str, title: str, body: str, data: dict | None = None):
        if firebase_admin is None or messaging is None:
            return {"success": False, "message": "Firebase Admin SDK is not installed"}

        if not token:
            return {"success": False, "message": "No FCM token provided"}

        if not NotificationService._initialize_app():
            return {"success": False, "message": "Firebase service account is not configured"}

        payload = NotificationService.build_notification_payload(title, body, data)
        response = messaging.send(
            messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={str(k): str(v) for k, v in (data or {}).items()},
                token=token,
            )
        )
        return {"success": True, "message_id": response}

    @staticmethod
    def send_to_user(user_id, title: str, body: str, data: dict | None = None):
        from app.extensions import db
        from app.models.notification_token import NotificationToken

        tokens = (
            db.session.query(NotificationToken.token)
            .filter(NotificationToken.user_id == user_id, NotificationToken.is_active.is_(True))
            .all()
        )
        results = []
        for (token,) in tokens:
            results.append(NotificationService.send_to_token(token, title, body, data))
        return results
