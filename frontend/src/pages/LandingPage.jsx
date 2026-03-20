import React from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import HeroSection from '../components/sections/HeroSection';
import LiveMetricsBar from '../components/sections/LiveMetricsBar';
import StatsSection from '../components/sections/StatsSection';
import FeaturesSection from '../components/sections/FeaturesSection';
const HowItWorksSection = React.lazy(() => import('../components/sections/HowItWorksSection'));
const DemoPreviewSection = React.lazy(() => import('../components/sections/DemoPreviewSection'));
const ROICalculator = React.lazy(() => import('../components/sections/ROICalculator'));
import TrustedBySection from '../components/sections/TrustedBySection';
import PricingSection from '../components/sections/PricingSection';
import CTASection from '../components/sections/CTASection';

export default function LandingPage() {
  return (
    <PageWrapper>
      <HeroSection />
      <LiveMetricsBar />
      <StatsSection />
      <FeaturesSection />
      <React.Suspense fallback={<div className="h-96 bg-white/5 animate-pulse rounded-2xl mx-10 my-20"></div>}>
        <HowItWorksSection />
      </React.Suspense>
      <React.Suspense fallback={<div className="h-96 bg-white/5 animate-pulse rounded-2xl mx-10 my-20"></div>}>
        <DemoPreviewSection />
      </React.Suspense>
      <React.Suspense fallback={<div className="h-96 bg-white/5 animate-pulse rounded-2xl mx-10 my-20"></div>}>
        <ROICalculator />
      </React.Suspense>
      <TrustedBySection />
      <PricingSection />
      <CTASection />
    </PageWrapper>
  );
}
