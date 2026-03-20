import React from 'react';
import { motion as Motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useInView';
import useUiStore from '../../store/uiStore';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const TIERS = [
  {
    name: 'Starter',
    monthlyPrice: 2999,
    desc: 'For small teams getting started with AI QA',
    features: ['Up to 500 calls/month', '3 agents', 'Basic 6-dimension scoring', 'PDF export', '7-day report history', 'Email support'],
    cta: 'Start Free Trial',
    variant: 'secondary',
    highlight: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 7999,
    desc: 'Most popular for mid-size BPOs',
    features: ['Up to 5,000 calls/month', '25 agents', 'Full 6-dimension scoring', 'Coaching recommendations', 'API access', '90-day history', 'Priority support', 'Team analytics'],
    cta: 'Get Started',
    variant: 'primary',
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: 24999,
    desc: 'For large contact centers with custom needs',
    features: ['Unlimited calls', 'Unlimited agents', 'Custom scoring rubrics', 'SSO integration', 'On-premise option', 'Dedicated success manager', 'SLA guarantee', 'Custom reports'],
    cta: 'Contact Sales',
    variant: 'secondary',
    highlight: false,
  },
];

export default React.memo(function PricingSection() {
  const pricingBilling = useUiStore(s => s.pricingBilling);
  const setPricingBilling = useUiStore(s => s.setPricingBilling);
  const { ref, inView } = useInView({ threshold: 0.1 });
  const isAnnual = pricingBilling === 'annual';

  const getPrice = (monthly) => {
    const price = isAnnual ? Math.round(monthly * 0.8) : monthly;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <section id="pricing" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="heading-lg gradient-text mb-4">Simple, Transparent Pricing</h2>
          <p className="text-text-muted text-lg mb-8">No hidden fees. Cancel anytime. Starts at ₹2,999/month.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setPricingBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-primary text-background' : 'text-text-muted hover:text-text-primary'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPricingBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? 'bg-primary text-background' : 'text-text-muted hover:text-text-primary'}`}
            >
              Annual
              {isAnnual && (
                <span className="bg-background/20 text-background rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  Save 20%
                </span>
              )}
            </button>
          </div>
          {!isAnnual && (
            <p className="text-text-muted text-xs mt-2">Switch to annual billing to save 20%</p>
          )}
        </Motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier, i) => (
            <Motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className={tier.highlight ? 'md:-mt-4' : ''}
            >
              <div className={[
                'glass-card p-6 h-full flex flex-col transition-all duration-500',
                tier.highlight
                  ? 'border-t-4 border-t-[#3b82f6] shadow-[0_20px_50px_rgba(0,212,255,0.15),0_0_30px_rgba(59,130,246,0.1)]'
                  : 'hover:border-white/10',
              ].join(' ')}>
                {tier.highlight && (
                  <div className="flex justify-center mb-4">
                    <Badge variant="primary" dot>Most Popular</Badge>
                  </div>
                )}
                <h3 className="font-syne font-bold text-xl text-text-primary mb-1">{tier.name}</h3>
                <p className="text-text-muted text-sm mb-4">{tier.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-syne font-bold text-text-primary">{getPrice(tier.monthlyPrice)}</span>
                  <span className="text-text-muted text-sm">/month</span>
                  {isAnnual && <p className="text-success text-xs mt-1">Billed annually — 20% off</p>}
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant={tier.variant} className="w-full" icon={tier.highlight ? <Zap size={14} /> : undefined}>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
