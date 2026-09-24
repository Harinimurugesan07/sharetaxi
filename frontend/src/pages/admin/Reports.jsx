import { useEffect, useState } from "react";

import {
  Users,
  UserRound,
  ShieldCheck,
  Car,
  Route,
} from "lucide-react";

import Card from "../../components/Card";

import {
  LoadingState,
  ErrorState,
} from "../../components/States";

import { formatCurrency } from "../../lib/format";

import {
  adminDashboard,
  adminFinancialSummary,
  getAdminPaymentSplitSettings,
  updateAdminPaymentSplitSettings,
} from "../../api/admin";

import "./Reports.css";

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");

  const [splitSettings, setSplitSettings] = useState({
    freelance_admin_rate: 0,
    operator_admin_rate: 0,
    operator_share_rate: 0,
  });

  const [splitStatus, setSplitStatus] = useState("loading");
  const [splitMessage, setSplitMessage] = useState("");

  const load = () => {
    setStatus("loading");
    setSplitStatus("loading");
    setSplitMessage("");

    Promise.all([
      adminDashboard(),
      adminFinancialSummary(),
      getAdminPaymentSplitSettings(),
    ])
      .then(([dashboard, financial, splitResponse]) => {
        setStats({
          ...dashboard,
          financial,
        });

        const data =
          splitResponse?.data || splitResponse || {};

        setSplitSettings({
          // Backend stores decimal:
          // 0.10 -> UI 10
          // 0.30 -> UI 30
          freelance_admin_rate:
            Number(data.freelance_admin_rate || 0) * 100,

          operator_admin_rate:
            Number(data.operator_admin_rate || 0) * 100,

          operator_share_rate:
            Number(data.operator_share_rate || 0) * 100,
        });

        setStatus("success");
        setSplitStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setSplitStatus("error");
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSplitChange = (field, value) => {
    const numberValue =
      value === "" ? "" : Number(value);

    setSplitSettings((prev) => ({
      ...prev,
      [field]: numberValue,
    }));

    setSplitMessage("");
  };

  const savePaymentSplit = () => {
    setSplitStatus("saving");
    setSplitMessage("");

    const freelanceAdmin =
      Number(splitSettings.freelance_admin_rate || 0);

    const operatorAdmin =
      Number(splitSettings.operator_admin_rate || 0);

    const operatorShare =
      Number(splitSettings.operator_share_rate || 0);

    // Frontend uses percentages.
    // Backend expects decimal values.
    const payload = {
      freelance_admin_rate: freelanceAdmin / 100,
      operator_admin_rate: operatorAdmin / 100,
      operator_share_rate: operatorShare / 100,
    };

    updateAdminPaymentSplitSettings(payload)
      .then(() => {
        setSplitStatus("success");
        setSplitMessage(
          "Payment split settings saved."
        );
      })
      .catch((error) => {
        setSplitStatus("error");

        setSplitMessage(
          error?.message ||
            "Failed to save payment split settings."
        );
      });
  };

  if (status === "loading") {
    return <LoadingState label="Building report..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  const tiles = [
    {
      label: "Total Users",
      value: stats?.total_users,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Total Drivers",
      value: stats?.total_drivers,
      icon: UserRound,
      tone: "purple",
    },
    {
      label: "Verified Drivers",
      value: stats?.verified_drivers,
      icon: ShieldCheck,
      tone: "green",
    },
    {
      label: "Total Vehicles",
      value: stats?.total_vehicles,
      icon: Car,
      tone: "amber",
    },
    {
      label: "Total Trips",
      value: stats?.total_trips,
      icon: Route,
      tone: "cyan",
    },
  ];

  const financial = stats?.financial || {};

  const financialTiles = [
    {
      label: "Total Ride Revenue",
      value: financial.total_ride_revenue,
      tone: "blue",
    },
    {
      label: "Admin Revenue",
      value: financial.total_admin_amount,
      tone: "purple",
    },
    {
      label: "Operator Share",
      value: financial.total_operator_share,
      tone: "amber",
    },
    {
      label: "Driver Earnings",
      value: financial.total_driver_earnings,
      tone: "green",
    },
  ];

  const freelanceAdmin =
    Number(splitSettings.freelance_admin_rate || 0);

  const freelanceDriver =
    100 - freelanceAdmin;

  const operatorAdmin =
    Number(splitSettings.operator_admin_rate || 0);

  const operatorShare =
    Number(splitSettings.operator_share_rate || 0);

  const operatorDriver =
    100 - operatorAdmin - operatorShare;

  return (
    <Card className="reports-card">
      <p className="reports-title">
        Platform Summary
      </p>

      <p className="reports-subtitle">
        A snapshot of ShareTaxi activity across the platform.
      </p>

      <div className="reports-grid">
        {tiles.map(
          ({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className={`reports-tile reports-tile-${tone}`}
            >
              <span className="reports-tile-icon">
                <Icon size={18} />
              </span>

              <span className="reports-tile-value">
                {value ?? "—"}
              </span>

              <span className="reports-tile-label">
                {label}
              </span>
            </div>
          )
        )}
      </div>

      <div className="reports-grid">
        {financialTiles.map(
          ({ label, value, tone }) => (
            <div
              key={label}
              className={`reports-tile reports-tile-${tone}`}
            >
              <span className="reports-tile-value">
                {formatCurrency(value ?? 0)}
              </span>

              <span className="reports-tile-label">
                {label}
              </span>
            </div>
          )
        )}
      </div>

      <div className="payment-split-section">
        <p className="reports-title">
          Payment Split Settings
        </p>

        <p className="reports-subtitle">
          Configure how each paid ride is divided.
        </p>

        {splitStatus === "loading" ? (
          <p className="payment-split-message">
            Loading payment split settings...
          </p>
        ) : (
          <>
            {/* Freelance Driver Trip */}
            <div className="payment-split-group">
              <h3>Freelance Driver Trip</h3>

              <div className="payment-split-row">
                <label>
                  Admin %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      splitSettings.freelance_admin_rate
                    }
                    onChange={(e) =>
                      handleSplitChange(
                        "freelance_admin_rate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <div className="payment-split-result">
                  <span>Driver %</span>
                  <strong>
                    {freelanceDriver.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Operator Trip */}
            <div className="payment-split-group">
              <h3>Operator Trip</h3>

              <div className="payment-split-row">
                <label>
                  Admin %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      splitSettings.operator_admin_rate
                    }
                    onChange={(e) =>
                      handleSplitChange(
                        "operator_admin_rate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Operator %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={
                      splitSettings.operator_share_rate
                    }
                    onChange={(e) =>
                      handleSplitChange(
                        "operator_share_rate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <div className="payment-split-result">
                  <span>Driver %</span>
                  <strong>
                    {operatorDriver.toFixed(2)}%
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="payment-split-save"
              disabled={
                splitStatus === "saving" ||
                freelanceAdmin < 0 ||
                freelanceAdmin > 100 ||
                operatorAdmin < 0 ||
                operatorAdmin > 100 ||
                operatorShare < 0 ||
                operatorShare > 100 ||
                operatorAdmin + operatorShare > 100
              }
              onClick={savePaymentSplit}
            >
              {splitStatus === "saving"
                ? "Saving..."
                : "Save Payment Split"}
            </button>

            {splitMessage && (
              <p className="payment-split-message">
                {splitMessage}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}