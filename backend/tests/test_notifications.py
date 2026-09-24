from app.services.notification_service import NotificationService


def test_build_notification_payload_includes_title_and_data():
    payload = NotificationService.build_notification_payload(
        "Booking confirmed",
        "Your ride is confirmed.",
        {"booking_id": "abc-123"},
    )

    assert payload["notification"]["title"] == "Booking confirmed"
    assert payload["notification"]["body"] == "Your ride is confirmed."
    assert payload["data"]["booking_id"] == "abc-123"
