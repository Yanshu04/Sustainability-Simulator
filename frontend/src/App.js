import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { warmupBackend } from './api';
import './styles/App.css';

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const Home = lazyNamed(() => import('./pages/Home'), 'Home');
const ProjectHome = lazyNamed(() => import('./pages/ProjectHome'), 'ProjectHome');
const Login = lazyNamed(() => import('./pages/Login'), 'Login');
const Register = lazyNamed(() => import('./pages/Register'), 'Register');
const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const FeatureShowcase = lazyNamed(() => import('./pages/FeatureShowcase'), 'FeatureShowcase');
const Profile = lazyNamed(() => import('./pages/Profile'), 'Profile');

const LoadingView = () => {
  const [showColdStartHint, setShowColdStartHint] = useState(false);

  useEffect(() => {
    const hintTimer = setTimeout(() => {
      setShowColdStartHint(true);
    }, 1800);

    return () => clearTimeout(hintTimer);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-stack">
        <p>Loading...</p>
        {showColdStartHint && (
          <p className="loading-hint">Waking the server. First load on deploy can take up to 30 seconds.</p>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingView />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect logged-in users away from auth pages)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingView />;
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

// Root Route Component
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingView />;
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
            <NavLink to="/home" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Dashboard
            </NavLink>
            <div className="nav-more">
              <button
                type="button"
                className="btn btn-small nav-more-trigger"
                aria-label="Open menu"
                aria-haspopup="menu"
                aria-expanded={showMoreMenu}
                onClick={() => setShowMoreMenu((prev) => !prev)}
              >
                <span className="nav-more-icon" aria-hidden="true">☰</span>
              </button>
              {showMoreMenu && (
                <div className="nav-more-menu" role="menu" aria-label="More navigation">
                  <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    role="menuitem"
                  >
                    Profile
                  </NavLink>
                  <NavLink
                    to="/showcase"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    role="menuitem"
                  >
                    Showcase
                  </NavLink>
                  <button
                    type="button"
                    className="nav-menu-action"
                    role="menuitem"
                    onClick={toggleTheme}
                  >
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                  <button
                    type="button"
                    className="nav-menu-action"
                    role="menuitem"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
        {!showAuthenticatedNav && (
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
        )}
      </div>
    </nav>
  );
};

function App() {
  useEffect(() => {
    warmupBackend();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <main className="app-main">
          <Suspense fallback={<LoadingView />}>
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
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
