import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Nutrition from './pages/Nutrition';
import Workout from './pages/Workout';
import WorkoutHistory from './pages/WorkoutHistory';
import Progress from './pages/Progress';
import Goals from './pages/Goals';
import Profile from './pages/Profile';

import './App.css';

/**
 * Route protector for authenticated views
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="ft-loading-screen">
        <div className="ft-spinner"></div>
        <span>Loading FitTrack...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but haven't finished onboarding, force onboarding
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/**
 * Route guard for public auth pages (redirects to dashboard if already logged in)
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={isOnboarded ? '/dashboard' : '/onboarding'} replace />;
  }

  return children;
}

/**
 * Main Authenticated App Shell with Sidebar & BottomNav
 */
function AuthenticatedLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="app__main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Onboarding Flow (No distracting sidebar) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Dashboard & Feature Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workout"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Workout />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <WorkoutHistory />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nutrition"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Nutrition />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Progress />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Goals />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Profile />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
