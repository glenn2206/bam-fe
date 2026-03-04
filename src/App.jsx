import { Link, Outlet } from 'react-router';
import { useState } from 'react';
import { AuthProvider, useAuth } from './helper/authContext'; // Sesuaikan path
import AuthPopup from './components/AuthPopup'; // Sesuaikan path

function AppContent() {
  const { user, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-center items-center gap-6">
        <Link to="/booking" className="hover:text-sky-500 font-medium transition">Booking</Link>
        <Link to="/jadwal" className="hover:text-sky-500 font-medium transition">Jadwal</Link>
        <Link to="/profile" className="hover:text-sky-500 font-medium transition">Company Profile</Link>
        
        <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

        {/* Tombol Login/Logout Dinamis */}
        {user ? (
          <button 
            onClick={logout}
            className="text-red-500 font-bold hover:text-red-700 transition"
          >
            Logout
          </button>
        ) : (
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="bg-sky-500 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-sky-600 transition"
          >
            Login
          </button>
        )}
      </nav>

      {/* Konten Halaman */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm relative">
          <Outlet /> 
        </div>
      </main>

      {/* Popup Login Global */}
      <AuthPopup isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

// Bungkus dengan Provider di level paling atas
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;