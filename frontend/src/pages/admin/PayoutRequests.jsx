import { useEffect, useState } from "react";

import {
  Check,
  X,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import Card from "../../components/Card";

import {
  LoadingState,
  ErrorState,
} from "../../components/States";

import { formatCurrency } from "../../lib/format";

import {
  adminDriverPayoutRequests,
  adminApproveDriverPayout,
  adminProcessDriverPayout,
  adminReconcileDriverPayout,
  adminRejectDriverPayout,
} from "../../api/admin";

import "./PayoutRequests.css";

export default function PayoutRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const data = await adminDriverPayoutRequests();

      setRequests(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load payout requests."
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (payoutRequestId) => {
    setActionId(payoutRequestId);
    setMessage("");

    try {
      await adminApproveDriverPayout(
        payoutRequestId
      );

      setMessage("Payout request approved.");

      await load();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to approve payout request."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleProcess = async (payoutRequestId) => {
    setActionId(payoutRequestId);
    setMessage("");

    try {
      await adminProcessDriverPayout(
        payoutRequestId
      );

      setMessage("Payout processing started.");

      await load();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to process payout."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleReconcile = async (payoutRequestId) => {
    setActionId(payoutRequestId);
    setMessage("");

    try {
      await adminReconcileDriverPayout(
        payoutRequestId
      );

      setMessage("Payout status updated.");

      await load();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to check payout status."
      );
    } finally {
      setActionId(null);
    }
  };

  const reject = async (payoutRequestId) => {
    const adminNote = window.prompt(
      "Enter rejection reason:"
    );

    if (adminNote === null) {
      return;
    }

    setActionId(payoutRequestId);
    setMessage("");

    try {
      await adminRejectDriverPayout(
        payoutRequestId,
        adminNote
      );

      setMessage("Payout request rejected.");

      await load();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to reject payout request."
      );
    } finally {
      setActionId(null);
    }
  };

  if (status === "loading") {
    return (
      <LoadingState label="Loading payout requests..." />
    );
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  return (
    <Card className="admin-payout-card">
      <div className="admin-payout-header">
        <div>
          <div className="admin-payout-title-row">
            <span className="admin-payout-icon">
              <WalletCards size={18} />
            </span>

            <div>
              <p className="admin-payout-title">
                Driver Payout Requests
              </p>

              <p className="admin-payout-subtitle">
                Review and process driver withdrawal requests.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="admin-payout-refresh"
          onClick={load}
          disabled={actionId !== null}
          title="Refresh"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <p className="admin-payout-message">
          {message}
        </p>
      )}

      {requests.length === 0 ? (
        <div className="admin-payout-empty">
          <WalletCards size={28} />

          <p>
            No payout requests found.
          </p>
        </div>
      ) : (
        <div className="admin-payout-table-wrap">
          <table className="admin-payout-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Operator</th>
                <th>Driver</th>
                <th>Amount</th>
                <th>Bank</th>
                <th>Account</th>
                <th>IFSC</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((item) => {
                const busy =
                  actionId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      {item.operator_id ? "Operator driver" : "Freelance driver"}
                    </td>
                    <td>{item.operator_name || "Admin-managed"}</td>
                    <td>
                      <strong>
                        {item.driver_name ||
                          item.driver_id ||
                          "Driver"}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          item.amount
                        )}
                      </strong>
                    </td>

                    <td>
                      {item.bank_name || "—"}
                    </td>

                    <td>
                      {item.bank_account_number_masked ||
                        "—"}
                    </td>

                    <td>
                      {item.bank_ifsc_code || "—"}
                    </td>

                    <td>
                      <span
                        className={`payout-status payout-status-${String(
                          item.status || "unknown"
                        ).toLowerCase()}`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <div className="admin-payout-actions">
                        {item.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="admin-payout-approve"
                              onClick={() =>
                                approve(item.id)
                              }
                              disabled={busy}
                            >
                              <Check size={15} />

                              {busy
                                ? "Working..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              className="admin-payout-reject"
                              onClick={() =>
                                reject(item.id)
                              }
                              disabled={busy}
                            >
                              <X size={15} />
                              Reject
                            </button>
                          </>
                        )}

                        {item.status === "approved" && (
                          <button
                            type="button"
                            className="admin-payout-approve"
                            onClick={() =>
                              handleProcess(item.id)
                            }
                            disabled={busy}
                          >
                            <WalletCards size={15} />

                            {busy
                              ? "Processing..."
                              : "Process Payout"}
                          </button>
                        )}

                        {item.status === "processing" && (
                          <button
                            type="button"
                            className="admin-payout-approve"
                            onClick={() =>
                              handleReconcile(item.id)
                            }
                            disabled={busy}
                          >
                            <RefreshCw size={15} />

                            {busy
                              ? "Checking..."
                              : "Check Status"}
                          </button>
                        )}

                        {item.status === "paid" && (
                          <span className="payout-status payout-status-paid">
                            Paid
                          </span>
                        )}

                        {item.status === "rejected" && (
                          <span className="payout-status payout-status-rejected">
                            Rejected
                          </span>
                        )}

                        {item.status === "failed" && (
                          <span className="payout-status payout-status-failed">
                            Failed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}