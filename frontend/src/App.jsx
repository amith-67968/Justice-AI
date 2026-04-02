import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import AnalyzerPage from './pages/AnalyzerPage';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignupPage from './pages/SignupPage';

function RouteLoader() {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-50/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        <p className="text-sm font-medium">Preparing your workspace...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <AnalyzerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<IndexRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </div>
  );
}
