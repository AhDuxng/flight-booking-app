import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
        setProfile(response.data.data.profile);
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { session, user: loggedUser, profile: userProfile } = response.data.data;
      
      localStorage.setItem('token', session.access_token);
      setUser(loggedUser);
      setProfile(userProfile);
      return { user: loggedUser, profile: userProfile };
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      setProfile(response.data.data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthProvider;
