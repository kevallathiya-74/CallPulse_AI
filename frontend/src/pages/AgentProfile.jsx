import { motion } from 'framer-motion';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  ShieldCheck,
  XCircle,
  Heart,
  BookOpen,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { useAgentService } from '../services/agentService';
import { formatScore, getScoreColor } from '../utils/formatScore';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import AgentBarChart from '../components/charts/AgentBarChart';
import Button from '../components/ui/Button';
import AgentProfileSkeleton from '../components/skeletons/AgentProfileSkeleton';

const DIMENSIONS = [
  'Sentiment Arc', 'Tone & Empathy', 'Clarity Score',
  'Script Compliance', 'Resolution Quality', 'Professional Language',
];

const DIMENSION_ICONS = {
  'Sentiment Arc': TrendingUp,
  'Tone & Empathy': Heart,
  'Clarity Score': BookOpen,
  'Script Compliance': ShieldCheck,
  'Resolution Quality': CheckCircle2,
  'Professional Language': MessageSquare,
};

const getToneLabelFromScore = (score) => {
  const val = Number(score);
  if (!Number.isFinite(val)) return 'Neutral';
  if (val >= 80) return 'Empathetic';
  if (val >= 60) return 'Professional';
  if (val >= 40) return 'Neutral';
  return 'Needs Empathy';
};

export default function AgentProfile() {
  const { id } = useParams();
  const agentService = useAgentService();

  const { data: rawAgent, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.AGENT(id),
    queryFn: () => agentService.getAgent(id),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const agent = rawAgent?.data || rawAgent;
  const complianceDisplay = agent?.compliance_pct != null
    ? agent.compliance_pct
    : agent?.dimension_averages?.compliance;
  const trendData = React.useMemo(
    () => (Array.isArray(agent?.trend) ? agent.trend : [])
      .map((score, idx) => ({ name: `Call ${idx + 1}`, score: Number(score || 0) })),
    [agent?.trend],
  );

  if (loading) {
    return <AgentProfileSkeleton />;
  }

  if (!agent) {
    return (
      <PageWrapper hideFooter>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <XCircle size={48} className="text-error mx-auto mb-4" />
          <h2 className="heading-md text-text-primary mb-2">Agent Not Found</h2>
          <p className="text-text-muted mb-6">This agent profile does not exist or was removed.</p>
          <Link to="/agents"><Button icon={<ArrowLeft size={16} />} variant="secondary">Back to Agents</Button></Link>
        </div>
      </PageWrapper>
    );
  }


  return (
    <PageWrapper hideFooter>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link to="/agents" className="flex items-center gap-1 text-text-muted hover:text-primary text-sm mb-6 transition-colors inline-flex">
          <ArrowLeft size={14} /> All Agents
        </Link>

        {/* Agent header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard className="p-6 mb-6" hover={false}>
            <div className="flex items-start gap-5 flex-wrap">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#10b981] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <span className="text-white font-syne font-bold text-xl drop-shadow-sm">
                  {(agent.name || 'A').slice(0, 1)}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="heading-md text-text-primary">{agent.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> Joined: {agent.created_at ? new Date(agent.created_at).toLocaleDateString('en-IN') : '—'}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-success" /> Compliance: {complianceDisplay != null ? `${complianceDisplay}%` : '—'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-syne font-bold ${getScoreColor(agent.avg_score)}`}>{formatScore(agent.avg_score)}</p>
                <p className="text-text-muted text-xs mt-1">Average Score</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Performance trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="font-syne font-semibold text-text-primary mb-4">Performance Trend</h2>
            {trendData.length > 0 ? (
              <AgentBarChart data={trendData} />
            ) : (
              <div className="text-center py-8 text-text-muted text-sm">
                No trend data yet — scores will appear after call analysis is complete.
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Dimension scores */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="font-syne font-semibold text-text-primary mb-4">6 Dimension Scores</h2>
            {agent.dimension_averages && Object.keys(agent.dimension_averages).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {DIMENSIONS.map((dim) => {
                  const backendKey = {
                    'Sentiment Arc': 'sentiment_arc',
                    'Tone & Empathy': 'tone_&_empathy',
                    'Clarity Score': 'clarity',
                    'Script Compliance': 'compliance',
                    'Resolution Quality': 'resolution',
                    'Professional Language': 'professional_language',
                  }[dim];
                  const Icon = DIMENSION_ICONS[dim] || TrendingUp;
                  const score = backendKey ? agent.dimension_averages?.[backendKey] : null;
                  const toneLabel =
                    agent?.dimension_averages?.tone_label
                    || agent?.tone_labels?.dominant_tone
                    || agent?.dominant_tone
                    || getToneLabelFromScore(score);
                  return (
                    <div
                      key={dim}
                      className={[
                        'rounded-3xl p-5 text-center border transition-colors',
                        'bg-gradient-to-b from-[#031329] to-[#041026] border-cyan-400/25',
                        'hover:border-cyan-300/45 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]',
                        dim === 'Tone & Empathy' ? 'from-[#07162f] to-[#051126] border-pink-400/30' : '',
                      ].join(' ')}
                    >
                      <div className="mb-3 flex justify-center">
                        <Icon
                          size={18}
                          className={dim === 'Tone & Empathy' ? 'text-pink-300' : 'text-cyan-300'}
                        />
                      </div>
                      {dim === 'Tone & Empathy' ? (
                        <>
                          <p className={`text-4xl leading-none font-syne font-bold ${score != null ? getScoreColor(score) : 'text-text-muted'}`}>
                            {score != null ? toneLabel : '—'}
                          </p>
                          <p className="text-text-muted text-lg mt-2 font-syne font-bold">
                            {score != null ? `${score} / 100` : ''}
                          </p>
                        </>
                      ) : (
                        <p className={`text-4xl leading-none font-syne font-bold ${score != null ? getScoreColor(score) : 'text-text-muted'}`}>
                          {score != null ? `${score} / 100` : '—'}
                        </p>
                      )}
                      <p className="text-text-muted text-base mt-2">{dim}</p>
                      {score != null && (
                        <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#7b2fff]" style={{ width: `${score}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted text-sm">
                No dimension scores yet — they will appear after at least one call is analyzed for this agent.
              </div>
            )}
          </GlassCard>
        </motion.div>


        {/* Coaching history */}
        {(agent.coaching_history || []).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <GlassCard className="p-6" hover={false}>
              <h2 className="font-syne font-semibold text-text-primary mb-4">Coaching History</h2>
              <ul className="space-y-3">
                {agent.coaching_history.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{item.title}</p>
                      <p className="text-text-muted text-xs mt-0.5">{item.date ? new Date(item.date).toLocaleDateString('en-IN') : ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
