import unittest
from datetime import date

from app.models.customer import Customer
from app.models.driver import Driver
from app.models.user import User
from app.models.vehicle import Vehicle


class ProfileCompletionTests(unittest.TestCase):
    def test_passenger_profile_completion_counts_all_required_fields(self):
        user = User(
            full_name="Anu Sharma",
            email="anu@example.com",
            phone="9876543210",
            role="passenger",
        )
        user.customer_profile = Customer(
            user=user,
            gender="Male",
            date_of_birth=None,
            address="12 Market Road",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600001",
            emergency_contact_name="Asha",
            emergency_contact_phone="9876543210",
            id_type="Aadhaar",
            id_number="123456789012",
        )

        user.customer_profile.date_of_birth = date(1998, 5, 12)
        self.assertEqual(user.profile_completion_percentage(), 100)

        user.customer_profile.address = None
        self.assertEqual(user.profile_completion_percentage(), 92)

        user.customer_profile.gender = None
        self.assertEqual(user.profile_completion_percentage(), 85)

    def test_driver_profile_completion_counts_actual_driver_fields(self):
        user = User(
            full_name="Ravi Kumar",
            email="ravi@example.com",
            phone="9876543210",
            role="driver",
        )
        user.driver_profile = Driver(
            user=user,
            license_number="DL-0420110149646",
            address="7 MG Road",
            city="Chennai",
            state="Tamil Nadu",
            postal_code="600001",
            country="India",
            license_expiry=date(2029, 12, 31),
            license_photo_url="https://example.com/license.jpg",
        )

        self.assertEqual(user.profile_completion_percentage(), 100)

        user.driver_profile.postal_code = None
        self.assertEqual(user.profile_completion_percentage(), 91)

    def test_operator_profile_uses_user_account_fields(self):
        user = User(
            full_name="Meena Nair",
            email="meena@example.com",
            phone="9876543210",
            role="operator",
        )

        self.assertEqual(user.profile_completion_percentage(), 100)

        user.email = ""
        self.assertEqual(user.profile_completion_percentage(), 67)


if __name__ == "__main__":
    unittest.main()
