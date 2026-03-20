import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { calculateROI } from '../../utils/formatCurrency';
import GlassCard from '../ui/GlassCard';

export default React.memo(function ROICalculator() {
  const [agents, setAgents] = useState(300);
  const { ref, inView } = useInView({ threshold: 0.2 });

  const roi = calculateROI(agents);

  const handleSliderChange = (e) => {
    setAgents(Number(e.target.value));
  };

  return (
    <section ref={ref} className="py-24 px-6" id="roi">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="heading-lg gradient-text mb-4">Calculate Your ROI</h2>
          <p className="text-text-muted text-lg">See how much your BPO can save by automating QA with CallPulse AI</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <GlassCard className="p-8" hover={false} glow>
            {/* Slider */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-text-muted text-sm">Team size</span>
                <span className="text-primary font-syne font-bold text-lg">
                  Your team: {agents.toLocaleString('en-IN')} agents
                </span>
              </div>
              <input
                type="range"
                name="agentsRange"
                min={50}
                max={2000}
                step={50}
                value={agents}
                onChange={handleSliderChange}
                className="w-full"
                aria-label="Number of agents"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>50</span>
                <span>2,000</span>
              </div>
            </div>

            {/* Result cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-card p-5 text-center">
                <p className="text-3xl font-syne font-bold text-primary">{roi.monthly}</p>
                <p className="text-sm text-text-muted mt-1">Monthly Savings</p>
              </div>
              <div className="bg-secondary/5 border border-secondary/20 rounded-card p-5 text-center">
                <p className="text-3xl font-syne font-bold text-secondary">{roi.annual}</p>
                <p className="text-sm text-text-muted mt-1">Annual Savings</p>
              </div>
              <div className="bg-success/5 border border-success/20 rounded-card p-5 text-center">
                <p className="text-3xl font-syne font-bold text-success">3% → 100%</p>
                <p className="text-sm text-text-muted mt-1">QA Coverage Gain</p>
              </div>
            </div>

            <p className="text-text-muted text-xs text-center mt-6 opacity-60">
              Calculation based on ₹60,000/month QA analyst cost. Source: NASSCOM 2024.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
});
