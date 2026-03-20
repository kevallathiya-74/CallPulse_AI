import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { useAuthApi } from '../services/api';
import useSessionStore from '../store/sessionStore';

/**
 * useAuthSync — Syncs Clerk user to PostgreSQL and hydrates the session store.
 *
 * On authenticated session start:
 *   1. POST /api/auth/sync → provisions/updates user in DB
 *   2. Populates sessionStore.userProfile from sync response
 *   3. Sets sessionStatus to 'active'
 *
 * Handles:
 *   - 401 → token refresh + retry once, then show expired modal
 *   - 404 → user doesn't exist yet, sync creates them
 *   - Network error → non-fatal, warns in console
 */
export function useAuthSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const authApi = useAuthApi();
  const { setUserProfile, setSessionStatus } = useSessionStore();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Skip if profile already loaded by useSessionManager
    if (useSessionStore.getState().userProfile) {
      setSessionStatus('active');
      return;
    }

    const orgName =
      user.organizationMemberships?.[0]?.organization?.name || null;

    authApi
      .post('/api/auth/sync', { organization_name: orgName })
      .then((res) => {
        const profile = res?.data || res;
        if (profile) {
          setUserProfile({
            id: profile?.user_id || profile?.id,
            email: profile?.email,
            fullName: profile?.full_name,
            role: profile?.role,
            organizationName: profile?.organization_name,
          });
          setSessionStatus('active');
        }
      })
      .catch((err) => {
        // Sync failure is non-fatal — useSessionManager will also try /me
        if (import.meta.env.DEV) {
          console.warn('[CallPulse][AUTH] Backend sync failed — session manager will retry', err?.message);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded, user?.id]);
}
