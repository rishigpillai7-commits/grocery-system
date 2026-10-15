import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

// Wraps all pages that need a signed-in user (nested-route layout element).
export default function ProtectedRoute() {
  const { user } = useApp();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
