import "./Field.css";
import { Input, Select } from "./FieldControls";

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="field">
      {label && (
        <span className="field-label">
          {label}{" "}
          {required && <span className="field-required">*</span>}
        </span>
      )}

      {children}

      {hint && !error && (
        <span className="field-hint">{hint}</span>
      )}

      {error && (
        <span className="field-error">{error}</span>
      )}
    </label>
  );
}

// Re-exported for backward compatibility — every file across the app
// imports Input/Select from "./Field" (or "../../components/Field"),
// so this keeps all of those working without touching each call site.
export { Input, Select };