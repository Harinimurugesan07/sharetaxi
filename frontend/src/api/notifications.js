import { request } from "./client";

export const saveNotificationToken = (token, platform = "web") =>
  request({ method: "POST", url: "/notifications/token", data: { token, platform } });

export const deleteNotificationToken = (token) =>
  request({ method: "DELETE", url: "/notifications/token", data: { token } });

export const getNotificationStatus = () =>
  request({ method: "GET", url: "/notifications/status" });
