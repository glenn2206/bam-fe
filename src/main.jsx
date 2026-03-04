import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import Booking from './pages/Booking';
import Jadwal from './pages/Jadwal';
import Profile from './pages/Profile';

// Styles
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Redirect root to booking */}
            <Route path="/" element={<Navigate to="/booking" replace />} />
            
            {/* Protected Routes */}
            <Route 
              path="/booking" 
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jadwal" 
              element={
                <ProtectedRoute>
                  <Jadwal />
                </ProtectedRoute>
              } 
            />
            
            {/* Public Route */}
            <Route path="/profile" element={<Profile />} />
            
            {/* 404 - Redirect to booking */}
            <Route path="*" element={<Navigate to="/booking" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
