import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, CircleDollarSign } from "lucide-react";

import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../components/States";

import {
  operatorSettleSettlement,
  operatorSettlements,
} from "../../api/operator";

import {
  formatCurrency,
  formatDateTime,
} from "../../lib/format";

import "./Settlements.css";

export default function Settlements() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(null);
  const [actionError, setActionError] = useState("");

  const load = () => {
    setStatus("loading");
    setActionError("");

    operatorSettlements()
      .then((data) => {
        setItems(data || []);
        setStatus("success");
      })
      .catch((error) => {
        console.error("Failed to load settlements:", error);
        setStatus("error");
      });
  };

  useEffect(() => {
    load();
  }, []);

  const settle = async (settlement) => {
    setSaving(settlement.id);
    setActionError("");

    try {
      await operatorSettleSettlement(settlement.id);
      load();
    } catch (error) {
      console.error("Failed to settle payment:", error);
      setActionError(
        error.message || "Failed to settle payment."
      );
    } finally {
      setSaving(null);
    }
  };

  /*
   * IMPORTANT:
   * These calculations must stay BEFORE any conditional return.
   * Otherwise useMemo can be called in a different hook order
   * between loading/success renders.
   */

  const pendingTotal = items
    .filter((item) => item.status === "pending")
    .reduce(
      (sum, item) =>
        sum + Number(item.driver_earnings || item.amount || 0),
      0
    );

  const driverSummaries = useMemo(() => {
    const grouped = new Map();

    items.forEach((item) => {
      const current = grouped.get(item.driver_id) || {
        driver_id: item.driver_id,
        driver_name: item.driver_name,
        total_rides: 0,
        ride_revenue: 0,
        driver_earnings: 0,
        operator_share: 0,
        pending_settlement: 0,
        settled_amount: 0,
      };

      current.total_rides += 1;

      current.ride_revenue += Number(
        item.ride_revenue || 0
      );

      current.driver_earnings += Number(
        item.driver_earnings || item.amount || 0
      );

      current.operator_share += Number(
        item.operator_share || 0
      );

      if (item.status === "pending") {
        current.pending_settlement += Number(
          item.driver_earnings || item.amount || 0
        );
      }

      if (item.status === "settled") {
        current.settled_amount += Number(
          item.driver_earnings || item.amount || 0
        );
      }

      grouped.set(item.driver_id, current);
    });

    return [...grouped.values()];
  }, [items]);

  /*
   * Conditional rendering comes AFTER all hooks.
   */

  if (status === "loading") {
    return (
      <LoadingState label="Loading settlements..." />
    );
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  if (!items.length) {
    return (
      <EmptyState
        title="No settlements yet"
        description="Completed trips from your operator drivers will appear here."
      />
    );
  }

  return (
    <div className="settlements-page">

      {actionError && (
        <ErrorState message={actionError} />
      )}

      <div className="settlements-summary">
        <CircleDollarSign />

        <div>
          <span className="settlements-summary-label">
            Pending driver settlement
          </span>

          <strong>
            {formatCurrency(pendingTotal)}
          </strong>
        </div>
      </div>

      <Card className="settlements-card">
        <table className="settlements-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Total rides</th>
              <th>Ride revenue</th>
              <th>Driver earnings</th>
              <th>Operator share</th>
              <th>Pending</th>
              <th>Settled</th>
            </tr>
          </thead>

          <tbody>
            {driverSummaries.map((summary) => (
              <tr key={summary.driver_id}>
                <td className="settlements-primary">
                  {summary.driver_name || "—"}
                </td>

                <td>
                  {summary.total_rides}
                </td>

                <td>
                  {formatCurrency(
                    summary.ride_revenue
                  )}
                </td>

                <td>
                  {formatCurrency(
                    summary.driver_earnings
                  )}
                </td>

                <td>
                  {formatCurrency(
                    summary.operator_share
                  )}
                </td>

                <td>
                  {formatCurrency(
                    summary.pending_settlement
                  )}
                </td>

                <td>
                  {formatCurrency(
                    summary.settled_amount
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="settlements-card">
        <table className="settlements-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Trip</th>
              <th>Ride revenue</th>
              <th>Driver earnings</th>
              <th>Operator share</th>
              <th>Completed</th>
              <th>Status</th>
              <th>Settlement date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>

                <td className="settlements-primary">
                  {item.driver_name || "—"}
                </td>

                <td>
                  {item.route || "—"}
                </td>

                <td>
                  {formatCurrency(
                    item.ride_revenue
                  )}
                </td>

                <td>
                  {formatCurrency(
                    item.driver_earnings ||
                    item.amount
                  )}
                </td>

                <td>
                  {formatCurrency(
                    item.operator_share
                  )}
                </td>

                <td>
                  {formatDateTime(
                    item.created_at
                  )}
                </td>

                <td>
                  <Badge
                    tone={
                      item.status === "settled"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {item.status}
                  </Badge>
                </td>

                <td>
                  {item.settled_at
                    ? formatDateTime(
                        item.settled_at
                      )
                    : "—"}
                </td>

                <td>
                  {item.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="subtleSuccess"
                      loading={
                        saving === item.id
                      }
                      onClick={() =>
                        settle(item)
                      }
                    >
                      <CheckCircle2 />
                      Mark settled
                    </Button>
                  ) : (
                    <span className="settlements-complete">
                      Settled
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </Card>

    </div>
  );
}