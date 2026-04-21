import {
  Bot,
  BrainCircuit,
  Building2,
  Factory,
  FileText,
  LineChart,
  Megaphone,
  Package,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface AiTechNavItem {
  href: string
  label: string
}

export interface AiTechHighlight {
  value: string
  label: string
  detail: string
  accent: string
}

export interface AiTechModule {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  points: string[]
  accent: string
}

export interface AiTechScenario {
  title: string
  description: string
  icon: LucideIcon
  outcomes: string[]
  accent: string
}

export interface AiTechLoopStep {
  step: string
  title: string
  description: string
}

export interface AiTechArchitectureLayer {
  title: string
  description: string
  icon: LucideIcon
  accent: string
}

export const aiTechNavItems: AiTechNavItem[] = [
  { href: '#platform', label: '平台能力' },
  { href: '#scenarios', label: '行业场景' },
  { href: '#capabilities', label: '能力矩阵' },
  { href: '#architecture', label: '架构与治理' },
  { href: '#contact', label: '联系团队' },
]

export const aiTechHighlights: AiTechHighlight[] = [
  {
    value: '12',
    label: 'AI capability packs',
    detail: '覆盖合同、菜单、内容、图像、视频、精算与经营分析',
    accent: 'var(--sk-red)',
  },
  {
    value: '4',
    label: 'control layers',
    detail: '从经营洞察到任务派发，再到审批与审计闭环',
    accent: 'var(--sk-orange)',
  },
  {
    value: '5',
    label: 'service sectors',
    detail: '面向连锁餐饮、团餐、酒店、物业与零售服务业',
    accent: 'var(--sk-green)',
  },
  {
    value: '24/7',
    label: 'operating rhythm',
    detail: '把总部、区域与门店拉回同一套经营语境',
    accent: 'var(--sk-blue)',
  },
]

export const aiTechModules: AiTechModule[] = [
  {
    eyebrow: 'AI Command Center',
    title: '经营指挥台',
    description: '把利润、食安、人效、采购与执行优先级拉到一张实时管理地图里。',
    icon: BrainCircuit,
    points: ['异常预警', '经营摘要', '动作建议'],
    accent: 'var(--sk-blue)',
  },
  {
    eyebrow: 'Agent Workforce',
    title: '智能体团队',
    description: '让法务、财务、营运、供应链、营销与内容团队拥有可协同的 AI 角色。',
    icon: Bot,
    points: ['角色分工', '多模型路由', '跨团队协作'],
    accent: 'var(--sk-red)',
  },
  {
    eyebrow: 'Workflow Automation',
    title: '工单与审批',
    description: '把建议推进为任务、审批、复盘与责任分配，而不是停留在聊天界面。',
    icon: Workflow,
    points: ['审批流', '任务追踪', '人机协同'],
    accent: 'var(--sk-orange)',
  },
  {
    eyebrow: 'Knowledge & Governance',
    title: '知识与治理',
    description: '通过权限、审计、知识库与模型策略，确保 AI 在企业环境里可控可追溯。',
    icon: ShieldCheck,
    points: ['权限映射', '审计记录', '知识注入'],
    accent: 'var(--sk-green)',
  },
]

export const aiTechScenarios: AiTechScenario[] = [
  {
    title: '连锁餐饮运营',
    description: '围绕门店经营、菜单更新、促销节奏、排班与区域巡店建立更快的决策闭环。',
    icon: Store,
    outcomes: ['门店经营分析', '营销与内容生成', '区域动作跟踪'],
    accent: 'var(--sk-red)',
  },
  {
    title: '团餐与中央厨房',
    description: '把食材、产能、供给纪律、菜单结构与项目执行拉进同一套调度语境。',
    icon: UtensilsCrossed,
    outcomes: ['菜单生成', '采购与损耗分析', '食安文档输出'],
    accent: 'var(--sk-yellow)',
  },
  {
    title: '酒店与综合服务',
    description: '让住客服务、会务餐饮、后勤协作与品牌体验拥有统一的 AI 运营底座。',
    icon: Building2,
    outcomes: ['服务 SOP 生成', '任务协同', '跨部门经营摘要'],
    accent: 'var(--sk-blue)',
  },
  {
    title: '零售与现场增长',
    description: '为服务型品牌提供内容生产、活动节奏、商品策划与增长协同能力。',
    icon: Megaphone,
    outcomes: ['社媒内容生成', '活动文案', '新品策划'],
    accent: 'var(--sk-green)',
  },
]

export const aiTechLoopSteps: AiTechLoopStep[] = [
  {
    step: '01',
    title: 'Sense',
    description: '接收经营数据、巡店反馈、工单状态、模型输入与现场异常信号。',
  },
  {
    step: '02',
    title: 'Decide',
    description: '通过经营规则、智能体推理与模型路由生成优先级、建议与任务草案。',
  },
  {
    step: '03',
    title: 'Dispatch',
    description: '把建议分发给总部、区域、门店与职能团队，进入审批、执行与协同流。',
  },
  {
    step: '04',
    title: 'Verify',
    description: '将结果写回审计与知识层，用复盘、权限与版本记录支撑持续迭代。',
  },
]

export const aiTechArchitectureLayers: AiTechArchitectureLayer[] = [
  {
    title: 'Model routing',
    description: '按任务类型分配长上下文、推理、多模态与 Agent 执行通道。',
    icon: Bot,
    accent: 'var(--sk-blue)',
  },
  {
    title: 'Service workflows',
    description: '让经营动作、审批节点与角色分工形成真正可执行的工作流。',
    icon: Workflow,
    accent: 'var(--sk-orange)',
  },
  {
    title: 'Knowledge & audit',
    description: '沉淀制度、合同、报表、场景知识，并保留可追溯的操作记录。',
    icon: FileText,
    accent: 'var(--sk-green)',
  },
  {
    title: 'Business integration',
    description: '对接经营看板、财务、供应链、OA、内容工具与未来 API 生态。',
    icon: Factory,
    accent: 'var(--sk-red)',
  },
]

export const aiTechFocusAreas = [
  {
    title: '经营分析与精算',
    description: '让经营者更快理解利润结构、成本弹性与动作优先级。',
    icon: LineChart,
    accent: 'var(--sk-blue)',
  },
  {
    title: '产品与菜单生成',
    description: '让新品、菜单、包装与服务方案拥有更快的策划节奏。',
    icon: Package,
    accent: 'var(--sk-yellow)',
  },
  {
    title: '制度、合同与标书',
    description: '把大量高频文档工作拉进可治理的智能流程里。',
    icon: FileText,
    accent: 'var(--sk-green)',
  },
]
