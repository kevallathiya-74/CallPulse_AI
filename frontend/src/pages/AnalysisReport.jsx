import React, { useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import {
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ArrowLeft,
  Trash2,
  Copy,
  Heart,
  BookOpen,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useReportService } from '../services/reportService';
import { formatScore, getScoreColor } from '../utils/formatScore';
import { formatStatusLabel, getStatusClasses } from '../utils/formatStatus';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import SentimentTimeline from '../components/charts/SentimentTimeline';
import ScorecardRadar from '../components/charts/ScorecardRadar';
import ReportSkeleton from '../components/skeletons/ReportSkeleton';
import { useToast } from '../hooks/useToast';
import { toUserFriendlyMessage } from '../utils/userFriendlyMessage';

const DIMENSION_MAP = [
  { label: 'Sentiment Arc', field: 'sentiment_avg', icon: TrendingUp },
  { label: 'Tone & Empathy', field: 'empathy_score', icon: Heart },
  { label: 'Clarity Score', field: 'clarity_score', icon: BookOpen },
  { label: 'Script Compliance', field: 'compliance_score', icon: ShieldCheck },
  { label: 'Resolution Quality', field: 'resolution_quality', icon: CheckCircle2 },
  { label: 'Professional Language', field: 'language_score', icon: MessageSquare },
];

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, num));
};

const getToneLabelFromScore = (score) => {
  const val = Number(score);
  if (!Number.isFinite(val)) return 'Neutral';
  if (val >= 80) return 'Empathetic';
  if (val >= 60) return 'Professional';
  if (val >= 40) return 'Neutral';
  return 'Needs Empathy';
};

const formatEntityId = (value) => {
  if (!value) return 'Unknown';
  const raw = String(value);
  if (raw.length <= 18) return raw;
  return `${raw.slice(0, 8)}...${raw.slice(-8)}`;
};

const cleanAgentName = (name) => {
  if (!name) return 'Unknown';
  const raw = String(name).trim();
  const cleaned = raw.replace(/\s*[-|]\s*call\s*id\s*[:=].*$/i, '').trim();
  return cleaned || raw;
};

const getDimensionScores = (report) => {
  const sentimentArc = Array.isArray(report?.sentiment_arc) ? report.sentiment_arc : [];
  const sentimentAvg = sentimentArc.length
    ? sentimentArc.reduce((sum, val) => sum + Number(val || 0), 0) / sentimentArc.length
    : null;

  const empathy = Number(report?.tone_labels?.empathy_score);

  return {
    sentiment_arc: Number.isFinite(sentimentAvg) ? clampScore(Math.round(sentimentAvg * 10) / 10) : null,
    'tone_&_empathy': Number.isFinite(empathy) ? clampScore(empathy) : null,
    clarity_score: clampScore(report?.clarity_score),
    script_compliance: clampScore(report?.compliance_score),
    resolution_quality: clampScore(report?.resolution_quality),
    professional_language: clampScore(report?.language_score),
  };
};

const normalizeStatus = (report, overallScore) => {
  if (report?.status) return report.status;
  if (!Number.isFinite(overallScore)) return 'pending';
  if (overallScore >= 80) return 'compliant';
  if (overallScore >= 60) return 'at_risk';
  return 'flagged';
};

const buildSentimentTimeline = (report) => {
  const points = Array.isArray(report?.sentiment_scores) ? report.sentiment_scores : [];
  if (points.length > 0) {
    return points.map((point, idx) => {
      const pointIndex = Number.isFinite(Number(point?.index)) ? Number(point.index) : idx + 1;
      return {
        x: idx + 1,
        time: String(pointIndex),
        segmentLabel: typeof point?.label === 'string' ? point.label : '',
        score: clampScore(point?.score) ?? 0,
      };
    });
  }

  const arc = Array.isArray(report?.sentiment_arc) ? report.sentiment_arc : [];
  return arc.map((score, idx) => ({
    x: idx + 1,
    time: String(idx + 1),
    segmentLabel: '',
    score: clampScore(score) ?? 0,
  }));
};

const buildRadarData = (dimensionScores) => {
  return DIMENSION_MAP.map(({ label, field }) => {
    const byField = clampScore(dimensionScores?.[field]);
    const fallbackMap = {
      sentiment_avg: dimensionScores?.sentiment_arc,
      empathy_score: dimensionScores?.['tone_&_empathy'],
    };
    const mappedScore = clampScore(fallbackMap[field]);
    const agentScore = byField ?? mappedScore;
    return {
      dimension: label,
      agent: Number.isFinite(agentScore) ? clampScore(Math.round(agentScore * 10) / 10) : null,
    };
  });
};

