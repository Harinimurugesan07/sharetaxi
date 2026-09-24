from app.utils.validators import is_valid_license_number, is_valid_registration_number


def test_license_number_accepts_standard_dl_format():
    assert is_valid_license_number("DL-0420110149646")
    assert is_valid_license_number("dl-0420110149646")


def test_license_number_rejects_wrong_format():
    assert not is_valid_license_number("0420110149646")
    assert not is_valid_license_number("ABCD123")


def test_registration_number_accepts_indian_format():
    assert is_valid_registration_number("TN 09 AB 1234")
    assert is_valid_registration_number("tn09ab1234")


def test_registration_number_rejects_wrong_format():
    assert not is_valid_registration_number("AB1234")
    assert not is_valid_registration_number("1234567890")
