import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { Navigate, useLocation } from 'react-router-dom';
import FullPageLoader from '../ui/FullPageLoader';
import useSessionStore from '../../store/sessionStore';

/**
 * RouteGuard — 3-layer route protection.
 * Layer 1: Clerk isLoaded → FullPageLoader
 * Layer 2: Clerk isSignedIn → RedirectToSignIn with redirect_url
 * Layer 3: Role check → AccessDenied page
 */
export default function RouteGuard({ children, requiredRole = null }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const userProfile = useSessionStore(s => s.userProfile);
  const sessionStatus = useSessionStore(s => s.sessionStatus);

  // Layer 1 — Wait for Clerk to initialize
  if (!isLoaded) {
    return <FullPageLoader />;
  }

  // Layer 2 — Redirect if not signed in
  if (!isSignedIn) {
    const currentPath = location.pathname + location.search;
    // Prevent redirect loops
    if (currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up')) {
      return <Navigate to="/sign-in" replace />;
    }
    return (
      <Navigate
        to={`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`}
        replace
      />
    );
  }

  // Layer 3 — Role check (if required)
  if (requiredRole) {
    // Wait for profile to load
    if (sessionStatus === 'loading' || !userProfile) {
      return <FullPageLoader />;
    }

    const userRole = userProfile.role;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#030812' }}>
          <div className="glass-card p-10 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <Lock size={48} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary mb-3">Access Denied</h1>
            <p className="text-text-muted mb-6">
              You don&apos;t have access to this section. Contact your admin for permission.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm hover:opacity-90 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
