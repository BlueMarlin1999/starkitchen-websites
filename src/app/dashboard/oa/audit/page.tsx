'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  fetchOaAudit,
  OaActorContext,
  OaAuditAction,
  OaAuditEvent,
  OaAuditQueryResult,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { RefreshCw, Shield, ShieldAlert, SignalHigh, UserRoundCheck } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const actionOptions: Array<{ label: string; value: '' | OaAuditAction }> = [
  { label: '全部动作', value: '' },
  { label: '会话创建', value: 'room.create' },
  { label: '会话读取', value: 'room.read' },
  { label: '消息读取', value: 'chat.read' },
  { label: '消息发送', value: 'chat.message.send' },
  { label: '文件上传', value: 'file.upload' },
  { label: '文件列表', value: 'file.read' },
  { label: '文件下载', value: 'file.download' },
  { label: '通话创建', value: 'call.create' },
  { label: '通话读取', value: 'call.read' },
  { label: '会议创建', value: 'meeting.create' },
  { label: '会议读取', value: 'meeting.read' },
  { label: '审计读取', value: 'audit.read' },
]

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export default function OaAuditPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [actorFilter, setActorFilter] = useState('')
  const [actionFilter, setActionFilter] = useState<'' | OaAuditAction>('')
  const [page, setPage] = useState(1)
  const [size] = useState(50)
  const [result, setResult] = useState<OaAuditQueryResult>({
    items: [],
    total: 0,
    page: 1,
    size,
    summary: {
      uniqueIpCount: 0,
      uniqueActorCount: 0,
      failedCount: 0,
      todayCount: 0,
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (nextPage = 1, actorIdFilter = actorFilter.trim()) => {
    setIsLoading(true)
    setError('')
    try {
      const payload = await fetchOaAudit(
        {
          page: nextPage,
          size,
          actorId: actorIdFilter || undefined,
          action: actionFilter || undefined,
        },
        token,
        actor
      )
      setResult(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取审计失败')
    } finally {
      setIsLoading(false)
    }
  }, [actionFilter, actor, actorFilter, size, token])

  useEffect(() => {
    void load(1)
    setPage(1)
  }, [load])

  const pageCount = Math.max(1, Math.ceil((result.total || 0) / size))

  const SummaryCard = ({
    title,
    value,
    sub,
    icon: Icon,
  }: {
    title: string
    value: string | number
    sub: string
    icon: typeof Shield
  }) => (
    <Card className={panelClassName}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-300">{title}</p>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout>
      <AccessGuard permission="manage_access_control" title="当前账号无权访问 OA 审计中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>OA 监控审计中心</CardTitle>
                  <CardDescription>Real-time IP / Geo / Action Trace</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => void load(page)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard
                  title="今日事件"
                  value={result.summary.todayCount}
                  sub="24h内可见窗口"
                  icon={SignalHigh}
                />
                <SummaryCard
                  title="独立 IP"
                  value={result.summary.uniqueIpCount}
                  sub="来源地址数量"
                  icon={Shield}
                />
                <SummaryCard
                  title="独立操作人"
                  value={result.summary.uniqueActorCount}
                  sub="活跃账号数"
                  icon={UserRoundCheck}
                />
                <SummaryCard
                  title="失败事件"
                  value={result.summary.failedCount}
                  sub="异常动作需复盘"
                  icon={ShieldAlert}
                />
              </div>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                  <label className="space-y-1 text-xs text-slate-400">
                    操作人筛选
                    <Input
                      value={actorFilter}
                      onChange={(event) => setActorFilter(event.target.value)}
                      placeholder="employeeId / actorId"
                      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    动作筛选
                    <select
                      value={actionFilter}
                      onChange={(event) => setActionFilter(event.target.value as '' | OaAuditAction)}
                      className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    >
                      {actionOptions.map((item) => (
                        <option key={item.value || 'all'} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                <Button
                  className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    setPage(1)
                    void load(1, actorFilter.trim())
                  }}
                >
                  应用筛选
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                    onClick={() => {
                    setActorFilter('')
                    setActionFilter('')
                    setPage(1)
                    void load(1, '')
                  }}
                >
                  清空
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="space-y-2 p-3">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="text-xs text-slate-300">
                        <tr className="border-b border-white/10">
                          <th className="px-2 py-2">时间</th>
                          <th className="px-2 py-2">操作人</th>
                          <th className="px-2 py-2">动作</th>
                          <th className="px-2 py-2">IP</th>
                          <th className="px-2 py-2">地理位置</th>
                          <th className="px-2 py-2">状态</th>
                          <th className="px-2 py-2">消息</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item: OaAuditEvent) => (
                          <tr key={item.id} className="border-b border-white/5 text-slate-200">
                            <td className="px-2 py-2 whitespace-nowrap">{formatTime(item.timestamp)}</td>
                            <td className="px-2 py-2 whitespace-nowrap">{item.actorName}</td>
                            <td className="px-2 py-2">
                              <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{item.action}</Badge>
                            </td>
                            <td className="px-2 py-2 font-mono text-xs">{item.ipAddress}</td>
                            <td className="px-2 py-2">
                              {item.geo.country} / {item.geo.region} / {item.geo.city}
                            </td>
                            <td className="px-2 py-2">
                              <Badge
                                className={
                                  item.success
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                                    : 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                                }
                              >
                                {item.success ? '成功' : '失败'}
                              </Badge>
                            </td>
                            <td className="px-2 py-2 text-xs text-slate-300">{item.message || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {result.items.length === 0 && !isLoading ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                      当前暂无审计数据
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">
                      第 {page} / {pageCount} 页，累计 {result.total} 条
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                        disabled={page <= 1}
                        onClick={() => {
                          const nextPage = Math.max(1, page - 1)
                          setPage(nextPage)
                          void load(nextPage)
                        }}
                      >
                        上一页
                      </Button>
                      <Button
                        className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={page >= pageCount}
                        onClick={() => {
                          const nextPage = Math.min(pageCount, page + 1)
                          setPage(nextPage)
                          void load(nextPage)
                        }}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-red-400/25 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
