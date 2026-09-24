"""
One-time (or repeatable) script to create an admin account, since admins are
not self-registered through the API. Run from the backend/ folder with your
venv active:

    python seed_admin.py

It will prompt for name, email, phone, and password. Safe to re-run — it
skips creation if an admin with that email already exists.
"""
import getpass
from app import create_app
from app.extensions import db
from app.models.user import User
from app.utils.constants import UserRole
from app.utils.validators import is_valid_email, is_valid_phone, is_valid_password

app = create_app()

with app.app_context():
    print("=== Create ShareTaxi Admin Account ===")

    full_name = input("Full name: ").strip()

    email = input("Email: ").strip().lower()
    while not is_valid_email(email):
        email = input("Please enter a valid email: ").strip().lower()

    phone = input("Phone (10 digits): ").strip()
    while not is_valid_phone(phone):
        phone = input("Please enter a valid 10-digit phone: ").strip()

    password = getpass.getpass("Password (min 8 chars, letter + number): ")
    while not is_valid_password(password):
        password = getpass.getpass("Please enter a valid password: ")

    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"A user with email {email} already exists (role: {existing.role}). Nothing created.")
    else:
        admin = User(
            full_name=full_name,
            email=email,
            phone=phone,
            role=UserRole.ADMIN,
            is_email_verified=True,
            is_phone_verified=True,
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin account created: {email}")