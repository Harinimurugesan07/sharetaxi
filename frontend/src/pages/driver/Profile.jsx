import { useEffect, useState } from "react";

import {
  Check,
  Edit3,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  IdCard,
  Mail,
  Phone,
  X,
  Award,
  Star,
  Landmark,
} from "lucide-react";

import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import StarRating from "../../components/StarRating";
import { LoadingState, ErrorState } from "../../components/States";

import {
  myDriverProfile,
  updateMyDriverAddress,
  updateMyDriverPayoutMethod,
} from "../../api/driver";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import "./Profile.css";

export default function DriverProfile() {
  const { user, refreshUser } = useAuth();

  const [driver, setDriver] = useState(null);
  const [status, setStatus] = useState("loading");

  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPayout, setEditingPayout] = useState(false);

  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    license_number: "",
    license_expiry: "",
    license_photo_url: "",
  });

  const [payoutForm, setPayoutForm] = useState({
    payout_method: "bank",
    bank_account_holder_name: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
  });

  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  const toast = useToast();

  const load = () => {
    setStatus("loading");

    myDriverProfile()
      .then((d) => {
        setDriver(d);

        setAddressForm({
          address: d.address || "",
          city: d.city || "",
          state: d.state || "",
          postal_code: d.postal_code || "",
          country: d.country || "",
          license_number: d.license_number || "",
          license_expiry: d.license_expiry || "",
          license_photo_url: d.license_photo_url || "",
        });

        setPayoutForm({
          payout_method: d.payout_method || "bank",
          bank_account_holder_name:
            d.bank_account_holder_name || "",
          bank_name: d.bank_name || "",
          bank_account_number: "",
          bank_ifsc_code: d.bank_ifsc_code || "",
        });

        setStatus("success");
      })
      .catch(() => setStatus("error"));
  };

  const setAddress = (key) => (event) =>
    setAddressForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));

  const setPayout = (key) => (event) =>
    setPayoutForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));

  const saveAddress = async (event) => {
    event.preventDefault();

    setSavingAddress(true);

    try {
      const updated = await updateMyDriverAddress(addressForm);

      setDriver(updated);

      const refreshedUser = await refreshUser();
      const completion = Number(
        refreshedUser?.profile_completion_percentage ?? 0
      );

      setEditingAddress(false);

      if (completion >= 100) {
        toast.success(
          "Your profile is now 100% complete.",
          "Profile Completed!"
        );
      } else {
        toast.success(
          "Your driver profile has been updated successfully.",
          "Profile Updated Successfully"
        );
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const savePayout = async (event) => {
    event.preventDefault();

    setSavingPayout(true);

    try {
      const updated = await updateMyDriverPayoutMethod(payoutForm);

      setDriver(updated);

      setPayoutForm((current) => ({
        ...current,
        bank_account_number: "",
      }));

      setEditingPayout(false);

      toast.success(
        "Your bank payout details have been saved.",
        "Payout Method Updated"
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPayout(false);
    }
  };

  const cancelPayoutEdit = () => {
    setEditingPayout(false);

    setPayoutForm({
      payout_method: driver?.payout_method || "bank",
      bank_account_holder_name:
        driver?.bank_account_holder_name || "",
      bank_name: driver?.bank_name || "",
      bank_account_number: "",
      bank_ifsc_code: driver?.bank_ifsc_code || "",
    });
  };

  useEffect(load, []);

  if (status === "loading") {
    return <LoadingState label="Loading profile..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  const addressText = [
    driver?.address,
    driver?.city,
    driver?.state,
    driver?.postal_code,
    driver?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const hasPayoutMethod =
    driver?.bank_name ||
    driver?.bank_account_holder_name ||
    driver?.bank_ifsc_code;

  return (
    <div className="driver-profile">
      <div className="driver-profile-grid">
        {/* Left: identity, contact, stats */}
        <Card className="driver-profile-side">
          <div className="driver-profile-banner" />

          <div className="driver-profile-header">
            <div className="driver-profile-avatar">
              {user?.full_name?.[0]}
            </div>

            {driver?.verification_status === "verified" ? (
              <Badge
                tone="success"
                className="driver-profile-badge"
              >
                <ShieldCheck /> Verified
              </Badge>
            ) : (
              <Badge
                tone="neutral"
                className="driver-profile-badge"
              >
                <ShieldAlert /> {driver?.verification_status}
              </Badge>
            )}
          </div>

          <div className="driver-profile-identity">
            <p>{user?.full_name}</p>
            <StarRating value={driver?.average_rating || 5} />
          </div>

          <div className="driver-profile-contact">
            <div className="driver-profile-contact-row">
              <Mail /> {user?.email}
            </div>

            <div className="driver-profile-contact-row">
              <Phone /> {user?.phone}
            </div>

            <div className="driver-profile-contact-row">
              <IdCard /> {driver?.license_number}
            </div>
          </div>

          <div className="driver-profile-stats">
            <div className="driver-profile-stat">
              <span className="driver-profile-stat-icon">
                <Award />
              </span>

              <p className="driver-profile-stat-value">
                {driver?.total_trips ?? 0}
              </p>

              <p className="driver-profile-stat-label">
                Total Trips
              </p>
            </div>

            <div className="driver-profile-stat">
              <span className="driver-profile-stat-icon">
                <Star />
              </span>

              <p className="driver-profile-stat-value">
                {Number(driver?.average_rating || 5).toFixed(1)}
              </p>

              <p className="driver-profile-stat-label">
                Average Rating
              </p>
            </div>
          </div>
        </Card>

        {/* Right: address & license details */}
        <Card className="driver-profile-main">
          <div className="driver-profile-address-header">
            <p className="driver-profile-address-title">
              <MapPin /> Driver profile details
            </p>

            {!editingAddress && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingAddress(true)}
              >
                <Edit3 className="driver-profile-edit-icon" /> Edit
              </Button>
            )}
          </div>

          {editingAddress ? (
            <form
              className="driver-profile-address-form"
              onSubmit={saveAddress}
            >
              <Field label="Address" required>
                <Input
                  required
                  value={addressForm.address}
                  onChange={setAddress("address")}
                />
              </Field>

              <Field label="City" required>
                <Input
                  required
                  value={addressForm.city}
                  onChange={setAddress("city")}
                />
              </Field>

              <Field label="State" required>
                <Input
                  required
                  value={addressForm.state}
                  onChange={setAddress("state")}
                />
              </Field>

              <Field label="Postal Code" required>
                <Input
                  required
                  value={addressForm.postal_code}
                  onChange={setAddress("postal_code")}
                />
              </Field>

              <Field label="Country" required>
                <Input
                  required
                  value={addressForm.country}
                  onChange={setAddress("country")}
                />
              </Field>

              <Field label="Driving License Number" required>
                <Input
                  required
                  value={addressForm.license_number}
                  onChange={setAddress("license_number")}
                />
              </Field>

              <Field label="License Expiry">
                <Input
                  type="date"
                  value={addressForm.license_expiry || ""}
                  onChange={setAddress("license_expiry")}
                />
              </Field>

              <Field label="License Photo URL">
                <Input
                  value={addressForm.license_photo_url || ""}
                  onChange={setAddress("license_photo_url")}
                />
              </Field>

              <div className="driver-profile-address-actions">
                <Button
                  type="submit"
                  size="sm"
                  loading={savingAddress}
                >
                  <Check /> Save
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingAddress(false);

                    setAddressForm({
                      address: driver.address || "",
                      city: driver.city || "",
                      state: driver.state || "",
                      postal_code: driver.postal_code || "",
                      country: driver.country || "",
                      license_number:
                        driver.license_number || "",
                      license_expiry:
                        driver.license_expiry || "",
                      license_photo_url:
                        driver.license_photo_url || "",
                    });
                  }}
                >
                  <X /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="driver-profile-address-view">
              <div className="driver-profile-address-tile">
                <p className="driver-profile-address-tile-label">
                  Registered address
                </p>

                <p className="driver-profile-address-text">
                  {addressText || "No address registered"}
                </p>
              </div>

              <div className="driver-profile-license-grid">
                <div className="driver-profile-address-tile">
                  <p className="driver-profile-address-tile-label">
                    License number
                  </p>

                  <p className="driver-profile-address-text">
                    {driver?.license_number || "—"}
                  </p>
                </div>

                <div className="driver-profile-address-tile">
                  <p className="driver-profile-address-tile-label">
                    License expiry
                  </p>

                  <p className="driver-profile-address-text">
                    {driver?.license_expiry || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payout Method */}
          <div className="driver-profile-payout">
            <div className="driver-profile-address-header">
              <p className="driver-profile-address-title">
                <Landmark /> Payout Method
              </p>

              {!editingPayout && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPayout(true)}
                >
                  <Edit3 className="driver-profile-edit-icon" />
                  {hasPayoutMethod ? "Edit" : "Add"}
                </Button>
              )}
            </div>

            {editingPayout ? (
              <form
                className="driver-profile-address-form"
                onSubmit={savePayout}
              >
                <Field
                  label="Payout Method"
                  required
                >
                  <Input
                    value="Bank Account"
                    disabled
                  />
                </Field>

                <Field
                  label="Account Holder Name"
                  required
                >
                  <Input
                    required
                    value={
                      payoutForm.bank_account_holder_name
                    }
                    onChange={setPayout(
                      "bank_account_holder_name"
                    )}
                    placeholder="Enter account holder name"
                  />
                </Field>

                <Field label="Bank Name" required>
                  <Input
                    required
                    value={payoutForm.bank_name}
                    onChange={setPayout("bank_name")}
                    placeholder="Enter bank name"
                  />
                </Field>

                <Field
                  label="Bank Account Number"
                  required
                >
                  <Input
                    required
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={payoutForm.bank_account_number}
                    onChange={setPayout(
                      "bank_account_number"
                    )}
                    placeholder="Enter bank account number"
                  />
                </Field>

                <Field label="IFSC Code" required>
                  <Input
                    required
                    value={payoutForm.bank_ifsc_code}
                    onChange={setPayout(
                      "bank_ifsc_code"
                    )}
                    placeholder="Example: SBIN0001234"
                    maxLength={11}
                  />
                </Field>

                <div className="driver-profile-address-actions">
                  <Button
                    type="submit"
                    size="sm"
                    loading={savingPayout}
                  >
                    <Check /> Save Payout Method
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelPayoutEdit}
                  >
                    <X /> Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="driver-profile-address-view">
                {hasPayoutMethod ? (
                  <div className="driver-profile-license-grid">
                    <div className="driver-profile-address-tile">
                      <p className="driver-profile-address-tile-label">
                        Account Holder
                      </p>

                      <p className="driver-profile-address-text">
                        {driver?.bank_account_holder_name ||
                          "—"}
                      </p>
                    </div>

                    <div className="driver-profile-address-tile">
                      <p className="driver-profile-address-tile-label">
                        Bank
                      </p>

                      <p className="driver-profile-address-text">
                        {driver?.bank_name || "—"}
                      </p>
                    </div>

                    <div className="driver-profile-address-tile">
                      <p className="driver-profile-address-tile-label">
                        IFSC Code
                      </p>

                      <p className="driver-profile-address-text">
                        {driver?.bank_ifsc_code || "—"}
                      </p>
                    </div>

                    <div className="driver-profile-address-tile">
                      <p className="driver-profile-address-tile-label">
                        Account Number
                      </p>

                      <p className="driver-profile-address-text">
                        Saved securely
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="driver-profile-address-tile">
                    <p className="driver-profile-address-text">
                      No payout method added yet. Add your bank
                      account details to receive future payouts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}