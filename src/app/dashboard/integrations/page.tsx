'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ActivitySquare,
  BrainCircuit,
  Building2,
  Database,
  KeyRound,
  Link2,
  Shield,
  Store,
  Users,
  WalletCards,
  RefreshCcw,
} from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getRoleConfig, hasPermission } from '@/lib/access'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildApiUrl } from '@/lib/runtime-config'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/hooks/use-toast'

type ConnectorKey = 'gaya' | 'kingdee' | 'xiaoniu' | 'meituan'
type ConnectorRuntimeState = 'connected' | 'needs_config' | 'degraded'

interface ConnectorDefinition {
  key: ConnectorKey
  name: string
  type: string
  method: string
  scope: string
  risk: '高' | '中'
  sync: string
  endpoint: string
}

interface ConnectorRuntimeStatus {
  status: ConnectorRuntimeState
  message: string
  requiredEnvKeys: string[]
  missingEnvKeys: string[]
  hints: string[]
}

const parseBooleanFlag = (value: string | undefined, fallback = false) => {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const connectors: ConnectorDefinition[] = [
  {
    key: 'gaya',
    name: '盖雅',
    type: '人力资源 / 排班 / 考勤',
    method: 'API + 定时拉取',
    scope: '员工、班次、工时、人效',
    risk: '中',
    sync: '每 30 分钟',
    endpoint: '/api/integrations/gaya',
  },
  {
    key: 'kingdee',
    name: '金蝶',
    type: '财务 / 成本 / 利润',
    method: 'API / 中间库 / 文件推送',
    scope: '收入、成本、利润、科目余额',
    risk: '高',
    sync: '每 60 分钟',
    endpoint: '/api/integrations/kingdee',
  },
  {
    key: 'xiaoniu',
    name: '小牛',
    type: '进销存 / 原料流转',
    method: 'API + 增量同步',
    scope: '采购、库存、损耗、调拨',
    risk: '中',
    sync: '每 15 分钟',
    endpoint: '/api/integrations/xiaoniu',
  },
  {
    key: 'meituan',
    name: '美团',
    type: '会员 / 评价 / 外卖 / 到店',
    method: '开放平台 API',
    scope: '会员、消费、复购、评价、流量',
    risk: '中',
    sync: '每 20 分钟',
    endpoint: '/api/integrations/meituan',
  },
]

const connectorStatusLabelMap: Record<ConnectorRuntimeState, string> = {
  connected: '已连接',
  needs_config: '待配置',
  degraded: '配置异常',
}

const connectorStatusToneMap: Record<ConnectorRuntimeState, string> = {
  connected: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  needs_config: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  degraded: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
}

const securityPolicies = [
  {
    title: '后端统一接入，不在前端直连第三方',
    description: '后端接入 Backend Gateway',
    icon: Shield,
  },
  {
    title: '按租户隔离凭证、任务和数据域',
    description: '租户隔离 Tenant Isolation',
    icon: Building2,
  },
  {
    title: '默认只读，写回操作单独审批',
    description: '只读优先 Read-only First',
    icon: KeyRound,
  },
  {
    title: '全链路审计与告警',
    description: '审计告警 Audit Trail',
    icon: ActivitySquare,
  },
]

const architectureLayers = [
  {
    title: '连接器层',
    description: '连接外部系统 Connector Layer',
  },
  {
    title: '标准化层',
    description: '统一模型 Unified Model',
  },
  {
    title: '安全治理层',
    description: '安全治理 Security Layer',
  },
  {
    title: '驾驶舱消费层',
    description: '统一消费 Serving Layer',
  },
]

type IntegrationReadinessState = 'ready' | 'partial' | 'missing'

interface IntegrationReadinessItem {
  key: string
  title: string
  state: IntegrationReadinessState
  message: string
  updatedAt: string
  details: Record<string, unknown>
}

const readinessToneMap: Record<IntegrationReadinessState, string> = {
  ready: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  partial: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  missing: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
}

const readinessLabelMap: Record<IntegrationReadinessState, string> = {
  ready: '已就绪',
  partial: '部分就绪',
  missing: '未接入',
}

const toStringArray = (value: unknown, max = 24) => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max)
}

