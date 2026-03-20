import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Zap, Play, ShieldCheck, Clock, Lock, Mic,
  TrendingUp, Heart, CheckCircle2,
} from 'lucide-react';
const HeroCanvas = React.lazy(() => import('../three/HeroCanvas'));
import { useMouseParallax } from '../../hooks/useMouseParallax';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

function AnimatedWaveform() {
  return (
    <div className="flex items-end gap-[2px] h-12 w-full my-4">
      {Array.from({ length: 45 }).map((_, i) => (
        <div
          key={i}
          className="wave-bar flex-1 rounded-full bg-gradient-to-t from-primary to-secondary"
          style={{
            animationDelay: `${(i % 10) * 0.08}s`,
            minHeight: '4px',
            maxHeight: '100%',
          }}
        />
      ))}
    </div>
  );
}

function ScoreArc({ score = 87 }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke="url(#scoreGrad)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-arc"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#7B2FFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center" style={{ marginTop: '-70px' }}>
        <p className="text-2xl font-syne font-bold text-primary" style={{ transform: 'rotate(90deg)' }}>{score}</p>
        <p className="text-xs text-text-muted" style={{ transform: 'rotate(90deg)' }}>/ 100</p>
      </div>
    </div>
  );
}

const HERO_STATS = [
  { icon: TrendingUp, label: 'Sentiment', value: '92' },
  { icon: Heart, label: 'Empathy', value: '88' },
  { icon: ShieldCheck, label: 'Compliance', value: '100%' },
];

export default React.memo(function HeroSection() {
  const parallaxRef = useMouseParallax({ intensity: 6 });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Three.js canvas background */}
      <div className="absolute inset-0 z-0">
        <React.Suspense fallback={null}>
          <HeroCanvas />
        </React.Suspense>
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-primary/20 rounded-full px-4 py-2 w-fit">
            <Activity size={14} className="text-primary pulse-dot" />
            <span className="text-sm text-text-muted font-medium">Live AI Engine · 8s Analysis</span>
          </div>

          <h1 className="heading-xl gradient-text leading-tight mb-2">
            Every Call.<br />Scored. Coached.<br />Improved.
          </h1>

          <p className="text-text-muted text-lg leading-relaxed max-w-[460px]">
            AI-powered voice quality analytics that scores 100% of calls in 8 seconds across
            6 critical dimensions. Built for India's BPO industry.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link to="/register">
              <Button size="lg" icon={<Zap size={18} />}>
                Analyze a Call Free
              </Button>
            </Link>
            <Button variant="secondary" size="lg" icon={<Play size={16} />}>
              Watch Demo
            </Button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: ShieldCheck, text: 'No credit card' },
              { icon: Clock, text: 'Setup in 60s' },
              { icon: Lock, text: 'DPDPA Compliant' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                 <div key={item.text} className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Icon size={14} className="text-primary" />
                  {item.text}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right column — 3D preview card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
          className="flex justify-center"
        >
          <div ref={parallaxRef} style={{ willChange: 'transform' }}>
            <div className="glass-card p-6 max-w-sm w-full shadow-[0_0_60px_rgba(0,212,255,0.1)]">
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-syne font-semibold text-text-primary">Agent Priya Mehta</p>
                  <p className="text-xs text-text-muted">Call ID: CP-20240315-0042</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Mic size={18} className="text-white drop-shadow-sm" />
                </div>
              </div>

              {/* Waveform */}
              <AnimatedWaveform />

              {/* Score + stats */}
              <div className="flex items-center justify-between mt-4 gap-4">
                <div className="relative flex items-center justify-center w-24 h-24">
                  <svg width="96" height="96" viewBox="0 0 100 100" className="-rotate-90 absolute inset-0">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="url(#heroScoreGrad)" strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - 87 / 100)}
                      className="score-arc"
                    />
                    <defs>
                      <linearGradient id="heroScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="100%" stopColor="#7B2FFF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-center">
                    <p className="text-2xl font-syne font-bold text-primary">87</p>
                    <p className="text-[10px] text-text-muted">/ 100</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {HERO_STATS.map((item) => {
                    const Icon = item.icon;
                    return (
                       <div key={item.label} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} className="text-primary" />
                          <span className="text-xs text-text-muted">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-text-primary">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-xs text-success font-medium">Analysis Complete</span>
                <span className="ml-auto text-xs text-text-muted">8.4s</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
