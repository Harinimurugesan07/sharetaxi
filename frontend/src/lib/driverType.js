export function isOperatorOwnedDriver(user) {
  if (!user || user.role !== "driver") return false;
  if (user.driver_type) return user.driver_type === "operator";
  return Boolean(user.operator_id);
}

export function isFreelanceDriver(user) {
  if (!user || user.role !== "driver") return false;
  if (user.driver_type) return user.driver_type === "freelance";
  return !Boolean(user.operator_id);
}
