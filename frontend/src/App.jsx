import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  ClerkLoaded,
  ClerkLoading,
  useAuth,
} from '@clerk/react';

import Toast from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import FullPageLoader from './components/ui/FullPageLoader';
import IdleModal from './components/ui/IdleModal';
import SessionExpiredModal from './components/ui/SessionExpiredModal';
import RouteGuard from './components/auth/RouteGuard';
import { useSessionManager } from './hooks/useSessionManager';
import { useAuthSync } from './hooks/useAuthSync';

// Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const UploadCall = React.lazy(() => import('./pages/UploadCall'));
const AnalysisReport = React.lazy(() => import('./pages/AnalysisReport'));
const AgentDashboard = React.lazy(() => import('./pages/AgentDashboard'));
const AgentProfile = React.lazy(() => import('./pages/AgentProfile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

/**
 * Redirect signed-in users away from auth pages (prevent redirect loops)
 */
function AuthPageGuard({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <FullPageLoader />;
  if (isSignedIn) return <Navigate to="/dashboard" replace />;
  return children;
}

import nprogress from 'nprogress';
import 'nprogress/nprogress.css';

nprogress.configure({ showSpinner: false, speed: 400 });

function AnimatedRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    nprogress.start();
    nprogress.done();
  }, [location.pathname]);

  return (
    <React.Suspense fallback={<FullPageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in/*" element={<AuthPageGuard><Login /></AuthPageGuard>} />
          <Route path="/sign-up/*" element={<AuthPageGuard><Register /></AuthPageGuard>} />
          <Route path="/login" element={<AuthPageGuard><Login /></AuthPageGuard>} />
          <Route path="/register" element={<AuthPageGuard><Register /></AuthPageGuard>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<RouteGuard><Dashboard /></RouteGuard>} />
          <Route path="/upload" element={<RouteGuard><UploadCall /></RouteGuard>} />
          <Route path="/report/:id" element={<RouteGuard><AnalysisReport /></RouteGuard>} />
          <Route path="/agents" element={<RouteGuard><AgentDashboard /></RouteGuard>} />
          <Route path="/agents/:id" element={<RouteGuard><AgentProfile /></RouteGuard>} />
          <Route path="/settings" element={<RouteGuard><Settings /></RouteGuard>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </React.Suspense>
  );
}

function AppInner() {
  // Sync Clerk user to backend DB
  useAuthSync();
  // Session lifecycle manager (idle, multi-tab, health check, profile hydration)
  const { performSignOut } = useSessionManager();

  return (
    <ErrorBoundary>
      <Toast />
      <AnimatedRoutes />
      {/* Global session modals */}
      <IdleModal onSignOut={performSignOut} />
      <SessionExpiredModal />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ClerkLoading>
        <FullPageLoader />
      </ClerkLoading>
      <ClerkLoaded>
        <AppInner />
      </ClerkLoaded>
    </BrowserRouter>
  );
}
