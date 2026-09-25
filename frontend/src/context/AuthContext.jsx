import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getDeviceIdentifier } from '../utils/device';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('trustpay_token');
      const storedUser = localStorage.getItem('trustpay_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('trustpay_token');
      localStorage.removeItem('trustpay_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const deviceIdentifier = getDeviceIdentifier();
    const data = await authService.login({ email, password, deviceIdentifier });

    if (data && data.token && data.user) {
      localStorage.setItem('trustpay_token', data.token);
      localStorage.setItem('trustpay_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data?.message || 'Login failed');
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authService.register(formData);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('trustpay_token');
    localStorage.removeItem('trustpay_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedUserData };
      localStorage.setItem('trustpay_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const role = user?.role || null;
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
