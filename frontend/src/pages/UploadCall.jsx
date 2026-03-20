import { motion } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, File, X, Zap, Users } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAgentService } from '../services/agentService';
import { useToast } from '../hooks/useToast';
import { uploadSchema, validate } from '../utils/validators';
import { CAMPAIGN_TYPES } from '../constants/uiLabels';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import useAnalysisStore from '../store/analysisStore';

export default function UploadCall() {
  const { uploadAndAnalyze } = useAnalysis();
  const agentService = useAgentService();
  
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents-list-upload'],
    queryFn: () => agentService.listAgents({ per_page: 100 }),
  });
  const agents = agentsData?.items || agentsData?.data?.items || (Array.isArray(agentsData) ? agentsData : []);
  const hasAgents = agents.length > 0;

  const toast = useToast();
  const navigate = useNavigate();
  const uploadProgress = useAnalysisStore(s => s.uploadProgress);
  const setUploadProgress = useAnalysisStore(s => s.setUploadProgress);
  const fileInputRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const [form, setForm] = useState({ agentId: '', campaignType: '', file: null });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastCompletedSeconds, setLastCompletedSeconds] = useState(null);

  const formatElapsed = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startElapsedTimer = () => {
    const startTime = Date.now();
    setElapsedSeconds(0);
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }
    elapsedTimerRef.current = setInterval(() => {
      const nextSeconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(nextSeconds);
    }, 1000);
  };

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  useEffect(() => () => stopElapsedTimer(), []);

  const handleFile = (file) => {
    setForm((f) => ({ ...f, file }));
    setErrors((e) => ({ ...e, file: undefined }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success, errors: valErrors } = validate(uploadSchema, form);
    if (!success) { setErrors(valErrors); return; }

    setLoading(true);
    setUploadProgress(0);
    setLastCompletedSeconds(null);
    startElapsedTimer();
    const startedAt = Date.now();

    const fd = new FormData();
    fd.append('file', form.file);
    fd.append('agent_id', form.agentId);
    if (form.campaignType) {
      fd.append('campaign_type', form.campaignType);
    }

    const result = await uploadAndAnalyze(fd, (p) => setUploadProgress(p));
    const backendDurationMs = Number(result?.data?.processing_time_ms);
    const durationSeconds = Number.isFinite(backendDurationMs) && backendDurationMs > 0
      ? Math.max(1, Math.floor(backendDurationMs / 1000))
      : Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    setLastCompletedSeconds(durationSeconds);
    stopElapsedTimer();
    setLoading(false);

    if (result.success) {
      const targetId = result.data?.report_id || result.data?.call_id || result.data?.id;
      if (!targetId) {
        toast.error('Analysis finished but report id is missing. Please open it from Dashboard.');
        return;
      }
      toast.success(`Analysis complete in ${formatElapsed(durationSeconds)}. Redirecting to report...`);
      navigate(`/report/${targetId}`);
    } else {
      toast.error(result.error || 'Failed to analyze call. Please review the inputs and try again.');
    }
  };

  return (
    <PageWrapper hideFooter>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 surface-chip text-xs font-medium">
              <Upload size={13} className="text-cyan-300" />
              AI Ingestion Pipeline
            </div>
            <h1 className="heading-md text-text-primary mb-2">Upload Call for Analysis</h1>
            <p className="text-text-muted">Drop an audio recording or paste a transcript — AI will score it in under 8 seconds</p>
          </div>

          <GlassCard className="p-8 bg-gradient-to-b from-white/[0.05] to-transparent" hover={false}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              {/* Drop zone */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Call File</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={[
                    'border-2 border-dashed rounded-card p-10 text-center cursor-pointer transition-all',
                    dragging ? 'border-primary bg-primary/7' : 'border-white/10 hover:border-primary/45 hover:bg-white/5',
                    errors.file ? 'border-error/40' : '',
                  ].join(' ')}
                >
                  <input
                    ref={fileInputRef}
                    id="callFile"
                    name="callFile"
                    type="file"
                    accept=".mp3,.wav,.m4a,.txt,audio/mpeg,audio/wav,audio/x-m4a,text/plain"
                    className="hidden"
                    onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                  />
                  {form.file ? (
                    <div className="flex items-center justify-center gap-3">
                      <File size={24} className="text-primary" />
                      <div className="text-left">
                        <p className="text-text-primary text-sm font-medium">{form.file.name}</p>
                        <p className="text-text-muted text-xs">{(form.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, file: null })); }}
                        className="text-error hover:text-error">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#7b2fff]/10 border border-[#00d4ff]/20 flex items-center justify-center mx-auto mb-4">
                        <Upload size={28} className="text-[#00d4ff]" />
                      </div>
                      <p className="text-text-primary text-sm font-semibold mb-1">Drop your file here or click to browse</p>
                      <p className="text-text-muted text-xs">Supported: .mp3, .wav, .m4a, .txt · Max 50MB</p>
                    </>
                  )}
                </div>
                {errors.file && <p className="text-error text-xs mt-1">{errors.file}</p>}
              </div>

              {/* Agent ID */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5" htmlFor="agentId">Select Agent</label>
                <select
                  id="agentId"
                  name="agentId"
                  value={form.agentId}
                  onChange={(e) => { setForm((f) => ({ ...f, agentId: e.target.value })); setErrors((e2) => ({ ...e2, agentId: undefined })); }}
                  disabled={!hasAgents || agentsLoading}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-text-primary text-sm outline-none transition-colors ${errors.agentId ? 'border-error/60' : 'border-white/15 focus:border-primary/60'}`}
                >
                  <option className="bg-slate-900 text-white" value="" disabled>{agentsLoading ? 'Loading agents...' : hasAgents ? 'Select an assigned agent...' : 'No agents available'}</option>
                  {agents.map((a) => (
                    <option className="bg-slate-900 text-white" key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.agentId && <p className="text-error text-xs mt-1">{errors.agentId}</p>}
                {!agentsLoading && !hasAgents && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-3 py-2">
                    <p className="text-xs text-warning">Create an agent first to start analyzing calls.</p>
                    <Link to="/agents">
                      <Button size="sm" variant="secondary" icon={<Users size={14} />}>
                        Add Agent
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Campaign type */}
              <div>
                <label className="block text-sm text-text-muted mb-1.5" htmlFor="campaignType">Campaign Type</label>
                <select
                  id="campaignType"
                  name="campaignType"
                  value={form.campaignType}
                  onChange={(e) => { setForm((f) => ({ ...f, campaignType: e.target.value })); setErrors((e2) => ({ ...e2, campaignType: undefined })); }}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-text-primary text-sm outline-none transition-colors ${errors.campaignType ? 'border-error/60' : 'border-white/15 focus:border-primary/60'}`}
                >
                  <option className="bg-slate-900 text-white" value="">Select campaign type (optional)...</option>
                  {CAMPAIGN_TYPES.map((c) => (
                    <option className="bg-slate-900 text-white" key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.campaignType && <p className="text-error text-xs mt-1">{errors.campaignType}</p>}
              </div>

              {/* Progress bar */}
              {loading && (
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Uploading & analyzing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress || 5}%` }} /></div>
                  <p className="text-xs text-text-muted mt-1">
                    Real time elapsed: {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
              )}

              {!loading && lastCompletedSeconds != null && (
                <p className="text-xs text-success mt-1">
                  Last completed analysis time: {formatElapsed(lastCompletedSeconds)}
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={loading || !form.file || !form.agentId || !hasAgents}
                icon={<Zap size={16} />}
                className="mt-2"
              >
                Analyze Call
              </Button>
              {(!form.file || !form.agentId) && (
                <p className="text-xs text-text-muted mt-1">
                  Select a call file and agent to enable analysis.
                </p>
              )}
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
