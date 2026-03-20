import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Upload, TrendingUp, ShieldCheck, Users, CheckCircle2, XCircle, Loader2, Activity,
} from 'lucide-react';
import { useReportService } from '../services/reportService';
import { formatScore, getScoreColor } from '../utils/formatScore';
import { formatStatusLabel, getStatusClasses } from '../utils/formatStatus';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { QUERY_KEYS } from '../constants/queryKeys';
import QualityScoreTrend from '../components/charts/QualityScoreTrend';

const formatCallId = (id) => {
  if (!id) return '—';
  const value = String(id);
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
};

export default function Dashboard() {
  const reportService = useReportService();
  const getDashboardSummary = React.useCallback(() => reportService.getDashboardSummary(), [reportService]);
  const getLeaderboard = React.useCallback(() => reportService.getLeaderboard({ limit: 5 }), [reportService]);
  const getHealth = React.useCallback(() => reportService.getHealth(), [reportService]);

  const { data: summaryRes, isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_SUMMARY],
    queryFn: getDashboardSummary,
    staleTime: 30000,
  });
  const summary = summaryRes?.data || summaryRes;

  const { data: leaderboardRes } = useQuery({
    queryKey: QUERY_KEYS.LEADERBOARD('month'),
    queryFn: getLeaderboard,
    staleTime: 30000,
  });
  const leaderboard = leaderboardRes?.data || leaderboardRes;

  const { data: healthRes, isError: healthError } = useQuery({
    queryKey: [QUERY_KEYS.HEALTH],
    queryFn: getHealth,
    refetchInterval: 30000,
    retry: false,
  });
  const healthData = healthRes?.data?.status || healthRes?.status;
  const health = healthError ? 'error' : (healthData || 'loading');

  const SUMMARY_CARDS = React.useMemo(() => [
    { label: 'Total Calls Analyzed', value: (summary?.total_calls ?? summary?.total_calls_today)?.toLocaleString('en-IN'), subtitle: summary?.total_calls_today != null ? `+${summary.total_calls_today} today` : '', icon: Activity, iconColor: '#00d4ff', gradient: 'from-[#00d4ff]/20 to-[#00d4ff]/5', borderColor: 'border-l-[#00d4ff]' },
    { label: 'Average Score', value: (summary?.avg_score ?? summary?.avg_score_today) != null ? formatScore(summary?.avg_score ?? summary?.avg_score_today) : '—', subtitle: 'Global Average', subtitleColor: summary?.avg_score != null ? getScoreColor(summary.avg_score) : '', icon: TrendingUp, iconColor: '#7b2fff', gradient: 'from-[#7b2fff]/20 to-[#7b2fff]/5', borderColor: 'border-l-[#7b2fff]' },
    { label: 'Compliance Rate', value: summary?.compliance_rate != null ? `${summary.compliance_rate}%` : '—', subtitle: 'Target: 95%', icon: ShieldCheck, iconColor: '#00e676', gradient: 'from-[#00e676]/20 to-[#00e676]/5', borderColor: 'border-l-[#00e676]' },
    { label: 'Top Agent', value: summary?.top_agent ? (typeof summary.top_agent === 'string' ? summary.top_agent : summary.top_agent.name) : '—', subtitle: summary?.top_agent?.score != null ? `Score: ${summary.top_agent.score}` : '', icon: Users, iconColor: '#ff6b35', gradient: 'from-[#ff6b35]/20 to-[#ff6b35]/5', borderColor: 'border-l-[#ff6b35]' },
  ], [summary]);

  const recentCalls = React.useMemo(
    () => (summary?.recent_calls || []).map((call) => ({
      ...call,
      createdAtLabel: call.created_at ? new Date(call.created_at).toLocaleDateString('en-IN') : '—',
      durationLabel: Number.isFinite(Number(call.processing_time_ms)) && Number(call.processing_time_ms) > 0
        ? `${String(Math.floor(Number(call.processing_time_ms) / 60000)).padStart(2, '0')}:${String(Math.floor((Number(call.processing_time_ms) % 60000) / 1000)).padStart(2, '0')}`
        : '—',
    })),
    [summary?.recent_calls],
  );

  if (loading && !summary) {
    return <DashboardSkeleton />;
  }

  return (
    <PageWrapper hideFooter>
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 surface-chip text-xs font-medium">
              <LayoutDashboard size={13} className="text-cyan-300" />
              Live QA Operations
            </div>
            <h1 className="text-2xl font-syne font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-muted text-sm">Overview of your QA analytics</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
              {health === 'healthy' || health === 'ok' ? (
                <><span className="w-2 h-2 rounded-full bg-success pulse-dot" /><span className="text-success">AI Engine Online</span></>
              ) : health === 'error' ? (
                <><XCircle size={14} className="text-error" /><span className="text-error">AI Engine Offline</span></>
              ) : (
                <><Loader2 size={14} className="text-primary animate-spin" /><span className="text-text-muted">Checking...</span></>
              )}
            </div>
            <Link to="/upload">
              <Button icon={<Upload size={16} />}>Upload New Call</Button>
            </Link>
          </div>
        </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {SUMMARY_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <GlassCard className={`p-5 border-l-2 ${card.borderColor} bg-gradient-to-b from-white/[0.045] to-transparent`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                          <Icon size={20} style={{ color: card.iconColor }} />
                        </div>
                      </div>
                      <p className="text-2xl font-syne font-bold text-text-primary mb-1">{card.value || '—'}</p>
                      <p className="text-text-muted text-sm">{card.label}</p>
                      {card.subtitle && <p className={`text-xs mt-2 ${card.subtitleColor || 'text-text-muted opacity-70'}`}>{card.subtitle}</p>}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Quality trend + Recent calls */}
            <GlassCard className="p-6 mb-8 bg-gradient-to-b from-white/[0.035] to-transparent" hover={false}>
              <h2 className="font-syne font-semibold text-text-primary mb-4">Quality Score Trend</h2>
              <QualityScoreTrend data={summary?.score_trend || []} />
            </GlassCard>

            {/* Recent calls table */}
            <GlassCard className="p-0 overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent" hover={false}>
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-syne font-semibold text-text-primary">Recent Calls</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Call ID', 'Agent', 'Score', 'Status', 'Time', 'Date'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <Upload size={32} className="mx-auto text-text-muted mb-4 opacity-50" />
                          <h3 className="text-lg font-syne font-semibold text-text-primary mb-1">No calls analyzed yet</h3>
                          <p className="text-sm text-text-muted mb-6">Upload your first call recording to see analytics here</p>
                          <Link to="/upload">
                            <Button size="sm">Upload First Call</Button>
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      recentCalls.map((call, i) => {
                        const sc = getStatusClasses(call.status);
                        return (
                          <tr key={call.id || i} className="border-b border-white/[0.03] hover:bg-cyan-300/[0.04] transition-colors">
                            <td className="px-6 py-4 text-sm">
                              <Link
                                to={`/report/${call.id}`}
                                className="text-primary hover:underline font-mono text-xs"
                                title={call.id}
                              >
                                {formatCallId(call.id)}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-primary">{call.agent_name}</td>
                            <td className={`px-6 py-4 text-sm font-semibold ${getScoreColor(call.score)}`}>
                              {formatScore(call.score)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                                {formatStatusLabel(call.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">
                              {call.durationLabel}
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">
                              {call.createdAtLabel}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
              <GlassCard className="mt-8 p-0 overflow-hidden" hover={false}>
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="font-syne font-semibold text-text-primary">Top 5 Agents</h2>
                  <Link to="/agents" className="text-primary text-sm hover:underline">View All Agents</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Rank', 'Agent', 'Score', 'Calls Analyzed'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((agent) => (
                        <tr key={agent.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm text-text-muted font-mono">#{agent.rank}</td>
                          <td className="px-6 py-4 text-sm text-text-primary font-medium">{agent.name}</td>
                          <td className={`px-6 py-4 text-sm font-bold ${getScoreColor(agent.score)}`}>{formatScore(agent.score)}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{agent.calls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
      </div>
    </PageWrapper>
  );
}
