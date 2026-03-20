import { motion } from 'framer-motion';
import React from 'react';
import { TrendingUp, Heart, BookOpen, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import GlassCard from '../ui/GlassCard';

const FEATURES = [
  {
    icon: TrendingUp,
    name: 'Sentiment Arc',
    color: '#00D4FF',
    desc: 'Track how customer sentiment evolves across the entire call duration. Identify the exact moment where conversations turn positive or spiral into escalation.',
    stat: 'Used by 89% of enterprise QA teams',
  },
  {
    icon: Heart,
    name: 'Tone & Empathy',
    color: '#FF6B35',
    desc: "Score how empathetically agents respond to frustrated or distressed customers. Separate warm, helpful language from robotic or dismissive tone automatically.",
    stat: 'Reduces escalations by 34% on average',
  },
  {
    icon: BookOpen,
    name: 'Clarity Score',
    color: '#7B2FFF',
    desc: 'Measure how clearly agents communicate complex information, product details, and instructions. Flagged when jargon or mumbled speech creates confusion.',
    stat: '98% correlation with CSAT surveys',
  },
  {
    icon: ShieldCheck,
    name: 'Script Compliance',
    color: '#00E676',
    desc: 'Automatically verify that agents follow mandatory scripts, legal disclosures, and regulatory requirements. Zero missed compliance steps.',
    stat: 'Catches 4,219 violations monthly',
  },
  {
    icon: CheckCircle2,
    name: 'Resolution Quality',
    color: '#FFD600',
    desc: "Assess whether the agent genuinely resolved the customer's issue or deflected it. Correlates directly with first-call resolution and repeat call rates.",
    stat: '43% improvement in FCR scores',
  },
  {
    icon: MessageSquare,
    name: 'Professional Language',
    color: '#00D4FF',
    desc: 'Detect unprofessional language, cultural insensitivity, or brand policy violations automatically. Protect your organization\'s reputation at scale.',
    stat: 'Scans 1.4L calls every day',
  },
];

export default React.memo(function FeaturesSection() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="features" ref={ref} className="py-24 px-6 relative">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <h2 className="heading-lg gradient-text mb-4">Beyond Basic Sentiment</h2>
          <p className="text-text-muted max-w-xl mx-auto text-lg">
            Six dimensions that mirror how QA managers actually score calls
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 36 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              >
                <GlassCard className="p-6 h-full flex flex-col gap-4">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                  >
                    <Icon size={22} style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-syne font-bold text-lg text-text-primary">{feature.name}</h3>
                  <p className="text-text-muted text-sm leading-relaxed flex-1">{feature.desc}</p>
                  <p className="text-xs text-text-muted border-t border-white/5 pt-3">{feature.stat}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
