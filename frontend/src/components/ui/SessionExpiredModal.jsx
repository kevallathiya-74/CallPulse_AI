import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSessionStore from '../../store/sessionStore';
import { Mic } from 'lucide-react';

/**
 * SessionExpiredModal — Non-dismissable modal shown when auth session ends.
 * User MUST choose "Sign In Again" or "Go to Homepage".
 */
export default function SessionExpiredModal() {
  const sessionExpiredModalVisible = useSessionStore(s => s.sessionExpiredModalVisible);
  const dismissExpiredModal = useSessionStore(s => s.dismissExpiredModal);
  const navigate = useNavigate();

  if (!sessionExpiredModalVisible) return null;

  const currentPath = window.location.pathname;
  const redirectUrl = currentPath !== '/sign-in' && currentPath !== '/sign-up'
    ? `?redirect_url=${encodeURIComponent(currentPath)}`
    : '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="glass-card p-8 max-w-sm w-full mx-4 text-center"
        role="alertdialog"
        aria-modal="true"
        aria-label="Session expired"
      >
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
            <Mic className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-bold font-display text-text-primary mb-2">
          Your session has ended
        </h2>
        <p className="text-text-muted text-sm mb-6">
          For your security, you&apos;ve been signed out. Please sign in again to continue.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              dismissExpiredModal();
              navigate(`/sign-in${redirectUrl}`);
            }}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Sign In Again
          </button>
          <button
            onClick={() => {
              dismissExpiredModal();
              navigate('/');
            }}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary font-semibold text-sm hover:bg-white/10 transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
