import "./Button.css";

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  children,
  ...props
}) {
  const buttonClassName = [
    "app-button",
    `app-button-${size}`,
    `app-button-${variant}`,
    loading ? "app-button-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={buttonClassName} {...props}>
      {loading && <span className="app-button-spinner" aria-hidden="true" />}
      {children}
    </Tag>
  );
}