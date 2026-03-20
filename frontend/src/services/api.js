/**
 * api.js — Clerk-authenticated Axios instances with hardened error handling.
 *
 * - 401 auto-retry with token refresh (singleton pattern)
 * - Null token guard
 * - Per-status-code error handling (409/422 inline, 429 countdown, 500 retry, 503 banner)
 * - Network error detection with health-check reconnection
 */
import axios from 'axios';
import { useAuth } from '@clerk/react';
import toast from 'react-hot-toast';
import useSessionStore from '../store/sessionStore';
import { useMemo } from 'react';
import { getFriendlyStatusMessage, toUserFriendlyMessage } from '../utils/userFriendlyMessage';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const HEALTH_CHECK_URL = BASE_URL ? `${BASE_URL}/api/health` : '/api/health';
const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

const STATUS_MESSAGES = {
  400: getFriendlyStatusMessage(400),
  401: getFriendlyStatusMessage(401),
  403: getFriendlyStatusMessage(403),
  404: getFriendlyStatusMessage(404),
  409: getFriendlyStatusMessage(409),
  410: getFriendlyStatusMessage(410),
  413: getFriendlyStatusMessage(413),
  422: getFriendlyStatusMessage(422),
  429: getFriendlyStatusMessage(429),
  500: getFriendlyStatusMessage(500),
  503: getFriendlyStatusMessage(503),
};

// ── Public API (no auth) ──────────────────────────────────────────────────
export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: BASE_HEADERS,
});

publicApi.interceptors.request.use((config) => {
  config._axiosInstance = publicApi;
  return config;
});

publicApi.interceptors.response.use(
  (response) => response.data,
  (error) => handleErrorResponse(error),
);

// ── Auth API hook ─────────────────────────────────────────────────────────
export function useAuthApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const authApi = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: BASE_HEADERS,
      withCredentials: true,
    });

    // Singleton refresh promise to avoid duplicate token refreshes
    const refreshState = { promise: null };

    // ── Request interceptor ────────────────────────────────────────────
    authApi.interceptors.request.use(async (config) => {
      // eslint-disable-next-line
      config._startTime = Date.now();
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Token is null — session ended
          useSessionStore.getState().showExpiredModal();
          return Promise.reject(
            new axios.CanceledError(
              'No auth token — session expired',
              axios.AxiosError.ERR_CANCELED,
              config
            )
          );
        }
      } catch {
        useSessionStore.getState().showExpiredModal();
        return Promise.reject(
          new axios.CanceledError(
            'Failed to get auth token',
            axios.AxiosError.ERR_CANCELED,
            config
          )
        );
      }
      config._axiosInstance = authApi;
      return config;
    });

    // ── Response interceptor ───────────────────────────────────────────
    authApi.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          const url = response.config?.url || '';
          if (!url.includes('/health') && !url.includes('/status')) {
            // eslint-disable-next-line
            const duration = Date.now() - (response.config._startTime || Date.now());
            console.log(`[API] ${response.config?.method?.toUpperCase()} ${url} | ${response.status} OK | ${duration}ms`);
          }
        }
        return response.data;
      },
      async (error) => {
        // Cancelled requests (null token)
        if (axios.isCancel(error)) {
          return Promise.reject({ status: 0, message: 'Request cancelled', raw: null });
        }

        const config = error.config;
        const status = error.response?.status;

        // ── 401: Auto-retry with token refresh ─────────────────────
        if (status === 401 && !config?._retry) {
          config._retry = true;

          if (!refreshState.promise) {
            refreshState.promise = getToken({ skipCache: true })
              .finally(() => { refreshState.promise = null; });
          }

          try {
            const newToken = await refreshState.promise;
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
              return authApi.request(config);
            }
          } catch {
            // Refresh failed
          }

          // Unrecoverable 401
          useSessionStore.getState().showExpiredModal();
          return Promise.reject({ status: 401, message: 'Session expired', raw: null });
        }

        return handleErrorResponse(error);
      },
    );

    return authApi;
  }, [getToken]);
}

export function useUploadApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const uploadApi = axios.create({
      baseURL: BASE_URL,
      timeout: 120000,
      headers: BASE_HEADERS,
      withCredentials: true,
    });

    uploadApi.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config._axiosInstance = uploadApi;
      return config;
    });

    uploadApi.interceptors.response.use(
      (response) => response.data,
      (error) => handleErrorResponse(error),
    );

    return uploadApi;
  }, [getToken]);
}

// ── Shared error handler ──────────────────────────────────────────────────
function handleErrorResponse(error) {
  if (!error.response) {
    // Network error
    toast.error('Connection lost — check your internet connection', { id: 'network-err' });
    startHealthChecker();
    return Promise.reject({ status: 0, message: getFriendlyStatusMessage(0), raw: null });
  }

  const status = error.response?.status;
  const config = error.config;
  const detail =
    error.response?.data?.message ||
    error.response?.data?.detail ||
    null;
  const message = toUserFriendlyMessage(detail, {
    status,
    fallback: STATUS_MESSAGES[status] || getFriendlyStatusMessage(status),
  });

  // Dispatch global api-error event
  window.dispatchEvent(new CustomEvent('api-error', { detail: { status, message } }));

  // Per-status handling
  switch (status) {
    case 401:
      toast.error('Session expired — please sign in again', { id: 'auth-err' });
      useSessionStore.getState().showExpiredModal();
      break;

    case 403:
      toast.error(message, { id: 'forbidden-err' });
      // Do NOT redirect — let the page handle it
      break;

    case 404:
      toast.error(message, { id: 'not-found-err' });
      break;

    case 409:
      // Return for inline handling — no toast
      break;

    case 422:
      // Return for inline field-level handling — no toast
      break;

    case 429: {
      const retryAfter = error.response?.headers?.['retry-after'];
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 30;
      toast.error(`Too many requests — retry in ${seconds}s`, { id: 'rate-limit', duration: seconds * 1000 });
      break;
    }

    case 500:
      if (config && !config._retry500) {
        config._retry500 = true;
        toast.error('Something went wrong — retrying...', { id: 'server-err' });
        const client = config._axiosInstance || axios;
        return new Promise((resolve, reject) =>
          setTimeout(() =>
            client.request(config)
              .then((response) => resolve(response?.data ?? response))
              .catch(reject),
            2000
          )
        );
      }
      toast.error('Server error — our team has been notified', { id: 'server-err', duration: 10000 });
      break;

    case 503:
      toast('AI Engine warming up — analysis will start shortly', { id: 'ai-warmup', duration: 15000 });
      break;

    default:
      toast.error(message, { id: `err-${status}` });
  }

  return Promise.reject({ status, message, raw: error.response?.data });
}

// ── Network reconnection checker ──────────────────────────────────────────
let healthInterval = null;

function startHealthChecker() {
  if (healthInterval) return;
  healthInterval = setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(HEALTH_CHECK_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        clearInterval(healthInterval);
        healthInterval = null;
        toast.success('Connection restored', { id: 'network-err' });
        useSessionStore.getState().setBackendHealthy(true);
      }
    } catch {
      // Still offline
    }
  }, 5000);
}

// Default export for backward compatibility
export default publicApi;
