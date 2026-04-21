import type { UserRole } from '@/lib/access'

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'critical'

export interface ConfidenceInfo {
  score: number
  tier: ConfidenceTier
  label_zh: string
  requires_human_review: boolean
  must_pause: boolean
}

export interface ChatResponse {
  success: boolean
  session_id: string
  agent_id: string
  content: string
  confidence: ConfidenceInfo
  decision_level: 1 | 2 | 3 | 4
  requires_human_review: boolean
  request_id: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent_id?: string
  confidence?: ConfidenceInfo
  decision_level?: number
  requires_human_review?: boolean
  timestamp: Date
}

export interface AgentProfile {
  id: string
  role: string
  name_zh: string
  name_en: string
  title: string
  emoji: string
  color: string
  domain: string
  minRole: UserRole
  skills: string[]
  status: 'active' | 'standby'
}

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: 'cos_zhuge_liang',
    role: 'COS',
    name_zh: '诸葛亮',
    name_en: 'Zhuge Liang',
    title: '首席幕僚 · Chief of Staff',
    emoji: '🪄',
    color: 'slate',
    domain: '战略协调 · Orchestration',
    minRole: 'supervisor',
    skills: ['跨CxO任务路由', '决策分级管理', '会议纪要与行动项拆解', '高风险流程人工复核'],
    status: 'active',
  },
  {
    id: 'ceo_zhang_wuji',
    role: 'CEO',
    name_zh: '张无忌',
    name_en: 'Zhang Wuji',
    title: '首席生态官 · CEO',
    emoji: '⚔️',
    color: 'amber',
    domain: '战略决策 · Strategy',
    minRole: 'director',
    skills: ['集团经营战略', '重大投资决策', '组织变革治理', '年度经营目标拆解'],
    status: 'active',
  },
  {
    id: 'caio_alan_turing',
    role: 'CAIO',
    name_zh: '阿兰·图灵',
    name_en: 'Alan Turing',
    title: '首席AI与技术官 · CAIO',
    emoji: '🧠',
    color: 'violet',
    domain: 'AI治理与技术架构 · AI & Tech',
    minRole: 'manager',
    skills: ['模型选型与路由', '提示词与工作流优化', 'AI风险评估', '平台技术架构'],
    status: 'active',
  },
  {
    id: 'csco_ray_kroc',
    role: 'CSCO',
    name_zh: '雷·克罗克',
    name_en: 'Ray Kroc',
    title: '首席供应链官 · CSCO',
    emoji: '🚛',
    color: 'yellow',
    domain: '供应链统筹 · Supply Chain',
    minRole: 'manager',
    skills: ['采购策略与到货保障', '配送履约优化', '库存周转与损耗控制', '供应商绩效治理'],
    status: 'active',
  },
  {
    id: 'cfo_buffett',
    role: 'CFO',
    name_zh: '沃伦·巴菲特',
    name_en: 'Warren Buffett',
    title: '首席财务官 · CFO',
    emoji: '💰',
    color: 'green',
    domain: '财务管控 · Finance',
    minRole: 'director',
    skills: ['预算与滚动预测', '利润与现金流分析', '成本结构优化', '财务风险预警'],
    status: 'active',
  },
  {
    id: 'coo_howard_schultz',
    role: 'COO',
    name_zh: '霍华德·舒尔茨',
    name_en: 'Howard Schultz',
    title: '首席运营官 · COO',
    emoji: '☕',
    color: 'orange',
    domain: '标准运营 · Operations',
    minRole: 'vp',
    skills: ['门店运营标准化', 'SOP落地与稽核', '异常闭环管理', '跨区域协同调度'],
    status: 'active',
  },
  {
    id: 'cmo_philip_kotler',
    role: 'CMO',
    name_zh: '菲利普·科特勒',
    name_en: 'Philip Kotler',
    title: '首席营销官 · CMO',
    emoji: '📣',
    color: 'pink',
    domain: '品牌营销 · Marketing',
    minRole: 'manager',
    skills: ['品牌定位策略', '活动投放评估', '增长漏斗优化', '社媒内容规划'],
    status: 'active',
  },
  {
    id: 'cco_escoffier',
    role: 'CCO',
    name_zh: '奥古斯特·埃斯科菲耶',
    name_en: 'Auguste Escoffier',
    title: '首席厨艺官 · CCO',
    emoji: '👨‍🍳',
    color: 'red',
    domain: '菜品品质 · Culinary',
    minRole: 'supervisor',
    skills: ['菜品标准与SOP', '新品研发建议', '出品稳定性改进', 'Recipe成本平衡'],
    status: 'active',
  },
  {
    id: 'cpo_bei_yuming',
    role: 'CPO',
    name_zh: '贝聿铭',
    name_en: 'I.M. Pei',
    title: '首席项目官 · CPO',
    emoji: '🏛️',
    color: 'cyan',
    domain: '工程项目 · Projects',
    minRole: 'manager',
    skills: ['项目排期与里程碑', '交付风险识别', '工程成本控制', '多方协作推进'],
    status: 'active',
  },
  {
    id: 'chro_peter_drucker',
    role: 'CHRO',
    name_zh: '彼得·德鲁克',
    name_en: 'Peter Drucker',
    title: '首席人力官 · CHRO',
    emoji: '🤝',
    color: 'teal',
    domain: '人才管理 · HR',
    minRole: 'director',
    skills: ['组织与编制优化', '人力成本分析', '招聘与梯队建设', '绩效机制设计'],
    status: 'active',
  },
  {
    id: 'clo_napoleon',
    role: 'CLO',
    name_zh: '拿破仑·波拿巴',
    name_en: 'Napoleon Bonaparte',
    title: '首席法务官 · CLO',
    emoji: '⚖️',
    color: 'indigo',
    domain: '法律合规 · Legal',
    minRole: 'director',
    skills: ['合同审阅', '制度与合规校验', '招投标合规建议', '法律风险评估'],
    status: 'active',
  },
  {
    id: 'cgo_elon_musk',
    role: 'CGO',
    name_zh: '埃隆·马斯克',
    name_en: 'Elon Musk',
    title: '首席增长官 · CGO',
    emoji: '🚀',
    color: 'sky',
    domain: '增长战略 · Growth',
    minRole: 'manager',
    skills: ['渠道增长策略', '新项目孵化', '商业模式优化', '增长实验设计'],
    status: 'active',
  },
]

export const DECISION_LEVEL_LABELS: Record<number, string> = {
  1: 'COS 直接处理',
  2: '单CxO决策',
  3: '多CxO协商',
  4: 'CEO拍板',
}

export const AGENT_ID_ALIASES: Record<string, string> = {
  coo_ray_kroc: 'coo_howard_schultz',
  csco_fan_li: 'csco_ray_kroc',
}

export const normalizeAgentId = (agentId: string) => AGENT_ID_ALIASES[agentId] || agentId

export const getAgentProfileById = (agentId: string) =>
  AGENT_PROFILES.find((agent) => agent.id === normalizeAgentId(agentId))
