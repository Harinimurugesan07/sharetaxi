import "./Card.css";

export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`app-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}