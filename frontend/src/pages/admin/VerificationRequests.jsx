import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Check, X } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/States";
import { adminListVerificationRequests, adminReviewVerificationRequest } from "../../api/admin";
import { API_BASE_URL } from "../../api/client";
import "./VerificationRequests.css";

export default function VerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [reason, setReason] = useState({});
  const [saving, setSaving] = useState("");
  const [preview, setPreview] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = () => {
    setStatus("loading");
    adminListVerificationRequests()
      .then((data) => { setRequests(data || []); setStatus("success"); })
      .catch((err) => { setError(err.message); setStatus("error"); });
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((account) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "driver") return account.role === "driver" && account.driver_profile?.driver_type === "freelance";
      if (categoryFilter === "operator") return account.role === "operator";
      if (categoryFilter === "operator-driver") return account.role === "driver" && account.driver_profile?.driver_type === "operator";
      return true;
    });
  }, [requests, categoryFilter]);

  const review = async (userId, nextStatus) => {
    const rejectionReason = reason[userId] || "";
    if (nextStatus === "rejected" && !rejectionReason.trim()) {
      setError("Add a rejection reason before rejecting a document.");
      return;
    }
    setSaving(userId);
    setError("");
    try {
      await adminReviewVerificationRequest(userId, nextStatus, rejectionReason);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  };

  const fileUrl = (path) => path?.startsWith("http") ? path : `${API_BASE_URL.replace(/\/api\/v1$/, "")}${path}`;
  const isPdf = (document) => document.file_url?.toLowerCase().includes(".pdf");
  const previewUrl = (document) => {
    const url = fileUrl(document.file_url);
    if (!isPdf(document) || !url.includes("/image/upload/")) return url;
    return url.replace("/image/upload/", "/image/upload/pg_1,f_jpg/").replace(/\.pdf($|\?)/i, ".jpg$1");
  };

  const statusPillClass = (verificationStatus) => {
    if (verificationStatus === "verified") return "verification-status-pill verification-status-pill--verified";
    if (verificationStatus === "rejected") return "verification-status-pill verification-status-pill--rejected";
    return "verification-status-pill verification-status-pill--pending";
  };

  if (status === "loading") return <LoadingState label="Loading verification requests..." />;
  if (status === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="verification-page">
      {error && <p className="verification-error">{error}</p>}

      <div className="admin-segmented-control" role="tablist" aria-label="Verification request categories">
        {[
          { value: "all", label: "All requests" },
          { value: "driver", label: "Drivers" },
          { value: "operator", label: "Operators" },
          { value: "operator-driver", label: "Operator drivers" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`admin-segmented-button ${categoryFilter === tab.value ? "admin-segmented-button--active" : ""}`}
            onClick={() => setCategoryFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!filteredRequests.length ? (
        <EmptyState title="No verification requests" description="Driver and operator submissions will appear here." />
      ) : (
        <div className="verification-grid">
          {filteredRequests.map((account) => (
            <Card key={account.id} className="verification-card">
              <div className="verification-card-header">
                <div>
                  <p className="verification-name">{account.full_name}</p>
                  <p className="verification-meta">
                    {account.role === "driver" && account.driver_profile?.operator_id ? `Operator driver • ${account.driver_profile.operator_name}` : account.role} · {account.email}
                    {account.role === "driver" && !account.driver_profile?.operator_id ? " • Freelancing driver" : ""}
                    {account.role === "operator" ? ` • Operator` : ""}
                    <span>{account.subscription_status ? ` · subscription: ${account.subscription_status}` : ""}</span>
                  </p>
                </div>
                <span className={statusPillClass(account.verification_status)}>
                  {account.verification_status}
                </span>
              </div>
              <div className="verification-documents">
                {(account.documents || []).map((document) => (
                  <div key={document.id} className="verification-document">
                    <div className="verification-document-header">
                      <span className="verification-document-type">{document.document_type}</span>
                      <span className={`verification-document-status verification-document-status--${document.status}`}>{document.status}</span>
                    </div>
                    <div className="verification-document-actions">
                      <a href={previewUrl(document)} target="_blank" rel="noreferrer" className="verification-document-link">
                        Review document <ExternalLink />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPreview({ ...document, url: previewUrl(document), previewImage: isPdf(document) && fileUrl(document.file_url).includes("/image/upload/") })}
                        className="verification-preview-btn"
                      >
                        {isPdf(document) ? "Preview PDF" : "Preview image"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="verification-review">
                <p className="verification-review-title">Review all documents for this {account.role}</p>
                {account.verification_status !== "verified" && (
                  <>
                    <input value={reason[account.id] || ""} onChange={(event) => setReason((current) => ({ ...current, [account.id]: event.target.value }))} placeholder="Rejection reason (required to reject)" className="verification-reason-input" />
                    <div className="verification-review-actions">
                      <Button size="sm" loading={saving === account.id} onClick={() => review(account.id, "verified")}><Check /> Approve All Documents</Button>
                      <Button size="sm" variant="danger" loading={saving === account.id} onClick={() => review(account.id, "rejected")}><X /> Reject All Documents</Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <div className="verification-modal-overlay" onClick={() => setPreview(null)}>
          <Card className="verification-modal" onClick={(event) => event.stopPropagation()}>
            <div className="verification-modal-header">
              <p className="verification-modal-title">{preview.document_type} preview</p>
              <Button size="sm" variant="outline" onClick={() => setPreview(null)}>Close</Button>
            </div>
            <div className="verification-modal-body">
              {isPdf(preview) && !preview.previewImage ? (
                <iframe title={`${preview.document_type} PDF`} src={preview.url} className="verification-modal-frame" />
              ) : (
                <img src={preview.url} alt={`${preview.document_type} document`} className="verification-modal-image" />
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
