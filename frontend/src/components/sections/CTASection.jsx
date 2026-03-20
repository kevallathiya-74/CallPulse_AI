import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import Button from '../ui/Button';

export default React.memo(function CTASection() {
  const { ref, inView } = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-14 relative overflow-hidden"
          style={{ boxShadow: '0 0 80px rgba(0,212,255,0.08)' }}
        >
          {/* Gradient blobs */}
          <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
              <span className="text-sm text-primary font-medium">Start Analyzing Today</span>
            </div>
            <h2 className="heading-lg gradient-text mb-6">
              Ready to Score Every Call?
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Join leading BPOs across India who are using CallPulse AI to review 100% of calls,
              coach agents faster, and save lakhs every year.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" icon={<Zap size={18} />}>
                  Analyze Your First Call Free
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button variant="secondary" size="lg">View Pricing</Button>
              </Link>
            </div>
            <p className="text-text-muted text-sm mt-6">No credit card required · Setup in 60 seconds · Cancel anytime</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
