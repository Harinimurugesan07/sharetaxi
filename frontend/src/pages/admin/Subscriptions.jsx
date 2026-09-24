import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, Search } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { Input, Select } from "../../components/Field";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { formatDate } from "../../lib/format";
import { adminListSubscriptions } from "../../api/admin";
import "./AdminTable.css";

function statusTone(status) {
  if (status === "active" || status === "verified") return "success";
  if (status === "expired" || status === "rejected") return "danger";
  return "neutral";
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = () => {
    setStatus("loading");
    adminListSubscriptions(filter)
      .then((items) => { setSubscriptions(items || []); setStatus("success"); })
      .catch(() => setStatus("error"));
  };
  useEffect(() => {
    load();
  }, [filter]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const user = subscription.user || {};
      const matchesQuery = !normalizedQuery || `${user.full_name || ""} ${user.email || ""} ${user.phone || ""} ${subscription.plan || ""}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryFilter === "all" || user.role === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [subscriptions, query, categoryFilter]);

  return (
    <div className="admin-page">
      <div className="admin-filter-bar">
        <div className="admin-filter-search--compact">
          <Input icon={Search} placeholder="Search subscriber or plan..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select className="admin-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">All subscription statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </Select>
      </div>

      <div className="admin-segmented-control" role="tablist" aria-label="Subscription categories">
        {[
          { value: "all", label: "All subscriptions" },
          { value: "driver", label: "Drivers" },
          { value: "operator", label: "Operators" },
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

      {status === "loading" && <LoadingState label="Loading subscriptions..." />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "success" && !filtered.length && <EmptyState title="No subscriptions found" description="Driver and operator subscription payments will appear here." />}
      {status === "success" && filtered.length > 0 && (
        <Card className="admin-table-card">
          <table className="admin-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Subscriber</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Payment Reference</th>
                <th>Period</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <p className="admin-table-cell-primary">{subscription.user?.full_name}</p>
                    <p className="admin-table-cell-muted">{subscription.user?.email} · {subscription.user?.phone}</p>
                  </td>
                  <td className="admin-table-cell-capitalize">{subscription.user?.role}</td>
                  <td><Badge tone={statusTone(subscription.user?.verification_status)}>{subscription.user?.verification_status}</Badge></td>
                  <td><p className="admin-table-cell-primary admin-table-cell-capitalize">{subscription.plan}</p></td>
                  <td><Badge tone={statusTone(subscription.status)}>{subscription.status}</Badge></td>
                  <td className="admin-table-cell-muted">{subscription.payment_reference || "-"}</td>
                  <td className="admin-table-cell-muted">
                    <span className="admin-table-icon-row"><CalendarDays /> {formatDate(subscription.started_at)}</span>
                    <span className="admin-table-subline">Expires {formatDate(subscription.expires_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}