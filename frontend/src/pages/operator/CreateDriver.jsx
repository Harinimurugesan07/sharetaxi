import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileUp,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  Plus,
  X,
  Search,
} from "lucide-react";

import Card from "../../components/Card";
import Button from "../../components/Button";
import { Field, Input } from "../../components/Field";
import {
  operatorCreateDriver,
  operatorUploadDriverDocument,
  operatorDrivers,
} from "../../api/operator";
import { useToast } from "../../context/ToastContext";

import "./OperatorForms.css";
import "./CreateDriver.css";

/* =========================================================
   Driver Verification Documents
========================================================= */

const documents = [
  ["profile_photo", "Profile Photo"],
  ["driving_license", "Driving License"],
  ["government_id", "Government ID"],
  ["address_proof", "Address Proof"],
];

const statusFilters = ["All", "pending", "verified", "rejected"];

/* =========================================================
   Helpers
========================================================= */

function initials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* =========================================================
   Component
========================================================= */

export default function CreateDriver() {
  const toast = useToast();

  /* -------------------------------------------------------
     Driver List State
  ------------------------------------------------------- */

  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* -------------------------------------------------------
     Modal + Form State
  ------------------------------------------------------- */

  const [showModal, setShowModal] = useState(false);

  const emptyForm = {
    full_name: "",
    email: "",
    phone: "",
    password: "",
    license_number: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);

  /* =======================================================
     Load Drivers
  ======================================================= */

  const loadDrivers = () => {
    setDriversLoading(true);

    operatorDrivers()
      .then((items) => {
        setDrivers(items || []);
      })
      .catch(() => {
        setDrivers([]);
      })
      .finally(() => {
        setDriversLoading(false);
      });
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  /* =======================================================
     Lock Background Scroll When Modal Is Open
  ======================================================= */

  useEffect(() => {
    if (!showModal) return;

    const original = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [showModal]);

  /* =======================================================
     License Number Formatting
  ======================================================= */

  const formatLicenseNumber = (value) => {
    const cleaned = value
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 21);

    const match = cleaned.match(/^([a-zA-Z]*)(\d{0,14})$/i);

    if (!match) return cleaned;

    const prefix = (match[1] || "")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase();

    const digits = (match[2] || "").replace(/\D/g, "");

    if (!prefix && !digits) return "";

    if (digits) {
      return `${prefix ? `${prefix}-` : ""}${digits}`;
    }

    return prefix;
  };

  /* =======================================================
     Form Setter
  ======================================================= */

  const set = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [key]:
        key === "license_number"
          ? formatLicenseNumber(value)
          : value,
    }));
  };

  /* =======================================================
     Reset Form
  ======================================================= */

  const resetForm = () => {
    setForm(emptyForm);
    setFiles({});
  };

  /* =======================================================
     Close Modal
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  /* =======================================================
     Submit Driver
  ======================================================= */

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      /* Create Driver */

      const created = await operatorCreateDriver(form);

      /* Upload Driver Documents */

      for (const [type] of documents) {
        if (files[type]) {
          await operatorUploadDriverDocument(
            created.driver.id,
            type,
            files[type]
          );
        }
      }

      /* Close Modal */

      setShowModal(false);
      resetForm();

      /* Refresh Driver List */

      loadDrivers();

      toast.success(
        "Driver added. Awaiting approval.",
        "Driver Added"
      );
    } catch (error) {
      toast.error(
        error?.message || "Failed to create driver."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Uploaded Documents Count
  ======================================================= */

  const uploadedCount = documents.filter(
    ([type]) => files[type]
  ).length;

  /* =======================================================
     Filter Drivers
  ======================================================= */

  const filteredDrivers = useMemo(() => {
    let list = drivers;

    /* Status Filter */

    if (statusFilter !== "All") {
      list = list.filter(
        (driver) =>
          driver.verification_status === statusFilter
      );
    }

    /* Search */

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((driver) =>
        [
          driver.full_name,
          driver.email,
          driver.phone,
          driver.license_number,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [drivers, statusFilter, search]);

  /* =======================================================
     Modal Root
  ======================================================= */

  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="cd-page">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="cd-page-header">

        <div>
          <h2 className="cd-page-title">
            Drivers
          </h2>

          <p className="cd-page-subtitle">
            {drivers.length} driver
            {drivers.length === 1 ? "" : "s"} on the platform
          </p>
        </div>

        <div className="cd-page-actions">

          {/* Search */}

          <div className="cd-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search name, email, phone or license"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Create Driver */}

          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Create Driver
          </Button>

        </div>
      </div>

      {/* ===================================================
          STATUS FILTERS
      =================================================== */}

      <div className="cd-chip-row">

        {statusFilters.map((status) => (
          <button
            key={status}
            className={`cd-chip ${
              statusFilter === status
                ? "cd-chip--active"
                : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "All"
              ? "All"
              : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}

      </div>

      {/* ===================================================
          DRIVER LIST
      =================================================== */}

      <div className="cd-list-card">

        {driversLoading ? (

          <div className="cd-list-empty">
            Loading drivers…
          </div>

        ) : filteredDrivers.length === 0 ? (

          <div className="cd-list-empty">

            <p>No drivers found.</p>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} />
              Create your first driver
            </Button>

          </div>

        ) : (

          <table className="cd-driver-table">

            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>License</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredDrivers.map((driver) => (

                <tr key={driver.id}>

                  {/* Driver */}

                  <td>

                    <div className="cd-driver-cell">

                      <span className="cd-driver-avatar">
                        {initials(driver.full_name)}
                      </span>

                      <div className="cd-driver-cell-text">

                        <p className="cd-driver-name">
                          {driver.full_name}
                        </p>

                        <p className="cd-driver-sub">
                          {driver.email}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* Phone */}

                  <td>
                    {driver.phone || "—"}
                  </td>

                  {/* License */}

                  <td>
                    {driver.license_number || "—"}
                  </td>

                  {/* Status */}

                  <td>

                    <span
                      className={`cd-status cd-status--${
                        driver.verification_status || "pending"
                      }`}
                    >
                      {driver.verification_status || "pending"}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* ===================================================
          CREATE DRIVER MODAL
      =================================================== */}

      {showModal &&
        modalRoot &&
        createPortal(

          <div
            className="cd-modal-overlay"
            onClick={closeModal}
          >

            <div
              className="cd-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* ==========================================
                  MODAL HEADER
              ========================================== */}

              <div className="cd-modal-header">

                <div className="cd-modal-title-wrap">

                  <User size={18} />

                  <h3>
                    Create Driver
                  </h3>

                </div>

                <button
                  type="button"
                  className="cd-modal-close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

              {/* ==========================================
                  MODAL BODY
              ========================================== */}

              <div className="cd-modal-body">

                <div className="create-driver-layout">

                  <form
                    onSubmit={submit}
                    className="create-driver-form"
                  >

                    <div className="create-driver-grid">

                      {/* =================================
                          DRIVER DETAILS
                      ================================= */}

                      <Card className="create-driver-main">

                        <p className="create-driver-main-title">
                          Driver Details
                        </p>

                        <div className="op-form-grid-2">

                          <Field
                            label="Full Name"
                            required
                          >
                            <Input
                              icon={User}
                              required
                              value={form.full_name}
                              onChange={set("full_name")}
                            />
                          </Field>

                          <Field
                            label="Email"
                            required
                          >
                            <Input
                              icon={Mail}
                              type="email"
                              required
                              value={form.email}
                              onChange={set("email")}
                            />
                          </Field>

                          <Field
                            label="Phone"
                            required
                          >
                            <Input
                              icon={Phone}
                              required
                              value={form.phone}
                              onChange={set("phone")}
                            />
                          </Field>

                          <Field
                            label="Temporary Password"
                            required
                          >
                            <Input
                              icon={Lock}
                              type="password"
                              required
                              value={form.password}
                              onChange={set("password")}
                            />
                          </Field>

                          <Field
                            label="License Number"
                            required
                            hint="Format: DL-XXXXXXXXXXXX"
                          >
                            <Input
                              icon={IdCard}
                              required
                              value={form.license_number}
                              onChange={set("license_number")}
                              placeholder="DL-0420110149646"
                            />
                          </Field>

                        </div>

                        {/* =================================
                            ADDRESS DETAILS
                        ================================= */}

                        <div className="op-form-section">

                          <p className="op-form-section-title">
                            <MapPin />
                            Address Details
                          </p>

                          <div className="op-form-grid-2">

                            <Field
                              label="Address"
                              required
                            >
                              <Input
                                required
                                value={form.address}
                                onChange={set("address")}
                              />
                            </Field>

                            <Field
                              label="City"
                              required
                            >
                              <Input
                                required
                                value={form.city}
                                onChange={set("city")}
                              />
                            </Field>

                            <Field
                              label="State"
                              required
                            >
                              <Input
                                required
                                value={form.state}
                                onChange={set("state")}
                              />
                            </Field>

                            <Field
                              label="Postal Code"
                              required
                            >
                              <Input
                                required
                                value={form.postal_code}
                                onChange={set("postal_code")}
                              />
                            </Field>

                            <Field
                              label="Country"
                              required
                            >
                              <Input
                                required
                                value={form.country}
                                onChange={set("country")}
                              />
                            </Field>

                          </div>

                        </div>

                      </Card>

                      {/* =================================
                          DRIVER DOCUMENTS
                      ================================= */}

                      <Card className="create-driver-docs">

                        <div className="create-driver-docs-header">

                          <p className="create-driver-main-title">
                            Verification Documents
                          </p>

                          <span className="create-driver-docs-count">
                            {uploadedCount}/{documents.length} added
                          </span>

                        </div>

                        <div className="doc-upload-grid">

                          {documents.map(
                            ([type, label]) => {

                              const uploaded =
                                Boolean(files[type]);

                              return (

                                <label
                                  key={type}
                                  className={`doc-upload-row ${
                                    uploaded
                                      ? "doc-upload-row--done"
                                      : ""
                                  }`}
                                >

                                  <FileUp />

                                  <span className="doc-upload-text">

                                    <span className="doc-upload-label">
                                      {label}
                                    </span>

                                    <span className="doc-upload-filename">
                                      {uploaded
                                        ? files[type].name
                                        : "No file chosen"}
                                    </span>

                                  </span>

                                  <span className="doc-upload-btn">
                                    {uploaded
                                      ? "Change"
                                      : "Choose File"}
                                  </span>

                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    required
                                    className="doc-upload-input"
                                    onChange={(event) =>
                                      setFiles(
                                        (current) => ({
                                          ...current,
                                          [type]:
                                            event.target
                                              .files?.[0],
                                        })
                                      )
                                    }
                                  />

                                </label>

                              );
                            }
                          )}

                        </div>

                      </Card>

                    </div>

                    {/* =====================================
                        SUBMIT
                    ===================================== */}

                    <Button
                      type="submit"
                      className="op-submit-full"
                      size="lg"
                      loading={saving}
                    >
                      Create Driver & Submit Documents
                    </Button>

                  </form>

                </div>

              </div>

            </div>

          </div>,

          modalRoot
        )}

    </div>
  );
}