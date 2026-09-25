import { request } from "./client";

export const getDriverWallet = () =>
  request({
    method: "GET",
    url: "/drivers/wallet",
  });

export const getDriverWalletTransactions = () =>
  request({
    method: "GET",
    url: "/drivers/wallet/transactions",
  });

export const getDriverPayoutRequests = () =>
  request({ method: "GET", url: "/drivers/wallet/payouts" });

export const withdrawDriverPayout = (payoutRequestId) =>
  request({ method: "POST", url: `/drivers/wallet/payout/${payoutRequestId}/withdraw` });