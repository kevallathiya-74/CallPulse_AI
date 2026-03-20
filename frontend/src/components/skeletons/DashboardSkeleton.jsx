import React from 'react';
import PageWrapper from '../layout/PageWrapper';
import GlassCard from '../ui/GlassCard';

export default function DashboardSkeleton() {
  return (
    <PageWrapper hideFooter>
      <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-8 w-40 bg-white/10 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-wrap mb-8">
          {[...Array(4)].map((_, i) => (
            <GlassCard key={i} className="p-6 h-32 bg-white/5"></GlassCard>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6 h-80 bg-white/5"></GlassCard>
          <GlassCard className="p-6 h-80 bg-white/5"></GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
