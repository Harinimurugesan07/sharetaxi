import { request } from "./client";

export const updateProfile = (data) => request({ method: "PATCH", url: "/users/profile", data });
