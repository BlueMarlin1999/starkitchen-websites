'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AccessGuard } from '@/components/access-guard'
import { DemoBanner } from '@/components/AgentLegion/DemoBanner'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AGENT_PROFILES } from '@/components/AgentLegion/types'
import {
  getAgentKnowledgeFocus,
  getAgentSkillHighlights,
  resolveAgentCollaborators,
} from '@/lib/agent-intelligence/catalog'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/access'
import { canRoleAccessMinRole, getRoleLabelZh } from '@/lib/agent-legion-permissions'
import { isDemoFeatureEnabled } from '@/lib/live-mode'
import { useAuthStore } from '@/store/auth'

const AgentChatPanel = dynamic(
  () =>
    import('@/components/AgentLegion/AgentChatPanel').then((module) => ({
      default: module.AgentChatPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse text-slate-400">加载 AI Agent 面板...</div>
    ),
  }
)

const AgentRoster = dynamic(
  () =>
    import('@/components/AgentLegion/AgentRoster').then((module) => ({
      default: module.AgentRoster,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-72 animate-pulse rounded-3xl bg-white/5" />
    ),
  }
)

const AgentMetrics = dynamic(
  () =>
    import('@/components/AgentLegion/AgentMetrics').then((module) => ({
      default: module.AgentMetrics,
    })),
  { ssr: false }
)

const DecisionTracker = dynamic(
  () =>
    import('@/components/AgentLegion/DecisionTracker').then((module) => ({
      default: module.DecisionTracker,
    })),
  { ssr: false }
)

const AgentModelStrategyCard = dynamic(
  () =>
    import('@/components/AgentLegion/AgentModelStrategyCard').then((module) => ({
      default: module.AgentModelStrategyCard,
    })),
  { ssr: false }
)

export default function AgentLegionPage() {
  const viewerRole = useAuthStore((state) => state.user?.role)
  const canManageModelStrategy = hasPermission(viewerRole, 'manage_integrations')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('cos_zhuge_liang')
  const demoModeEnabled = isDemoFeatureEnabled()

  const selectedProfile = useMemo(
    () => AGENT_PROFILES.find((agent) => agent.id === selectedAgentId) ?? AGENT_PROFILES[0],
    [selectedAgentId]
  )

  const canDirectTalk = canRoleAccessMinRole(viewerRole, selectedProfile.minRole)
  const viewerRoleLabel = getRoleLabelZh(viewerRole)
  const requiredRoleLabel = getRoleLabelZh(selectedProfile.minRole)
  const knowledgeFocus = useMemo(
    () => getAgentKnowledgeFocus(selectedProfile.id),
    [selectedProfile.id]
  )
  const skillHighlights = useMemo(
    () => getAgentSkillHighlights(selectedProfile.id),
    [selectedProfile.id]
  )
  const collaborators = useMemo(
    () => resolveAgentCollaborators(selectedProfile.id),
    [selectedProfile.id]
  )

  return (
    <DashboardLayout>
      <AccessGuard permission="use_ai_chat" title="当前账号无权访问高管智能体军团">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1117] px-3 py-2.5">
            <span className="text-xs text-white/55">AI Agents Legion 模块</span>
            <Button
              asChild
              variant="outline"
              className="h-9 border-white/15 bg-white/[0.06] text-xs text-white hover:bg-white/[0.1]"
            >
              <Link href="/dashboard/ai/">
                AI 技能中心（12项）
              </Link>
            </Button>
            <Button asChild className="h-9 bg-primary text-xs text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/agents/">
                AI 集群团队
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 border-white/15 bg-white/[0.06] text-xs text-white hover:bg-white/[0.1]"
            >
              <Link href="/dashboard/opr/">
                OPR看板
              </Link>
            </Button>
          </div>

          <div className="flex min-h-[72vh] flex-col gap-4 p-1 lg:flex-row xl:h-[calc(100dvh-176px)] xl:overflow-hidden">
            <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto rounded-3xl border border-white/10 bg-[#0d1117] p-4 lg:flex">
              <AgentRoster
                highlightedAgentId={selectedProfile.id}
                onSelectAgent={(agentId) => {
                  setSelectedAgentId(agentId)
                }}
              />
            </aside>

            <main className="min-w-0 flex flex-1 flex-col gap-3 xl:min-h-0 xl:overflow-hidden">
              {demoModeEnabled ? <DemoBanner /> : null}

              <div className="mb-2.5 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1117] p-2 lg:hidden">
                {AGENT_PROFILES.map((agent) => {
                  const active = agent.id === selectedProfile.id
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgentId(agent.id)
                      }}
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition ${
                        active
                          ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
                          : 'border-white/15 bg-white/[0.04] text-white/65'
                      }`}
                    >
                      {agent.emoji} {agent.role}
                    </button>
                  )
                })}
              </div>

              <div className="xl:min-h-0 xl:flex-1">
                <AgentChatPanel
                  selectedAgentId={selectedProfile.id}
                  onSelectedAgentChange={(agentId) => {
                    if (agentId && AGENT_PROFILES.some((agent) => agent.id === agentId)) {
                      setSelectedAgentId(agentId)
                    }
                  }}
                />
              </div>

              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-[#0d1117] p-3 xl:hidden">
                <div className="text-sm font-semibold text-white">
                  {selectedProfile.emoji} {selectedProfile.role} · {selectedProfile.name_zh}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">
                    你的角色：{viewerRoleLabel}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">
                    直连门槛：{requiredRoleLabel}及以上
                  </span>
                  {canDirectTalk ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-emerald-300">
                      可直连对话
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-amber-300">
                      无直连权限（COS 代办）
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillHighlights.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-1 text-[11px] text-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-white/45">知识域</div>
                  <div className="flex flex-wrap gap-1.5">
                    {knowledgeFocus.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-white/45">协同角色</div>
                  <div className="flex flex-wrap gap-1.5">
                    {collaborators.map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-white/15 bg-white/[0.05] px-2 py-1 text-[11px] text-white/70"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 xl:hidden">
                <AgentModelStrategyCard
                  selectedAgentId={selectedProfile.id}
                  canManage={canManageModelStrategy}
                />
              </div>
            </main>

            <aside className="hidden w-[21rem] shrink-0 flex-col gap-4 overflow-y-auto xl:flex">
              <div className="space-y-3 rounded-3xl border border-white/10 bg-[#0d1117] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">当前角色详情</h3>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-sm font-semibold text-white">
                    {selectedProfile.emoji} {selectedProfile.role} · {selectedProfile.name_zh}
                  </div>
                  <div className="mt-1 text-xs text-white/45">{selectedProfile.title}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-white/50">你的角色</span>
                    <span className="text-xs text-white">{viewerRoleLabel}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-white/50">直连门槛</span>
                    <span className="text-xs text-white">{requiredRoleLabel}及以上</span>
                  </div>
                  <div className="mt-2 text-xs">
                    {canDirectTalk ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-emerald-300">
                        可直连对话
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-amber-300">
                        无直连权限（可由 COS 代办）
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-white/45">技能</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillHighlights.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-1 text-[11px] text-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-white/45">知识域</div>
                  <div className="flex flex-wrap gap-1.5">
                    {knowledgeFocus.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-white/45">协同角色</div>
                  <div className="flex flex-wrap gap-1.5">
                    {collaborators.map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-white/15 bg-white/[0.05] px-2 py-1 text-[11px] text-white/70"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <AgentModelStrategyCard
                selectedAgentId={selectedProfile.id}
                canManage={canManageModelStrategy}
              />

              <AgentMetrics />
              <DecisionTracker />

              <div className="space-y-3 rounded-3xl border border-white/10 bg-[#0d1117] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">决策分级</h3>
                {[
                  { level: 'L1', label: 'COS 直接处理', color: 'text-emerald-400' },
                  { level: 'L2', label: '单CxO决策', color: 'text-blue-400' },
                  { level: 'L3', label: '多CxO协商', color: 'text-amber-400' },
                  { level: 'L4', label: 'CEO拍板', color: 'text-red-400' },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-2">
                    <span className={`w-6 text-xs font-bold ${item.color}`}>{item.level}</span>
                    <span className="text-xs text-white/50">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-3xl border border-white/10 bg-[#0d1117] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">安全保障</h3>
                {['🔒 端到端加密', '🛡️ PII 自动脱敏', '🚫 注入攻击防护', '📋 完整审计日志', '🔐 人工授权机制'].map(
                  (item) => (
                    <div key={item} className="text-xs text-white/45">
                      {item}
                    </div>
                  )
                )}
              </div>
            </aside>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
