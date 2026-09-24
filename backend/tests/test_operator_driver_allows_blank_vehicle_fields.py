import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"

from app import create_app
from app.extensions import db
from app.models.user import User
from app.services import operator_service
from app.utils.constants import UserRole


def test_operator_driver_creation_allows_driver_only_payload():
    app = create_app("testing")

    with app.app_context():
        db.create_all()

        operator = User(
            full_name="Test Operator",
            email="operator@example.com",
            phone="9999999999",
            role=UserRole.OPERATOR,
            verification_status="verified",
            subscription_status="active",
        )
        operator.set_password("Secret@123")
        db.session.add(operator)
        db.session.commit()

        payload = {
            "full_name": "Jane Driver",
            "email": "jane@example.com",
            "phone": "9876543210",
            "password": "Secret@123",
            "license_number": "DL-0420110149646",
            "address": "Main Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "country": "India",
        }

        user, driver, vehicle = operator_service.create_driver(payload, operator_id=operator.id)

        assert user.full_name == "Jane Driver"
        assert driver.operator_id == operator.id
        assert vehicle is None
