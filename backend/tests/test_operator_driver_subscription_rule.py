import os

os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"

from app import create_app
from app.extensions import db
from app.models.driver import Driver
from app.models.user import User
from app.services.onboarding_service import create_subscription_order
from app.utils.constants import UserRole


def test_operator_owned_driver_skips_subscription_requirement():
    app = create_app("testing")

    with app.app_context():
        db.create_all()

        operator = User(
            full_name="Operator User",
            email="operator@example.com",
            phone="9000000001",
            role=UserRole.OPERATOR,
            verification_status="verified",
            subscription_status="active",
        )
        operator.set_password("Secret@123")
        db.session.add(operator)
        db.session.commit()

        driver_user = User(
            full_name="Operator Driver",
            email="driver-owned@example.com",
            phone="9000000002",
            role=UserRole.DRIVER,
            verification_status="verified",
            subscription_status="inactive",
        )
        driver_user.set_password("Secret@123")
        db.session.add(driver_user)
        db.session.commit()

        driver_profile = Driver(
            user_id=driver_user.id,
            operator_id=operator.id,
            license_number="DL-0420110149646",
            address="Main Road",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560001",
            country="India",
        )
        db.session.add(driver_profile)
        db.session.commit()

        assert driver_user.is_operator_owned_driver() is True

        try:
            create_subscription_order(driver_user, "monthly")
            assert False, "Operator-owned driver should not be allowed to subscribe"
        except Exception as exc:
            assert "Subscription is not required" in str(exc)
