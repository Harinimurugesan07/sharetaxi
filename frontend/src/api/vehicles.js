import { request } from "./client";

export const addVehicle = (data) => request({ method: "POST", url: "/vehicles", data });
export const myVehicles = () => request({ method: "GET", url: "/vehicles/mine" });
