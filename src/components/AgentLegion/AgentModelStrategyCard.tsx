'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ExternalLink, RefreshCcw, Save, ShieldAlert } from 'lucide-react'
import {
  LLM_PROVIDER_CATALOG,
  getProviderCatalogItem,
  getProviderDefaultModel,
  getProviderModelPresets,
  type LlmProviderId,
} from '@/lib/llm-catalog'
import { loadLlmControlPlane, saveLlmAgentRoutes } from '@/lib/llm-control-plane'
import type { LlmAgentRouteConfig, LlmProviderConfig } from '@/store/llm-control-plane'
import { useAuthStore } from '@/store/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AGENT_PROFILES } from './types'
import {
  buildFallbackAgentRoute,
  resolveAgentRouteDraft,
  upsertAgentRouteDraft,
} from './agent-model-routing'

interface AgentModelStrategyCardProps {
  selectedAgentId: string
  canManage: boolean
}

const resolveProviderStatusLabel = (provider?: LlmProviderConfig) => {
  if (!provider) return '未接入'
  if (provider.health === 'healthy') return '已连通'
  if (provider.health === 'error') return '连接异常'
  return '待检测'
}

const resolveProviderStatusClassName = (provider?: LlmProviderConfig) => {
  if (!provider) return 'bg-white/10 text-white/65'
  if (provider.health === 'healthy') return 'bg-emerald-500/15 text-emerald-300'
  if (provider.health === 'error') return 'bg-red-500/15 text-red-300'
  return 'bg-white/10 text-white/65'
}

export function AgentModelStrategyCard({
  selectedAgentId,
  canManage,
}: AgentModelStrategyCardProps) {
  const token = useAuthStore((state) => state.token)
  const selectedAgentIdRef = useRef(selectedAgentId)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [providers, setProviders] = useState<LlmProviderConfig[]>([])
  const [agentRoutes, setAgentRoutes] = useState<LlmAgentRouteConfig[]>([])
  const [draft, setDraft] = useState<LlmAgentRouteConfig>(() => buildFallbackAgentRoute(selectedAgentId))

  const selectedProfile = useMemo(
    () => AGENT_PROFILES.find((agent) => agent.id === selectedAgentId) ?? AGENT_PROFILES[0],
    [selectedAgentId]
  )

  const syncSnapshot = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) setIsRefreshing(true)
      else setIsLoading(true)
      setErrorMessage(null)
      try {
        const snapshot = await loadLlmControlPlane(token)
        setProviders(snapshot.providers)
        setAgentRoutes(snapshot.agentRoutes)
        setDraft(resolveAgentRouteDraft(selectedAgentIdRef.current, snapshot.agentRoutes))
      } catch (error) {
        const message = error instanceof Error ? error.message : '读取模型策略失败'
        setErrorMessage(message)
      } finally {
        if (asRefresh) setIsRefreshing(false)
        else setIsLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    void syncSnapshot(false)
  }, [syncSnapshot])

  useEffect(() => {
    selectedAgentIdRef.current = selectedAgentId
    setDraft(resolveAgentRouteDraft(selectedAgentId, agentRoutes))
  }, [selectedAgentId, agentRoutes])

  const currentProvider = useMemo(
    () => providers.find((item) => item.providerId === draft.providerId),
    [providers, draft.providerId]
  )
  const providerCatalog = useMemo(
    () => getProviderCatalogItem(draft.providerId),
    [draft.providerId]
  )
  const modelPresets = useMemo(
    () => getProviderModelPresets(draft.providerId),
    [draft.providerId]
  )

  const hasUsableProvider = Boolean(
    currentProvider?.enabled && (providerCatalog.supportsKeyless || currentProvider.keyConfigured)
  )

  const handleSave = async () => {
    if (!canManage || isSaving) return
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const nextRoutes = upsertAgentRouteDraft(agentRoutes, draft)
      const snapshot = await saveLlmAgentRoutes(nextRoutes, token)
      setProviders(snapshot.providers)
      setAgentRoutes(snapshot.agentRoutes)
      setDraft(resolveAgentRouteDraft(selectedAgentId, snapshot.agentRoutes))
      setSuccessMessage(`已保存 ${selectedProfile.role} 的模型策略`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存智能体模型策略失败'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProviderChange = (providerId: LlmProviderId) => {
    setDraft((current) => ({
      ...current,
      providerId,
      model: getProviderDefaultModel(providerId),
    }))
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-[#0d1117] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            智能体模型策略
          </h3>
          <p className="mt-1 text-xs text-white/45">当前对话角色可独立配置模型、温度与输出长度。</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 border-white/15 bg-white/[0.05] px-2 text-[11px] text-white hover:bg-white/[0.1]"
          onClick={() => {
            void syncSnapshot(true)
          }}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCcw className="mr-1 h-3 w-3" />
          {isRefreshing ? '同步中' : '同步'}
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {selectedProfile.emoji} {selectedProfile.role} · {selectedProfile.name_zh}
          </span>
          <Badge className={`${resolveProviderStatusClassName(currentProvider)} hover:bg-transparent`}>
            {resolveProviderStatusLabel(currentProvider)}
          </Badge>
          {hasUsableProvider ? (
            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              可用
            </Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
              <ShieldAlert className="mr-1 h-3 w-3" />
              待补齐 Key/可用性
            </Badge>
          )}
        </div>

        <div className="mt-3 grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="agent-model-provider">供应商</Label>
            <select
              id="agent-model-provider"
              value={draft.providerId}
              onChange={(event) => {
                handleProviderChange(event.target.value as LlmProviderId)
              }}
              className="h-10 w-full rounded-md border border-white/15 bg-white/[0.05] px-3 text-sm text-white focus:border-primary focus:outline-none"
              disabled={isLoading || !canManage}
            >
              {LLM_PROVIDER_CATALOG.map((provider) => (
                <option key={provider.id} value={provider.id} className="bg-slate-900 text-white">
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-model-name">模型</Label>
            <Input
              id="agent-model-name"
              list="agent-model-name-options"
              value={draft.model}
              onChange={(event) => {
                setDraft((current) => ({ ...current, model: event.target.value }))
              }}
              className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
              disabled={isLoading || !canManage}
            />
            <datalist id="agent-model-name-options">
              {modelPresets.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="agent-model-temperature">Temperature</Label>
              <Input
                id="agent-model-temperature"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft.temperature}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    temperature: Number.parseFloat(event.target.value || '0'),
                  }))
                }}
                className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                disabled={isLoading || !canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-model-max-tokens">Max Tokens</Label>
              <Input
                id="agent-model-max-tokens"
                type="number"
                min={100}
                max={8192}
                step={100}
                value={draft.maxTokens}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    maxTokens: Number.parseInt(event.target.value || '1000', 10),
                  }))
                }}
                className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                disabled={isLoading || !canManage}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="h-8 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            void handleSave()
          }}
          disabled={isLoading || isSaving || !canManage}
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {isSaving ? '保存中...' : '保存当前智能体'}
        </Button>
        <Link href="/dashboard/integrations/llm/">
          <Button
            type="button"
            variant="outline"
            className="h-8 border-white/15 bg-white/[0.05] px-3 text-xs text-white hover:bg-white/[0.1]"
          >
            全局模型控制台
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {!canManage ? (
        <p className="text-xs text-amber-300/90">当前角色为只读。需要“管理集成”权限才能修改模型策略。</p>
      ) : null}
      {errorMessage ? <p className="text-xs text-red-300">{errorMessage}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-300">{successMessage}</p> : null}
    </div>
  )
}
