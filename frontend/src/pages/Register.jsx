import React from 'react';
import { motion } from 'framer-motion';
import { SignUp } from '@clerk/react';
import { Mic, BarChart3, Shield, Zap, Clock, Users, Sparkles } from 'lucide-react';
import { getClerkAppearance } from '../constants/clerkTheme';

const steps = [
  { icon: Users, title: 'Create Account', desc: 'Sign up in seconds with email or Google' },
  { icon: Zap, title: 'Upload a Call', desc: 'Drop an audio file or paste a transcript' },
  { icon: BarChart3, title: 'Get AI Insights', desc: 'Receive a 6-dimension scorecard in 8s' },
];

export default function Register() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding & How It Works */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center px-16 xl:px-24">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-background to-primary/10" />
        <div
          className="absolute top-1/3 -left-20 w-96 h-96 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #7B2FFF 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', filter: 'blur(60px)', animationDelay: '2s' }}
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/20">
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
            Start scoring calls
            <span className="block bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              in minutes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-text-muted text-lg mb-12 max-w-md leading-relaxed"
          >
            No credit card required. Get started with a free trial and analyze your first call in under 60 seconds.
          </motion.p>

          {/* How It Works steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4 max-w-md"
          >
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
              <div
                key={step.title}
                className="flex items-start gap-4 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-[15px] flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-secondary" />
                    {step.title}
                  </p>
                  <p className="text-text-muted text-sm mt-0.5">{step.desc}</p>
                </div>
              </div>
              );
            })}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 flex items-center gap-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-xs text-text-muted">DPDPA Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-text-muted">Setup in 60s</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs text-text-muted">Free Trial</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Clerk Sign Up */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-4">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/[0.03] via-transparent to-primary/[0.03]" />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
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
          <SignUp
            appearance={getClerkAppearance(true)}
            forceRedirectUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </motion.div>
      </div>
    </div>
  );
}
