import React, { createContext, useState, useContext, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import authService from '../services/auth.service';

const AuthContext = createContext();

/**
 * Auth Provider Component
 * Manages authentication state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (savedToken && savedUser && savedUser !== "undefined") {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error loading auth data:", error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (no_hp, password) => {
    try {
      const response = await authService.login(no_hp, password);
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register new user
   */
  const register = async (no_hp, password, name) => {
    try {
      const response = await authService.register(no_hp, password, name);
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext;
