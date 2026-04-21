'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Clapperboard,
  ClipboardCheck,
  ExternalLink,
  FileAudio,
  FileText,
  GanttChartSquare,
  ImageIcon,
  Loader2,
  Megaphone,
  Package,
  PenSquare,
  ScrollText,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleConfig } from '@/lib/access'
import {
  AI_AGENT_CAPABILITY_LIBRARY,
  AiAgentCapabilityId,
  buildCapabilityChatHref,
} from '@/lib/ai-agent-capabilities'
import { getStarshipAiUrl } from '@/lib/runtime-config'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const pickValue = (value: string | null | undefined, fallback = '') => {
  const normalized = value?.trim()
  return normalized || fallback
}

const capabilityIconMap: Record<AiAgentCapabilityId, typeof FileText> = {
  contract_review: ClipboardCheck,
  policy_generation: GanttChartSquare,
  tender_generation: ScrollText,
  report_summary: FileText,
  copywriting: PenSquare,
  product_generation: Package,
  menu_generation: UtensilsCrossed,
  audio_generation: FileAudio,
  image_generation: ImageIcon,
  video_generation: Clapperboard,
  social_content: Megaphone,
  other: Calculator,
}

export default function StarshipAgentPage() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const roleConfig = getRoleConfig(user?.role)
  const [isFrameLoading, setIsFrameLoading] = useState(true)
  const [bridgeState, setBridgeState] = useState<'loading' | 'ready' | 'slow' | 'error'>('loading')
  const [bridgeAttempt, setBridgeAttempt] = useState(0)

  const starshipAiLaunchUrl = useMemo(() => {
    const baseUrl = getStarshipAiUrl().trim()

    if (!baseUrl) {
      return ''
    }

    try {
      const url = new URL(baseUrl)

      if (!url.pathname || url.pathname === '/') {
        url.pathname = '/login'
      }

      const displayName = pickValue(
        searchParams.get('displayName'),
        pickValue(user?.nickname, pickValue(user?.name))
      )
      const employeeId = pickValue(searchParams.get('employeeId'), user?.employeeId || '')
      const role = pickValue(searchParams.get('role'), roleConfig.role)
      const permissions = pickValue(
        searchParams.get('permissions'),
        roleConfig.permissions.join(',')
      )
      const source = pickValue(searchParams.get('source'), 'starkitchen')

      if (employeeId) {
        url.searchParams.set('employeeId', employeeId)
      }

      if (displayName) {
        url.searchParams.set('displayName', displayName)
      }

      if (role) {
        url.searchParams.set('role', role)
      }

      if (permissions) {
        url.searchParams.set('permissions', permissions)
      }

      if (source) {
        url.searchParams.set('source', source)
      }

      return url.toString()
    } catch (error) {
      console.warn('Failed to build Starship AI launch URL', error)
      return ''
    }
  }, [
    roleConfig.permissions,
    roleConfig.role,
    searchParams,
    user?.employeeId,
    user?.name,
    user?.nickname,
  ])

  useEffect(() => {
    if (!starshipAiLaunchUrl) {
      setIsFrameLoading(false)
      setBridgeState('error')
      return
    }

    setIsFrameLoading(true)
    setBridgeState('loading')

    const timeoutId = window.setTimeout(() => {
      setBridgeState((previous) => (previous === 'loading' ? 'slow' : previous))
    }, 6000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [bridgeAttempt, starshipAiLaunchUrl])

  return (
    <DashboardLayout>
      <AccessGuard permission="use_ai_chat" title="当前账号无权访问星座 AI 智能体">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="text-xl">智能体新增能力入口</CardTitle>
              <CardDescription className="text-slate-300">
                已支持：合同审阅、制度生成及更新、标书生成、报告总结、文案生成、产品生成、菜单生成、音频生成、图片生成、视频生成、社交媒体内容生成、精算专家
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {AI_AGENT_CAPABILITY_LIBRARY.map((capability) => {
                const Icon = capabilityIconMap[capability.id]
                return (
                  <Link
                    key={capability.id}
                    href={buildCapabilityChatHref(capability.id)}
                    className="group rounded-2xl border border-white/15 bg-[#081538]/55 p-4 transition hover:border-primary/45 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {capability.recommendedRoute}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{capability.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{capability.description}</p>
                    <p className="mt-2 text-xs text-primary">进入站内智能体执行</p>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  权限已匹配
                </Badge>
                <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                  当前角色: {roleConfig.label}
                </Badge>
              </div>
              <CardTitle className="text-xl">星座 AI 智能体</CardTitle>
              <CardDescription className="text-slate-300">
                权限透传 Access Synced
                <span className="mx-1 rounded-md bg-white/10 px-2 py-1 text-xs text-slate-100">
                  www.starkitchen.works/dashboard/agents
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {starshipAiLaunchUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#020b20]/90">
                  {(isFrameLoading || bridgeState === 'slow' || bridgeState === 'error') && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#020b20]/85">
                      <div className="max-w-md rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-center backdrop-blur">
                        {bridgeState === 'loading' && (
                          <div className="inline-flex items-center gap-2 text-sm text-slate-200">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            正在连接 Starship AI 平台...
                          </div>
                        )}
                        {bridgeState === 'slow' && (
                          <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 text-sm text-amber-200">
                              <AlertTriangle className="h-4 w-4" />
                              响应较慢 Slow Response
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setBridgeState('loading')
                                  setIsFrameLoading(true)
                                  setBridgeAttempt((previous) => previous + 1)
                                }}
                                className="border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.12] hover:text-white"
                              >
                                重试连接
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                className="border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.12] hover:text-white"
                              >
                                <Link href="/dashboard/chat/">改用站内 AI 会话</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                        {bridgeState === 'error' && (
                          <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 text-sm text-amber-200">
                              <AlertTriangle className="h-4 w-4" />
                              平台不可用 Service Unavailable
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Button
                                asChild
                                variant="outline"
                                className="border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.12] hover:text-white"
                              >
                                <Link href="/dashboard/chat/">进入站内 AI 会话</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <iframe
                    key={`${starshipAiLaunchUrl}-${bridgeAttempt}`}
                    src={starshipAiLaunchUrl}
                    title="Starship AI 智能平台"
                    className="h-[calc(100vh-18rem)] min-h-[680px] w-full bg-[#020b20]"
                    onLoad={() => {
                      setIsFrameLoading(false)
                      setBridgeState('ready')
                    }}
                    onError={() => {
                      setIsFrameLoading(false)
                      setBridgeState('error')
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  未配置 AI 地址 Missing `NEXT_PUBLIC_STARSHIP_AI_URL`.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {starshipAiLaunchUrl ? (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <a href={starshipAiLaunchUrl} target="_blank" rel="noopener noreferrer">
                      新窗口打开
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.10] hover:text-white"
                >
                  <Link href="/dashboard/ai/">返回 AI 中心</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
