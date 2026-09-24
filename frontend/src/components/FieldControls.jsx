import "./Field.css";

export function Input({
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <div className="input-wrapper">
      {Icon && (
        <Icon
          className="input-icon"
          aria-hidden="true"
        />
      )}

      <input
        className={`input ${Icon ? "input-with-icon" : ""} ${className}`}
        {...props}
      />
    </div>
  );
}

export function Select({
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  return (
    <div className="input-wrapper">
      {Icon && (
        <Icon
          className="input-icon"
          aria-hidden="true"
        />
      )}

      <select
        className={`select ${Icon ? "select-with-icon" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}