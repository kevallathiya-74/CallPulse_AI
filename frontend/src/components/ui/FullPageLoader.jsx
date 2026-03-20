import React from 'react';
import { Mic } from 'lucide-react';

/**
 * FullPageLoader — Branded loading screen shown during Clerk initialization.
 * Renders in under 100ms. Never flashes during normal navigation.
 */
export default React.memo(function FullPageLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: '#030812' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Mic className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold font-display text-text-primary">
          CallPulse AI
        </span>
      </div>

      {/* Animated gradient ring */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, #00D4FF, #7B2FFF, #00D4FF)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
            animationDuration: '1.2s',
          }}
        />
      </div>

      {/* Loading text */}
      <p className="text-text-muted text-sm animate-pulse" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Loading CallPulse AI...
      </p>
    </div>
  );
});
