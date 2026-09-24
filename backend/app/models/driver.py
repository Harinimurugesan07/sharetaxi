from app.extensions import db
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import DriverStatus, DriverAvailability


class Driver(db.Model, TimestampMixin):
    """
    Driver-specific profile data, 1:1 with User
    (role='driver').
    """

    __tablename__ = "drivers"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=gen_uuid,
        index=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    operator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    operator = db.relationship(
        "User",
        foreign_keys=[operator_id],
        backref=db.backref(
            "created_drivers",
            lazy="dynamic",
        ),
    )

    # ========================================================
    # DRIVER INFORMATION
    # ========================================================

    license_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
    )

    # These fields are intentionally optional during initial
    # driver creation. They can be completed later.
    address = db.Column(
        db.String(500),
        nullable=True,
    )

    city = db.Column(
        db.String(100),
        nullable=True,
    )

    state = db.Column(
        db.String(100),
        nullable=True,
    )

    postal_code = db.Column(
        db.String(20),
        nullable=True,
    )

    country = db.Column(
        db.String(100),
        nullable=True,
    )

    license_expiry = db.Column(
        db.Date,
        nullable=True,
    )

    license_photo_url = db.Column(
        db.String(500),
        nullable=True,
    )

    # ========================================================
    # VERIFICATION
    # ========================================================

    verification_status = db.Column(
        db.Enum(
            *DriverStatus.ALL,
            name="driver_verification_status",
        ),
        default=DriverStatus.PENDING,
        nullable=False,
        index=True,
    )

    verification_notes = db.Column(
        db.Text,
        nullable=True,
    )

    verified_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    # ========================================================
    # DRIVER AVAILABILITY
    # ========================================================

    availability = db.Column(
        db.Enum(
            *DriverAvailability.ALL,
            name="driver_availability",
        ),
        default=DriverAvailability.OFFLINE,
        nullable=False,
        index=True,
    )

    # ========================================================
    # DRIVER STATISTICS
    # ========================================================

    total_trips = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    average_rating = db.Column(
        db.Numeric(2, 1),
        default=5.0,
        nullable=False,
    )

    total_earnings = db.Column(
        db.Numeric(10, 2),
        default=0,
        nullable=False,
    )

    # ========================================================
    # VEHICLES
    #
    # Vehicle remains a separate entity.
    # Driver creation does NOT create a vehicle.
    # ========================================================

    vehicles = db.relationship(
        "Vehicle",
        backref="driver",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    # ========================================================
    # PAYOUT METHOD
    # ========================================================

    payout_method = db.Column(
        db.String(20),
        nullable=True,
        default="bank",
    )

    bank_account_holder_name = db.Column(
        db.String(150),
        nullable=True,
    )

    bank_name = db.Column(
        db.String(150),
        nullable=True,
    )

    bank_account_number = db.Column(
        db.String(50),
        nullable=True,
    )

    bank_ifsc_code = db.Column(
        db.String(20),
        nullable=True,
    )

    # ========================================================
    # HELPERS
    # ========================================================

    @staticmethod
    def _is_filled(value):
        if value is None:
            return False

        if isinstance(value, str):
            return value.strip() != ""

        return True

    # ========================================================
    # PROFILE COMPLETION
    # ========================================================

    def profile_completion_percentage(self, user=None):
        user = user or self.user

        required_fields = []

        if user:
            required_fields = [
                user.full_name,
                user.email,
                user.phone,
                self.address,
                self.city,
                self.state,
                self.postal_code,
                self.country,
                self.license_number,
                self.license_expiry,
                self.license_photo_url,
            ]
        else:
            required_fields = [
                self.address,
                self.city,
                self.state,
                self.postal_code,
                self.country,
                self.license_number,
                self.license_expiry,
                self.license_photo_url,
            ]

        total = len(required_fields)

        if total == 0:
            return 0

        filled = sum(
            1
            for value in required_fields
            if self._is_filled(value)
        )

        return int(round((filled / total) * 100))

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self, include_documents=False):
        data = {
            "id": self.public_id,

            "operator_id": (
                self.operator.public_id
                if self.operator
                else None
            ),

            "operator_name": (
                self.operator.full_name
                if self.operator
                else None
            ),

            "license_number": (
                self.license_number
                if include_documents
                else None
            ),

            "address": self.address,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "country": self.country,

            "license_expiry": (
                self.license_expiry.isoformat()
                if self.license_expiry
                else None
            ),

            "verification_status": self.verification_status,
            "availability": self.availability,

            "total_trips": self.total_trips,

            "average_rating": (
                float(self.average_rating)
                if self.average_rating is not None
                else None
            ),

            "profile_completion_percentage": (
                self.profile_completion_percentage(
                    self.user
                )
            ),

            "profile_completion": {
                "percentage": self.profile_completion_percentage(
                    self.user
                ),
                "completed": 0,
                "total": 0,
            },
        }

        if self.user:
            required_fields = [
                self.user.full_name,
                self.user.email,
                self.user.phone,
                self.address,
                self.city,
                self.state,
                self.postal_code,
                self.country,
                self.license_number,
                self.license_expiry,
                self.license_photo_url,
            ]

            completed = sum(
                1
                for value in required_fields
                if self._is_filled(value)
            )

            data["profile_completion"] = {
                "percentage": int(
                    round(
                        (
                            completed
                            / len(required_fields)
                        )
                        * 100
                    )
                ),
                "completed": completed,
                "total": len(required_fields),
            }

        if include_documents:
            data["license_photo_url"] = (
                self.license_photo_url
            )

            data["verification_notes"] = (
                self.verification_notes
            )

            data["total_earnings"] = float(
                self.total_earnings
            )

            # ====================================================
            # PAYOUT METHOD
            #
            # Never expose the full bank account number.
            # Only the last 4 digits are returned.
            # ====================================================

            data["payout_method"] = self.payout_method

            data["bank_account_holder_name"] = (
                self.bank_account_holder_name
            )

            data["bank_name"] = self.bank_name

            data["bank_ifsc_code"] = (
                self.bank_ifsc_code
            )

            data["bank_account_number_masked"] = (
                f"********{self.bank_account_number[-4:]}"
                if self.bank_account_number
                and len(self.bank_account_number) >= 4
                else None
            )

        return data

    # ========================================================
    # DISPLAY NAME
    # ========================================================

    def _display_name(self):
        """
        Best-effort lookup of the driver's name
        from the related User row.
        """

        user = getattr(
            self,
            "user",
            None,
        )

        if user is None:
            return None

        for attr in (
            "full_name",
            "name",
            "display_name",
        ):
            value = getattr(
                user,
                attr,
                None,
            )

            if value:
                return value

        first = getattr(
            user,
            "first_name",
            None,
        )

        last = getattr(
            user,
            "last_name",
            None,
        )

        if first or last:
            return " ".join(
                p
                for p in [first, last]
                if p
            )

        return None

    # ========================================================
    # PUBLIC DRIVER DATA
    # ========================================================

    def to_public_dict(self):
        """
        Minimal, non-sensitive fields safe to expose
        to other users.
        """

        vehicle = (
            self.vehicles.first()
            if self.vehicles is not None
            else None
        )

        return {
            "id": self.public_id,

            "name": self._display_name(),

            "city": self.city,
            "state": self.state,

            "availability": self.availability,

            "average_rating": (
                float(self.average_rating)
                if self.average_rating is not None
                else None
            ),

            "total_trips": self.total_trips,

            "vehicle": (
                getattr(
                    vehicle,
                    "to_public_dict",
                    lambda: None,
                )()
                if vehicle
                else None
            ),
        }