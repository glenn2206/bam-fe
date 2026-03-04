import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPopup from './AuthPopup';

/**
 * Protected Route Component
 * Shows auth popup if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Show auth popup if not authenticated
  if (!user) {
    return (
      <>
        {/* Blur overlay with message */}
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none">
            {children}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600 mb-4">
                🔒 Halaman Terlindungi
              </p>
              <p className="text-slate-500 mb-6">
                Silakan login untuk mengakses halaman ini
              </p>
              <button
                onClick={() => setShowAuthPopup(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all"
              >
                Login Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* Auth Popup */}
        <AuthPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} />
      </>
    );
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
