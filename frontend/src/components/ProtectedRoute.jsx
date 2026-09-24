import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "./States";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingState label="Loading your account..." />
      </div>
    );
  }

  if (!user) {
    const loginPath =
      role === "operator" ? "/operator/login" : role === "admin" ? "/admin/login" : role ? `/login?role=${role}` : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