const resolveDimensionScore = (report, dimensionScores, field) => {
  const direct = clampScore(report?.[field]);
  if (direct != null) return direct;

  if (field === 'sentiment_avg') {
    return clampScore(dimensionScores?.sentiment_arc);
  }
  if (field === 'empathy_score') {
    return clampScore(dimensionScores?.['tone_&_empathy']);
  }
  return null;
};

const normalizeCoaching = (rawCoaching) => {
  if (!rawCoaching || typeof rawCoaching !== 'object') return null;

  const summary = typeof rawCoaching.summary === 'string' ? rawCoaching.summary.trim() : '';
  const strengths = Array.isArray(rawCoaching.strengths)
    ? rawCoaching.strengths.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const improvements = Array.isArray(rawCoaching.improvements)
    ? rawCoaching.improvements.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  const isFallbackSummary = /endpoint unavailable|could not be generated|not available yet|generation failed/i.test(summary);
  const fallbackStrengths = ['clear communication attempt'];
  const fallbackImprovements = ['review standard procedures'];
  const normalizedStrengths = strengths.map((item) => item.toLowerCase());
  const normalizedImprovements = improvements.map((item) => item.toLowerCase());
  const isFallbackList =
    normalizedStrengths.length === fallbackStrengths.length
    && normalizedImprovements.length === fallbackImprovements.length
    && normalizedStrengths.every((item, idx) => item === fallbackStrengths[idx])
    && normalizedImprovements.every((item, idx) => item === fallbackImprovements[idx]);
  const hasStructuredInsights = strengths.length > 0 || improvements.length > 0;

  if (isFallbackSummary || isFallbackList || (!hasStructuredInsights && !summary)) {
    return null;
  }

  return {
    summary: summary || 'No summary provided.',
    strengths,
    improvements,
  };
};

