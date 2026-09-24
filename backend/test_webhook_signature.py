from app import create_app
from app.services import razorpayx_service


app = create_app()

with app.app_context():
    print("TEST 1: Missing signature")

    try:
        razorpayx_service.verify_webhook_signature(
            b"{}",
            None,
        )
        print("FAILED - missing signature was accepted")
    except razorpayx_service.RazorpayXServiceError as error:
        print(f"REJECTED: {error.status_code} - {error.message}")