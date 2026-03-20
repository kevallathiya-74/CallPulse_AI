import { motion } from 'framer-motion';
import React from 'react';
import { useInView } from '../../hooks/useInView';
import { useCounter } from '../../hooks/useCounter';
import GlassCard from '../ui/GlassCard';

const STATS = [
  { value: 97, suffix: '%', label: 'Of Calls Previously Unreviewed', decimals: 0, prefix: '' },
  { value: 8, suffix: ' sec', label: 'Average Analysis Time Per Call', decimals: 0, prefix: '' },
  { value: 23.76, suffix: 'L', label: 'Annual Savings Per 300-Agent BPO', decimals: 2, prefix: '₹' },
  { value: 6, suffix: '', label: 'Quality Dimensions Scored Per Call', decimals: 0, prefix: '' },
];

function StatCard({ stat, inView, index }) {
  const value = useCounter(stat.value, 2000, inView);
  const display = stat.decimals > 0 ? value.toFixed(stat.decimals) : Math.round(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.23, 1, 0.32, 1] }}
    >
      <GlassCard className="p-8 text-center" glow>
        <div className="heading-lg gradient-text mb-2">
          {stat.prefix}{display}{stat.suffix}
        </div>
        <p className="text-text-muted text-sm leading-relaxed">{stat.label}</p>
      </GlassCard>
    </motion.div>
  );
}

export default React.memo(function StatsSection() {
  const { ref, inView } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} inView={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
});
