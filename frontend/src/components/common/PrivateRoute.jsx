import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate replace to={`/login?redirect=${redirect}`} />;
  }

  return children;
}
