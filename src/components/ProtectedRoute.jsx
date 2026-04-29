import { Navigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
