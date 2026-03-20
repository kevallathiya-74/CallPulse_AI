import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, BarChart2, Lightbulb, CheckCircle2, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { analysisService } from '../../services/analysisService';
import { useInView } from '../../hooks/useInView';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import SentimentTimeline from '../charts/SentimentTimeline';
import ScorecardRadar from '../charts/ScorecardRadar';
import GlassCard from '../ui/GlassCard';

const TABS = [
  { key: 'sentiment', label: 'Sentiment', icon: Activity },
  { key: 'scorecard', label: 'Scorecard', icon: BarChart2 },
  { key: 'coaching', label: 'Coaching', icon: Lightbulb },
];

export default React.memo(function DemoPreviewSection() {
  const [activeTab, setActiveTab] = useState('sentiment');
  const { ref, inView } = useInView({ threshold: 0.2 });

  const { data: rawSentiment, isLoading: isSentimentLoading } = useQuery({
    queryKey: [QUERY_KEYS.DEMO_SENTIMENT],
    queryFn: () => analysisService.getDemoSentiment(),
    staleTime: Infinity,
    enabled: inView,
  });

  const { data: rawScorecard, isLoading: isScorecardLoading } = useQuery({
    queryKey: [QUERY_KEYS.DEMO_SCORECARD],
    queryFn: () => analysisService.getDemoScorecard(),
    staleTime: Infinity,
    enabled: inView,
  });

  const { data: rawCoaching, isLoading: isCoachingLoading } = useQuery({
    queryKey: [QUERY_KEYS.DEMO_COACHING],
    queryFn: () => analysisService.getDemoCoaching(),
    staleTime: Infinity,
    enabled: inView,
  });

  const loading = (isSentimentLoading && inView) || (isScorecardLoading && inView) || (isCoachingLoading && inView);

  const sentimentData = React.useMemo(() => {
    const raw = rawSentiment?.data || [];
    if (!raw.length) return null;
    return { data: raw.map(v => ({ ...v, time: `${v.index}:00` })) };
  }, [rawSentiment]);

  const scorecardData = React.useMemo(() => {
    const rawAgent = rawScorecard?.data?.agent || [];
    const rawTeam = rawScorecard?.data?.team_average || [];
    if (!rawAgent.length) return null;
    const combined = rawAgent.map(a => ({
      dimension: a.dimension,
      agent: a.score,
      team: rawTeam.find(t => t.dimension === a.dimension)?.score || 0
    }));
    return { data: combined };
  }, [rawScorecard]);

  const coachingData = rawCoaching?.data || null;

  return (
    <section id="demo" ref={ref} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="heading-lg gradient-text mb-4">See It in Action</h2>
          <p className="text-text-muted text-lg">Real analysis output from CallPulse AI — live data when backend is connected</p>
        </div>

        <GlassCard className="p-6" hover={false}>
          {/* Tab bar */}
          <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active ? 'bg-primary/15 text-primary border border-primary/30' : 'text-text-muted hover:text-text-primary hover:bg-white/5',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <div key={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={36} className="animate-spin text-primary" />
                </div>
              ) : activeTab === 'sentiment' ? (
                <SentimentTimeline data={sentimentData?.data} />
              ) : activeTab === 'scorecard' ? (
                <ScorecardRadar data={scorecardData?.data} />
              ) : (
                coachingData ? (
                  <div className="space-y-6">
                    <p className="text-text-muted text-sm leading-relaxed bg-white/3 rounded-xl p-4">
                      {coachingData.summary}
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-success font-syne font-semibold text-sm mb-3 flex items-center gap-2">
                          <CheckCircle2 size={14} /> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(coachingData.strengths || []).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                              <CheckCircle2 size={13} className="text-success mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-syne font-semibold text-sm mb-3 flex items-center gap-2">
                          <TrendingUp size={14} /> Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                          {(coachingData.improvements || []).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                              <TrendingUp size={13} className="text-primary mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-accent font-syne font-semibold text-sm mb-3">Action Items</h4>
                      <ol className="space-y-2">
                        {(coachingData.actions || []).map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                            <ArrowRight size={13} className="text-accent mt-0.5 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-72 flex items-center justify-center text-text-muted text-sm">
                    Coaching insights are not available yet.
                  </div>
                )
              )}
            </div>
          </AnimatePresence>
        </GlassCard>
      </div>
    </section>
  );
});
