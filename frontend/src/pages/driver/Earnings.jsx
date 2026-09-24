import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Banknote,
} from "lucide-react";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell,
} from "recharts";

import Card from "../../components/Card";

import {
  LoadingState,
  ErrorState,
} from "../../components/States";

import {
  formatCurrency,
  formatDate,
} from "../../lib/format";

import {
  driverEarnings,
  myDriverProfile,
  requestDriverPayout,
} from "../../api/driver";

import { myTrips } from "../../api/trips";

import { useAuth } from "../../context/AuthContext";

import { isOperatorOwnedDriver } from "../../lib/driverType";


import {
  getDriverWallet,
  getDriverWalletTransactions,
} from "../../api/driverWallet";

import "./Earnings.css";


const ROUTE_BAR_COLORS = [
  "#2F5CE0",
  "#5B7FE8",
  "#7C9BFF",
  "#9FB4FF",
  "#C3D0FF",
];


function TrendTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="earnings-tooltip">
      <p className="earnings-tooltip-date">
        {point.date}
      </p>

      <p className="earnings-tooltip-route">
        {point.route}
      </p>

      <p className="earnings-tooltip-row">
        <span>Trip earning</span>

        <strong>
          {formatCurrency(point.earning)}
        </strong>
      </p>

      <p className="earnings-tooltip-row">
        <span>Running total</span>

        <strong>
          {formatCurrency(point.cumulative)}
        </strong>
      </p>
    </div>
  );
}


function RouteTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="earnings-tooltip">
      <p className="earnings-tooltip-route">
        {point.route}
      </p>

      <p className="earnings-tooltip-row">
        <span>Total earned</span>

        <strong>
          {formatCurrency(point.total)}
        </strong>
      </p>
    </div>
  );
}


