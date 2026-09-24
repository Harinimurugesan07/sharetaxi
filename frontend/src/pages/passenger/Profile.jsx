import { useEffect, useState } from "react";
import { Mail, Phone, Pencil } from "lucide-react";
import { Field, Input, Select } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateProfile } from "../../api/users";
import "./Profile.css";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const ID_TYPE_OPTIONS = ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profile: {
      gender: user?.profile?.gender || "",
      date_of_birth: user?.profile?.date_of_birth || "",
      address: user?.profile?.address || "",
      city: user?.profile?.city || "",
      state: user?.profile?.state || "",
      pincode: user?.profile?.pincode || "",
      emergency_contact_name: user?.profile?.emergency_contact_name || "",
      emergency_contact_phone: user?.profile?.emergency_contact_phone || "",
      id_type: user?.profile?.id_type || "",
      id_number: user?.profile?.id_number || "",
    },
  });

  useEffect(() => {
    setForm({
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profile: {
        gender: user?.profile?.gender || "",
        date_of_birth: user?.profile?.date_of_birth || "",
        address: user?.profile?.address || "",
        city: user?.profile?.city || "",
        state: user?.profile?.state || "",
        pincode: user?.profile?.pincode || "",
        emergency_contact_name: user?.profile?.emergency_contact_name || "",
        emergency_contact_phone: user?.profile?.emergency_contact_phone || "",
        id_type: user?.profile?.id_type || "",
        id_number: user?.profile?.id_number || "",
      },
    });
  }, [user]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateProfileField = (key, value) => setForm((current) => ({
    ...current,
    profile: { ...(current.profile || {}), [key]: value },
  }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        profile: form.profile,
      });
      const updatedUser = await refreshUser();
      const completion = Number(updatedUser?.profile_completion_percentage ?? 0);
      if (completion >= 100) {
        toast.success("Your profile is now 100% complete.", "Profile Completed!");
      } else {
        toast.success("Your passenger profile has been updated successfully.", "Profile Updated Successfully");
      }
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pf-wrap">
      <div className="pf-card">
        <div className="pf-head">
          <div className="pf-avatar">{user?.full_name?.[0] || "U"}</div>
          <div className="pf-head-text">
            <p className="pf-name">{user?.full_name}</p>
            <p className="pf-rides">{user?.profile?.total_rides ?? 0} rides completed</p>
          </div>
          <button className="pf-btn pf-btn-outline" onClick={() => setEditing((e) => !e)}>
            <Pencil className="pf-btn-icon" /> {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {editing ? (
          <div className="pf-form">
            <div className="pf-section-block">
              <p className="pf-section-title">Personal Details</p>
              <Field label="Full Name">
                <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.profile.date_of_birth || ""} onChange={(e) => updateProfileField("date_of_birth", e.target.value)} />
              </Field>
              <Field label="Gender">
                <Select value={form.profile.gender || ""} onChange={(e) => updateProfileField("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="pf-section-block">
              <p className="pf-section-title">Contact Details</p>
              <Field label="Email">
                <Input icon={Mail} value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </Field>
              <Field label="Mobile Number">
                <Input icon={Phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </Field>
            </div>

            <div className="pf-section-block">
              <p className="pf-section-title">Address Details</p>
              <Field label="Address">
                <Input value={form.profile.address || ""} onChange={(e) => updateProfileField("address", e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.profile.city || ""} onChange={(e) => updateProfileField("city", e.target.value)} />
              </Field>
              <Field label="State">
                <Input value={form.profile.state || ""} onChange={(e) => updateProfileField("state", e.target.value)} />
              </Field>
              <Field label="Pincode">
                <Input value={form.profile.pincode || ""} onChange={(e) => updateProfileField("pincode", e.target.value)} />
              </Field>
            </div>

            <div className="pf-section-block">
              <p className="pf-section-title">Emergency Contact</p>
              <Field label="Emergency Contact Name">
                <Input value={form.profile.emergency_contact_name || ""} onChange={(e) => updateProfileField("emergency_contact_name", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Number">
                <Input value={form.profile.emergency_contact_phone || ""} onChange={(e) => updateProfileField("emergency_contact_phone", e.target.value)} />
              </Field>
            </div>

            <div className="pf-section-block">
              <p className="pf-section-title">Identity Details</p>
              <Field label="ID Type">
                <Select value={form.profile.id_type || ""} onChange={(e) => updateProfileField("id_type", e.target.value)}>
                  <option value="">Select ID type</option>
                  {ID_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </Field>
              <Field label="ID Number">
                <Input value={form.profile.id_number || ""} onChange={(e) => updateProfileField("id_number", e.target.value)} />
              </Field>
            </div>

            <button className="pf-btn pf-btn-primary pf-btn-block" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        ) : (
          <div className="pf-info">
            <div className="pf-info-row"><Mail className="pf-info-icon" /> {user?.email}</div>
            <div className="pf-info-row"><Phone className="pf-info-icon" /> {user?.phone}</div>
            <div className="pf-info-row">Gender: {user?.profile?.gender || "-"}</div>
            <div className="pf-info-row">DOB: {user?.profile?.date_of_birth || "-"}</div>
            <div className="pf-info-row">Address: {user?.profile?.address || "-"}</div>
            <div className="pf-info-row">City: {user?.profile?.city || "-"}</div>
            <div className="pf-info-row">State: {user?.profile?.state || "-"}</div>
            <div className="pf-info-row">Pincode: {user?.profile?.pincode || "-"}</div>
          </div>
        )}
      </div>
    </div>
  );
}