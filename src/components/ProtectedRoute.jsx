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
        {/* Gunakan min-h-screen dan w-screen untuk mengunci ukuran satu layar penuh */}
        <div className="relative min-h-screen w-full overflow-hidden">
          
          {/* Content yang di-blur dipaksa ikut tinggi layar minimal */}
          <div className="blur-sm pointer-events-none select-none min-h-screen">
            {children}
          </div>
          
          {/* Overlay tetap di tengah layar (fixed lebih aman kalau mau bener-bener nutupin layar) */}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md">
            <div className="text-center p-8">
              <p className="text-3xl font-black text-slate-800 mb-2">
                🔒 Halaman Terlindungi
              </p>
              <p className="text-slate-600 mb-8 max-w-xs mx-auto">
                Silakan login terlebih dahulu untuk mengakses fitur ini
              </p>
              <button
                onClick={() => setShowAuthPopup(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-sky-200 transition-all active:scale-95"
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
