'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ListChecks,
  RefreshCcw,
  Save,
  Server,
  ShieldAlert,
  PlugZap,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { hasPermission } from '@/lib/access'
import {
  LLM_PROVIDER_CATALOG,
  LLM_ROUTE_PROFILE_LIBRARY,
  LlmProviderId,
  LlmRouteProfileId,
  getProviderCatalogItem,
  getProviderDefaultModel,
  getProviderModelPresets,
  maskApiKey,
} from '@/lib/llm-catalog'
import {
  LlmAuditLogItem,
  LlmMonitorSummary,
  LlmControlPlaneMode,
  loadLlmAuditLogs,
  loadLlmControlPlane,
  loadLlmMonitorSummary,
  saveLlmAgentRoutes,
  saveLlmProviderConfig,
  saveLlmRouteProfiles,
  testLlmProviderConnection,
} from '@/lib/llm-control-plane'
import { isStrictLiveMode } from '@/lib/live-mode'
import { useAuthStore } from '@/store/auth'
import {
  LlmAgentRouteConfig,
  LlmProviderConfig,
  LlmRouteProfileConfig,
  useLlmControlPlaneStore,
} from '@/store/llm-control-plane'
import { AGENT_PROFILES } from '@/components/AgentLegion/types'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const getProviderStatusBadgeClass = (health: LlmProviderConfig['health']) => {
  if (health === 'healthy') return 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
  if (health === 'error') return 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
  return 'bg-white/10 text-slate-200 hover:bg-white/10'
}

const getProviderStatusLabel = (health: LlmProviderConfig['health']) => {
  if (health === 'healthy') return '已连通'
  if (health === 'error') return '连通异常'
  return '待检测'
}

const mergeProvidersWithCatalog = (providers: LlmProviderConfig[]) =>
  LLM_PROVIDER_CATALOG.map((catalog) => {
    const exists = providers.find((item) => item.providerId === catalog.id)
    if (exists) return exists

    return {
      providerId: catalog.id,
      enabled: false,
      apiKey: '',
      keySource: 'cookie' as const,
      keyEnvVar: catalog.defaultApiKeyEnvVar,
      keyConfigured: false,
      keyPreview: '',
      baseUrl: catalog.defaultBaseUrl,
      defaultModel: getProviderDefaultModel(catalog.id),
      organization: '',
      health: 'unknown' as const,
      lastTestAt: null,
      updatedAt: new Date().toISOString(),
    }
  })

const mergeRoutesWithLibrary = (routes: LlmRouteProfileConfig[]) =>
  LLM_ROUTE_PROFILE_LIBRARY.map((template) => {
    const exists = routes.find((item) => item.routeId === template.id)
    if (exists) return exists

    return {
      routeId: template.id,
      providerId: template.defaultProviderId,
      model: template.defaultModel,
      temperature: template.defaultTemperature,
      maxTokens: template.defaultMaxTokens,
    }
  })

const mergeAgentRoutesWithRoster = (agentRoutes: LlmAgentRouteConfig[]) => {
  const routeMap = new Map(agentRoutes.map((item) => [item.agentId, item]))
  return AGENT_PROFILES.map((agent) => {
    const exists = routeMap.get(agent.id)
    if (exists) return exists
    return {
      agentId: agent.id,
      providerId: 'deepseek' as LlmProviderId,
      model: 'deepseek-chat',
      temperature: 0.2,
      maxTokens: 1800,
    }
  })
}

