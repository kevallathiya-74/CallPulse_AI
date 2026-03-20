import React from 'react';
import PageWrapper from '../layout/PageWrapper';
import GlassCard from '../ui/GlassCard';

export default function AgentProfileSkeleton() {
  return (
    <PageWrapper hideFooter>
      <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-6"></div>
        <GlassCard className="p-6 mb-6 h-32 bg-white/5"></GlassCard>
        <GlassCard className="p-6 mb-6 h-80 bg-white/5"></GlassCard>
        <GlassCard className="p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>)}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
