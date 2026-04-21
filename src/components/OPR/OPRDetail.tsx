'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getAgentOPRData } from './opr-data';
import {
  CircularProgress,
  ProgressBar,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_COLORS,
} from './ProgressBar';
import type { OPRDaily, OPRMonthly, OPRObjective, OPRPath, OPRResult, OPRStatus } from './types';

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-300', ring: 'ring-slate-500/40' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/40' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-300', ring: 'ring-violet-500/40' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', ring: 'ring-yellow-500/40' },
  green: { bg: 'bg-green-500/10', text: 'text-green-300', ring: 'ring-green-500/40' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-300', ring: 'ring-orange-500/40' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-300', ring: 'ring-pink-500/40' },
  red: { bg: 'bg-red-500/10', text: 'text-red-300', ring: 'ring-red-500/40' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', ring: 'ring-cyan-500/40' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-300', ring: 'ring-teal-500/40' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', ring: 'ring-indigo-500/40' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-300', ring: 'ring-sky-500/40' },
};

type TabKey = 'yearly' | 'monthly' | 'daily';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'yearly', label: '年度总览' },
  { key: 'monthly', label: '月度进度' },
  { key: 'daily', label: '每日动态' },
];

interface OPRDetailProps {
  agentId: string;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

const getOverallProgress = (objectives: OPRObjective[]) => {
  if (objectives.length === 0) return 0;
  const total = objectives.reduce((sum, item) => sum + item.overallProgress, 0);
  return Math.round(total / objectives.length);
};

const getOverallStatus = (objectives: OPRObjective[]): OPRStatus => {
  const statuses = objectives.map((item) => item.status);
  if (statuses.some((item) => item === 'behind')) return 'behind';
  if (statuses.some((item) => item === 'at_risk')) return 'at_risk';
  if (statuses.every((item) => item === 'completed')) return 'completed';
  return 'on_track';
};

function NotFoundPanel() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-white/40 text-lg">未找到该部门的OPR数据</p>
        <Link
          href="/dashboard/opr"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回总览
        </Link>
      </div>
    </div>
  );
}

function BackNav() {
  return (
    <div className="px-6 pt-5">
      <Link
        href="/dashboard/opr"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回OPR总览
      </Link>
    </div>
  );
}

