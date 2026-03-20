import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { ProjectHome } from './pages/ProjectHome';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FeatureShowcase } from './pages/FeatureShowcase';
import './styles/App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect logged-in users away from auth pages)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

// Root Route Component
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <Home />;
};

// Navigation Component
const Navigation = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState('light');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const hasStoredToken = !!localStorage.getItem('access_token');
  const showAuthenticatedNav = isAuthenticated || (loading && hasStoredToken);
  const isAuthenticatedHome = location.pathname === '/home';
  const buildVersion = process.env.REACT_APP_BUILD_VERSION || 'local';

  useEffect(() => {
    setShowMoreMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <nav className="navbar" aria-label="Primary">
      <div className="navbar-brand">
        <Link to="/">Sustainability Simulator</Link>
      </div>
      <div className="navbar-menu">
        {showAuthenticatedNav ? (
          <>
            <span className="navbar-user">Welcome, {user?.username}</span>
            {!isAuthenticatedHome && (
              <NavLink to="/home" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Home
              </NavLink>
            )}
            {!isAuthenticatedHome && (
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Dashboard
              </NavLink>
            )}
            {!isAuthenticatedHome && (
              <div className="nav-more">
                <button
                  type="button"
                  className="btn btn-small nav-more-trigger"
                  aria-haspopup="menu"
                  aria-expanded={showMoreMenu}
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                >
                  More
                </button>
                {showMoreMenu && (
                  <div className="nav-more-menu" role="menu" aria-label="More navigation">
                    <NavLink
                      to="/showcase"
                      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      role="menuitem"
                    >
                      Showcase
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-small" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Sign Up
            </NavLink>
          </>
        )}
        <button
          type="button"
          className="btn btn-small theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className="theme-toggle-icon" aria-hidden="true">
            {theme === 'light' ? '☾' : '☀'}
          </span>
          <span className="sr-only">
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </span>
        </button>
        <span className="build-badge" title="Live build version">
          Build {buildVersion}
        </span>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <ProjectHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/showcase"
              element={
                <ProtectedRoute>
                  <FeatureShowcase />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
