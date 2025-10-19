import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
