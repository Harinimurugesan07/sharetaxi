import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Clock, FileUp, X } from "lucide-react";
import Logo from "../components/Logo";
import { getOnboardingStatus, submitVerificationDocument } from "../api/onboarding";
import { useAuth } from "../context/AuthContext";
import { isOperatorOwnedDriver } from "../lib/driverType";
import { roleLandingPath } from "../lib/access";
import "./OnboardingVerification.css";

const labels = {
  profile_photo: "Profile photo",
  driving_license: "Driving license",
  government_id: "Government ID",
  address_proof: "Address proof",
  vehicle_rc: "Vehicle RC",
  insurance: "Insurance",
  puc: "PUC",
  vehicle_document: "required document",
};

const POLL_INTERVAL_MS = 5000;

export default function OnboardingVerification() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState("");
  const redirecting = useRef(false);

  // Operator-owned drivers never upload here and never pay: their operator
  // supplies the documents and an admin approves them.
  const operatorOwnedDriver = isOperatorOwnedDriver(user);

  const load = useCallback(
    () => getOnboardingStatus().then(setStatus).catch((err) => setError(err.message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const documents = Object.fromEntries((status?.documents || []).map((document) => [document.document_type, document]));
  const requiredDocuments = status?.required_documents || [];
  const allDocumentsUploaded = requiredDocuments.length > 0 && requiredDocuments.every((type) => documents[type]);
  const anyDocumentRejected = requiredDocuments.some((type) => documents[type]?.status === "rejected");
  const verificationStatus = status?.verification_status || user?.verification_status || "pending";

  // "Submitted" is derived from what the backend has, not from a local flag,
  // so it survives refreshes and other devices.
  const inReview = verificationStatus === "pending" && allDocumentsUploaded && !anyDocumentRejected;
  const waiting = inReview || (operatorOwnedDriver && verificationStatus === "pending");

  // Verified -> refresh the session first (PortalAccess reads the user from
  // context, so a stale copy would bounce the driver straight back here),
  // then send them where their driver type belongs.
  useEffect(() => {
    if (verificationStatus !== "verified" || redirecting.current) return;
    redirecting.current = true;

    (async () => {
      let me = user;
      try {
        me = await refreshUser();
      } catch {
        // fall through with the copy we already have
      }
      navigate(isOperatorOwnedDriver(me) ? "/driver" : "/subscribe", { replace: true });
    })();
  }, [verificationStatus, user, refreshUser, navigate]);

  useEffect(() => {
    if (!waiting || verificationStatus === "verified") return undefined;
    const interval = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [waiting, verificationStatus, load]);

  if (user && user.role !== "driver" && user.role !== "operator") {
    return <Navigate to={roleLandingPath(user)} replace />;
  }

  const upload = async (type, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(type);
    setError("");
    try {
      await submitVerificationDocument(type, file);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading("");
      event.target.value = "";
    }
  };

  const statusBannerClass =
    verificationStatus === "verified"
      ? "status-banner status-banner--verified"
      : verificationStatus === "rejected"
      ? "status-banner status-banner--rejected"
      : "status-banner status-banner--pending";

  return (
    <div className="verification-page">
      <div className="verification-container">
        <div className="logo-wrap">
          <Logo dark />
        </div>
        <div className="card">
          <p className="step-label">Step 1 of {operatorOwnedDriver ? 1 : 2}</p>
          <h1 className="title">{operatorOwnedDriver ? "Account verification" : "Complete verification"}</h1>
          <p className="subtitle">
            {operatorOwnedDriver
              ? "Your operator manages your documents. You'll get access as soon as an admin approves your account."
              : "Submit the required documents. Admin approval is required before subscription and portal access."}
          </p>

          <div className={statusBannerClass}>
            {verificationStatus === "verified" ? <Check className="icon" /> : verificationStatus === "rejected" ? <X className="icon" /> : <Clock className="icon" />}
            Verification status: {verificationStatus}
          </div>
          {status?.verification_notes && <p className="rejection-reason">Rejection reason: {status.verification_notes}</p>}
          {inReview && (
            <p className="submitted-notice">All documents are submitted. An admin is reviewing them and this page updates automatically.</p>
          )}

          <div className="documents-grid">
            {requiredDocuments.map((type) => {
              const document = documents[type];
              const statusClass =
                document?.status === "rejected"
                  ? "document-status document-status--rejected"
                  : document?.status === "verified"
                  ? "document-status document-status--verified"
                  : "document-status";
              return (
                <label key={type} className="document-label">
                  <FileUp className="document-icon" />
                  <span className="document-info">
                    <span className="document-name">{labels[type] || type}</span>
                    <span className={statusClass}>
                      {document?.status || "Not submitted"}{document?.rejection_reason ? `: ${document.rejection_reason}` : ""}
                    </span>
                  </span>
                  {!operatorOwnedDriver && (
                    <>
                      <input type="file" accept="image/*,.pdf" className="file-input-hidden" onChange={(event) => upload(type, event)} disabled={uploading === type} />
                      <span className="document-action">{document?.status === "rejected" ? "Resubmit" : document ? "Replace" : "Upload"}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
          {error && <p className="error-message">{error}</p>}
          {!operatorOwnedDriver && verificationStatus !== "verified" && !allDocumentsUploaded && (
            <p className="submit-hint">Upload every required document and they go to the admin for review automatically.</p>
          )}
          {operatorOwnedDriver && verificationStatus === "rejected" && (
            <p className="submit-hint">Please contact your operator to resubmit the rejected documents.</p>
          )}
        </div>
      </div>
    </div>
  );
}
