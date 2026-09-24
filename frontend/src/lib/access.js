import { isOperatorOwnedDriver } from "./driverType";

export function roleLandingPath(user) {
  if (!user || (user.role !== "driver" && user.role !== "operator")) {
    return user?.role === "passenger" ? "/passenger" : "/";
  }
  if (user.verification_status !== "verified") return "/onboarding/verification";
  if (user.role === "driver" && isOperatorOwnedDriver(user)) return "/driver";
  if (user.role === "driver" && user.subscription_status !== "active") return "/subscribe";
  return user.role === "operator" ? "/operator" : "/driver";
}
