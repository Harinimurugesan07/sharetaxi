const PROFILE_ROLES = new Set(["passenger", "driver", "operator"]);

export function supportsProfileCompletion(user) {
  return !!user && PROFILE_ROLES.has(user.role);
}

function hasValue(value) {
  return value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "");
}

export function getProfileCompletion(user) {
  if (!supportsProfileCompletion(user)) return null;

  const directValue = Number(
    user?.profile_completion_percentage ??
      user?.profile?.profile_completion_percentage ??
      user?.profile?.profile_completion?.percentage ??
      Number.NaN
  );

  if (Number.isFinite(directValue)) {
    return Math.max(0, Math.min(100, directValue));
  }

  const profile = user?.profile || {};
  const fields =
    user.role === "passenger"
      ? [
          user?.full_name,
          user?.email,
          user?.phone,
          profile?.gender,
          profile?.date_of_birth,
          profile?.address,
          profile?.city,
          profile?.state,
          profile?.pincode,
          profile?.emergency_contact_name,
          profile?.emergency_contact_phone,
          profile?.id_type,
          profile?.id_number,
        ]
      : user.role === "driver"
        ? [
            user?.full_name,
            user?.email,
            user?.phone,
            profile?.address,
            profile?.city,
            profile?.state,
            profile?.postal_code,
            profile?.country,
            profile?.license_number,
            profile?.license_expiry,
            profile?.license_photo_url,
          ]
        : [user?.full_name, user?.email, user?.phone];

  const completed = fields.filter(hasValue).length;
  const total = fields.length || 1;
  return Math.round((completed / total) * 100);
}
