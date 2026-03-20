import { motion } from 'framer-motion';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, ChevronUp, ChevronDown, Users, Plus } from 'lucide-react';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAgentService } from '../services/agentService';
import { useToast } from '../hooks/useToast';
import { formatScore, getScoreColor } from '../utils/formatScore';
import PageWrapper from '../components/layout/PageWrapper';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import AgentTableSkeleton from '../components/skeletons/AgentTableSkeleton';

const EMPTY_ARRAY = [];

export default function AgentDashboard() {
  const agentService = useAgentService();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const parentRef = useRef(null);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sort, setSort] = useState({ col: 'avg_score', dir: 'desc' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [newAgent, setNewAgent] = useState({ name: '', email: '' });
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: QUERY_KEYS.AGENTS({ search: debouncedSearch, scoreFilter, sort }),
    queryFn: () => agentService.listAgents({ 
      search: debouncedSearch, 
      sort_by: sort.col, 
      sort_dir: sort.dir 
    }),
    staleTime: 60000,
  });

  const agents = rawData?.items
    || rawData?.data?.items
    || rawData?.agents
    || (Array.isArray(rawData) ? rawData : EMPTY_ARRAY);

  const createAgentMutation = useMutation({
    mutationFn: (payload) => agentService.createAgent(payload),
    onSuccess: () => {
      toast.success('Agent created successfully.');
      setNewAgent({ name: '', email: '' });
      setCreateErrors({});
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => {
      const status = error?.status;
      if (status === 409) {
        setCreateErrors((prev) => ({ ...prev, email: 'This email is already used by another agent.' }));
        return;
      }
      if (status === 422) {
        const detailList = error?.raw?.detail;
        if (Array.isArray(detailList)) {
          const fieldErrors = {};
          detailList.forEach((entry) => {
            const loc = Array.isArray(entry?.loc) ? entry.loc : [];
            const fieldName = loc[loc.length - 1];
            if (fieldName === 'name' || fieldName === 'email') {
              fieldErrors[fieldName] = entry?.msg || 'Invalid value';
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setCreateErrors((prev) => ({ ...prev, ...fieldErrors }));
            return;
          }
        }
      }
      toast.error(error?.message || 'Could not create agent. Please try again.');
    },
  });

  const filtered = useMemo(() => {
    let list = agents;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((a) => a.name?.toLowerCase().includes(q));
    }
    if (scoreFilter !== 'all') {
      const [min, max] = scoreFilter.split('-').map(Number);
      list = list.filter((a) => (a.avg_score || 0) >= min && (a.avg_score || 0) <= max);
    }
    list = [...list].sort((a, b) => {
      const av = a[sort.col] ?? '';
      const bv = b[sort.col] ?? '';
      if (sort.dir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
    return list.map((agent) => ({
      ...agent,
      lastActiveLabel: agent.last_active
        ? new Date(agent.last_active).toLocaleDateString('en-IN')
        : '—',
      callsAnalyzedLabel: (agent.calls_analyzed || 0).toLocaleString('en-IN'),
    }));
  }, [agents, debouncedSearch, scoreFilter, sort]);

  const shouldVirtualize = filtered.length >= 50;

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filtered.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const toggleSort = useCallback((col) => {
    setSort((s) => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }));
  }, []);

  const onRowClick = useCallback((agentId) => {
    navigate(`/agents/${agentId}`);
  }, [navigate]);

  const validateCreateForm = useCallback(() => {
    const errors = {};
    const nameValue = newAgent.name.trim();
    if (!nameValue) {
      errors.name = 'Agent name is required.';
    } else if (nameValue.length < 2) {
      errors.name = 'Agent name must be at least 2 characters.';
    } else if (nameValue.length > 100) {
      errors.name = 'Agent name must be at most 100 characters.';
    }

    const emailValue = newAgent.email.trim();
    if (!emailValue) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.email = 'Enter a valid email address.';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newAgent]);

  const handleCreateAgent = useCallback(async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) {
      return;
    }
    await createAgentMutation.mutateAsync({
      name: newAgent.name.trim(),
      email: newAgent.email.trim(),
    });
  }, [createAgentMutation, newAgent, validateCreateForm]);

  if (loading && agents.length === 0) {
    return <AgentTableSkeleton />;
  }

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <ChevronUp size={12} className="opacity-20" />;
    return sort.dir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  const COLS = [
    { key: 'name', label: 'Agent Name' },
    { key: 'calls_analyzed', label: 'Calls Analyzed' },
    { key: 'avg_score', label: 'Avg Score' },
    { key: 'compliance_pct', label: 'Compliance %' },
    { key: 'last_active', label: 'Last Active' },
  ];

  return (
    <PageWrapper hideFooter>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="heading-md text-text-primary">Agent Dashboard</h1>
            <p className="text-text-muted text-sm">Monitor and manage all your agents</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span>{filtered.length} agents</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setCreateErrors({});
              }}
            >
              {showCreateForm ? 'Close' : 'Add Agent'}
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <GlassCard className="p-5 mb-6" hover={false}>
            <h2 className="text-text-primary font-syne font-semibold mb-4">Create New Agent</h2>
            <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-3  gap-3">
              <div>
                <input
                  type="text"
                  value={newAgent.name}
                  placeholder="Agent name"
                  onChange={(e) => {
                    setNewAgent((prev) => ({ ...prev, name: e.target.value }));
                    setCreateErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-text-primary text-sm outline-none transition-colors ${createErrors.name ? 'border-error/60' : 'border-white/10 focus:border-primary/60'}`}
                />
                {createErrors.name && <p className="text-error text-xs mt-1">{createErrors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  value={newAgent.email}
                  placeholder="Email address"
                  onChange={(e) => {
                    setNewAgent((prev) => ({ ...prev, email: e.target.value }));
                    setCreateErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-text-primary text-sm outline-none transition-colors ${createErrors.email ? 'border-error/60' : 'border-white/10 focus:border-primary/60'}`}
                />
                {createErrors.email && <p className="text-error text-xs mt-1">{createErrors.email}</p>}
              </div>
              <Button
                type="submit"
                loading={createAgentMutation.isPending}
                disabled={createAgentMutation.isPending}
                icon={<Plus size={14} />}
              >
                Create Agent
              </Button>
            </form>
          </GlassCard>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="agentSearch"
              name="agentSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              aria-label="Search agents"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-primary placeholder-text-muted text-sm outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select
              id="scoreFilter"
              name="scoreFilter"
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              aria-label="Filter agents by score"
              className="pl-9 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
            >
              <option className="bg-slate-900 text-white" value="all">All Scores</option>
              <option className="bg-slate-900 text-white" value="80-100">High (80–100)</option>
              <option className="bg-slate-900 text-white" value="60-79">Mid (60–79)</option>
              <option className="bg-slate-900 text-white" value="0-59">Low (0–59)</option>
            </select>
          </div>
        </div>

        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="table-scroll">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-6 py-3 text-left text-text-muted text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-muted text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <p>No agents found. Create your first agent to start analyzing calls.</p>
                          {!showCreateForm && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Plus size={14} />}
                              onClick={() => setShowCreateForm(true)}
                            >
                              Add First Agent
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : shouldVirtualize ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div ref={parentRef} className="max-h-[560px] overflow-auto">
                          <div
                            style={{
                              height: `${rowVirtualizer.getTotalSize()}px`,
                              position: 'relative',
                            }}
                          >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                              const agent = filtered[virtualRow.index];
                              return (
                                <div
                                  key={virtualRow.key}
                                  className="absolute left-0 top-0 w-full"
                                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                                >
                                  <div
                                    className="grid grid-cols-5 items-center border-b border-white/3 hover:bg-white/2 transition-colors cursor-pointer group px-6"
                                    style={{ height: `${virtualRow.size}px` }}
                                    onClick={() => onRowClick(agent.id)}
                                  >
                                    <div className="text-sm">
                                      <Link
                                        to={`/agents/${agent.id}`}
                                        className="text-text-primary font-medium hover:text-primary transition-colors group-hover:text-primary"
                                      >
                                        {agent.name || '—'}
                                      </Link>
                                    </div>
                                    <div className="text-sm text-text-muted">{agent.callsAnalyzedLabel}</div>
                                    <div className={`text-sm font-semibold ${getScoreColor(agent.avg_score)}`}>{formatScore(agent.avg_score)}</div>
                                    <div className="text-sm text-text-muted">{agent.compliance_pct != null ? `${agent.compliance_pct}%` : '—'}</div>
                                    <div className="text-sm text-text-muted">{agent.lastActiveLabel}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((agent, i) => (
                      <motion.tr
                        key={agent.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/3 hover:bg-white/2 transition-colors cursor-pointer group"
                        onClick={() => onRowClick(agent.id)}
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/agents/${agent.id}`}
                            className="text-text-primary font-medium text-sm hover:text-primary transition-colors group-hover:text-primary"
                          >
                            {agent.name || '—'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {agent.callsAnalyzedLabel}
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold ${getScoreColor(agent.avg_score)}`}>
                          {formatScore(agent.avg_score)}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {agent.compliance_pct != null ? `${agent.compliance_pct}%` : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {agent.lastActiveLabel}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </PageWrapper>
  );
}