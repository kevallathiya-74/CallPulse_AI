import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

const resolveClerkPublishableKey = () => {
  const modeSpecific = import.meta.env.PROD
    ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_PROD
    : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV;

  const fallback = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const key = modeSpecific || fallback;

  if (!key) {
    throw new Error(
      'Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY_DEV (dev) or VITE_CLERK_PUBLISHABLE_KEY_PROD (prod).',
    );
  }

  // Prevent accidental production deployments with test keys.
  if (import.meta.env.PROD && key.startsWith('pk_test_')) {
    throw new Error('Refusing to start production build with a Clerk test key. Use VITE_CLERK_PUBLISHABLE_KEY_PROD=pk_live_...');
  }

  return key;
};

const PUBLISHABLE_KEY = resolveClerkPublishableKey();

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk publishable key in .env');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Production console suppression ──────────────────────────────────────────
// Suppress console.log and console.warn in production; keep console.error only
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
  console.info = noop;
  // console.error is kept for critical unhandled errors
}

import { dark } from '@clerk/themes';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signOutUrl="/sign-in"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#00D4FF',
          colorBackground: '#13111C',
          colorInputBackground: '#1E1B29',
          colorInputText: '#FFFFFF',
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
