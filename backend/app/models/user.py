from app.extensions import db, bcrypt
from app.models import TimestampMixin, gen_uuid
from app.utils.constants import UserRole


class User(db.Model, TimestampMixin):
    """
    Base account table for ALL roles (passenger, driver, admin, operator).
    Role-specific data lives in Customer / Driver profile tables (1:1),
    keeping auth concerns separate from role-specific business data.
    """
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=gen_uuid, index=True)

    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(15), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(db.Enum(*UserRole.ALL, name="user_role"), nullable=False, default=UserRole.PASSENGER)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_phone_verified = db.Column(db.Boolean, default=False, nullable=False)
    profile_photo_url = db.Column(db.String(500), nullable=True)

    # Onboarding state is shared by driver and operator accounts.
    verification_status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    verification_notes = db.Column(db.Text, nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    subscription_status = db.Column(db.String(20), nullable=False, default="inactive", index=True)
    subscription_plan = db.Column(db.String(40), nullable=True)
    subscription_started_at = db.Column(db.DateTime, nullable=True)
    subscription_expires_at = db.Column(db.DateTime, nullable=True)

    last_login_at = db.Column(db.DateTime, nullable=True)

    # 1:1 relationships to role-specific profiles
    customer_profile = db.relationship(
        "Customer", backref="user", uselist=False, cascade="all, delete-orphan"
    )
    driver_profile = db.relationship(
        "Driver",
        foreign_keys="[Driver.user_id]",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def set_password(self, raw_password):
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    @staticmethod
    def _is_filled(value):
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        return True

    def profile_completion_summary(self):
        required_fields = []
        if self.role == UserRole.PASSENGER:
            profile = self.customer_profile
            required_fields = [
                self.full_name,
                self.email,
                self.phone,
                profile.gender if profile else None,
                profile.date_of_birth if profile else None,
                profile.address if profile else None,
                profile.city if profile else None,
                profile.state if profile else None,
                profile.pincode if profile else None,
                profile.emergency_contact_name if profile else None,
                profile.emergency_contact_phone if profile else None,
                profile.id_type if profile else None,
                profile.id_number if profile else None,
            ]
        elif self.role == UserRole.DRIVER:
            profile = self.driver_profile
            required_fields = [
                self.full_name,
                self.email,
                self.phone,
                profile.address if profile else None,
                profile.city if profile else None,
                profile.state if profile else None,
                profile.postal_code if profile else None,
                profile.country if profile else None,
                profile.license_number if profile else None,
                profile.license_expiry if profile else None,
                profile.license_photo_url if profile else None,
            ]
        elif self.role == UserRole.OPERATOR:
            required_fields = [self.full_name, self.email, self.phone]
        else:
            return {"percentage": 0, "completed": 0, "total": 0}

        total = len(required_fields)
        if total == 0:
            return {"percentage": 0, "completed": 0, "total": 0}

        completed = sum(1 for value in required_fields if self._is_filled(value))
        percentage = int(round((completed / total) * 100))
        return {"percentage": percentage, "completed": completed, "total": total}

    def profile_completion_percentage(self):
        return self.profile_completion_summary()["percentage"]

    def is_operator_owned_driver(self):
        return (
            self.role == UserRole.DRIVER
            and self.driver_profile is not None
            and self.driver_profile.operator_id is not None
        )

    def to_dict(self):
        summary = self.profile_completion_summary()
        data = {
            "id": self.public_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_active": self.is_active,
            "is_email_verified": self.is_email_verified,
            "is_phone_verified": self.is_phone_verified,
            "profile_photo_url": self.profile_photo_url,
            "verification_status": self.verification_status,
            "verification_notes": self.verification_notes,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "subscription_status": self.subscription_status,
            "subscription_plan": self.subscription_plan,
            "subscription_expires_at": self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile_completion_percentage": summary["percentage"],
            "profile_completion": summary,
        }
        if self.role == UserRole.DRIVER and self.driver_profile:
            data["operator_id"] = self.driver_profile.operator.public_id if self.driver_profile.operator else None
            data["operator_name"] = self.driver_profile.operator.full_name if self.driver_profile.operator else None
            data["driver_type"] = "operator" if self.driver_profile.operator_id is not None else "freelance"
        return data

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