export default function Earnings() {
  const { user } = useAuth();

  // One definition of "operator-owned" for the whole app.
  const operatorOwned =
    isOperatorOwnedDriver(user);

  const [driver, setDriver] =
    useState(null);

  const [trips, setTrips] =
    useState([]);

  const [settlementData, setSettlementData] =
    useState(null);

  // Freelance driver wallet
  const [wallet, setWallet] =
    useState(null);

  const [walletTransactions, setWalletTransactions] =
    useState([]);

  // Payout request
  const [payoutAmount, setPayoutAmount] =
    useState("");

  const [payoutLoading, setPayoutLoading] =
    useState(false);

  const [payoutMessage, setPayoutMessage] =
    useState("");

  const [status, setStatus] =
    useState("loading");

  // Operator drivers are shown their settlement records
  // once they have loaded.
  const operatorView =
    operatorOwned &&
    Boolean(settlementData);


  const load = () => {
    setStatus("loading");

    Promise.all([
      myDriverProfile(),
      myTrips(),
    ])
      .then(async ([d, t]) => {
        setDriver(d);

        setTrips(
          (t || []).filter(
            (tr) =>
              tr.status === "completed"
          )
        );

        /*
         * Operator Driver
         * ----------------
         * Uses operator settlement system.
         */
        if (operatorOwned) {
          const settlement =
            await driverEarnings();

          setSettlementData(settlement);

          // Operator drivers don't use
          // freelance wallet.
          setWallet(null);
          setWalletTransactions([]);
        }

        /*
         * Freelance Driver
         * ----------------
         * Uses driver wallet system.
         */
        else {
          const [w, wt] =
            await Promise.all([
              getDriverWallet(),
              getDriverWalletTransactions(),
            ]);

          setWallet(w);

          setWalletTransactions(
            wt || []
          );

          // Freelance drivers don't use
          // operator settlement.
          setSettlementData(settlement);
        }

        setStatus("success");
      })
      .catch((error) => {
        console.error(
          "Failed to load earnings:",
          error
        );

        setStatus("error");
      });
  };


  useEffect(() => {
    load();
  }, []);


  const handleRequestPayout =
    async () => {
      const amount =
        Number(payoutAmount);

      if (!amount || amount <= 0) {
        setPayoutMessage(
          "Please enter a valid payout amount."
        );
        return;
      }

      const availableBalance =
        Number(
          wallet?.available_balance || 0
        );

      if (
        amount > availableBalance
      ) {
        setPayoutMessage(
          `Maximum available payout is ${formatCurrency(
            availableBalance
          )}.`
        );
        return;
      }

      setPayoutLoading(true);
      setPayoutMessage("");

      try {
        await requestDriverPayout(
          amount
        );

        setPayoutAmount("");

        setPayoutMessage(
          "Payout request submitted successfully."
        );

        await load();
      } catch (error) {
        console.error(
          "Failed to request payout:",
          error
        );

        setPayoutMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to submit payout request."
        );
      } finally {
        setPayoutLoading(false);
      }
    };


  const now = new Date();


  const isSameDay = (d) =>
    d.toDateString() ===
    now.toDateString();


  const isSameWeek = (d) => {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return d <= now && d >= start;
  };


  const isSameMonth = (d) =>
    d.getMonth() ===
      now.getMonth() &&
    d.getFullYear() ===
      now.getFullYear();


  /*
   * Freelance Driver Wallet earnings by period.
   *
   * Only RIDE_EARNING transactions
   * are counted.
   */
  const walletEarningsByPeriod =
    (predicate) =>
      walletTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
              "RIDE_EARNING" &&
            predicate(
              new Date(
                transaction.created_at
              )
            )
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(
              transaction.amount || 0
            ),
          0
        );


  /*
   * Earnings trend
   *
   * Operator Driver:
   * Uses settlement records.
   *
   * Freelance Driver:
   * Uses wallet earning transactions.
   */
  const trendData = useMemo(() => {
    const source =
      operatorView
        ? settlementData.records || []
        : walletTransactions.filter(
            (transaction) => transaction.transaction_type === "RIDE_EARNING"
          );

    const sorted = [...source].sort(
      (a, b) =>
        new Date(
          a.created_at ||
            a.departure_time
        ) -
        new Date(
          b.created_at ||
            b.departure_time
        )
    );

    let running = 0;

    return sorted.map((t) => {
      const earning =
        operatorView
          ? Number(
              t.driver_earnings || 0
            )
          : Number(t.amount || 0);

      running += earning;

      return {
        id: t.id,

        date: formatDate(
          t.created_at ||
            t.departure_time
        ).slice(0, 6),

        route:
          t.route || t.description || "Wallet earning",

        earning,

        cumulative: running,
      };
    });
  }, [
    trips,
    walletTransactions,
    settlementData,
    operatorView,
  ]);


  /*
   * Top routes by earnings
   */
  const topRoutes = useMemo(() => {
    const source =
      operatorView
        ? settlementData.records || []
        : walletTransactions.filter(
            (transaction) => transaction.transaction_type === "RIDE_EARNING"
          );

    const totals = source.reduce(
      (acc, t) => {
        const route = (
          t.route || t.description || "Wallet earning"
        )
          .replace(/\s+/g, " ")
          .trim();

        if (!route) {
          return acc;
        }

        const earning =
          operatorView
            ? Number(
                t.driver_earnings || 0
              )
            : Number(t.amount || 0);

        acc[route] =
          (acc[route] || 0) +
          Number(earning || 0);

        return acc;
      },
      {}
    );

    return Object.entries(totals)
      .map(
        ([route, total]) => ({
          route,
          total: Number(
            total || 0
          ),
        })
      )
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 5);
  }, [
    trips,
    walletTransactions,
    settlementData,
    operatorView,
  ]);


  const formatRouteLabel =
    (route) => {
      if (!route) return "";

      return route.length > 22
        ? `${route.slice(0, 22)}…`
        : route;
    };


  const longestRouteLabel =
    Math.max(
      0,
      ...topRoutes.map(
        ({ route }) =>
          route.length
      )
    );


  const routeChartWidth =
    Math.min(
      180,
      Math.max(
        120,
        longestRouteLabel * 6
      )
    );


  if (status === "loading") {
    return (
      <LoadingState
        label="Loading your earnings..."
      />
    );
  }


  if (status === "error") {
    return (
      <ErrorState
        onRetry={load}
      />
    );
  }


  /*
   * Determine driver type
   */
  const operatorDriver =
    operatorView;


  /*
   * Operator Driver settlement records
   */
  const earningsRecords =
    operatorDriver
      ? settlementData.records || []
      : [];


  const earningsByPeriod =
    (predicate) =>
      earningsRecords
        .filter((record) =>
          predicate(
            new Date(
              record.created_at
            )
          )
        )
        .reduce(
          (total, record) =>
            total +
            Number(
              record.driver_earnings ||
                0
            ),
          0
        );


  /*
   * Stats
   */
  const stats = operatorDriver
    ? [
        {
          label: "Today",
          value:
            earningsByPeriod(
              isSameDay
            ),
          icon: CalendarDays,
        },

        {
          label: "This Week",
          value:
            earningsByPeriod(
              isSameWeek
            ),
          icon: CalendarRange,
        },

        {
          label: "This Month",
          value:
            earningsByPeriod(
              isSameMonth
            ),
          icon: TrendingUp,
        },

        {
          label: "Total Earnings",
          value:
            settlementData.summary
              .total_earnings,
          icon: Wallet,
        },
        {
          label: "Commission",
          value: settlementData.summary.total_commission,
          icon: Banknote,
        },

        {
          label: "Pending Settlement",
          value:
            settlementData.summary
              .pending_settlement,
          icon: Wallet,
        },

        {
          label: "Settled Amount",
          value:
            settlementData.summary
              .settled_amount,
          icon: Wallet,
        },
      ]
    : [
        {
          label: "Today",
          value:
            walletEarningsByPeriod(
              isSameDay
            ),
          icon: CalendarDays,
        },

        {
          label: "This Week",
          value:
            walletEarningsByPeriod(
              isSameWeek
            ),
          icon: CalendarRange,
        },

        {
          label: "This Month",
          value:
            walletEarningsByPeriod(
              isSameMonth
            ),
          icon: TrendingUp,
        },

        {
          label: "Total Earnings",
          value: Number(
            wallet?.total_earned || 0
          ),
          icon: Wallet,
        },
        {
          label: "Commission",
          value: settlementData?.summary?.total_commission || 0,
          icon: Banknote,
        },

        {
          label: "Available Balance",
          value: Number(
            wallet?.available_balance ||
              0
          ),
          icon: Wallet,
        },

        {
          label: "Total Withdrawn",
          value: Number(
            wallet?.total_withdrawn ||
              0
          ),
          icon: Wallet,
        },
      ];


  return (
    <div className="earnings-page">

      {/* =========================================
          Earnings Summary
      ========================================== */}

      <div className="earnings-stats-grid">
        {stats.map((s) => {
          const Icon = s.icon;

          return (
            <Card
              key={s.label}
              className="earnings-stat-card"
            >
              <div className="earnings-stat-top">
                <p className="earnings-stat-label">
                  {s.label}
                </p>

                <Icon
                  className="earnings-stat-icon"
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <p className="earnings-stat-value">
                {formatCurrency(
                  s.value
                )}
              </p>
            </Card>
          );
        })}
      </div>


      {/* =========================================
          Request Payout
      ========================================== */}

      {!operatorDriver && (
        <Card className="earnings-card">
          <div className="earnings-card-header">
            <div>
              <p className="earnings-card-title">
                Request Payout
              </p>

              <p className="earnings-card-subtitle">
                Request a bank payout from
                your available wallet balance.
              </p>
            </div>

            <Banknote
              className="earnings-stat-icon"
              size={22}
              strokeWidth={2}
            />
          </div>

          <div className="payout-request-content">

            <div className="payout-balance-box">
              <span>
                Available for payout
              </span>

              <strong>
                {formatCurrency(
                  wallet?.available_balance ||
                    0
                )}
              </strong>
            </div>

            <div className="payout-form">

              <label
                htmlFor="payout-amount"
                className="payout-label"
              >
                Amount
              </label>

              <div className="payout-input-row">
                <span className="payout-currency">
                  ₹
                </span>

                <input
                  id="payout-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(event) => {
                    setPayoutAmount(
                      event.target.value
                    );

                    if (payoutMessage) {
                      setPayoutMessage("");
                    }
                  }}
                  placeholder="Enter amount"
                  disabled={payoutLoading}
                />

                <button
                  type="button"
                  className="payout-submit-button"
                  onClick={
                    handleRequestPayout
                  }
                  disabled={
                    payoutLoading ||
                    !wallet ||
                    Number(
                      wallet.available_balance ||
                        0
                    ) <= 0
                  }
                >
                  {payoutLoading
                    ? "Submitting..."
                    : "Request Payout"}
                </button>
              </div>

              {payoutMessage && (
                <p className="payout-message">
                  {payoutMessage}
                </p>
              )}

              <p className="payout-note">
                Your requested amount will be
                reserved from your available
                balance until the payout is
                processed.
              </p>

            </div>
          </div>
        </Card>
      )}


      {/* =========================================
          Earnings Trend
      ========================================== */}

      <Card className="earnings-card">
        <div className="earnings-card-header">
          <p className="earnings-card-title">
            Earnings trend
          </p>

          <div className="earnings-legend">
            <span className="earnings-legend-item">
              <span className="earnings-legend-dot earnings-legend-dot-bar" />
              Per trip
            </span>

            <span className="earnings-legend-item">
              <span className="earnings-legend-dot earnings-legend-dot-line" />
              Running total
            </span>
          </div>
        </div>

        {operatorDriver &&
        earningsRecords.length === 0 ? (
          <p className="earnings-empty-chart">
            Complete trips to see your
            settlement earnings here.
          </p>
        ) : trendData.length === 0 ? (
          <p className="earnings-empty-chart">
            Complete trips to see your
            earnings chart here.
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={260}
          >
            <ComposedChart
              data={trendData}
              margin={{
                left: 4,
                right: 12,
                top: 8,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-navy-50)"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                axisLine={{
                  stroke:
                    "var(--color-navy-50)",
                }}
                tickLine={false}
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />

              <Tooltip
                content={
                  <TrendTooltip />
                }
              />

              <Bar
                yAxisId="left"
                dataKey="earning"
                fill="var(--color-primary)"
                radius={[
                  6,
                  6,
                  2,
                  2,
                ]}
                barSize={22}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#22C55E"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>


      {/* =========================================
          Operator Driver Settlement History
      ========================================== */}

      {operatorDriver && (
        <Card className="earnings-card">
          <p className="earnings-card-title earnings-trips-title">
            Settlement history
          </p>

          <div className="earnings-trip-list">
            {(settlementData.transactions || [])
              .length === 0 ? (
              <p className="earnings-no-trips">
                No settlements processed yet.
              </p>
            ) : (
              settlementData.transactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="earnings-trip-row"
                  >
                    <div className="earnings-trip-info">
                      <p className="earnings-trip-route">
                        Settlement processed
                      </p>

                      <p className="earnings-trip-date">
                        {formatDate(
                          transaction.processed_at
                        )}
                      </p>
                    </div>

                    <span className="earnings-trip-amount">
                      {formatCurrency(
                        transaction.amount
                      )}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </Card>
      )}


      {/* =========================================
          Freelance Driver Wallet Transactions
      ========================================== */}

      {!operatorDriver && (
        <Card className="earnings-card">
          <p className="earnings-card-title earnings-trips-title">
            Wallet Transactions
          </p>

          <div className="earnings-trip-list">
            {walletTransactions.length ===
            0 ? (
              <p className="earnings-no-trips">
                No wallet transactions yet.
              </p>
            ) : (
              walletTransactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="earnings-trip-row"
                  >
                    <div className="earnings-trip-info">
                      <p className="earnings-trip-route">
                        {transaction.description ||
                          "Ride earning"}
                      </p>

                      <p className="earnings-trip-date">
                        {formatDate(
                          transaction.created_at
                        )}
                      </p>

                      <p className="earnings-trip-date">
                        {transaction.transaction_type}
                      </p>

                      <p className="earnings-trip-date">
                        Balance:{" "}
                        {formatCurrency(
                          transaction.balance_after
                        )}
                      </p>
                    </div>

                    <span
                      className={`earnings-trip-amount ${
                        transaction.amount < 0
                          ? "earnings-payout-amount"
                          : ""
                      }`}
                    >
                      {formatCurrency(
                        transaction.amount
                      )}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </Card>
      )}


      {/* =========================================
          Top Routes
      ========================================== */}

      {topRoutes.length > 0 && (
        <Card className="earnings-card">
          <p className="earnings-card-title">
            Top routes by earnings
          </p>

          <ResponsiveContainer
            width="100%"
            height={Math.max(
              180,
              topRoutes.length * 46
            )}
          >
            <BarChart
              data={topRoutes}
              layout="vertical"
              margin={{
                left: 12,
                right: 24,
                top: 8,
                bottom: 8,
              }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--color-navy-50)"
              />

              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{
                  stroke:
                    "var(--color-navy-50)",
                }}
              />

              <YAxis
                type="category"
                dataKey="route"
                width={routeChartWidth}
                tick={{
                  fontSize: 11,
                  fill: "var(--color-navy-500)",
                }}
                tickFormatter={
                  formatRouteLabel
                }
                tickLine={false}
                axisLine={false}
                interval={0}
              />

              <Tooltip
                content={
                  <RouteTooltip />
                }
              />

              <Bar
                dataKey="total"
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
                barSize={18}
              >
                {topRoutes.map(
                  (entry, index) => (
                    <Cell
                      key={`${entry.route}-${index}`}
                      fill={
                        ROUTE_BAR_COLORS[
                          index %
                            ROUTE_BAR_COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}


      {/* =========================================
          Completed Trips
      ========================================== */}

      <Card className="earnings-card">
        <p className="earnings-card-title earnings-trips-title">
          Completed trips
        </p>

        <div className="earnings-trip-list">
          {operatorDriver &&
            earningsRecords.length ===
              0 && (
              <p className="earnings-no-trips">
                No completed operator trips yet.
              </p>
            )}

          {!operatorDriver &&
            walletTransactions.filter(
              (transaction) => transaction.transaction_type === "RIDE_EARNING"
            ).length === 0 && (
              <p className="earnings-no-trips">
                No completed trips yet.
              </p>
            )}

          {(operatorDriver
            ? earningsRecords
            : walletTransactions.filter(
                (transaction) => transaction.transaction_type === "RIDE_EARNING"
              )
          ).map((t) => {
            const earning =
              operatorDriver
                ? Number(
                    t.driver_earnings || 0
                  )
                : Number(t.amount || 0);

            return (
              <div
                key={t.id}
                className="earnings-trip-row"
              >
                <div className="earnings-trip-info">
                  <p className="earnings-trip-route">
                    {operatorDriver
                      ? t.route
                      : t.description || "Wallet earning"}
                  </p>

                  <p className="earnings-trip-date">
                    {formatDate(
                      operatorDriver
                        ? t.created_at
                        : t.created_at
                    )}
                  </p>
                </div>

                <span className="earnings-trip-amount">
                  {formatCurrency(
                    earning
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}