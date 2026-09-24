import { request } from "./client";

export const registerPassenger = (data) =>
  request({ method: "POST", url: "/auth/passenger/register", data });

export const registerDriver = (data) =>
  request({ method: "POST", url: "/auth/driver/register", data });

export const registerOperator = (data) =>
  request({ method: "POST", url: "/auth/operator/register", data });

export const loginPassenger = (identifier, password) =>
  request({ method: "POST", url: "/auth/passenger/login", data: { identifier, password } });

export const loginDriver = (identifier, password) =>
  request({ method: "POST", url: "/auth/driver/login", data: { identifier, password } });

export const loginAdmin = (identifier, password) =>
  request({ method: "POST", url: "/auth/admin/login", data: { identifier, password } });

export const loginOperator = (identifier, password) =>
  request({ method: "POST", url: "/auth/operator/login", data: { identifier, password } });

export const fetchMe = () => request({ method: "GET", url: "/auth/me" });
