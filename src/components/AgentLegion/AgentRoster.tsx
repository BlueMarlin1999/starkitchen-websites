'use client';

import { canRoleAccessMinRole, getRoleLabelZh } from '@/lib/agent-legion-permissions';
import { useAuthStore } from '@/store/auth';
import { AGENT_PROFILES } from './types';
import { AgentCard } from './AgentCard';

interface Props {
  onSelectAgent?: (agentId: string) => void;
  highlightedAgentId?: string;
}

export function AgentRoster({ onSelectAgent, highlightedAgentId }: Props) {
  const viewerRole = useAuthStore((state) => state.user?.role);
  const activeCount = AGENT_PROFILES.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">AI C-Suite 战队</h3>
          <p className="text-white/40 text-xs mt-0.5">
            {activeCount} 位 Agent 在线 · 由诸葛亮统一调度
          </p>
        </div>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full
                         bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          全员就绪
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2">
        {AGENT_PROFILES.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isActive={highlightedAgentId === agent.id}
            onClick={() => onSelectAgent?.(agent.id)}
            canDirectTalk={canRoleAccessMinRole(viewerRole, agent.minRole)}
            requiredRoleLabel={getRoleLabelZh(agent.minRole)}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-white/25 text-xs text-center leading-relaxed">
        所有对话通过诸葛亮（COS）路由 · 安全加密
      </p>
    </div>
  );
}
