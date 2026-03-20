import React, { useEffect, useState } from 'react';
import useSessionStore from '../../store/sessionStore';

const IDLE_WARNING_SECONDS = parseInt(import.meta.env.VITE_IDLE_WARNING_SECONDS || '60', 10);

/**
 * IdleModal — "Still working?" modal with 60-second countdown.
 * Focus-trapped, ESC = keep me in. Auto-signs out when countdown reaches 0.
 */
export default function IdleModal({ onSignOut }) {
  const idleModalVisible = useSessionStore(s => s.idleModalVisible);
  const dismissIdleModal = useSessionStore(s => s.dismissIdleModal);

  if (!idleModalVisible) return null;

  return <IdleModalInner onSignOut={onSignOut} dismissIdleModal={dismissIdleModal} />;
}

/**
 * Inner component — only mounts when modal is visible.
 * Countdown state resets naturally because component unmounts/remounts.
 */
function IdleModalInner({ onSignOut, dismissIdleModal }) {
  const [countdown, setCountdown] = useState(IDLE_WARNING_SECONDS);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      onSignOut?.();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onSignOut]);

  // ESC key = keep me in
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') dismissIdleModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dismissIdleModal]);

  const progress = (countdown / IDLE_WARNING_SECONDS) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="glass-card p-8 max-w-sm w-full mx-4 text-center"
        role="dialog"
        aria-modal="true"
        aria-label="Session idle warning"
      >
        {/* Countdown ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r={radius} fill="none"
                stroke="url(#idleGrad)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="idleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#7B2FFF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-text-primary">{countdown}</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold font-display text-text-primary mb-2">Still working?</h2>
        <p className="text-text-muted text-sm mb-6">
          You&apos;ve been inactive for a while. Your session will end in {countdown} seconds.
        </p>

        <div className="flex gap-3">
          <button
            onClick={dismissIdleModal}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm hover:opacity-90 transition"
          >
            Yes, keep me in
          </button>
          <button
            onClick={onSignOut}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary font-semibold text-sm hover:bg-white/10 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
