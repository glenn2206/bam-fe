import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Public Route Component
 * Redirects to booking if user is already authenticated
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Redirect to booking if already authenticated
  if (user) {
    return <Navigate to="/booking" replace />;
  }

  return children;
};

export default PublicRoute;
