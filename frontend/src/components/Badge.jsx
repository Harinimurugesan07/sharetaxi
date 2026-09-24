import "./Badge.css";

const tones = {
  yellow: "badge-yellow",
  navy: "badge-navy",
  success: "badge-success",
  danger: "badge-danger",
  neutral: "badge-neutral",
};

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}) {
  return (
    <span
      className={`badge ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

// Maps common status strings from the backend to a consistent badge tone.
export function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();

  const map = {
    pending: {
      tone: "yellow",
      label: "Pending",
    },
    confirmed: {
      tone: "success",
      label: "Confirmed",
    },
    scheduled: {
      tone: "navy",
      label: "Scheduled",
    },
    active: {
      tone: "yellow",
      label: "On the Way",
    },
    in_progress: {
      tone: "yellow",
      label: "In Progress",
    },
    ongoing: {
      tone: "yellow",
      label: "On the Way",
    },
    completed: {
      tone: "success",
      label: "Completed",
    },
    cancelled: {
      tone: "danger",
      label: "Cancelled",
    },
    rejected: {
      tone: "danger",
      label: "Rejected",
    },
    verified: {
      tone: "success",
      label: "Verified",
    },
    approved: {
      tone: "success",
      label: "Verified",
    },
    unverified: {
      tone: "neutral",
      label: "Unverified",
    },
    online: {
      tone: "success",
      label: "Online",
    },
    offline: {
      tone: "neutral",
      label: "Offline",
    },
  };

  const entry = map[s] || {
    tone: "neutral",
    label: status || "Unknown",
  };

  return (
    <Badge tone={entry.tone}>
      {entry.label}
    </Badge>
  );
}