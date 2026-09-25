// Card.jsx
import "./Card.css";

export default function Card({
  variant, // "flat" | "accent" | "elevated" | undefined
  clickable = false,
  className = "",
  children,
  ...props
}) {
  const variantClass = variant ? `app-card--${variant}` : "";

  return (
    <div
      className={`app-card ${variantClass} ${clickable ? "clickable" : ""} ${className}`.trim()}
      {...(clickable ? { role: "button", tabIndex: 0 } : {})}
      {...props}
    >
      {children}
    </div>
  );
}