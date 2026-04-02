import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import AnalyzerPage from './pages/AnalyzerPage';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import AnalyzerPage from './pages/AnalyzerPage';
import DocumentsPage from './pages/DocumentsPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Application Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/analyze" element={<AnalyzerPage />} />
        <Route path="/documents" element={<DocumentsPage />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
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
