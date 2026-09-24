import { useNavigate } from "react-router-dom";
import { ShieldCheck, Radar } from "lucide-react";

import "./RoleSwitch.css";

const roles = [
  { key: "admin", label: "Admin", icon: ShieldCheck, path: "/admin/login" },
  { key: "operator", label: "Operator", icon: Radar, path: "/operator/login" },
];

// Both Admin and Operator keep their own separate login pages/routes —
// this is a visual + navigational switcher only (styled after the
// passenger/driver pill selector), not a shared form.
export default function RoleSwitch({ active }) {
  const navigate = useNavigate();

  return (
    <div className="role-switch" role="tablist" aria-label="Login as">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = role.key === active;

        return (
          <button
            key={role.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`role-switch-option ${isActive ? "role-switch-option-active" : ""}`}
            onClick={() => {
              if (!isActive) navigate(role.path);
            }}
          >
            <Icon size={16} className="role-switch-icon" />
            {role.label}
          </button>
        );
      })}
    </div>
  );
}