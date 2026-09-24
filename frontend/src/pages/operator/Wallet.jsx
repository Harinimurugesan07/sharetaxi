import { useEffect, useState } from "react";

import {
  CircleDollarSign,
  ArrowDownToLine,
  WalletCards,
} from "lucide-react";

import Card from "../../components/Card";

import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../components/States";

import { formatCurrency, formatDateTime } from "../../lib/format";

import { operatorWallet } from "../../api/operator";

import "./Wallet.css";

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");

    operatorWallet()
      .then((data) => {
        setWalletData(data || {});
        setStatus("success");
      })
      .catch((error) => {
        console.error("Failed to load operator wallet:", error);
        setStatus("error");
      });
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") {
    return <LoadingState label="Loading wallet..." />;
  }

  if (status === "error") {
    return <ErrorState onRetry={load} />;
  }

  const wallet = walletData?.wallet || {};
  const transactions = walletData?.transactions || [];

  return (
    <div className="wallet-page">
      <div className="wallet-summary-grid">
        <Card className="wallet-summary-card">
          <div className="wallet-summary-icon wallet-summary-icon-green">
            <CircleDollarSign />
          </div>

          <div>
            <span className="wallet-summary-label">
              Available Balance
            </span>

            <strong className="wallet-summary-value">
              {formatCurrency(wallet.available_balance || 0)}
            </strong>
          </div>
        </Card>

        <Card className="wallet-summary-card">
          <div className="wallet-summary-icon wallet-summary-icon-blue">
            <WalletCards />
          </div>

          <div>
            <span className="wallet-summary-label">
              Total Earned
            </span>

            <strong className="wallet-summary-value">
              {formatCurrency(wallet.total_earned || 0)}
            </strong>
          </div>
        </Card>

        <Card className="wallet-summary-card">
          <div className="wallet-summary-icon wallet-summary-icon-amber">
            <ArrowDownToLine />
          </div>

          <div>
            <span className="wallet-summary-label">
              Total Withdrawn
            </span>

            <strong className="wallet-summary-value">
              {formatCurrency(wallet.total_withdrawn || 0)}
            </strong>
          </div>
        </Card>
      </div>

      <Card className="wallet-card">
        <div className="wallet-card-header">
          <div>
            <p className="wallet-card-title">
              Wallet Transactions
            </p>

            <p className="wallet-card-subtitle">
              Operator earnings credited from completed trips.
            </p>
          </div>
        </div>

        {!transactions.length ? (
          <EmptyState
            title="No wallet transactions yet"
            description="Operator earnings from completed trips will appear here."
          />
        ) : (
          <div className="wallet-table-wrapper">
            <table className="wallet-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance after</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="wallet-primary">
                      {transaction.transaction_type || "—"}
                    </td>

                    <td>
                      {transaction.description || "—"}
                    </td>

                    <td className="wallet-amount">
                      {formatCurrency(transaction.amount || 0)}
                    </td>

                    <td>
                      {formatCurrency(
                        transaction.balance_after || 0
                      )}
                    </td>

                    <td>
                      {transaction.status || "—"}
                    </td>

                    <td>
                      {formatDateTime(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}