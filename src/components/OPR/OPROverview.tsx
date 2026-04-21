'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_OPR_DATA } from './opr-data';
import { ProgressBar, STATUS_DOT_COLORS, STATUS_LABELS, STATUS_TEXT_COLORS } from './ProgressBar';
import type { OPRStatus, AgentOPRData } from './types';

// ── Filter tabs ──────────────────────────────────────────────
type FilterKey = 'all' | 'on_track' | 'at_risk' | 'behind';

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: '全部' },
  { key: 'on_track', label: '进展顺利' },
  { key: 'at_risk',  label: '有风险' },
  { key: 'behind',   label: '滞后' },
];

// ── Compute agent-level summary status ───────────────────────
function getAgentOverallStatus(agent: AgentOPRData): OPRStatus {
  const statuses = agent.objectives.map(o => o.status);
  if (statuses.some(s => s === 'behind')) return 'behind';
  if (statuses.some(s => s === 'at_risk')) return 'at_risk';
  if (statuses.every(s => s === 'completed')) return 'completed';
  if (statuses.every(s => s === 'not_started')) return 'not_started';
  return 'on_track';
}

function getAgentOverallProgress(agent: AgentOPRData): number {
  if (agent.objectives.length === 0) return 0;
  const total = agent.objectives.reduce((sum, o) => sum + o.overallProgress, 0);
  return Math.round(total / agent.objectives.length);
}

// ── Color map (same as AgentCard) ────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  slate:  { bg: 'bg-slate-500/10',  text: 'text-slate-300',  ring: 'ring-slate-500/40' },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-300',  ring: 'ring-amber-500/40' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-300', ring: 'ring-violet-500/40' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', ring: 'ring-yellow-500/40' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-300',  ring: 'ring-green-500/40' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-300', ring: 'ring-orange-500/40' },
  pink:   { bg: 'bg-pink-500/10',   text: 'text-pink-300',   ring: 'ring-pink-500/40' },
  red:    { bg: 'bg-red-500/10',    text: 'text-red-300',    ring: 'ring-red-500/40' },
  cyan:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-300',   ring: 'ring-cyan-500/40' },
  teal:   { bg: 'bg-teal-500/10',   text: 'text-teal-300',   ring: 'ring-teal-500/40' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', ring: 'ring-indigo-500/40' },
  sky:    { bg: 'bg-sky-500/10',    text: 'text-sky-300',    ring: 'ring-sky-500/40' },
};

// ── Main component ───────────────────────────────────────────

export function OPROverview() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const stats = useMemo(() => {
    const allObjectives = ALL_OPR_DATA.flatMap(d => d.objectives);
    const total = allObjectives.length;
    const onTrack = allObjectives.filter(o => o.status === 'on_track' || o.status === 'completed').length;
    const atRisk = allObjectives.filter(o => o.status === 'at_risk').length;
    const behind = allObjectives.filter(o => o.status === 'behind').length;
    return {
      total,
      onTrack,
      atRisk,
      behind,
      onTrackPct: total > 0 ? Math.round((onTrack / total) * 100) : 0,
      atRiskPct: total > 0 ? Math.round((atRisk / total) * 100) : 0,
      behindPct: total > 0 ? Math.round((behind / total) * 100) : 0,
    };
  }, []);

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return ALL_OPR_DATA;
    return ALL_OPR_DATA.filter(agent => {
      const status = getAgentOverallStatus(agent);
      if (filter === 'on_track') return status === 'on_track' || status === 'completed';
      return status === filter;
    });
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <OverviewHeader />
      <SummarySection stats={stats} />
      <FilterTabs filter={filter} onSelect={setFilter} />
      <AgentGrid agents={filteredAgents} />
    </div>
  );
}

function OverviewHeader() {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl
                        bg-gradient-to-br from-violet-500/30 to-blue-500/20
                        border border-white/10 text-xl">
          🎯
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">OPR 总控仪表盘</h1>
          <p className="text-white/40 text-sm">
            Objectives &middot; Paths &middot; Results &mdash; 2026年度
          </p>
        </div>
      </div>
    </div>
  );
}

