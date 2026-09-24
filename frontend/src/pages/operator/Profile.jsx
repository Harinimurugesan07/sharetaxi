import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateProfile } from "../../api/users";
import "./OperatorProfile.css";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function OperatorProfile() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || "", email: user?.email || "", phone: user?.phone || "" });

  useEffect(() => {
    setForm({ full_name: user?.full_name || "", email: user?.email || "", phone: user?.phone || "" });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      const updatedUser = await refreshUser();
      const completion = Number(updatedUser?.profile_completion_percentage ?? 0);
      setEditing(false);
      if (completion >= 100) {
        toast.success("Your profile is now 100% complete.", "Profile Completed!");
      } else {
        toast.success("Your operator profile has been updated successfully.", "Profile Updated Successfully");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="account-page">
      <div className="account-header">
        <div className="account-header-left">
          <div className="account-avatar">{user?.full_name?.[0]}</div>
          <div>
            <p className="account-name">{user?.full_name}</p>
            <p className="account-role">{user?.role} account</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {editing && (
        <div className="account-section">
          <p className="account-section-title">Edit account details</p>
          <div className="account-fields-grid">
            <Field label="Full Name">
              <Input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </Field>
          </div>
          <div className="account-footer-actions">
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
          </div>
        </div>
      )}

      <div className="account-section">
        <p className="account-section-title">Account details</p>
        <div className="account-fields-grid">
          <div className="account-field">
            <p className="account-field-label">Email</p>
            <div className="account-field-value">{user?.email || "-"}</div>
          </div>
          <div className="account-field">
            <p className="account-field-label">Phone</p>
            <div className="account-field-value">{user?.phone || "-"}</div>
          </div>
        </div>
      </div>

      <div className="account-section">
        <p className="account-section-title">Verification & subscription</p>
        <div className="account-fields-grid">
          <div className="account-field">
            <p className="account-field-label">Verification</p>
            <div className="account-field-value account-field-value--capitalize">{user?.verification_status || "pending"}</div>
          </div>
          <div className="account-field">
            <p className="account-field-label">Subscription</p>
            <div className="account-field-value account-field-value--capitalize">{user?.subscription_status || "inactive"}</div>
          </div>
          <div className="account-field">
            <p className="account-field-label">Subscription plan</p>
            <div className="account-field-value account-field-value--capitalize">{user?.subscription_plan || "-"}</div>
          </div>
          <div className="account-field">
            <p className="account-field-label">Subscription expires</p>
            <div className="account-field-value">{formatDate(user?.subscription_expires_at)}</div>
          </div>
        </div>
      </div>

      <div className="account-footer-actions">
        <Button variant="danger" size="sm" onClick={logout}>Logout</Button>
      </div>
    </Card>
  );
}