function AgentHeader(props: {
  agentEmoji: string;
  agentRole: string;
  agentName: string;
  agentNameEn: string;
  objectiveCount: number;
  overallProgress: number;
  overallStatus: OPRStatus;
  colors: { bg: string; text: string; ring: string };
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-5">
        <span className={`flex items-center justify-center w-14 h-14 rounded-2xl text-2xl ${props.colors.bg} ring-1 ${props.colors.ring}`}>
          {props.agentEmoji}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold tracking-widest uppercase ${props.colors.text}`}>{props.agentRole}</span>
            <span className={`text-xs ${STATUS_TEXT_COLORS[props.overallStatus]}`}>
              {STATUS_LABELS[props.overallStatus]}
            </span>
          </div>
          <h1 className="text-white font-bold text-xl">
            {props.agentName}
            <span className="text-white/30 font-normal text-sm ml-2">{props.agentNameEn}</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{props.objectiveCount} 个年度目标 &middot; 2026年度</p>
        </div>
        <div className="hidden sm:block">
          <CircularProgress progress={props.overallProgress} status={props.overallStatus} size={80} />
        </div>
      </div>
    </div>
  );
}

function TabBar(props: { activeTab: TabKey; onChange: (value: TabKey) => void }) {
  return (
    <div className="px-6 border-b border-white/[0.06]">
      <div className="flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => props.onChange(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${
              props.activeTab === tab.key
                ? 'text-white border-blue-500'
                : 'text-white/40 hover:text-white/60 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OPRDetail({ agentId }: OPRDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('yearly');
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const data = useMemo(() => getAgentOPRData(agentId), [agentId]);

  if (!data) return <NotFoundPanel />;

  const colors = COLOR_MAP[data.agentColor] ?? COLOR_MAP.slate;
  const overallProgress = getOverallProgress(data.objectives);
  const overallStatus = getOverallStatus(data.objectives);

  const toggleObjective = (id: string) => {
    setExpandedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <BackNav />
      <AgentHeader
        agentEmoji={data.agentEmoji}
        agentRole={data.agentRole}
        agentName={data.agentName}
        agentNameEn={data.agentNameEn}
        objectiveCount={data.objectives.length}
        overallProgress={overallProgress}
        overallStatus={overallStatus}
        colors={colors}
      />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
      <div className="px-6 py-6">
        {activeTab === 'yearly' && (
          <YearlyTab
            objectives={data.objectives}
            expandedObjectives={expandedObjectives}
            toggleObjective={toggleObjective}
          />
        )}
        {activeTab === 'monthly' && <MonthlyTab monthly={data.monthly} />}
        {activeTab === 'daily' && <DailyTab daily={data.daily} />}
      </div>
    </div>
  );
}

function YearlyTab(props: {
  objectives: OPRObjective[];
  expandedObjectives: Set<string>;
  toggleObjective: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {props.objectives.map((objective) => (
        <ObjectiveCard
          key={objective.id}
          objective={objective}
          isExpanded={props.expandedObjectives.has(objective.id)}
          onToggle={props.toggleObjective}
        />
      ))}
    </div>
  );
}

function ObjectiveCard(props: {
  objective: OPRObjective;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  const { objective, isExpanded, onToggle } = props;
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => onToggle(objective.id)}
        className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT_COLORS[objective.status]}`} />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-relaxed">{objective.title}</h3>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">{objective.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs ${STATUS_TEXT_COLORS[objective.status]}`}>{STATUS_LABELS[objective.status]}</span>
            <span className="text-white/50 text-sm font-semibold tabular-nums">{objective.overallProgress}%</span>
            <ChevronIcon expanded={isExpanded} />
          </div>
        </div>
        <div className="mt-3 pl-5">
          <ProgressBar progress={objective.overallProgress} status={objective.status} size="md" showLabel={false} />
        </div>
      </button>
      {isExpanded && <ObjectiveExpandedContent objective={objective} />}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-white/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ObjectiveExpandedContent({ objective }: { objective: OPRObjective }) {
  return (
    <div className="border-t border-white/[0.06] p-5 space-y-6">
      <div>
        <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          执行路径 Paths
        </h4>
        <div className="space-y-3">
          {objective.paths.map((path) => (
            <PathItem key={path.id} path={path} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          关键结果 Results
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {objective.results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PathItem({ path }: { path: OPRPath }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h5 className="text-white/80 text-sm font-medium">{path.title}</h5>
          <p className="text-white/35 text-xs mt-0.5">{path.description}</p>
        </div>
        <span className="text-white/30 text-xs shrink-0">{path.milestone}</span>
      </div>
      <ProgressBar progress={path.progress} status={path.status} size="sm" />
    </div>
  );
}

function ResultCard({ result }: { result: OPRResult }) {
  const status = result.progress >= 80 ? 'on_track' : result.progress >= 50 ? 'at_risk' : 'behind';
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50 text-xs">{result.metric}</span>
        <TrendIcon trend={result.trend} />
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-white font-bold text-lg tabular-nums">{result.current}</span>
        <span className="text-white/25 text-xs">/ {result.target}</span>
      </div>
      <ProgressBar progress={result.progress} status={status} size="sm" showLabel={false} />
    </div>
  );
}

function MonthlyTab({ monthly }: { monthly: OPRMonthly[] }) {
  const currentMonth = 4;
  return (
    <div className="space-y-3">
      {monthly.map((month) => (
        <MonthlyCard key={month.month} month={month} currentMonth={currentMonth} />
      ))}
    </div>
  );
}

function MonthlyCard(props: { month: OPRMonthly; currentMonth: number }) {
  const isCurrent = props.month.month === props.currentMonth;
  const isFuture = props.month.month > props.currentMonth;
  const cardClass = isCurrent
    ? 'bg-blue-500/[0.05] border-blue-500/20'
    : 'bg-white/[0.03] border-white/[0.06]';

  return (
    <div className={`rounded-2xl border p-5 transition-all ${cardClass} ${isFuture ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[props.month.status]}`} />
          <span className={`text-sm font-semibold ${isCurrent ? 'text-blue-300' : 'text-white/70'}`}>
            {props.month.monthLabel}
          </span>
          {isCurrent && <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">当前</span>}
        </div>
        <div className="flex-1">
          <ProgressBar progress={props.month.progress} status={props.month.status} size="sm" animated={!isFuture} />
        </div>
      </div>
      <MonthlyHighlights highlights={props.month.highlights} isFuture={isFuture} />
    </div>
  );
}

function MonthlyHighlights({ highlights, isFuture }: { highlights: string[]; isFuture: boolean }) {
  if (highlights.length > 0) {
    return (
      <div className="pl-5 space-y-1">
        {highlights.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-start gap-2">
            <span className="text-white/20 text-xs mt-0.5">-</span>
            <span className="text-white/40 text-xs leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    );
  }

  if (isFuture) {
    return <p className="pl-5 text-white/20 text-xs">计划中...</p>;
  }
  return null;
}

function DailyTab({ daily }: { daily: OPRDaily[] }) {
  const today = '2026-04-09';
  const activeDays = daily.filter((item) => item.progress > 0);
  const futureDays = daily.filter((item) => item.progress === 0);
  return (
    <div className="space-y-6">
      <DailyCalendar daily={daily} today={today} />
      <ActiveDaysList daily={activeDays} today={today} />
      <FutureHint futureDays={futureDays} />
    </div>
  );
}

function DailyCalendar({ daily, today }: { daily: OPRDaily[]; today: string }) {
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  return (
    <div>
      <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
        2026年4月 日历视图
      </h4>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdays.map((weekday) => (
          <div key={weekday} className="text-center text-white/30 text-xs py-1">
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {[null, null].map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {daily.map((day) => (
          <CalendarCell key={day.date} day={day} today={today} />
        ))}
      </div>
    </div>
  );
}

function CalendarCell({ day, today }: { day: OPRDaily; today: string }) {
  const isToday = day.date === today;
  const hasData = day.progress > 0;
  const dayNum = parseInt(day.date.split('-')[2], 10);
  const bgClass = getCalendarBackground(day.progress);
  const textClass = isToday
    ? 'text-blue-300 font-semibold'
    : hasData
      ? 'text-white/60'
      : 'text-white/20';

  return (
    <div
      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center ${bgClass}
                 ${isToday ? 'ring-1 ring-blue-500/50' : ''} transition-all`}
      title={day.note || undefined}
    >
      <span className={`text-xs tabular-nums ${textClass}`}>{dayNum}</span>
      {hasData && <span className="text-[10px] text-white/40 tabular-nums">{day.progress}%</span>}
    </div>
  );
}