function SummarySection(props: {
  stats: {
    total: number;
    onTrack: number;
    atRisk: number;
    behind: number;
    onTrackPct: number;
    atRiskPct: number;
    behindPct: number;
  };
}) {
  const { stats } = props;
  return (
    <div className="px-6 pb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="目标总数" value={String(stats.total)} sub="个目标" color="text-white" />
        <SummaryCard label="进展顺利" value={`${stats.onTrackPct}%`} sub={`${stats.onTrack}个目标`} color="text-emerald-400" />
        <SummaryCard label="有风险" value={`${stats.atRiskPct}%`} sub={`${stats.atRisk}个目标`} color="text-amber-400" />
        <SummaryCard label="滞后" value={`${stats.behindPct}%`} sub={`${stats.behind}个目标`} color="text-red-400" />
      </div>
    </div>
  );
}

function FilterTabs(props: { filter: FilterKey; onSelect: (value: FilterKey) => void }) {
  return (
    <div className="px-6 pb-4">
      <div className="flex gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => props.onSelect(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              props.filter === tab.key
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentGrid({ agents }: { agents: AgentOPRData[] }) {
  if (agents.length === 0) {
    return (
      <div className="px-6 pb-8">
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">没有符合筛选条件的部门</p>
        </div>
      </div>
    );
  }
  return (
    <div className="px-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map(agent => (
          <AgentOPRCard key={agent.agentId} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-white/30 text-xs mt-0.5">{sub}</p>
    </div>
  );
}

// ── Agent OPR Card ───────────────────────────────────────────

function AgentOPRCard({ agent }: { agent: AgentOPRData }) {
  const overallProgress = getAgentOverallProgress(agent);
  const overallStatus = getAgentOverallStatus(agent);
  const colors = COLOR_MAP[agent.agentColor] ?? COLOR_MAP.slate;

  return (
    <Link
      href={`/dashboard/opr/${agent.agentId}`}
      className="group block rounded-2xl bg-white/[0.03] border border-white/[0.06]
                 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 p-5"
    >
      <AgentCardHeader agent={agent} colors={colors} overallStatus={overallStatus} />
      <ProgressBar progress={overallProgress} status={overallStatus} size="lg" className="mb-4" />
      <ObjectivePreview agent={agent} />
      <AgentCardFooter objectiveCount={agent.objectives.length} />
    </Link>
  );
}

function AgentCardHeader(props: {
  agent: AgentOPRData;
  colors: { bg: string; text: string; ring: string };
  overallStatus: OPRStatus;
}) {
  const { agent, colors, overallStatus } = props;
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg ${colors.bg} ring-1 ${colors.ring}`}>
        {agent.agentEmoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-widest uppercase ${colors.text}`}>
            {agent.agentRole}
          </span>
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[overallStatus]}`} />
        </div>
        <div className="text-white/80 text-sm font-medium truncate">{agent.agentName}</div>
      </div>
      <span className={`text-xs ${STATUS_TEXT_COLORS[overallStatus]}`}>
        {STATUS_LABELS[overallStatus]}
      </span>
    </div>
  );
}

function ObjectivePreview({ agent }: { agent: AgentOPRData }) {
  return (
    <div className="space-y-2 mb-4">
      {agent.objectives.slice(0, 3).map(obj => (
        <div key={obj.id} className="flex items-start gap-2">
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_COLORS[obj.status]}`} />
          <span className="text-white/50 text-xs leading-tight line-clamp-1">
            {obj.title}
          </span>
        </div>
      ))}
    </div>
  );
}

function AgentCardFooter({ objectiveCount }: { objectiveCount: number }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
      <span className="text-white/30 text-xs">{objectiveCount} 个目标</span>
      <span className="text-white/40 text-xs group-hover:text-white/70 transition-colors flex items-center gap-1">
        查看详情
        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  );
}
