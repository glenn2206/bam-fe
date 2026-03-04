import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthStatus from '../components/AuthStatus';

/**
 * Main Layout Component
 * Wraps all pages with navbar
 */
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} BAM Testing Laboratory. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Auth Status (Development Only) */}
      <AuthStatus />
    </div>
  );
};

export default MainLayout;
