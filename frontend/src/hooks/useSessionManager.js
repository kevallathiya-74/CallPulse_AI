/**
 * useSessionManager.js — Master session lifecycle hook.
 * Handles idle timeout, multi-tab sync, health checking, and profile hydration.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/react';
import useSessionStore from '../store/sessionStore';
import { useAuthApi } from '../services/api';

const IDLE_TIMEOUT_MS = (import.meta.env.VITE_IDLE_TIMEOUT_MINUTES || 30) * 60 * 1000;
const HEALTH_INTERVAL_MS = (import.meta.env.VITE_HEALTH_CHECK_INTERVAL_SECONDS || 30) * 1000;
const ACTIVITY_THROTTLE_MS = 30_000; // Max one activity update per 30 seconds
const PROFILE_REFETCH_GAP_MS = 5 * 60 * 1000; // Re-fetch profile after 5min of hidden tab

const CHANNEL_NAME = 'callpulse_auth';

export function useSessionManager() {
  const { isSignedIn, isLoaded, signOut, getToken } = useAuth();
  const authApi = useAuthApi();
  const idleTimerRef = useRef(null);
  const healthTimerRef = useRef(null);
  const lastThrottleRef = useRef(0);
  const channelRef = useRef(null);
  const hiddenSinceRef = useRef(null);

  const {
    setSessionStatus,
    updateActivity,
    showIdleModal,
    setBackendHealthy,
    setUserProfile,
    clearSession,
  } = useSessionStore();

  // ── Sign-out sequence (Area 7) ────────────────────────────────────────
  const performSignOut = useCallback(async () => {
    try {
      // 1. Notify backend
      await authApi.delete('/api/auth/session').catch(() => {});
    } catch {
      // Non-blocking — user must always be able to sign out
    }
    // 2. Clear Zustand
    clearSession();
    // 3. Clear sessionStorage
    sessionStorage.clear();
    // 4. Broadcast to other tabs
    channelRef.current?.postMessage({ type: 'signout' });
    // 5. Clerk sign out
    await signOut();
    // 6. Redirect
    window.location.href = '/sign-in';
  }, [authApi, clearSession, signOut]);

  // ── Idle timer (Area 1 — Session Activity Tracking) ───────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      showIdleModal();
    }, IDLE_TIMEOUT_MS);
  }, [showIdleModal]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    updateActivity();
    resetIdleTimer();
  }, [updateActivity, resetIdleTimer]);

  // ── Profile hydration (Area 6) ────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.get('/api/auth/me');
      const user = res?.data?.user;
      if (user) {
        setUserProfile({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          organizationName: user.organization_name,
        });
        setSessionStatus('active');
      }
    } catch (err) {
      if (err?.status === 401) {
        // Try force-refresh token once
        try {
          await getToken({ skipCache: true });
          const retry = await authApi.get('/api/auth/me');
          const user = retry?.data?.user || retry?.user;
          if (user) {
            setUserProfile({
              id: user.id,
              email: user.email,
              fullName: user.full_name,
              role: user.role,
              organizationName: user.organization_name,
            });
            setSessionStatus('active');
            return;
          }
        } catch {
          // Unrecoverable
        }
        useSessionStore.getState().showExpiredModal();
      } else if (err?.status === 404) {
        // User in Clerk but not DB — sync then retry
        try {
          await authApi.post('/api/auth/sync', {});
          const retry = await authApi.get('/api/auth/me');
          const user = retry?.data?.user || retry?.user;
          if (user) {
            setUserProfile({
              id: user.id,
              email: user.email,
              fullName: user.full_name,
              role: user.role,
              organizationName: user.organization_name,
            });
            setSessionStatus('active');
          }
        } catch {
          await performSignOut();
        }
      }
    }
  }, [authApi, getToken, setUserProfile, setSessionStatus, performSignOut]);

  // ── Health checker ────────────────────────────────────────────────────
  const lastHealthCheckRef = useRef(0);
  const checkHealth = useCallback(async () => {
    const now = Date.now();
    if (now - lastHealthCheckRef.current < 30000) return;
    lastHealthCheckRef.current = now;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/health`);
      setBackendHealthy(res.ok);
    } catch {
      setBackendHealthy(false);
    }
  }, [setBackendHealthy]);

  // ── Multi-tab sync (Area 1 — BroadcastChannel) ────────────────────────
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'signout') {
        clearSession();
        sessionStorage.clear();
        window.location.href = '/sign-in';
      } else if (event.data?.type === 'signin' && window.location.pathname === '/sign-in') {
        window.location.href = '/dashboard';
      }
    };

    return () => channel.close();
  }, [clearSession]);

  // ── Window focus re-fetch (Area 6 — User Profile Freshness) ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else {
        const hiddenDuration = Date.now() - (hiddenSinceRef.current || Date.now());
        if (hiddenDuration > PROFILE_REFETCH_GAP_MS && isSignedIn) {
          fetchProfile();
        }
        hiddenSinceRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSignedIn, fetchProfile]);

  // ── Main effect: start timers when authenticated ──────────────────────
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Hydrate profile on mount
    if (!useSessionStore.getState().userProfile) {
      fetchProfile();
    }

    // Start idle timer
    resetIdleTimer();

    // Activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Health checker
    healthTimerRef.current = setInterval(checkHealth, HEALTH_INTERVAL_MS);

    // Broadcast signin to other tabs
    channelRef.current?.postMessage({ type: 'signin' });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (healthTimerRef.current) clearInterval(healthTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [isLoaded, isSignedIn, fetchProfile, resetIdleTimer, handleActivity, checkHealth]);

  return { performSignOut, fetchProfile };
}
