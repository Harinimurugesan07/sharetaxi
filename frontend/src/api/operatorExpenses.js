import { request } from "./client";

export const createOperatorExpense = (data) =>
  request({
    method: "POST",
    url: "/operator/expenses",
    data,
  });

export const getOperatorExpenses = () =>
  request({
    method: "GET",
    url: "/operator/expenses",
  });