import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bam_token'));
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const savedToken = localStorage.getItem('bam_token');
  const savedUser = localStorage.getItem('bam_user');

  // Perbaikan: Cek apakah savedUser ada DAN bukan string "undefined"
  if (savedToken && savedUser && savedUser !== "undefined") {
    try {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Data user di localStorage rusak, membersihkan...");
      localStorage.clear();
    }
  }
  setLoading(false);
}, []);

  const login = (newToken, userData) => {
    localStorage.setItem('bam_token', newToken);
    localStorage.setItem('bam_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);