export default function AnalysisReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const reportRef = useRef();
  const reportService = useReportService();

  const { data: rawReport, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.REPORT(id),
    queryFn: () => reportService.getReport(id),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const report = rawReport?.data || rawReport;
  const overallScore = Number.isFinite(Number(report?.composite_score))
    ? clampScore(report.composite_score)
    : Number.isFinite(Number(report?.overall_score))
      ? clampScore(report.overall_score)
      : null;
  const dimensionScores = report?.dimension_scores || getDimensionScores(report);
  const status = normalizeStatus(report, overallScore);
  const sentimentData = buildSentimentTimeline(report);
  const radarData = buildRadarData(dimensionScores);
  const coaching = normalizeCoaching(report?.coaching || report?.llm_summary);
  const recoveryIndex = report?.llm_summary?.recovery_index;
  const recoveryTime = recoveryIndex != null ? Number(recoveryIndex) + 1 : null;
  const agentLabel = cleanAgentName(report?.agent_name);
  const callIdFull = report?.call_id || id;
  const callIdShort = formatEntityId(callIdFull);
  const reportIdShort = formatEntityId(id);
  const generatedAtLabel = report?.created_at
    ? new Date(report.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    : null;

  const deleteMutation = useMutation({
    mutationFn: () => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORT(id) });
      toast.success('Report deleted successfully');
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(toUserFriendlyMessage(err?.message, {
        status: err?.status,
        fallback: 'We could not delete the report right now. Please try again.',
      }));
    },
  });

  const handleExportPDF = async () => {
    const tid = toast.loading('Generating PDF...');
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let y = 18;

      const ensureSpace = (needed = 16) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const lineText = (text, x, yy, options = {}) => {
        pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
        pdf.setFontSize(options.size || 10);
        pdf.setTextColor(options.color || 20, options.colorG || 30, options.colorB || 42);
        pdf.text(String(text ?? '—'), x, yy, { maxWidth: options.maxWidth || pageW - margin * 2 });
      };

      // Header
      pdf.setFillColor(8, 16, 30);
      pdf.roundedRect(margin, y - 8, pageW - margin * 2, 26, 3, 3, 'F');
      lineText('CallPulse AI - Analysis Report', margin + 4, y, { size: 14, bold: true, color: 238, colorG: 245, colorB: 255 });
      lineText(`Report ID: ${id}`, margin + 4, y + 7, { size: 9, color: 190, colorG: 206, colorB: 226 });
      lineText(`Generated: ${new Date().toLocaleString('en-IN')}`, margin + 4, y + 13, { size: 9, color: 190, colorG: 206, colorB: 226 });
      y += 26;

      // Summary
      ensureSpace(24);
      lineText('Executive Summary', margin, y, { size: 12, bold: true });
      y += 6;
      pdf.setDrawColor(220, 230, 245);
      pdf.roundedRect(margin, y, pageW - margin * 2, 16, 2, 2);
      lineText(`Agent: ${report?.agent_name || '—'}`, margin + 3, y + 6, { size: 10 });
      lineText(`Call ID: ${report?.call_id || id}`, margin + 3, y + 12, { size: 10 });
      lineText(`Overall Score: ${formatScore(overallScore, 'outof')}`, pageW / 2 + 8, y + 6, { size: 10, bold: true });
      lineText(`Status: ${formatStatusLabel(status)}`, pageW / 2 + 8, y + 12, { size: 10 });
      y += 22;

      // Dimension table
      ensureSpace(40);
      lineText('Dimension Scores', margin, y, { size: 12, bold: true });
      y += 7;
      const dims = [
        ['Sentiment Arc', dimensionScores?.sentiment_arc],
        ['Tone & Empathy', dimensionScores?.['tone_&_empathy']],
        ['Clarity Score', dimensionScores?.clarity_score],
        ['Script Compliance', dimensionScores?.script_compliance],
        ['Resolution Quality', dimensionScores?.resolution_quality],
        ['Professional Language', dimensionScores?.professional_language],
      ];

      dims.forEach(([label, value], idx) => {
        ensureSpace(8);
        if (idx % 2 === 0) {
          pdf.setFillColor(248, 251, 255);
          pdf.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
        }
        lineText(label, margin + 2, y, { size: 10 });
        lineText(formatScore(value, 'plain'), pageW - margin - 2, y, { size: 10, bold: true, maxWidth: 24 });
        y += 7;
      });

      // Coaching
      if (coaching) {
        ensureSpace(32);
        y += 2;
        lineText('Coaching Insights', margin, y, { size: 12, bold: true });
        y += 6;

        const summaryLines = pdf.splitTextToSize(coaching.summary || '—', pageW - margin * 2);
        ensureSpace(summaryLines.length * 5 + 4);
        lineText(summaryLines, margin, y, { size: 10 });
        y += summaryLines.length * 5 + 2;

        const writeBullets = (title, items = []) => {
          ensureSpace(10);
          lineText(title, margin, y, { size: 10, bold: true });
          y += 5;
          if (!items.length) {
            lineText('- —', margin + 2, y, { size: 9 });
            y += 5;
            return;
          }
          items.forEach((item) => {
            const lines = pdf.splitTextToSize(`- ${item}`, pageW - margin * 2 - 2);
            ensureSpace(lines.length * 5);
            lineText(lines, margin + 2, y, { size: 9 });
            y += lines.length * 5;
          });
        };

        writeBullets('Strengths', coaching.strengths || []);
        writeBullets('Areas to Improve', coaching.improvements || []);
      }

      // Footer on final page
      pdf.setFontSize(8);
      pdf.setTextColor(120, 130, 145);
      pdf.text('Generated by CallPulse AI', margin, pageH - 8);

      pdf.save(`CallPulse-Report-${id}.pdf`);
      toast.dismiss(tid);
      toast.success('Report exported as PDF');
    } catch {
      toast.dismiss(tid);
      toast.error('PDF export failed — try again');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Report link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Delete this report? This action cannot be undone.');
    if (!ok) return;
    deleteMutation.mutate();
  };

  const handleCopyCallId = async () => {
    try {
      await navigator.clipboard.writeText(String(callIdFull));
      toast.success('Call ID copied');
    } catch {
      toast.error('Could not copy Call ID');
    }
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!report) {
    return (
      <PageWrapper hideFooter>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <XCircle size={48} className="text-error mx-auto mb-4" />
          <h2 className="heading-md text-text-primary mb-2">Report Not Found</h2>
          <p className="text-text-muted mb-6">This report may have been deleted or the link is invalid.</p>
          <Link to="/dashboard"><Button icon={<ArrowLeft size={16} />} variant="secondary">Back to Dashboard</Button></Link>
        </div>
      </PageWrapper>
    );
  }

  const sc = getStatusClasses(status);

  return (
    <PageWrapper hideFooter>
      <div ref={reportRef} className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
          <div>
            <Link to="/dashboard" className="flex items-center gap-1 text-text-muted hover:text-primary text-sm mb-3 transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 className="heading-md text-text-primary">Analysis Report</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border-default/70 bg-surface/50 px-2.5 py-1 text-text-secondary font-mono" title={String(id)}>
                Report: {reportIdShort}
              </span>
              {generatedAtLabel ? (
                <span className="rounded-full border border-border-default/60 bg-surface/30 px-2.5 py-1 text-text-muted">
                  Generated: {generatedAtLabel}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${sc.bg} ${sc.text} ${sc.border}`}>
              {status === 'compliant' ? <CheckCircle2 size={14} /> : status === 'flagged' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
              {formatStatusLabel(status)}
            </span>
            <Button variant="ghost" size="sm" icon={<Share2 size={14} />} onClick={handleShare}>Share</Button>
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete} loading={deleteMutation.isPending}>Delete</Button>
            <Button size="sm" icon={<Download size={14} />} onClick={handleExportPDF}>Export PDF</Button>
          </div>
        </div>

        {/* Overall score */}
        <GlassCard className="p-6 mb-6 text-center bg-gradient-to-b from-white/[0.05] to-transparent" hover={false}>
          <p className="text-text-muted text-sm mb-2">Overall Quality Score</p>
          {overallScore != null ? (
            <p className={`text-5xl md:text-6xl font-syne font-bold tracking-tight ${getScoreColor(overallScore ?? 0)}`}>
              {formatScore(overallScore, 'outof')}
            </p>
          ) : (
            <p className="text-text-muted text-2xl font-syne font-semibold">Pending</p>
          )}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-border-default/60 bg-surface/40 px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <p className="text-xs uppercase tracking-wide text-text-muted leading-none">Agent</p>
              <p className="text-sm font-medium text-text-primary truncate leading-tight" title={agentLabel}>{agentLabel}</p>
            </div>
            <div className="rounded-xl border border-border-default/60 bg-surface/40 px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <p className="text-xs uppercase tracking-wide text-text-muted leading-none">Call ID</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono font-medium text-text-primary tracking-wide truncate leading-tight" title={String(callIdFull)}>{callIdShort}</p>
                <button
                  type="button"
                  onClick={handleCopyCallId}
                  className="inline-flex items-center gap-1 rounded-md border border-border-default/70 px-2 py-1 text-[11px] font-medium text-text-secondary hover:text-primary hover:border-primary/60 transition-colors flex-shrink-0"
                  title="Copy full Call ID"
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dimension scores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {DIMENSION_MAP.map(({ label, field, icon }) => {
            const score = resolveDimensionScore(report, dimensionScores, field);
            const toneLabel =
              report?.tone_labels?.dominant_tone
              || report?.tone_label
              || getToneLabelFromScore(score);
            return (
              <GlassCard key={label} className="p-4 text-center bg-white/[0.02]" hover={false}>
                {React.createElement(icon, { size: 18, className: `mx-auto mb-2 ${getScoreColor(score ?? 0)}` })}
                {label === 'Tone & Empathy' ? (
                  <>
                    <p className={`text-lg font-syne font-bold ${getScoreColor(score ?? 0)}`}>
                      {score != null ? toneLabel : '—'}
                    </p>
                    <p className="text-text-muted text-[11px] mt-1">
                      {score != null ? `${Math.round(score)} / 100` : ''}
                    </p>
                  </>
                ) : (
                  <p className={`text-2xl font-syne font-bold ${getScoreColor(score ?? 0)}`}>
                    {score != null ? `${Math.round(score)} / 100` : '—'}
                  </p>
                )}
                <p className="text-text-muted text-xs mt-1">{label}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GlassCard className="p-6 bg-white/[0.02]" hover={false}>
            <h3 className="font-syne font-semibold text-text-primary mb-4">Sentiment Timeline</h3>
            <SentimentTimeline data={sentimentData} recoveryTime={recoveryTime} />
          </GlassCard>
          <GlassCard className="p-6 bg-white/[0.02]" hover={false}>
            <h3 className="font-syne font-semibold text-text-primary mb-4">Dimension Scorecard</h3>
            <ScorecardRadar data={radarData} />
          </GlassCard>
        </div>

        {/* Coaching panel */}
        {coaching && (
          <GlassCard className="p-6 bg-gradient-to-b from-cyan-400/[0.06] to-transparent" hover={false}>
            <h3 className="font-syne font-semibold text-text-primary mb-4">Coaching Insights</h3>
            <p className="text-text-muted text-sm mb-4 leading-relaxed">{coaching.summary}</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-success font-semibold text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={14} /> Strengths</h4>
                <ul className="space-y-1">
                  {(coaching.strengths || []).map((s, i) => (
                    <li key={i} className="text-text-muted text-sm flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success mt-1 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-primary font-semibold text-sm mb-2 flex items-center gap-2"><TrendingUp size={14} /> Areas to Improve</h4>
                <ul className="space-y-1">
                  {(coaching.improvements || []).map((s, i) => (
                    <li key={i} className="text-text-muted text-sm flex items-start gap-2">
                      <TrendingUp size={12} className="text-primary mt-1 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
}