const getCalendarBackground = (progress: number) => {
  if (progress >= 80) return 'bg-emerald-500/20';
  if (progress >= 60) return 'bg-emerald-500/10';
  if (progress >= 40) return 'bg-amber-500/10';
  if (progress > 0) return 'bg-white/[0.06]';
  return 'bg-white/[0.03]';
};

function ActiveDaysList({ daily, today }: { daily: OPRDaily[]; today: string }) {
  return (
    <div>
      <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
        每日动态
      </h4>
      <div className="space-y-2">
        {[...daily].reverse().map((item) => (
          <ActiveDayCard key={item.date} day={item} isToday={item.date === today} />
        ))}
      </div>
    </div>
  );
}

function ActiveDayCard({ day, isToday }: { day: OPRDaily; isToday: boolean }) {
  const status = day.progress >= 80 ? 'on_track' : day.progress >= 50 ? 'at_risk' : 'behind';
  return (
    <div className={`rounded-xl border p-4 ${isToday ? 'bg-blue-500/[0.05] border-blue-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-300' : 'text-white/60'}`}>
          {day.dayLabel}
        </span>
        {isToday && <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs">今天</span>}
        <div className="flex-1">
          <ProgressBar progress={day.progress} status={status} size="sm" />
        </div>
      </div>
      {day.note && <p className="text-white/40 text-xs leading-relaxed">{day.note}</p>}
    </div>
  );
}

function FutureHint({ futureDays }: { futureDays: OPRDaily[] }) {
  if (futureDays.length === 0) return null;
  const startDate = futureDays[0].date.split('-')[2];
  return (
    <div className="text-center py-4">
      <p className="text-white/20 text-xs">4月{startDate}日以后的数据将随时间更新</p>
    </div>
  );
}