export default function IntegrationsPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const allowFinanceBaselineSeed = useMemo(
    () => parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_FINANCE_BASELINE_SEED, false) && !strictLiveMode,
    [strictLiveMode]
  )
  const roleConfig = getRoleConfig(user?.role)
  const canManage = hasPermission(user?.role, 'manage_integrations')
  const [activeConnectorKey, setActiveConnectorKey] = useState(connectors[0].key)
  const [connectorStatusMap, setConnectorStatusMap] = useState<Record<ConnectorKey, ConnectorRuntimeStatus>>({
    gaya: { status: 'needs_config', message: '等待检测连接状态', requiredEnvKeys: [], missingEnvKeys: [], hints: [] },
    kingdee: { status: 'needs_config', message: '等待检测连接状态', requiredEnvKeys: [], missingEnvKeys: [], hints: [] },
    xiaoniu: { status: 'needs_config', message: '等待检测连接状态', requiredEnvKeys: [], missingEnvKeys: [], hints: [] },
    meituan: { status: 'needs_config', message: '等待检测连接状态', requiredEnvKeys: [], missingEnvKeys: [], hints: [] },
  })
  const [financeLiveStatus, setFinanceLiveStatus] = useState<{
    mode: 'live' | 'fallback'
    updatedAt: string
    source: string
    totalScopes: number
    message: string
  }>({
    mode: 'fallback',
    updatedAt: '',
    source: 'none',
    totalScopes: 0,
    message: '尚未读取实时口径状态',
  })
  const [isSyncingFinanceLive, setIsSyncingFinanceLive] = useState(false)
  const [isTestingKingdee, setIsTestingKingdee] = useState(false)
  const [isSeedingFinanceLive, setIsSeedingFinanceLive] = useState(false)
  const [readinessItems, setReadinessItems] = useState<IntegrationReadinessItem[]>([])
  const [readinessScore, setReadinessScore] = useState(0)
  const [isRefreshingReadiness, setIsRefreshingReadiness] = useState(false)
  const activeConnector = useMemo(
    () => connectors.find((item) => item.key === activeConnectorKey) || connectors[0],
    [activeConnectorKey]
  )

  const activeConnectorRuntimeStatus = connectorStatusMap[activeConnector.key]

  const copyActiveConnectorMissingEnv = useCallback(async () => {
    const missingKeys = activeConnectorRuntimeStatus.missingEnvKeys
    if (missingKeys.length <= 0) {
      toast({
        title: '当前连接器已完整配置',
        description: `${activeConnector.name} 暂无待配置环境变量。`,
      })
      return
    }
    try {
      await navigator.clipboard.writeText(missingKeys.join('\n'))
      toast({
        title: '已复制待配置项',
        description: `已复制 ${missingKeys.length} 个环境变量名，可直接发给运维配置。`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '复制失败'
      toast({
        title: '复制失败',
        description: message,
        variant: 'destructive',
      })
    }
  }, [activeConnector.name, activeConnectorRuntimeStatus.missingEnvKeys, toast])

  const loadConnectorStatuses = useCallback(async () => {
    const response = await fetch(buildApiUrl('/integrations/status'), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string'
          ? payload.message
          : `读取连接器状态失败 (${response.status})`
      )
    }
    const items = Array.isArray(payload?.items) ? payload.items : []
    setConnectorStatusMap((previous) => {
      const next = { ...previous }
      for (const item of items) {
        const key = typeof item?.key === 'string' ? item.key : ''
        if (!(key in next)) continue
        const status = item?.status === 'connected' || item?.status === 'degraded' ? item.status : 'needs_config'
        next[key as ConnectorKey] = {
          status,
          message:
            typeof item?.message === 'string' && item.message.trim()
              ? item.message.trim()
              : '状态已同步',
          requiredEnvKeys: toStringArray(item?.requiredEnvKeys),
          missingEnvKeys: toStringArray(item?.missingEnvKeys),
          hints: toStringArray(item?.hints, 8),
        }
      }
      return next
    })
  }, [token])

  const loadReadiness = useCallback(async () => {
    setIsRefreshingReadiness(true)
    try {
      const response = await fetch(buildApiUrl('/integrations/readiness'), {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string'
            ? payload.message
            : `读取接入就绪度失败 (${response.status})`
        )
      }
      setReadinessItems(
        Array.isArray(payload?.items)
          ? (payload.items as IntegrationReadinessItem[])
          : []
      )
      setReadinessScore(
        typeof payload?.score === 'number' && Number.isFinite(payload.score) ? payload.score : 0
      )
    } finally {
      setIsRefreshingReadiness(false)
    }
  }, [token])

  const loadFinanceLiveStatus = useCallback(async (syncRemote = false) => {
    const params = new URLSearchParams({
      scope: 'global',
      includeChildren: '0',
      sync: syncRemote ? '1' : '0',
      autoseed: '0',
    })
    const response = await fetch(buildApiUrl(`/finance/live?${params.toString()}`), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' && payload.message.trim()
          ? payload.message.trim()
          : `读取实时财务状态失败 (${response.status})`
      )
    }
    setFinanceLiveStatus({
      mode: payload?.mode === 'live' ? 'live' : 'fallback',
      updatedAt: typeof payload?.updatedAt === 'string' ? payload.updatedAt : '',
      source: typeof payload?.source === 'string' ? payload.source : 'none',
      totalScopes:
        typeof payload?.totalScopes === 'number' && Number.isFinite(payload.totalScopes)
          ? payload.totalScopes
          : 0,
      message: typeof payload?.message === 'string' ? payload.message : '读取完成',
    })
  }, [token])

  const testKingdeeConnection = useCallback(async () => {
    const response = await fetch(buildApiUrl('/integrations/kingdee/test'), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' && payload.message.trim()
          ? payload.message.trim()
          : `金蝶连接测试失败 (${response.status})`
      )
    }
    return payload as {
      message?: string
      probe?: { rowCount?: number; scopeCount?: number }
    }
  }, [token])

  const seedFinanceLiveBaseline = useCallback(async () => {
    const response = await fetch(buildApiUrl('/finance/live'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        seedAllScopes: true,
        source: 'manual-baseline-seed',
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(
        typeof payload?.message === 'string' && payload.message.trim()
          ? payload.message.trim()
          : `初始化全域财务明细失败 (${response.status})`
      )
    }

    return payload as {
      upserted?: number
      seededScopes?: number
      message?: string
    }
  }, [token])

  useEffect(() => {
    void loadFinanceLiveStatus(false).catch((error) => {
      const message = error instanceof Error ? error.message : '读取实时财务状态失败'
      setFinanceLiveStatus((previous) => ({
        ...previous,
        mode: 'fallback',
        message,
      }))
    })
  }, [loadFinanceLiveStatus])

  useEffect(() => {
    void loadConnectorStatuses().catch((error) => {
      const message = error instanceof Error ? error.message : '读取连接器状态失败'
      toast({
        title: '连接器状态读取失败',
        description: message,
        variant: 'destructive',
      })
    })
  }, [loadConnectorStatuses, toast])

  useEffect(() => {
    void loadReadiness().catch((error) => {
      const message = error instanceof Error ? error.message : '读取数据就绪度失败'
      toast({
        title: '接入就绪度读取失败',
        description: message,
        variant: 'destructive',
      })
    })
  }, [loadReadiness, toast])

  return (
    <DashboardLayout>
      <AccessGuard permission="view_integrations" title="当前账号无权查看系统集成中心">
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Link2 className="h-3.5 w-3.5" />
                    统一接入 Unified Integration
                  </div>
                  <div>
                    <CardTitle>系统集成中心</CardTitle>
                    <CardDescription>
                      接口治理 Integration Governance
                    </CardDescription>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
                  <div>当前角色: {roleConfig.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {canManage ? '可管理 Manage Enabled' : '只读 Read Only'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {connectors.map((connector) => {
                const runtime = connectorStatusMap[connector.key]
                return (
                  <button
                    key={connector.name}
                    type="button"
                    onClick={() => setActiveConnectorKey(connector.key)}
                    className={`rounded-2xl border bg-slate-950/35 text-left text-white transition-all ${
                      connector.key === activeConnectorKey
                        ? 'border-primary/45 shadow-[0_0_0_1px_rgba(126,167,255,0.3)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                          {connector.name === '盖雅' ? (
                            <Users className="h-5 w-5" />
                          ) : connector.name === '金蝶' ? (
                            <WalletCards className="h-5 w-5" />
                          ) : connector.name === '小牛' ? (
                            <Store className="h-5 w-5" />
                          ) : (
                            <Database className="h-5 w-5" />
                          )}
                        </div>
                        <Badge
                          className={
                            connector.risk === '高'
                              ? 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                              : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                          }
                        >
                          风险 {connector.risk}
                        </Badge>
                      </div>
                      <p className="mt-4 font-medium">{connector.name}</p>
                      <p className="mt-2 text-sm text-slate-300">{connector.type}</p>
                      <div className="mt-3 text-xs leading-5 text-slate-500">
                        <div>接入方式: {connector.method}</div>
                        <div className="mt-1">数据范围: {connector.scope}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={connectorStatusToneMap[runtime.status]}>
                          {connectorStatusLabelMap[runtime.status]}
                        </Badge>
                        {runtime.missingEnvKeys.length > 0 ? (
                          <span className="text-[11px] text-amber-300/80">
                            待配置 {runtime.missingEnvKeys.length} 项
                          </span>
                        ) : null}
                        <span className="text-[11px] text-slate-400">{runtime.message}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>真实数据接入就绪度</CardTitle>
                  <CardDescription>
                    模块上线 Readiness
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                    {(readinessScore * 100).toFixed(0)}%
                  </Badge>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                    onClick={() => {
                      void loadReadiness().catch((error) => {
                        const message = error instanceof Error ? error.message : '刷新失败'
                        toast({
                          title: '刷新失败',
                          description: message,
                          variant: 'destructive',
                        })
                      })
                    }}
                    disabled={isRefreshingReadiness}
                  >
                    <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                    {isRefreshingReadiness ? '刷新中...' : '刷新'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-5">
              {readinessItems.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-6 text-sm text-slate-400">
                  暂无就绪度数据。
                </div>
              ) : (
                readinessItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <Badge className={readinessToneMap[item.state]}>{readinessLabelMap[item.state]}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{item.message}</p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      更新时间: {item.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '--'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI 模型接入中心
                  </CardTitle>
                  <CardDescription>
                    DeepSeek / Gemma 4 / Kimi 2.5 / Llama / OpenAI / Claude
                  </CardDescription>
                </div>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/integrations/llm/">
                    进入模型配置
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {[
                ['模型供应商', '6', '开源 + 闭源统一治理'],
                ['推荐路由策略', '5', '默认 / 推理 / 长上下文 / 成本 / Agent'],
                ['Key 托管建议', '后端', '前端不直存生产密钥'],
                ['聊天接口增强', '已兼容', 'provider + model + routeProfile'],
              ].map(([title, value, desc]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs text-slate-400">{title}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    实时财务数据接入
                  </CardTitle>
                  <CardDescription>
                    Scope / Segment / Component 真实口径 API
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      financeLiveStatus.mode === 'live'
                        ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                        : 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/15'
                    }
                  >
                    {financeLiveStatus.mode === 'live' ? '实时口径已启用' : '实时口径未接入'}
                  </Badge>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                    onClick={() => {
                      void loadFinanceLiveStatus(false).catch((error) => {
                        const message = error instanceof Error ? error.message : '刷新实时口径状态失败'
                        toast({
                          title: '刷新失败',
                          description: message,
                          variant: 'destructive',
                        })
                      })
                    }}
                  >
                    <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                    刷新状态
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs text-slate-400">口径模式</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {financeLiveStatus.mode === 'live' ? 'Live Data' : 'Not Connected'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs text-slate-400">最新时间</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {financeLiveStatus.updatedAt
                      ? new Date(financeLiveStatus.updatedAt).toLocaleString('zh-CN', { hour12: false })
                      : '--'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs text-slate-400">数据来源</p>
                  <p className="mt-2 text-sm font-semibold text-white">{financeLiveStatus.source || '--'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs text-slate-400">覆盖范围</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {financeLiveStatus.totalScopes} 个 Scope
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {allowFinanceBaselineSeed ? (
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                    disabled={!canManage || isSeedingFinanceLive}
                    onClick={() => {
                      if (!canManage) {
                        toast({
                          title: '权限不足',
                          description: '请使用具备“管理集成”权限的账号执行全域初始化。',
                          variant: 'destructive',
                        })
                        return
                      }
                      setIsSeedingFinanceLive(true)
                      void seedFinanceLiveBaseline()
                        .then((result) => {
                          toast({
                            title: '初始化完成',
                            description: `已写入 ${result.upserted || 0} 个范围明细。`,
                          })
                          return loadFinanceLiveStatus(false)
                        })
                        .catch((error) => {
                          const message = error instanceof Error ? error.message : '初始化失败'
                          toast({
                            title: '初始化失败',
                            description: message,
                            variant: 'destructive',
                          })
                        })
                        .finally(() => {
                          setIsSeedingFinanceLive(false)
                        })
                    }}
                  >
                    {isSeedingFinanceLive ? '初始化中...' : '一键初始化全域明细'}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                  disabled={!canManage || isTestingKingdee}
                  onClick={() => {
                    if (!canManage) {
                      toast({
                        title: '权限不足',
                        description: '请使用具备“管理集成”权限的账号测试金蝶连接。',
                        variant: 'destructive',
                      })
                      return
                    }
                    setIsTestingKingdee(true)
                    void testKingdeeConnection()
                      .then((result) => {
                        const rowCount = result.probe?.rowCount || 0
                        const scopeCount = result.probe?.scopeCount || 0
                        toast({
                          title: '金蝶连接成功',
                          description:
                            result.message ||
                            `已拉取 ${rowCount} 行，映射 ${scopeCount} 个范围。`,
                        })
                      })
                      .catch((error) => {
                        const message = error instanceof Error ? error.message : '金蝶连接测试失败'
                        toast({
                          title: '连接测试失败',
                          description: message,
                          variant: 'destructive',
                        })
                      })
                      .finally(() => {
                        setIsTestingKingdee(false)
                      })
                  }}
                >
                  {isTestingKingdee ? '测试中...' : '测试金蝶连接'}
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!canManage || isSyncingFinanceLive}
                  onClick={() => {
                    if (!canManage) {
                      toast({
                        title: '权限不足',
                        description: '请使用具备“管理集成”权限的账号执行远程同步。',
                        variant: 'destructive',
                      })
                      return
                    }
                    setIsSyncingFinanceLive(true)
                    void loadFinanceLiveStatus(true)
                      .then(() => {
                        toast({
                          title: '同步完成',
                          description: '已触发真实财务数据远程同步并刷新当前状态。',
                        })
                      })
                      .catch((error) => {
                        const message = error instanceof Error ? error.message : '远程同步失败'
                        toast({
                          title: '同步失败',
                          description: message,
                          variant: 'destructive',
                        })
                      })
                      .finally(() => {
                        setIsSyncingFinanceLive(false)
                      })
                  }}
                >
                  {isSyncingFinanceLive ? '同步中...' : '触发远程同步'}
                </Button>
                <span className="text-xs text-slate-500">/api/finance/live?scope=...</span>
                <p className="text-xs text-slate-400">{financeLiveStatus.message}</p>
              </div>
              {!allowFinanceBaselineSeed ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
                  当前环境已关闭基线种子写入，所有财务口径必须来自真实数据源。
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>连接器详情</CardTitle>
                  <CardDescription>连接详情 Connector Detail</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/12 text-primary hover:bg-primary/12">{activeConnector.name}</Badge>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                    onClick={() => {
                      void copyActiveConnectorMissingEnv()
                    }}
                  >
                    复制待配置项
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">连接状态</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={connectorStatusToneMap[activeConnectorRuntimeStatus.status]}>
                    {connectorStatusLabelMap[activeConnectorRuntimeStatus.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{activeConnectorRuntimeStatus.message}</p>
                {activeConnectorRuntimeStatus.missingEnvKeys.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-2.5">
                    <p className="text-[11px] font-medium text-amber-100">
                      待配置环境变量 ({activeConnectorRuntimeStatus.missingEnvKeys.length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeConnectorRuntimeStatus.missingEnvKeys.slice(0, 8).map((item) => (
                        <span
                          key={item}
                          className="rounded-md border border-amber-300/20 bg-slate-900/50 px-1.5 py-0.5 text-[10px] text-amber-100"
                        >
                          {item}
                        </span>
                      ))}
                      {activeConnectorRuntimeStatus.missingEnvKeys.length > 8 ? (
                        <span className="rounded-md border border-white/10 bg-slate-900/50 px-1.5 py-0.5 text-[10px] text-slate-300">
                          +{activeConnectorRuntimeStatus.missingEnvKeys.length - 8}
                        </span>
                      ) : null}
                    </div>
                    {activeConnectorRuntimeStatus.hints.length > 0 ? (
                      <p className="mt-2 text-[11px] text-amber-200/80">
                        {activeConnectorRuntimeStatus.hints[0]}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2.5">
                    <p className="text-[11px] text-emerald-100">配置已完整，可执行实时拉取。</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">同步频率</p>
                <p className="mt-2 text-lg font-semibold text-white">{activeConnector.sync}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">API 路径</p>
                <p className="mt-2 text-sm font-medium text-slate-200">{activeConnector.endpoint}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">数据域</p>
                <p className="mt-2 text-sm font-medium text-slate-200">{activeConnector.scope}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>合理安全的对接原则</CardTitle>
                    <CardDescription>
                      对接原则 Integration Rules
                    </CardDescription>
                  </div>
                  {canManage && (
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() =>
                        toast({
                          title: '连接器配置向导',
                          description: '已进入新连接器创建流程，请选择系统类型与认证方式。',
                        })
                      }
                    >
                      配置新连接器
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityPolicies.map((policy) => {
                  const Icon = policy.icon
                  return (
                    <div key={policy.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{policy.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{policy.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>推荐的集成架构分层</CardTitle>
                <CardDescription>
                  四层架构 4-Layer Architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {architectureLayers.map((layer, index) => (
                  <div key={layer.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                        L{index + 1}
                      </Badge>
                      <p className="font-medium text-white">{layer.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{layer.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>接入时必须满足的安全要求</CardTitle>
              <CardDescription>
                安全基线 Security Baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {[
                '凭证后端保管 Credentials in Backend',
                '租户独立配置 Tenant-specific Config',
                '写回需审批 Writeback with Approval',
                '关键系统白名单与签名 IP + Signature',
              ].map((rule) => (
                <div key={rule} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">
                  {rule}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
