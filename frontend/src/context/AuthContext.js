import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import { getFirebaseAuth, hasFirebaseConfig } from '../firebase';

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setError(null);
    } catch (err) {
      localStorage.removeItem('access_token');
      setUser(null);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);

      if (hasFirebaseConfig) {
        const firebaseAuth = await getFirebaseAuth();
        if (firebaseAuth) {
          const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          await updateProfile(credential.user, { displayName: username });
        }
      }

      const response = await authAPI.register(username, email, password);
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(identifier, password);

      if (hasFirebaseConfig) {
        const firebaseAuth = await getFirebaseAuth();
        const email = response.data?.user?.email;
        if (firebaseAuth && email) {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        }
      }

      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (hasFirebaseConfig) {
      try {
        const firebaseAuth = await getFirebaseAuth();
        if (firebaseAuth) {
          const { signOut } = await import('firebase/auth');
          await signOut(firebaseAuth);
        }
      } catch (_) {
        // Ignore firebase signout errors and still clear local session.
      }
    }

    localStorage.removeItem('access_token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
