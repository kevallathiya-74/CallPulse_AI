import React from 'react';
import PageWrapper from '../layout/PageWrapper';
import GlassCard from '../ui/GlassCard';

export default function AgentTableSkeleton() {
  return (
    <PageWrapper hideFooter>
      <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded mb-2"></div>
        <div className="h-4 w-64 bg-white/10 rounded mb-8"></div>
        <GlassCard className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-full md:w-64 bg-white/10 rounded-xl"></div>
            <div className="h-10 w-32 bg-white/10 rounded-xl"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