export default function LlmIntegrationPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const canManage = hasPermission(user?.role, 'manage_integrations')
  const [mode, setMode] = useState<LlmControlPlaneMode>('local')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [providers, setProviders] = useState<LlmProviderConfig[]>([])
  const [routes, setRoutes] = useState<LlmRouteProfileConfig[]>([])
  const [agentRoutes, setAgentRoutes] = useState<LlmAgentRouteConfig[]>([])
  const [savingProviderId, setSavingProviderId] = useState<LlmProviderId | null>(null)
  const [testingProviderId, setTestingProviderId] = useState<LlmProviderId | null>(null)
  const [isSavingRoutes, setIsSavingRoutes] = useState(false)
  const [isSavingAgentRoutes, setIsSavingAgentRoutes] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Partial<Record<LlmProviderId, boolean>>>({})
  const [monitorSummary, setMonitorSummary] = useState<LlmMonitorSummary | null>(null)
  const [auditLogs, setAuditLogs] = useState<LlmAuditLogItem[]>([])
  const [isRefreshingObservability, setIsRefreshingObservability] = useState(false)

  const refreshObservability = async () => {
    setIsRefreshingObservability(true)
    try {
      const [summary, logs] = await Promise.all([
        loadLlmMonitorSummary(24, token),
        loadLlmAuditLogs(20, token),
      ])
      setMonitorSummary(summary)
      setAuditLogs(logs.items)
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取模型监控失败'
      toast({
        title: '监控读取失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsRefreshingObservability(false)
    }
  }

  useEffect(() => {
    let disposed = false

    const bootstrap = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const [snapshot, summary, logs] = await Promise.all([
          loadLlmControlPlane(token),
          loadLlmMonitorSummary(24, token),
          loadLlmAuditLogs(20, token),
        ])
        if (disposed) return
        setMode(snapshot.mode)
        setProviders(mergeProvidersWithCatalog(snapshot.providers))
        setRoutes(mergeRoutesWithLibrary(snapshot.routes))
        setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
        setMonitorSummary(summary)
        setAuditLogs(logs.items)
      } catch (error) {
        if (disposed) return
        const message = error instanceof Error ? error.message : '读取模型控制平面失败'
        setLoadError(message)
        toast({
          title: '模型控制平面不可用',
          description: message,
          variant: 'destructive',
        })
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      disposed = true
    }
  }, [token, toast])

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.providerId, item])),
    [providers]
  )

  const connectedCount = providers.filter((item) => item.health === 'healthy').length
  const enabledCount = providers.filter((item) => item.enabled).length
  const missingKeyCount = providers.filter((item) => {
    const catalog = getProviderCatalogItem(item.providerId)
    return item.enabled && !catalog.supportsKeyless && !item.keyConfigured && !item.apiKey.trim()
  }).length

  const updateProviderDraft = (
    providerId: LlmProviderId,
    patch: Partial<Omit<LlmProviderConfig, 'providerId'>>
  ) => {
    setProviders((previous) =>
      previous.map((item) =>
        item.providerId === providerId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    )
  }

  const updateRouteDraft = (
    routeId: LlmRouteProfileId,
    patch: Partial<Omit<LlmRouteProfileConfig, 'routeId'>>
  ) => {
    setRoutes((previous) =>
      previous.map((item) => (item.routeId === routeId ? { ...item, ...patch } : item))
    )
  }

  const updateAgentRouteDraft = (
    agentId: string,
    patch: Partial<Omit<LlmAgentRouteConfig, 'agentId'>>
  ) => {
    setAgentRoutes((previous) =>
      previous.map((item) => {
        if (item.agentId !== agentId) return item
        return {
          ...item,
          ...patch,
          agentId: item.agentId,
        }
      })
    )
  }

  const handleSaveProvider = async (providerId: LlmProviderId) => {
    const provider = providerMap.get(providerId)
    if (!provider) return
    if (!canManage) {
      toast({
        title: '当前角色为只读',
        description: '请使用具备“管理集成”权限的账号修改模型配置。',
      })
      return
    }

    setSavingProviderId(providerId)
    try {
      const snapshot = await saveLlmProviderConfig(
        providerId,
        {
          enabled: provider.enabled,
          apiKey: provider.apiKey.trim(),
          keySource: provider.keySource,
          keyEnvVar: provider.keyEnvVar.trim(),
          baseUrl: provider.baseUrl.trim(),
          defaultModel: provider.defaultModel.trim(),
          organization: provider.organization?.trim(),
        },
        token
      )
      setMode(snapshot.mode)
      setProviders(mergeProvidersWithCatalog(snapshot.providers))
      setRoutes(mergeRoutesWithLibrary(snapshot.routes))
      setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
      await refreshObservability()
      toast({
        title: '供应商配置已保存',
        description:
          snapshot.mode === 'remote'
            ? `${getProviderCatalogItem(providerId).label} 配置已同步到后端密钥网关。`
            : `${getProviderCatalogItem(providerId).label} 当前处于本地降级缓存模式，未落库到后端。`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存供应商配置失败'
      toast({
        title: '保存失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSavingProviderId(null)
    }
  }

  const handleTestProvider = async (providerId: LlmProviderId) => {
    setTestingProviderId(providerId)
    const { snapshot, result } = await testLlmProviderConnection(providerId, token)
    setMode(snapshot.mode)
    setProviders(mergeProvidersWithCatalog(snapshot.providers))
    setRoutes(mergeRoutesWithLibrary(snapshot.routes))
    setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
    await refreshObservability()
    setTestingProviderId(null)
    toast({
      title: result.ok ? '连通性检查通过' : '连通性检查失败',
      description:
        result.latencyMs !== null
          ? `${result.message} · ${result.latencyMs}ms`
          : result.message,
      variant: result.ok ? 'default' : 'destructive',
    })
  }

  const handleSaveRoutes = async () => {
    if (!canManage) {
      toast({
        title: '当前角色为只读',
        description: '请使用具备“管理集成”权限的账号修改路由策略。',
      })
      return
    }

    setIsSavingRoutes(true)
    try {
      const snapshot = await saveLlmRouteProfiles(routes, token)
      setMode(snapshot.mode)
      setProviders(mergeProvidersWithCatalog(snapshot.providers))
      setRoutes(mergeRoutesWithLibrary(snapshot.routes))
      setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
      await refreshObservability()
      toast({
        title: '路由策略已保存',
        description:
          snapshot.mode === 'remote'
            ? '多模型路由策略已下发到后端控制平面。'
            : '当前处于本地降级缓存模式，策略未写入后端控制平面。',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存路由策略失败'
      toast({
        title: '保存失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingRoutes(false)
    }
  }

  const handleResetLocalDefaults = async () => {
    if (strictLiveMode) {
      toast({
        title: '严格真实模式',
        description: '严格模式下已禁用本地模板重置，请直接修改并保存后端配置。',
        variant: 'destructive',
      })
      return
    }
    useLlmControlPlaneStore.getState().resetDefaults()
    const snapshot = await loadLlmControlPlane(token)
    setMode(snapshot.mode)
    setProviders(mergeProvidersWithCatalog(snapshot.providers))
    setRoutes(mergeRoutesWithLibrary(snapshot.routes))
    setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
    await refreshObservability()
    toast({
      title: '已恢复默认配置',
      description: '模型提供商与路由策略已重置为初始模板。',
    })
  }

  const handleSaveAgentRoutes = async () => {
    if (!canManage) {
      toast({
        title: '当前角色为只读',
        description: '请使用具备“管理集成”权限的账号修改 Agent 模型策略。',
      })
      return
    }

    setIsSavingAgentRoutes(true)
    try {
      const snapshot = await saveLlmAgentRoutes(agentRoutes, token)
      setMode(snapshot.mode)
      setProviders(mergeProvidersWithCatalog(snapshot.providers))
      setRoutes(mergeRoutesWithLibrary(snapshot.routes))
      setAgentRoutes(mergeAgentRoutesWithRoster(snapshot.agentRoutes))
      await refreshObservability()
      toast({
        title: 'Agent 模型策略已保存',
        description:
          snapshot.mode === 'remote'
            ? '12 位智能体专属模型参数已同步到后端控制平面。'
            : '当前处于本地降级缓存模式，策略未写入后端控制平面。',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存 Agent 模型策略失败'
      toast({
        title: '保存失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingAgentRoutes(false)
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_integrations" title="当前账号无权查看模型接入中心">
        <div className="space-y-4">
          {loadError ? (
            <Card className={panelClassName}>
              <CardContent className="flex flex-wrap items-start gap-3 px-5 py-4">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-red-300" />
                <p className="text-sm leading-6 text-red-100">
                  模型控制平面异常：{loadError}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    大模型接入中心
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    DeepSeek / Gemma 4 / Kimi 2.5 / Llama / OpenAI / Claude
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                    模式: {mode === 'remote' ? '后端控制平面' : '本地降级缓存'}
                  </Badge>
                  {!canManage ? (
                    <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">只读</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">已启用供应商</p>
                <p className="mt-2 text-2xl font-semibold text-white">{enabledCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">连通通过</p>
                <p className="mt-2 text-2xl font-semibold text-white">{connectedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">缺少 Key</p>
                <p className="mt-2 text-2xl font-semibold text-white">{missingKeyCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">路由策略数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{routes.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    运行监控与审计
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    过去 24 小时模型网关调用与错误追踪
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  onClick={refreshObservability}
                  disabled={isRefreshingObservability}
                >
                  <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                  {isRefreshingObservability ? '刷新中...' : '刷新监控'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">调用总量(24h)</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{monitorSummary?.totalEvents ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">成功率</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {monitorSummary ? `${(monitorSummary.successRate * 100).toFixed(1)}%` : '0.0%'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">平均延迟</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {typeof monitorSummary?.avgLatencyMs === 'number' ? `${monitorSummary.avgLatencyMs}ms` : '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">P95 延迟</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {typeof monitorSummary?.p95LatencyMs === 'number' ? `${monitorSummary.p95LatencyMs}ms` : '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                <p className="text-sm font-semibold text-white">最近审计日志</p>
                <div className="mt-3 space-y-2">
                  {auditLogs.length ? (
                    auditLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-slate-200">
                            <Badge
                              className={
                                log.success
                                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                                  : 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                              }
                            >
                              {log.success ? 'OK' : 'ERROR'}
                            </Badge>
                            <span>{log.action}</span>
                            <span className="text-slate-400">{log.actor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{log.timestamp.replace('T', ' ').slice(0, 19)}</span>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-400">
                          {log.providerId ? <span>Provider: {log.providerId}</span> : null}
                          {log.model ? <span>Model: {log.model}</span> : null}
                          <span>Status: {log.statusCode}</span>
                        </div>
                        <p className="mt-1 text-slate-300">{log.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">暂无审计日志。</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === 'local' ? (
            <Card className={panelClassName}>
              <CardContent className="flex flex-wrap items-start gap-3 px-5 py-4">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                <p className="text-sm leading-6 text-slate-200">
                  当前为本地降级缓存模式：API Key 与路由配置仅保存在浏览器，不具备生产级可靠性。请尽快恢复后端控制平面并完成服务端托管。
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>供应商与 API Key 配置</CardTitle>
                  <CardDescription className="text-slate-300">
                    Provider Registry & Credential Binding
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                  onClick={handleResetLocalDefaults}
                  disabled={strictLiveMode}
                >
                  <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                  恢复默认模板
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  正在加载模型控制平面配置...
                </div>
              ) : (
                LLM_PROVIDER_CATALOG.map((catalog) => {
                  const provider = providerMap.get(catalog.id)
                  if (!provider) return null

                  const isTesting = testingProviderId === catalog.id
                  const isSaving = savingProviderId === catalog.id
                  const hasReadyKey =
                    catalog.supportsKeyless || provider.keyConfigured || Boolean(provider.apiKey.trim())
                  const modelPresets = getProviderModelPresets(catalog.id)

                  return (
                    <div key={catalog.id} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{catalog.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{catalog.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getProviderStatusBadgeClass(provider.health)}>
                            {getProviderStatusLabel(provider.health)}
                          </Badge>
                          <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                            {provider.keySource === 'env' ? 'ENV Key' : '托管 Key'}
                          </Badge>
                          <Badge
                            className={
                              hasReadyKey
                                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                            }
                          >
                            {hasReadyKey ? 'Key Ready' : 'Key Missing'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`key-${catalog.id}`}>{catalog.apiKeyLabel}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`key-${catalog.id}`}
                              type={revealedKeys[catalog.id] ? 'text' : 'password'}
                              value={provider.apiKey}
                              onChange={(event) =>
                                updateProviderDraft(catalog.id, { apiKey: event.target.value })
                              }
                              placeholder={
                                provider.keySource === 'env'
                                  ? '已改为环境变量模式，前端不再保存明文 Key'
                                  : catalog.apiKeyPlaceholder
                              }
                              className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                              disabled={!canManage || provider.keySource === 'env'}
                              autoComplete="off"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                              onClick={() =>
                                setRevealedKeys((previous) => ({
                                  ...previous,
                                  [catalog.id]: !previous[catalog.id],
                                }))
                              }
                              disabled={!canManage || provider.keySource === 'env'}
                            >
                              {revealedKeys[catalog.id] ? '隐藏' : '显示'}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            {provider.keyConfigured
                              ? `已配置: ${provider.keyPreview || '已隐藏'}`
                              : provider.apiKey.trim()
                                ? `待保存: ${maskApiKey(provider.apiKey)}`
                                : '尚未配置 API Key'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`base-${catalog.id}`}>Base URL</Label>
                          <Input
                            id={`base-${catalog.id}`}
                            value={provider.baseUrl}
                            onChange={(event) =>
                              updateProviderDraft(catalog.id, { baseUrl: event.target.value })
                            }
                            placeholder={catalog.defaultBaseUrl}
                            className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                            disabled={!canManage}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`key-source-${catalog.id}`}>密钥来源</Label>
                          <select
                            id={`key-source-${catalog.id}`}
                            value={provider.keySource}
                            onChange={(event) =>
                              updateProviderDraft(catalog.id, {
                                keySource: event.target.value === 'env' ? 'env' : 'cookie',
                                apiKey: '',
                              })
                            }
                            className="h-10 w-full rounded-md border border-white/15 bg-white/[0.05] px-3 text-sm text-white focus:border-primary focus:outline-none"
                            disabled={!canManage}
                          >
                            <option value="cookie" className="bg-slate-900 text-white">
                              平台托管密钥（密文 Cookie）
                            </option>
                            <option value="env" className="bg-slate-900 text-white">
                              环境变量（推荐生产）
                            </option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`env-${catalog.id}`}>环境变量名</Label>
                          <Input
                            id={`env-${catalog.id}`}
                            value={provider.keyEnvVar}
                            onChange={(event) =>
                              updateProviderDraft(catalog.id, { keyEnvVar: event.target.value })
                            }
                            placeholder={catalog.defaultApiKeyEnvVar}
                            className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                            disabled={!canManage || provider.keySource !== 'env'}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`model-${catalog.id}`}>默认模型</Label>
                          <Input
                            id={`model-${catalog.id}`}
                            list={`model-options-${catalog.id}`}
                            value={provider.defaultModel}
                            onChange={(event) =>
                              updateProviderDraft(catalog.id, { defaultModel: event.target.value })
                            }
                            placeholder={modelPresets[0]?.id || 'custom-model-id'}
                            className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                            disabled={!canManage}
                          />
                          <datalist id={`model-options-${catalog.id}`}>
                            {modelPresets.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.label}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`enabled-${catalog.id}`}>是否启用</Label>
                          <div className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3">
                            <p className="text-xs text-slate-300">Provider Enabled</p>
                            <Switch
                              id={`enabled-${catalog.id}`}
                              checked={provider.enabled}
                              onCheckedChange={(checked) => updateProviderDraft(catalog.id, { enabled: checked })}
                              disabled={!canManage}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
                          onClick={() => handleTestProvider(catalog.id)}
                          disabled={isTesting || !canManage}
                        >
                          <PlugZap className="mr-1 h-3.5 w-3.5" />
                          {isTesting ? '检测中...' : '连通性测试'}
                        </Button>
                        <Button
                          type="button"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleSaveProvider(catalog.id)}
                          disabled={isSaving || !canManage}
                        >
                          <Save className="mr-1 h-3.5 w-3.5" />
                          {isSaving ? '保存中...' : '保存供应商'}
                        </Button>
                        {provider.lastTestAt ? (
                          <p className="text-xs text-slate-500">最近检测: {provider.lastTestAt.replace('T', ' ').slice(0, 19)}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>多模型路由策略</CardTitle>
                  <CardDescription className="text-slate-300">
                    Route by Scenario: default / reasoning / long context / low cost / agent
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSaveRoutes}
                  disabled={isSavingRoutes || !canManage}
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {isSavingRoutes ? '保存中...' : '保存路由策略'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {LLM_ROUTE_PROFILE_LIBRARY.map((template) => {
                const route = routes.find((item) => item.routeId === template.id)
                if (!route) return null
                const modelPresets = getProviderModelPresets(route.providerId)

                return (
                  <div key={template.id} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{template.label}</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{template.id}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{template.description}</p>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor={`route-provider-${template.id}`}>供应商</Label>
                        <select
                          id={`route-provider-${template.id}`}
                          value={route.providerId}
                          onChange={(event) => {
                            const nextProviderId = event.target.value as LlmProviderId
                            updateRouteDraft(template.id, {
                              providerId: nextProviderId,
                              model: getProviderDefaultModel(nextProviderId),
                            })
                          }}
                          className="h-10 w-full rounded-md border border-white/15 bg-white/[0.05] px-3 text-sm text-white focus:border-primary focus:outline-none"
                          disabled={!canManage}
                        >
                          {LLM_PROVIDER_CATALOG.map((item) => (
                            <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`route-model-${template.id}`}>模型</Label>
                        <Input
                          id={`route-model-${template.id}`}
                          list={`route-model-options-${template.id}`}
                          value={route.model}
                          onChange={(event) => updateRouteDraft(template.id, { model: event.target.value })}
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                        <datalist id={`route-model-options-${template.id}`}>
                          {modelPresets.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.label}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`route-temp-${template.id}`}>Temperature</Label>
                        <Input
                          id={`route-temp-${template.id}`}
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={route.temperature}
                          onChange={(event) =>
                            updateRouteDraft(template.id, {
                              temperature: Number.parseFloat(event.target.value || '0'),
                            })
                          }
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`route-max-${template.id}`}>Max Tokens</Label>
                        <Input
                          id={`route-max-${template.id}`}
                          type="number"
                          min={100}
                          max={8192}
                          step={100}
                          value={route.maxTokens}
                          onChange={(event) =>
                            updateRouteDraft(template.id, {
                              maxTokens: Number.parseInt(event.target.value || '1000', 10),
                            })
                          }
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Agent 专属模型策略</CardTitle>
                  <CardDescription className="text-slate-300">
                    为 12 位高管智能体分别设置 Provider / Model / Temperature / Max Tokens
                  </CardDescription>
                </div>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSaveAgentRoutes}
                  disabled={isSavingAgentRoutes || !canManage}
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {isSavingAgentRoutes ? '保存中...' : '保存 Agent 策略'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentRoutes.map((agentRoute) => {
                const profile = AGENT_PROFILES.find((item) => item.id === agentRoute.agentId)
                if (!profile) return null
                const modelPresets = getProviderModelPresets(agentRoute.providerId)

                return (
                  <div
                    key={agentRoute.agentId}
                    className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {profile.emoji} {profile.role} · {profile.name_zh}
                      </p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {profile.domain}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor={`agent-provider-${agentRoute.agentId}`}>供应商</Label>
                        <select
                          id={`agent-provider-${agentRoute.agentId}`}
                          value={agentRoute.providerId}
                          onChange={(event) => {
                            const nextProviderId = event.target.value as LlmProviderId
                            updateAgentRouteDraft(agentRoute.agentId, {
                              providerId: nextProviderId,
                              model: getProviderDefaultModel(nextProviderId),
                            })
                          }}
                          className="h-10 w-full rounded-md border border-white/15 bg-white/[0.05] px-3 text-sm text-white focus:border-primary focus:outline-none"
                          disabled={!canManage}
                        >
                          {LLM_PROVIDER_CATALOG.map((provider) => (
                            <option
                              key={provider.id}
                              value={provider.id}
                              className="bg-slate-900 text-white"
                            >
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`agent-model-${agentRoute.agentId}`}>模型</Label>
                        <Input
                          id={`agent-model-${agentRoute.agentId}`}
                          list={`agent-model-options-${agentRoute.agentId}`}
                          value={agentRoute.model}
                          onChange={(event) =>
                            updateAgentRouteDraft(agentRoute.agentId, { model: event.target.value })
                          }
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                        <datalist id={`agent-model-options-${agentRoute.agentId}`}>
                          {modelPresets.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.label}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`agent-temp-${agentRoute.agentId}`}>Temperature</Label>
                        <Input
                          id={`agent-temp-${agentRoute.agentId}`}
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={agentRoute.temperature}
                          onChange={(event) =>
                            updateAgentRouteDraft(agentRoute.agentId, {
                              temperature: Number.parseFloat(event.target.value || '0'),
                            })
                          }
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`agent-max-${agentRoute.agentId}`}>Max Tokens</Label>
                        <Input
                          id={`agent-max-${agentRoute.agentId}`}
                          type="number"
                          min={100}
                          max={8192}
                          step={100}
                          value={agentRoute.maxTokens}
                          onChange={(event) =>
                            updateAgentRouteDraft(agentRoute.agentId, {
                              maxTokens: Number.parseInt(event.target.value || '1000', 10),
                            })
                          }
                          className="border-white/15 bg-white/[0.05] text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                          disabled={!canManage}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                API 接口约定
              </CardTitle>
              <CardDescription className="text-slate-300">
                当前生产环境已落地并可实测的接口
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                <p className="font-medium text-white">控制平面接口</p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  `GET /api/llm/control-plane` · `PUT /api/llm/providers/:providerId` · `POST /api/llm/providers/:providerId/test` · `PUT /api/llm/routes` · `PUT /api/llm/agent-routes`
                </p>
                <Separator className="my-3 bg-white/10" />
                <p className="font-medium text-white">聊天推理接口</p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  `POST /api/chat/completions`，支持 `routeProfileId`、`provider`、`model` 与 `modelConfig` 路由参数。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#081538]/55 p-4">
                <p className="font-medium text-white">生产安全建议</p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  已支持 `ENV` 与 `托管密钥` 双模式；前端不再回显明文 API Key。所有关键动作已写入审计日志，可通过监控面板查看 24h 成功率、延迟与错误。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                当前页面已连接远程控制平面，可直接用于生产联调与问题追踪。
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
