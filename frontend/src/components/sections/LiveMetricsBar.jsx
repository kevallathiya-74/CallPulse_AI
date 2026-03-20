import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, Users, Shield, Star } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { useCounter } from '../../hooks/useCounter';
import { formatIndianNumber } from '../../utils/formatScore';

const METRICS = [
  {
    icon: Activity,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    target: 148392,
    suffix: '',
    label: 'Calls Analyzed Today',
    sub: '+2,341 in last hour',
    format: (v) => formatIndianNumber(Math.round(v)),
  },
  {
    icon: Users,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
    target: 12847,
    suffix: '',
    label: 'Active Agents Monitored',
    sub: 'Across 43 contact centers',
    format: (v) => formatIndianNumber(Math.round(v)),
  },
  {
    icon: Star,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    target: 84.2,
    suffix: ' / 100',
    label: 'Average Quality Score',
    sub: '+3.1 pts from last month',
    format: (v) => v.toFixed(1),
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    target: 4219,
    suffix: '',
    label: 'Compliance Flags Caught',
    sub: 'That manual review missed',
    format: (v) => formatIndianNumber(Math.round(v)),
  },
];

function MetricCard({ metric, inView }) {
  const value = useCounter(metric.target, 2200, inView);
  const Icon = metric.icon;

  return (
    <div className="flex flex-col items-center gap-2 px-6 py-5 text-center">
      <div className={`w-11 h-11 rounded-[14px] ${metric.iconBg} flex items-center justify-center mb-1`}>
        <Icon size={20} className={metric.iconColor} />
      </div>
      <div className="text-2xl font-syne font-bold text-text-primary">
        {metric.format(value)}{metric.suffix}
      </div>
      <div className="text-sm font-medium text-text-primary">{metric.label}</div>
      <div className="text-xs text-text-muted">{metric.sub}</div>
    </div>
  );
}

function AIStatusCard() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-5 text-center">
      <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center mb-1 relative">
        <Zap size={20} className="text-primary pulse-dot" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success pulse-dot" />
        <span className="text-2xl font-syne font-bold text-success">Live</span>
      </div>
      <div className="text-sm font-medium text-text-primary">AI Engine Status</div>
      <div className="text-xs text-text-muted">99.97% uptime this month</div>
      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success text-xs">
        Operational
      </span>
    </div>
  );
}

export default React.memo(function LiveMetricsBar() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="w-full border-y"
      style={{
        background: 'rgba(0,212,255,0.03)',
        borderColor: 'rgba(0,212,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0"
          style={{ borderColor: 'rgba(0,212,255,0.08)', borderStyle: 'solid' }}
        >
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <MetricCard metric={metric} inView={inView} />
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="col-span-2 md:col-span-1"
          >
            <AIStatusCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
});
