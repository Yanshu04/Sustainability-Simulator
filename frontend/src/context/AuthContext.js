import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { getFirebaseAuth, hasFirebaseConfig } from '../firebase';

// Create Auth Context
const AuthContext = createContext();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryProfileError = (err) => {
  if (!err) {
    return false;
  }

  const status = err.response?.status;
  if (!status) {
    return true;
  }

  return status >= 500;
};

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

  const fetchProfile = useCallback(async () => {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
        setError(null);
        setLoading(false);
        return;
      } catch (err) {
        const retryable = shouldRetryProfileError(err);
        const isLastAttempt = attempt === maxAttempts;

        if (!retryable || isLastAttempt) {
          localStorage.removeItem('access_token');
          setUser(null);
          setError('Failed to load profile');
          setLoading(false);
          return;
        }

        await sleep(900);
      }
    }
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

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

  const updateProfile = async (payload) => {
    try {
      const response = await authAPI.updateProfile(payload);
      setUser(response.data.user);
      setError(null);
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
