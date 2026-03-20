import React from 'react';
import PageWrapper from '../layout/PageWrapper';
import GlassCard from '../ui/GlassCard';

export default function ReportSkeleton() {
  return (
    <PageWrapper hideFooter>
      <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded"></div>
          <div className="flex gap-3"><div className="w-24 h-8 bg-white/10 rounded-full"></div></div>
        </div>
        <GlassCard className="p-6 mb-6 h-40 bg-white/5"></GlassCard>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => <GlassCard key={i} className="h-32 bg-white/5"></GlassCard>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GlassCard className="h-80 bg-white/5"></GlassCard>
          <GlassCard className="h-80 bg-white/5"></GlassCard>
        </div>
        <GlassCard className="h-60 bg-white/5"></GlassCard>
      </div>
    </PageWrapper>
  );
}
