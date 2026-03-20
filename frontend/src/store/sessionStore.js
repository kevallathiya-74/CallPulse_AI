/**
 * sessionStore.js — Zustand store for session lifecycle management.
 * Manages user profile, session status, idle tracking, and UI modals.
 * NEVER persist sensitive data to localStorage.
 */
import { create } from 'zustand';

const useSessionStore = create((set) => ({
  // ── State ────────────────────────────────────────────────────────────
  userProfile: null,   // { id, email, fullName, role, organizationName }
  sessionStatus: 'loading', // 'loading' | 'active' | 'expired' | 'inactive'
  lastActivity: Date.now(),
  backendHealthy: true,
  idleModalVisible: false,
  sessionExpiredModalVisible: false,

  // ── Actions ──────────────────────────────────────────────────────────
  setUserProfile: (profile) => set({ userProfile: profile }),

  clearSession: () => set({
    userProfile: null,
    sessionStatus: 'inactive',
    lastActivity: 0,
    idleModalVisible: false,
    sessionExpiredModalVisible: false,
  }),

  updateActivity: () => set({ lastActivity: Date.now() }),

  setSessionStatus: (status) => set({ sessionStatus: status }),

  setBackendHealthy: (healthy) => set({ backendHealthy: healthy }),

  showIdleModal: () => set({ idleModalVisible: true }),

  dismissIdleModal: () => set({
    idleModalVisible: false,
    lastActivity: Date.now(),
  }),

  showExpiredModal: () => set({
    sessionExpiredModalVisible: true,
    sessionStatus: 'expired',
  }),

  dismissExpiredModal: () => set({ sessionExpiredModalVisible: false }),
}));

export default useSessionStore;
