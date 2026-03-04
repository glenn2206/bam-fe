import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPopup from './AuthPopup';

/**
 * Navbar Component
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-colors";
    return isActive(path)
      ? `${baseClass} bg-sky-100 text-sky-700`
      : `${baseClass} text-gray-700 hover:bg-gray-100`;
  };

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-gray-800">BAM Lab</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/booking" className={navLinkClass('/booking')}>
                📋 Booking
              </Link>
              <Link to="/jadwal" className={navLinkClass('/jadwal')}>
                📅 Jadwal
              </Link>
              <Link to="/profile" className={navLinkClass('/profile')}>
                🏢 Profile
              </Link>
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-2 text-sm">
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                      <span className="text-sky-700 font-semibold">
                        {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.no_hp}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors shadow-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-around py-2 border-t">
            <Link to="/booking" className={navLinkClass('/booking')}>
              📋
            </Link>
            <Link to="/jadwal" className={navLinkClass('/jadwal')}>
              📅
            </Link>
            <Link to="/profile" className={navLinkClass('/profile')}>
              🏢
            </Link>
          </div>
        </div>
      </nav>

      {/* Auth Popup */}
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Navbar;
