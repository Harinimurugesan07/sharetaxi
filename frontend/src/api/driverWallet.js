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