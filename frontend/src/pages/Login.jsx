import React from 'react';
import { motion } from 'framer-motion';
import { SignIn } from '@clerk/react';
import { Mic, BarChart3, Shield, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { getClerkAppearance } from '../constants/clerkTheme';

const features = [
  { icon: Zap, text: '8-Second AI Analysis' },
  { icon: BarChart3, text: '6 Quality Dimensions' },
  { icon: Shield, text: 'DPDPA Compliant' },
  { icon: TrendingUp, text: 'Real-Time Coaching' },
];

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center px-16 xl:px-24">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #7B2FFF 0%, transparent 70%)', filter: 'blur(60px)', animationDelay: '2s' }}
        />

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-text-primary">CallPulse AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl xl:text-5xl font-bold font-display text-text-primary leading-tight mb-6"
          >
            Welcome back to
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              smarter QA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-text-muted text-lg mb-10 max-w-md leading-relaxed"
          >
            Score 100% of your calls in 8 seconds across 6 critical dimensions. Built for India&apos;s BPO industry.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 gap-3 max-w-md"
          >
            {features.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
              <div
                key={feature.text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FeatureIcon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-text-secondary">{feature.text}</span>
              </div>
              );
            })}
          </motion.div>

          {/* Stats footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex items-center gap-8"
          >
            <div>
              <p className="text-2xl font-bold text-primary">₹23.76L</p>
              <p className="text-xs text-text-muted">Saved per 300 agents/yr</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-secondary">97%</p>
              <p className="text-xs text-text-muted">Calls now reviewed</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <p className="text-xs text-text-muted">AI-Powered</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Clerk Sign In */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-4">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/[0.03] via-transparent to-secondary/[0.03]" />

        {/* Mobile logo (shown only on small screens) */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold font-display text-text-primary">CallPulse AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10"
        >
          <SignIn
            appearance={getClerkAppearance(false)}
            forceRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </motion.div>
      </div>
    </div>
  );
}
