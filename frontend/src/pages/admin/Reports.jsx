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
  adminReportBreakdown,
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
  const [breakdown, setBreakdown] = useState({ items: [], page: 1, pages: 0, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    operator_id: "",
    category: "",
    status: "",
    date_from: "",
    date_to: "",
    sort: "date",
    direction: "desc",
    page: 1,
    per_page: 25,
  });

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

  useEffect(() => {
    const timer = setTimeout(() => {
      adminReportBreakdown(filters)
        .then((data) => setBreakdown(data || { items: [], page: 1, pages: 0, total: 0 }))
        .catch(() => setBreakdown({ items: [], page: 1, pages: 0, total: 0 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "page" ? {} : { page: 1 }),
    }));
  };

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
      value: stats?.total_users ?? 0,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Total Operators",
      value: stats?.total_operators ?? 0,
      icon: UserRound,
      tone: "cyan",
    },
    {
      label: "Total Drivers",
      value: stats?.total_drivers,
      icon: UserRound,
      tone: "purple",
    },
    {
      label: "Verified Drivers",
      value: stats?.drivers_verified ?? 0,
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
      label: "Total Earnings",
      value: financial.total_earnings,
      tone: "blue",
    },
    {
      label: "Total Commission",
      value: financial.total_admin_amount,
      tone: "purple",
    },
    {
      label: "Driver Earnings",
      value: financial.total_driver_earnings,
      tone: "green",
    },
    {
      label: "Operator Earnings",
      value: financial.total_operator_share,
      tone: "amber",
    },
    {
      label: "Freelance Driver Earnings",
      value: financial.freelance_driver_earnings,
      tone: "cyan",
    },
    {
      label: "Payout Amount",
      value: financial.total_payout_requested,
      tone: "blue",
    },
    {
      label: "Pending Payout",
      value: financial.pending_payout,
      tone: "amber",
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

  const commissionBreakdown =
    financial.commission_breakdown || {};

  const reportOperators = commissionBreakdown.operators || [];

  const commissionColumns = [
    ["Trips", "trip_count"],
    ["Ride revenue", "ride_revenue"],
    ["Admin commission", "admin_commission"],
    ["Operator earnings", "operator_earnings"],
    ["Driver earnings", "driver_earnings"],
    ["Payout requested", "payout_requested"],
    ["Payout pending", "payout_pending"],
    ["Payout paid", "payout_paid"],
    ["Payout status", "payout_status_counts"],
  ];

  const renderCommissionValue = (row, key) =>
    key === "trip_count"
      ? row[key] ?? 0
      : key === "payout_status_counts"
        ? Object.entries(row[key] || {})
            .map(([status, count]) => `${status}: ${count}`)
            .join(", ") || "—"
      : formatCurrency(row[key] ?? 0);

  const commissionTable = (rows, emptyLabel) => (
    rows?.length ? (
      <div className="commission-records">
        {rows.map((row) => (
          <div className="commission-record" key={`${row.driver_type}-${row.id}`}>
            <div className="commission-record-header">
              <div>
                <span className="commission-name">{row.name}</span>
                <span className="commission-type">
                  {row.driver_type === "operator"
                    ? "Operator"
                    : row.driver_type === "operator_driver"
                      ? "Operator driver"
                      : "Freelance driver"}
                </span>
              </div>
              <span className="commission-trip-count">
                {row.trip_count ?? 0} paid {row.trip_count === 1 ? "trip" : "trips"}
              </span>
            </div>
            <div className="commission-metrics">
              {commissionColumns.slice(1).map(([label, key]) => (
                <div className="commission-metric" key={key}>
                  <span>{label}</span>
                  <strong>{renderCommissionValue(row, key)}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="commission-empty">{emptyLabel}</p>
    )
  );

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

      <div className="reports-grid reports-financial-grid">
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

      <section className="commission-section">
        <p className="reports-title">Commission and Earnings</p>
        <p className="reports-subtitle">
          Paid-trip commissions grouped by operator ownership.
        </p>

        <div className="commission-groups">
          {(commissionBreakdown.operators || []).map((operator) => (
            <article className="commission-group" key={operator.id}>
              <h3>Operator: {operator.name}</h3>
              {commissionTable([operator], "No operator activity")}

              <h4>Drivers managed by {operator.name}</h4>
              {commissionTable(
                operator.drivers,
                "No drivers registered for this operator",
              )}
            </article>
          ))}
        </div>

        <article className="commission-group commission-group-freelance">
          <h3>Freelance drivers</h3>
          {commissionTable(
            commissionBreakdown.freelance_drivers,
            "No freelance drivers registered",
          )}
        </article>

        <article className="commission-group commission-group-trips">
          <h3>Trip-wise commission and earnings</h3>
          <div className="report-filter-bar">
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search driver or route"
              aria-label="Search commission records"
            />
            <select value={filters.operator_id} onChange={(event) => updateFilter("operator_id", event.target.value)}>
              <option value="">All operators</option>
              {reportOperators.map((operator) => (
                <option key={operator.id} value={operator.id}>{operator.name}</option>
              ))}
            </select>
            <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
              <option value="">All categories</option>
              <option value="operator">Operator drivers</option>
              <option value="freelance">Freelance drivers</option>
            </select>
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="">All trip statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} aria-label="From date" />
            <input type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} aria-label="To date" />
            <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
              <option value="date">Sort by date</option>
              <option value="commission">Sort by commission</option>
              <option value="earnings">Sort by driver earnings</option>
              <option value="revenue">Sort by revenue</option>
            </select>
            <button type="button" className="report-sort-button" onClick={() => updateFilter("direction", filters.direction === "desc" ? "asc" : "desc")}>
              {filters.direction === "desc" ? "Newest first" : "Oldest first"}
            </button>
          </div>
          {breakdown.items.length === 0 ? (
            <p className="commission-empty">No paid trips recorded</p>
          ) : (
            <div className="trip-records">
              {breakdown.items.map((trip) => (
                <div className="trip-record" key={trip.id}>
                  <div className="trip-record-heading">
                    <div>
                      <strong>{trip.route}</strong>
                      <span>{trip.departure_time ? new Date(trip.departure_time).toLocaleString() : "—"}</span>
                    </div>
                    <span className={`trip-category trip-category-${trip.category}`}>
                      {trip.category === "freelance" ? "Freelance" : "Operator"}
                    </span>
                  </div>
                  <div className="trip-record-meta">
                    <span><b>Driver</b>{trip.driver_name}</span>
                    <span><b>Operator</b>{trip.operator_name || "—"}</span>
                  </div>
                  <div className="trip-record-financials">
                    <span><b>Commission</b><strong>{formatCurrency(trip.admin_commission)}</strong></span>
                    <span><b>Operator earnings</b><strong>{formatCurrency(trip.operator_earnings)}</strong></span>
                    <span><b>Driver earnings</b><strong>{formatCurrency(trip.driver_earnings)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="report-pagination">
            <span>{breakdown.total} matching trips</span>
            <button type="button" disabled={filters.page <= 1} onClick={() => updateFilter("page", filters.page - 1)}>Previous</button>
            <strong>Page {breakdown.page || 1} of {breakdown.pages || 1}</strong>
            <button type="button" disabled={!breakdown.pages || filters.page >= breakdown.pages} onClick={() => updateFilter("page", filters.page + 1)}>Next</button>
          </div>
        </article>
      </section>

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