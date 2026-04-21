import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Calculator,
  ClipboardCheck,
  Clapperboard,
  FileAudio,
  FileText,
  GanttChartSquare,
  ImageIcon,
  Megaphone,
  Package,
  PenSquare,
  ScrollText,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AI_AGENT_CAPABILITY_LIBRARY,
  AiAgentCapabilityId,
  buildCapabilityChatHref,
} from '@/lib/ai-agent-capabilities'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const aiTasks = [
  '合同审阅：自动识别履约、付款、违约条款风险',
  '制度生成及更新：按场景输出新制度和旧版差异',
  '标书生成：自动产出投标文档结构与正文草稿',
  '报告总结：提炼管理层摘要与行动清单',
]

const modelQuickEntrances = [
  {
    id: 'deepseek',
    title: 'DeepSeek 推理通道',
    subtitle: '适合复杂经营分析与策略推理',
    href: '/dashboard/chat/?route=reasoning&provider=deepseek&model=deepseek-reasoner',
    badge: '推荐',
  },
  {
    id: 'kimi',
    title: 'Kimi 2.5 长上下文',
    subtitle: '适合长报表、长文档汇总与问答',
    href: '/dashboard/chat/?route=long_context&provider=moonshot&model=kimi-2.5',
    badge: '长上下文',
  },
]

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

export default function AIHubPage() {
  return (
    <DashboardLayout>
      <AccessGuard permission="use_ai_chat" title="当前账号无权使用 AI 中心">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              ['今日 AI 分析任务', '18', '同比 +6'],
              ['自动预警命中', '9', '人工成本 / 采购 / 食安'],
              ['已生成经营建议', '46', '待执行 12 条'],
              ['模型响应可用率', '99.2%', '稳定'],
            ].map(([title, value, sub]) => (
              <Card key={title} className={panelClassName}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-xs text-slate-400">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI 智能指挥台
                </CardTitle>
                <CardDescription className="text-slate-300">
                  分析编排 AI Orchestration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiTasks.map((task) => (
                  <div key={task} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-6 text-slate-100">{task}</p>
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">推荐</Badge>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/chat/" className="inline-flex items-center text-xs text-primary hover:text-primary/90">
                  进入 AI 会话执行任务
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI 能力开关
                </CardTitle>
                <CardDescription className="text-slate-300">权限映射 Role Mapping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['经营诊断', '已启用'],
                  ['成本预测', '已启用'],
                  ['自动排班建议', '灰度中'],
                  ['自动下发动作', '审批后启用'],
                ].map(([capability, state]) => (
                  <div key={capability} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{capability}</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{state}</Badge>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/chat/?route=default&provider=deepseek&model=deepseek-chat">
                      进入 AI 对话
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.10]">
                    <Link href="/dashboard/ai/workflows/">
                      审批工单台
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.10]">
                    <Link href="/dashboard/integrations/llm/">
                      AI 配置
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.10]">
                    <Link href="/dashboard/reports/">
                      导出 AI 周报
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                大模型快捷入口
              </CardTitle>
              <CardDescription className="text-slate-300">
                一键切换到 Kimi / DeepSeek 并自动带入模型参数
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {modelQuickEntrances.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
                    </div>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{item.badge}</Badge>
                  </div>
                  <div className="mt-4">
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link href={item.href}>
                        立即使用
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI 智能体能力包
              </CardTitle>
              <CardDescription className="text-slate-300">
                新增能力：合同审阅 / 制度生成更新 / 标书生成 / 报告总结 / 文案生成 / 产品生成 / 菜单生成 / 音频生成 / 图片生成 / 视频生成 / 社媒内容生成 / 精算专家
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {AI_AGENT_CAPABILITY_LIBRARY.map((capability) => {
                const Icon = capabilityIconMap[capability.id]

                return (
                  <div key={capability.id} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{capability.title}</p>
                          <p className="text-xs text-slate-400">{capability.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {capability.recommendedRoute}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href={buildCapabilityChatHref(capability.id)}>
                          立即执行
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <p className="text-sm text-slate-200">
                闭环流程 Loop: Dashboard → AI → Execution
              </p>
              <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/">
                  <Sparkles className="h-4 w-4" />
                  返回任务型指挥台
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
