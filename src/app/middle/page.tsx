'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PencilLine, RefreshCw, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import {
  MiddleMetricCard,
  MiddleMetricsPayload,
  MiddleMetricSource,
  MiddleMetricKey,
} from '@/lib/middle-metrics'
import { clearMiddleManualMetric, fetchMiddleMetrics, saveMiddleManualMetric } from '@/lib/middle-metrics-client'

const ALLOWED_ROLES = new Set(['manager', 'supervisor'])
const normalizeRole = (value?: string) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const formatDateTime = (value: string) => {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

const parseEditableValue = (raw: string) => {
  const sanitized = raw.replace(/[^0-9.+-]/g, '').trim()
  if (!sanitized) return null
  const parsed = Number(sanitized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

const resolveMetricStyle = (source: MiddleMetricSource) =>
  source === 'manual'
    ? {
        cardClassName: 'border-amber-300/35 bg-[linear-gradient(150deg,rgba(120,74,19,0.45),rgba(28,24,36,0.92))]',
        valueClassName: 'text-amber-200',
        badgeClassName: 'border-amber-300/40 bg-amber-500/15 text-amber-100',
      }
    : {
        cardClassName:
          'border-white/15 bg-[linear-gradient(145deg,rgba(19,36,74,0.88),rgba(12,26,56,0.9))]',
        valueClassName: 'text-white',
        badgeClassName: 'border-sky-300/35 bg-sky-500/15 text-sky-100',
      }

export default function MiddleDashboardPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, hasHydrated, logout } = useAuthStore()
  const role = normalizeRole(user?.role)
  const allowed = ALLOWED_ROLES.has(role)
  const [metricsPayload, setMetricsPayload] = useState<MiddleMetricsPayload | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [savingMetricKey, setSavingMetricKey] = useState<MiddleMetricKey | ''>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/middle/login/')
      return
    }
    if (!allowed) {
      logout()
      router.replace('/middle/login/')
    }
  }, [allowed, hasHydrated, isAuthenticated, logout, router])

  const loadMetrics = useCallback(async () => {
    if (!token) return
    setLoadingMetrics(true)
    setError('')
    try {
      const payload = await fetchMiddleMetrics(token)
      setMetricsPayload(payload)
      setMessage('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载中层数据失败，请稍后重试。')
    } finally {
      setLoadingMetrics(false)
    }
  }, [token])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !allowed || !token) return
    void loadMetrics()
  }, [allowed, hasHydrated, isAuthenticated, loadMetrics, token])

  const metrics = useMemo(() => metricsPayload?.metrics || [], [metricsPayload?.metrics])
  const history = useMemo(() => metricsPayload?.history || [], [metricsPayload?.history])

  const handleManualWrite = useCallback(
    async (metric: MiddleMetricCard) => {
      if (!token || savingMetricKey) return
      const rawInput = window.prompt(
        `手工录入「${metric.label}」\n${metric.inputHint}`,
        String(metric.value)
      )
      if (rawInput === null) return

      const value = parseEditableValue(rawInput)
      if (value === null) {
        window.alert('录入失败：请输入有效数字。')
        return
      }
      const note =
        window.prompt(
          '可选：填写备注（如来源系统、填报原因）',
          metric.note || '手工补录（系统未接通）'
        ) || ''

      setSavingMetricKey(metric.key)
      setError('')
      setMessage('')
      try {
        const response = await saveMiddleManualMetric(token, {
          metricKey: metric.key,
          value,
          note,
        })
        setMetricsPayload(response.payload)
        setMessage(response.message)
      } catch (writeError) {
        setError(writeError instanceof Error ? writeError.message : '手工录入失败，请稍后重试。')
      } finally {
        setSavingMetricKey('')
      }
    },
    [savingMetricKey, token]
  )

  const handleRestoreAuto = useCallback(
    async (metric: MiddleMetricCard) => {
      if (!token || savingMetricKey) return
      const confirmed = window.confirm(`确认将「${metric.label}」恢复为系统自动数据？`)
      if (!confirmed) return

      setSavingMetricKey(metric.key)
      setError('')
      setMessage('')
      try {
        const response = await clearMiddleManualMetric(token, metric.key)
        setMetricsPayload(response.payload)
        setMessage(response.message)
      } catch (restoreError) {
        setError(
          restoreError instanceof Error ? restoreError.message : '恢复系统自动数据失败，请稍后重试。'
        )
      } finally {
        setSavingMetricKey('')
      }
    },
    [savingMetricKey, token]
  )

  if (!hasHydrated || !isAuthenticated || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        正在进入中层驾驶舱...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#284a88_0%,#132e5c_45%,#0a1c3d_100%)] p-4 md:p-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Card className="border-white/15 bg-slate-950/55 text-white backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">中层管理驾驶舱</CardTitle>
              <CardDescription className="text-slate-300">
                项目经理 / 厨师长专页：支持右键手工录入，手工与系统数据颜色区分
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                当前账号：{user?.name || user?.employeeId}
              </span>
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={() => {
                  logout()
                  router.replace('/middle/login/')
                }}
              >
                退出
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-sky-300/35 bg-sky-500/15 px-3 py-1 text-sky-100">
                系统自动导入
              </span>
              <span className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-amber-100">
                手工录入
              </span>
              <span className="text-slate-300">右键卡片或点击“录入/修改”可写入数据</span>
            </div>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
              onClick={() => void loadMetrics()}
              disabled={loadingMetrics}
            >
              {loadingMetrics ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新数据
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-300/30 bg-red-500/10 text-red-100">
            <CardContent className="p-4 text-sm">{error}</CardContent>
          </Card>
        ) : null}
        {message ? (
          <Card className="border-emerald-300/30 bg-emerald-500/10 text-emerald-100">
            <CardContent className="p-4 text-sm">{message}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metrics.map((item) => {
            const styles = resolveMetricStyle(item.source)
            const isSaving = savingMetricKey === item.key
            return (
            <Card
              key={item.key}
              className={cn(styles.cardClassName, 'text-white transition-all')}
              onContextMenu={(event) => {
                event.preventDefault()
                void handleManualWrite(item)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-300">{item.label}</p>
                  <span className={cn(styles.badgeClassName, 'rounded-full border px-2 py-0.5 text-[10px]')}>
                    {item.sourceLabel}
                  </span>
                </div>
                <p className={cn(styles.valueClassName, 'mt-2 text-2xl font-semibold')}>{item.displayValue}</p>
                <p className="mt-1 text-[11px] text-slate-300/90">{item.hint}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  更新：{formatDateTime(item.updatedAt)} · {item.updatedBy}
                </p>
                {item.note ? <p className="mt-1 text-[11px] text-slate-400">备注：{item.note}</p> : null}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                    disabled={Boolean(savingMetricKey)}
                    onClick={() => void handleManualWrite(item)}
                  >
                    {isSaving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PencilLine className="mr-1 h-3.5 w-3.5" />}
                    录入/修改
                  </Button>
                  {item.source === 'manual' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-300/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                      disabled={Boolean(savingMetricKey)}
                      onClick={() => void handleRestoreAuto(item)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      恢复自动
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>

        <Card className="border-white/15 bg-slate-950/55 text-white backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">手工录入历史（最近 30 条）</CardTitle>
            <CardDescription className="text-slate-300">
              已累计 {metricsPayload?.manualCount || 0} 条手工记录，支持后续追溯与分析
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">
                暂无手工录入记录。你可以从上方卡片右键或点击“录入/修改”开始积累数据。
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"
                >
                  <p className="font-medium">
                    {item.label} · {item.displayValue}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    录入人：{item.actorName}（{item.actorId}） · 角色：{normalizeRole(item.actorRole)} · 时间：
                    {formatDateTime(item.createdAt)}
                  </p>
                  {item.note ? <p className="mt-1 text-xs text-slate-300">备注：{item.note}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
