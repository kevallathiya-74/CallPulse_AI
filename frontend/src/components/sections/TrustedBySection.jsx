import { motion } from 'framer-motion';
import React from 'react';
import { useInView } from '../../hooks/useInView';

// Inline SVG logo components — monochrome, 140x40 bounding box
const logos = [
  {
    name: 'TelecomCorp',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <rect x="2" y="8" width="24" height="24" rx="4" fill="currentColor" opacity="0.7"/>
        <circle cx="14" cy="20" r="5" fill="#030812"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">TelecomCorp</text>
      </svg>
    ),
  },
  {
    name: 'BankSecure',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <path d="M14 6L26 14V26H2V14L14 6Z" fill="currentColor" opacity="0.7"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">BankSecure</text>
      </svg>
    ),
  },
  {
    name: 'InsurePro',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <circle cx="14" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" opacity="0.7"/>
        <path d="M9 20L13 24L19 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">InsurePro</text>
      </svg>
    ),
  },
  {
    name: 'LearnFast',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <path d="M2 28L14 8L26 28H2Z" fill="currentColor" opacity="0.7"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">LearnFast</text>
      </svg>
    ),
  },
  {
    name: 'NovaBPO',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <rect x="2" y="12" width="24" height="16" rx="8" fill="currentColor" opacity="0.7"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">NovaBPO</text>
      </svg>
    ),
  },
  {
    name: 'CreditShield',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <polygon points="14,4 26,10 26,22 14,32 2,22 2,10" fill="currentColor" opacity="0.6"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="12" fontWeight="700" fill="currentColor">CreditShield</text>
      </svg>
    ),
  },
  {
    name: 'HealthCall',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <path d="M14 8C14 8 2 14 2 22C2 28 8 32 14 28C20 32 26 28 26 22C26 14 14 8 14 8Z" fill="currentColor" opacity="0.7"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">HealthCall</text>
      </svg>
    ),
  },
  {
    name: 'GovConnect',
    svg: (
      <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
        <rect x="2" y="18" width="24" height="14" fill="currentColor" opacity="0.6"/>
        <polygon points="14,4 28,18 0,18" fill="currentColor" opacity="0.7"/>
        <text x="32" y="25" fontFamily="Syne, sans-serif" fontSize="13" fontWeight="700" fill="currentColor">GovConnect</text>
      </svg>
    ),
  },
];

export default React.memo(function TrustedBySection() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-text-muted text-sm font-medium uppercase tracking-widest mb-10"
        >
          Trusted by BPOs Across India
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="flex items-center justify-center p-4 rounded-card border border-white/5 bg-white/2 text-white/30 hover:text-white/70 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 cursor-default h-16"
            >
              {logo.svg}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
