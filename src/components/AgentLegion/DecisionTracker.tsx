'use client';

import { useEffect, useState } from 'react';
import { AGENT_PROFILES } from './types';
import { listDecisions, type Decision } from '@/lib/agents-api';

type DecisionFilter = 'all' | 'pending' | 'in_progress' | 'completed';
type DecisionItem = Decision & { updated_at?: string | null };

const STATUS_STYLES: Record<DecisionItem['status'], { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Pending' },
  in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Completed' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled' },
};

const PRIORITY_STYLES: Record<DecisionItem['priority'], { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
  high:     { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  normal:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  low:      { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   dot: 'bg-zinc-400' },
};

const FILTER_OPTIONS: Array<{ value: DecisionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
];

function getAgentEmoji(agentId: string) {
  const profile = AGENT_PROFILES.find((a) => a.id === agentId);
  return profile?.emoji ?? '?';
}

function getAgentLabel(agentId: string) {
  const profile = AGENT_PROFILES.find((a) => a.id === agentId);
  return profile ? `${profile.emoji} ${profile.name_zh}` : agentId;
}

function isOverdue(dueDate: string | null, decisionStatus: DecisionItem['status']) {
  if (!dueDate || decisionStatus === 'completed' || decisionStatus === 'cancelled') return false;
  return new Date(dueDate) < new Date();
}

function formatDate(iso: string | null) {
  if (!iso) return '--';
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function DecisionSkeleton() {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#0d1117] p-6 animate-pulse">
      <div className="h-4 w-40 bg-white/10 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function DecisionError({ error }: { error: string }) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-[#0d1117] p-6">
      <p className="text-red-400 text-sm">决策追踪暂不可用（{error}）</p>
    </div>
  );
}

function FilterTabs(props: {
  filter: DecisionFilter;
  setFilter: (value: DecisionFilter) => void;
}) {
  return (
    <div className="flex gap-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => props.setFilter(opt.value)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            props.filter === opt.value
              ? 'bg-white/10 text-white/80'
              : 'text-white/30 hover:text-white/50 hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DecisionCard({ decision }: { decision: DecisionItem }) {
  const statusStyle = STATUS_STYLES[decision.status] ?? STATUS_STYLES.pending;
  const priorityStyle = PRIORITY_STYLES[decision.priority] ?? PRIORITY_STYLES.normal;
  const overdue = isOverdue(decision.due_date, decision.status);

  return (
    <div
      className={`rounded-2xl border p-3 space-y-2 transition-colors ${
        overdue
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5
                     ring-1 ring-white/10 text-sm shrink-0"
          title={getAgentLabel(decision.source_agent_id)}
        >
          {getAgentEmoji(decision.source_agent_id)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-white/80 text-xs font-medium leading-snug truncate">
            {decision.title}
          </div>
          <div className="text-white/30 text-[10px] mt-0.5">
            {getAgentLabel(decision.source_agent_id)} &rarr; {decision.assigned_to}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
          <span className={`w-1 h-1 rounded-full ${priorityStyle.dot}`} />
          {decision.priority}
        </span>
        <span className="text-white/20 text-[10px]">L{decision.decision_level}</span>
        {decision.due_date && (
          <span className={`text-[10px] ml-auto ${overdue ? 'text-red-400 font-medium' : 'text-white/25'}`}>
            {overdue ? 'OVERDUE ' : 'Due '}
            {formatDate(decision.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

async function fetchDecisionData(filter: DecisionFilter) {
  const status = filter === 'all' ? undefined : filter;
  return listDecisions({ status, limit: 50 });
}

function useDecisionFeed(filter: DecisionFilter) {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchDecisionData(filter);
        if (cancelled) return;
        setDecisions(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [filter]);

  return { decisions, loading, error };
}

export function DecisionTracker() {
  const [filter, setFilter] = useState<DecisionFilter>('all');
  const { decisions, loading, error } = useDecisionFeed(filter);

  if (loading) return <DecisionSkeleton />;
  if (error) return <DecisionError error={error} />;

  return (
    <div className="rounded-3xl border border-white/8 bg-[#0d1117] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          Decision Tracker
        </h3>
        <span className="text-white/25 text-[10px]">{decisions.length} items</span>
      </div>
      <FilterTabs filter={filter} setFilter={setFilter} />
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {decisions.length === 0 && (
          <p className="text-white/25 text-xs text-center py-6">No decisions found</p>
        )}
        {decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
