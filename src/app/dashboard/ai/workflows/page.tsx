'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  AI_AGENT_CAPABILITY_LIBRARY,
  AiAgentCapabilityId,
  getAiAgentCapabilityById,
} from '@/lib/ai-agent-capabilities'
import {
  AiWorkflowItem,
  AiWorkflowStatus,
  createAiWorkflow,
  fetchAiWorkflows,
  updateAiWorkflow,
} from '@/lib/ai-workflows'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const statusLabel: Record<AiWorkflowStatus, string> = {
  draft: '草稿',
  submitted: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  executing: '执行中',
  completed: '已完成',
  failed: '失败',
}

const statusClassName: Record<AiWorkflowStatus, string> = {
  draft: 'bg-white/10 text-slate-200 hover:bg-white/10',
  submitted: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  approved: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  rejected: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  executing: 'bg-[#7ca5ff]/20 text-[#b8d8ff] hover:bg-[#7ca5ff]/20',
  completed: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  failed: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
}

export default function AiWorkflowPage() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<AiWorkflowItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | AiWorkflowStatus>('all')
  const [selectedCapability, setSelectedCapability] = useState<'all' | AiAgentCapabilityId>('all')
  const [createCapabilityId, setCreateCapabilityId] = useState<AiAgentCapabilityId>('contract_review')
  const [createPrompt, setCreatePrompt] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [patchBusyId, setPatchBusyId] = useState('')

  const loadItems = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const responseItems = await fetchAiWorkflows(token)
      setItems(responseItems)
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取审批工单失败'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchStatus = selectedStatus === 'all' || item.status === selectedStatus
        const matchCapability = selectedCapability === 'all' || item.capabilityId === selectedCapability
        return matchStatus && matchCapability
      }),
    [items, selectedCapability, selectedStatus]
  )

  const summary = useMemo(() => {
    const submitted = items.filter((item) => item.status === 'submitted').length
    const approved = items.filter((item) => item.status === 'approved').length
    const executing = items.filter((item) => item.status === 'executing').length
    const completed = items.filter((item) => item.status === 'completed').length
    return {
      total: items.length,
      submitted,
      approved,
      executing,
      completed,
    }
  }, [items])

  const createWorkflowTask = async () => {
    if (!createPrompt.trim()) return
    const capability = getAiAgentCapabilityById(createCapabilityId)
    if (!capability) return

    setCreateBusy(true)
    setErrorMessage('')
    try {
      await createAiWorkflow(
        {
          capabilityId: createCapabilityId,
          prompt: createPrompt,
          routeId: capability.recommendedRoute,
          providerId: capability.recommendedProvider,
          model: capability.recommendedModel,
          owner: 'AI 管理中心',
        },
        token
      )
      setCreatePrompt('')
      await loadItems()
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建工单失败'
      setErrorMessage(message)
    } finally {
      setCreateBusy(false)
    }
  }

  const patchStatus = async (itemId: string, status: AiWorkflowStatus, note: string) => {
    setPatchBusyId(itemId)
    setErrorMessage('')
    try {
      const nextItem = await updateAiWorkflow(
        itemId,
        {
          status,
          note,
          approver: '运营审批人',
        },
        token
      )
      setItems((current) => current.map((item) => (item.id === nextItem.id ? nextItem : item)))
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新工单失败'
      setErrorMessage(message)
    } finally {
      setPatchBusyId('')
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="use_ai_chat" title="当前账号无权查看 AI 审批工单中心">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-5">
            {[
              { title: '工单总量', value: `${summary.total}` },
              { title: '待审批', value: `${summary.submitted}` },
              { title: '已批准', value: `${summary.approved}` },
              { title: '执行中', value: `${summary.executing}` },
              { title: '已完成', value: `${summary.completed}` },
            ].map((item) => (
              <Card key={item.title} className={panelClassName}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>新建审批工单</CardTitle>
              <CardDescription className="text-slate-300">
                创建后进入待审批流程，审批通过后执行生成
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <select
                  value={createCapabilityId}
                  onChange={(event) => setCreateCapabilityId(event.target.value as AiAgentCapabilityId)}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {AI_AGENT_CAPABILITY_LIBRARY.map((capability) => (
                    <option key={capability.id} value={capability.id}>
                      {capability.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={createWorkflowTask}
                  disabled={createBusy || !createPrompt.trim()}
                >
                  提交审批工单
                </Button>
              </div>
              <Textarea
                value={createPrompt}
                onChange={(event) => setCreatePrompt(event.target.value)}
                placeholder="请输入任务目标、资料要点、输出要求。"
                className="min-h-[120px] border-white/20 bg-[#071633]/70 text-slate-100 placeholder:text-slate-400"
              />
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>审批与执行</CardTitle>
              <CardDescription className="text-slate-300">
                审批通过后，可在 AI 会话页执行并产出内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value as 'all' | AiWorkflowStatus)}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">全部状态</option>
                  <option value="submitted">待审批</option>
                  <option value="approved">已批准</option>
                  <option value="executing">执行中</option>
                  <option value="completed">已完成</option>
                  <option value="failed">失败</option>
                  <option value="rejected">已驳回</option>
                </select>
                <select
                  value={selectedCapability}
                  onChange={(event) => setSelectedCapability(event.target.value as 'all' | AiAgentCapabilityId)}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">全部能力</option>
                  {AI_AGENT_CAPABILITY_LIBRARY.map((capability) => (
                    <option key={capability.id} value={capability.id}>
                      {capability.title}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : null}

              {isLoading ? (
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  正在加载审批工单...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                  当前条件下暂无工单。
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const capability = getAiAgentCapabilityById(item.capabilityId)
                    const latestTimeline = item.timeline[0]
                    const isPatching = patchBusyId === item.id

                    return (
                      <div key={item.id} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-300">{capability?.title || item.capabilityId}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              提交时间 {new Date(item.createdAt).toLocaleString('zh-CN')} · Owner {item.owner}
                            </p>
                          </div>
                          <Badge className={statusClassName[item.status]}>{statusLabel[item.status]}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-300">{item.prompt}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          路由 {item.routeId} · 提供商 {item.providerId} · 模型 {item.model} · 输出 {item.outputType}
                        </p>
                        {item.approval ? (
                          <p className="mt-1 text-xs text-slate-400">
                            审批记录: {item.approval.approver} · {item.approval.decision === 'approved' ? '通过' : '驳回'} ·{' '}
                            {new Date(item.approval.decisionAt).toLocaleString('zh-CN')}
                          </p>
                        ) : null}
                        {latestTimeline ? (
                          <p className="mt-2 text-xs text-slate-400">
                            最近动作: {latestTimeline.action} · {latestTimeline.actor}
                          </p>
                        ) : null}
                        {item.artifacts.length ? (
                          <div className="mt-2 space-y-1">
                            {item.artifacts.map((artifact, index) => (
                              <a
                                key={`${item.id}-${artifact.url}-${index}`}
                                href={artifact.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-primary hover:text-primary/90"
                              >
                                产物 {index + 1}: {artifact.mediaType} · {artifact.title || 'AI 生成产物'}
                              </a>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.status === 'submitted' ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 bg-emerald-500/90 text-white hover:bg-emerald-500"
                                disabled={isPatching}
                                onClick={() => patchStatus(item.id, 'approved', '审批通过')}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                审批通过
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                disabled={isPatching}
                                onClick={() => patchStatus(item.id, 'rejected', '审批驳回')}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                驳回
                              </Button>
                            </>
                          ) : null}

                          {item.status === 'approved' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                              disabled={isPatching}
                              onClick={() => patchStatus(item.id, 'executing', '进入执行')}
                            >
                              <Clock3 className="mr-1 h-3.5 w-3.5" />
                              标记执行中
                            </Button>
                          ) : null}

                          {item.status === 'executing' ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bg-emerald-500/90 text-white hover:bg-emerald-500"
                              disabled={isPatching}
                              onClick={() => patchStatus(item.id, 'completed', '执行完成')}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              标记完成
                            </Button>
                          ) : null}

                          <Link
                            href={`/dashboard/chat/?capability=${item.capabilityId}&workflowId=${item.id}&route=${item.routeId}&provider=${item.providerId}&model=${encodeURIComponent(item.model)}`}
                            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                          >
                            进入 AI 执行
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
