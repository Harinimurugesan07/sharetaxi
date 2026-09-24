import re

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")  # Indian 10-digit mobile numbers
LICENSE_NUMBER_REGEX = re.compile(r"^[A-Za-z]{2,3}-\d{10,20}$")
REGISTRATION_NUMBER_REGEX = re.compile(r"^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$")


def is_valid_email(email):
    return bool(email) and bool(EMAIL_REGEX.match(email.strip()))


def is_valid_phone(phone):
    return bool(phone) and bool(PHONE_REGEX.match(phone.strip()))


def is_valid_license_number(value):
    """Allow standard DL-style values like DL-0420110149646."""
    if not value or not isinstance(value, str):
        return False
    normalized = value.strip()
    if not normalized:
        return False
    return bool(LICENSE_NUMBER_REGEX.match(normalized))


def is_valid_registration_number(value):
    """Allow common Indian style registration numbers like TN 09 AB 1234."""
    if not value or not isinstance(value, str):
        return False
    normalized = re.sub(r"\s+", "", value.strip()).upper()
    return bool(REGISTRATION_NUMBER_REGEX.match(normalized))


def is_valid_password(password):
    """At least 8 chars, one letter, one digit."""
    if not password or len(password) < 8:
        return False
    return bool(re.search(r"[A-Za-z]", password)) and bool(re.search(r"\d", password))


def validate_required_fields(data, required_fields):
    """Returns a list of missing field names (empty list if all present)."""
    missing = []
    for field in required_fields:
        value = data.get(field) if isinstance(data, dict) else None
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(field)
    return missing


def is_valid_latlng(lat, lng):
    try:
        lat_f, lng_f = float(lat), float(lng)
    except (TypeError, ValueError):
        return False
    return -90 <= lat_f <= 90 and -180 <= lng_f <= 180
