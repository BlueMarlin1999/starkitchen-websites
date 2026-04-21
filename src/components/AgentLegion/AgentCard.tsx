'use client';

import type { AgentProfile } from './types';

interface Props {
  agent: AgentProfile;
  isActive?: boolean;
  onClick?: () => void;
  canDirectTalk?: boolean;
  requiredRoleLabel?: string;
}

// Map color token → Tailwind classes (static for tree-shaking)
const COLOR_MAP: Record<string, { ring: string; bg: string; text: string }> = {
  slate:  { ring: 'ring-slate-500/40',  bg: 'bg-slate-500/10',  text: 'text-slate-300' },
  amber:  { ring: 'ring-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-300' },
  violet: { ring: 'ring-violet-500/40', bg: 'bg-violet-500/10', text: 'text-violet-300' },
  yellow: { ring: 'ring-yellow-500/40', bg: 'bg-yellow-500/10', text: 'text-yellow-300' },
  green:  { ring: 'ring-green-500/40',  bg: 'bg-green-500/10',  text: 'text-green-300' },
  orange: { ring: 'ring-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-300' },
  pink:   { ring: 'ring-pink-500/40',   bg: 'bg-pink-500/10',   text: 'text-pink-300' },
  red:    { ring: 'ring-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-300' },
  cyan:   { ring: 'ring-cyan-500/40',   bg: 'bg-cyan-500/10',   text: 'text-cyan-300' },
  teal:   { ring: 'ring-teal-500/40',   bg: 'bg-teal-500/10',   text: 'text-teal-300' },
  indigo: { ring: 'ring-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-300' },
  sky:    { ring: 'ring-sky-500/40',    bg: 'bg-sky-500/10',    text: 'text-sky-300' },
};

function AgentCardHeader(props: {
  emoji: string;
  role: string;
  name: string;
  colors: { ring: string; bg: string; text: string };
}) {
  return (
    <div className="flex items-center gap-2.5 mb-1.5">
      <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-base ${props.colors.bg} ring-1 ${props.colors.ring}`}>
        {props.emoji}
      </span>
      <div>
        <div className={`text-xs font-bold tracking-widest uppercase ${props.colors.text}`}>
          {props.role}
        </div>
        <div className="text-white/80 text-sm font-medium leading-tight">{props.name}</div>
      </div>
    </div>
  );
}

function AccessBadges(props: { canDirectTalk: boolean; requiredRoleLabel?: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-white/45">
        {props.requiredRoleLabel ? `${props.requiredRoleLabel}+` : '已授权'}
      </span>
      <span
        className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
          props.canDirectTalk
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
            : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
        }`}
      >
        {props.canDirectTalk ? '可直连' : '需COS代办'}
      </span>
    </div>
  );
}

export function AgentCard({ agent, isActive, onClick, canDirectTalk = true, requiredRoleLabel }: Props) {
  const colors = COLOR_MAP[agent.color] ?? COLOR_MAP.slate;
  const cardStateClass = isActive
    ? `${colors.bg} border-white/20 ring-1 ${colors.ring}`
    : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15';

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left p-3 rounded-2xl border transition-all duration-200 ${cardStateClass}`}
    >
      <span
        className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${
          agent.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'
        }`}
      />
      <AgentCardHeader
        emoji={agent.emoji}
        role={agent.role}
        name={agent.name_zh}
        colors={colors}
      />
      <div className="text-white/40 text-xs truncate">{agent.domain}</div>
      <AccessBadges canDirectTalk={canDirectTalk} requiredRoleLabel={requiredRoleLabel} />
    </button>
  );
}
