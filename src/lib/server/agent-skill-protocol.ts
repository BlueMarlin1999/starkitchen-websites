import { z } from 'zod'
import type { AgentKnowledgeCitation, AgentSkillSpec } from '@/lib/agent-intelligence/catalog'

type ConfidenceCap = 'high' | 'medium' | 'low' | 'critical'

interface SkillInputSignals {
  message: string
  hasScope: boolean
  hasTimeRange: boolean
  hasMetric: boolean
  hasObjective: boolean
}

interface SkillConfidenceRule {
  downgradeOnMissingInput: boolean
  requireReviewOnMissingInput: boolean
}

export interface SkillProtocolConfig {
  skillId: string
  triggerIntents: string[]
  requiredInputs: string[]
  requiredInputSchema: z.ZodType<SkillInputSignals>
  tools: string[]
  outputTemplate: string
  confidenceRule: SkillConfidenceRule
  forceHumanReview: boolean
}

export interface SkillProtocolEvaluation {
  selectedProtocols: SkillProtocolConfig[]
  missingInputs: string[]
  requiresHumanReview: boolean
  mustPause: boolean
  confidenceCap: ConfidenceCap
  protocolInstruction: string
}

interface SkillResponseContext {
  selectedSkillIds?: string[]
  selectedSkillNames?: string[]
  agentName?: string
  agentRole?: string
  modelLabel?: string
  question?: string
}

const OUTPUT_TEMPLATE = '结论 / 依据 / 风险 / 行动项 / 负责人 / 截止时间'
const scopeKeywords = ['门店', '项目', '区域', '餐厅', '供应商', '部门', '组织']
const timeKeywords = ['今日', '昨天', '本周', '上周', '本月', '上月', '季度', '年度']
const metricKeywords = ['成本', '收入', '毛利', '净利', '缺货率', '损耗率', '转化率', 'revpash', '%']
const objectiveKeywords = ['目标', '优化', '提升', '下降', '建议', '方案', '策略', '计划']

const coreInputSchema = z.object({
  message: z.string().trim().min(1),
  hasScope: z.boolean(),
  hasTimeRange: z.boolean(),
  hasMetric: z.boolean(),
  hasObjective: z.boolean(),
})

const buildScopeMetricSchema = () =>
  coreInputSchema
    .refine((value) => value.hasScope, { message: '缺少项目/门店/对象范围' })
    .refine((value) => value.hasMetric, { message: '缺少核心指标或口径' })

const buildScopeTimeMetricSchema = () =>
  buildScopeMetricSchema().refine((value) => value.hasTimeRange, { message: '缺少时间范围' })

const buildScopeObjectiveSchema = () =>
  coreInputSchema
    .refine((value) => value.hasScope, { message: '缺少执行范围或责任对象' })
    .refine((value) => value.hasObjective, { message: '缺少明确目标或动作方向' })

const buildObjectiveSchema = () =>
  coreInputSchema.refine((value) => value.hasObjective, { message: '缺少明确目标或决策问题' })

const createProtocol = (input: {
  skillId: string
  intents: string[]
  requiredInputs: string[]
  requiredInputSchema: z.ZodType<SkillInputSignals>
  tools: string[]
  forceHumanReview?: boolean
  requireReviewOnMissingInput?: boolean
}) => ({
  skillId: input.skillId,
  triggerIntents: input.intents,
  requiredInputs: input.requiredInputs,
  requiredInputSchema: input.requiredInputSchema,
  tools: input.tools,
  outputTemplate: OUTPUT_TEMPLATE,
  confidenceRule: {
    downgradeOnMissingInput: true,
    requireReviewOnMissingInput: input.requireReviewOnMissingInput ?? true,
  },
  forceHumanReview: input.forceHumanReview === true,
})

const SKILL_PROTOCOLS: Record<string, SkillProtocolConfig> = {
  'cross-agent-routing': createProtocol({
    skillId: 'cross-agent-routing',
    intents: ['跨部门协同', '任务拆解', '会议编排'],
    requiredInputs: ['执行范围', '目标结果', '时间约束'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['task_orchestrator', 'meeting_scheduler', 'decision_tracker'],
  }),
  'decision-gating': createProtocol({
    skillId: 'decision-gating',
    intents: ['审批门控', '风险分级', '授权判断'],
    requiredInputs: ['决策事项', '风险等级', '审批门槛'],
    requiredInputSchema: buildObjectiveSchema(),
    tools: ['approval_matrix', 'risk_policy_guard', 'audit_logger'],
    forceHumanReview: true,
  }),
  'strategy-review': createProtocol({
    skillId: 'strategy-review',
    intents: ['战略评估', '资源取舍', '投资判断'],
    requiredInputs: ['战略目标', '投入产出假设', '时间窗口'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['strategy_canvas', 'capital_simulator', 'scenario_compare'],
    forceHumanReview: true,
  }),
  'model-governance': createProtocol({
    skillId: 'model-governance',
    intents: ['模型评估', '路由策略', 'AI安全'],
    requiredInputs: ['业务场景', '质量指标', '风险边界'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['model_router', 'safety_guard', 'hallucination_evaluator'],
  }),
  'workflow-automation': createProtocol({
    skillId: 'workflow-automation',
    intents: ['流程自动化', '编排设计', '异常回退'],
    requiredInputs: ['流程范围', '触发条件', '目标效率'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['workflow_engine', 'event_bus', 'audit_logger'],
  }),
  'supply-fulfillment': createProtocol({
    skillId: 'supply-fulfillment',
    intents: ['采购履约', '配送优化', '库存保障'],
    requiredInputs: ['供应对象', '到货时窗', '履约指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['supplier_scorecard', 'inventory_center', 'food_safety_monitor'],
  }),
  'financial-simulation': createProtocol({
    skillId: 'financial-simulation',
    intents: ['利润测算', '现金流模拟', '成本预测'],
    requiredInputs: ['测算范围', '时间窗口', '关键指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['finance_simulator', 'cost_bridge', 'budget_guard'],
    forceHumanReview: true,
  }),
  'operation-standard': createProtocol({
    skillId: 'operation-standard',
    intents: ['SOP稽核', '门店运营', '排班执行'],
    requiredInputs: ['门店或项目范围', '执行标准', '效率指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['sop_audit', 'schedule_optimizer', 'store_ops_board'],
  }),
  'campaign-planning': createProtocol({
    skillId: 'campaign-planning',
    intents: ['活动策划', '渠道投放', '增长复盘'],
    requiredInputs: ['目标客群', '渠道范围', '转化指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['campaign_planner', 'channel_allocator', 'growth_tracker'],
  }),
  'knowledge-briefing': createProtocol({
    skillId: 'knowledge-briefing',
    intents: ['能力说明', '知识讲解', '术语解释'],
    requiredInputs: ['问题主题'],
    requiredInputSchema: coreInputSchema,
    tools: ['knowledge_retrieval', 'agent_profile', 'model_runtime_introspect'],
    requireReviewOnMissingInput: false,
  }),
  'recipe-optimization': createProtocol({
    skillId: 'recipe-optimization',
    intents: ['菜品优化', 'SOP升级', '成本平衡'],
    requiredInputs: ['产品范围', '品质目标', '成本指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['recipe_library', 'sop_center', 'food_cost_analyzer'],
  }),
  'sop-execution-audit': createProtocol({
    skillId: 'sop-execution-audit',
    intents: ['SOP执行审计', '抽检复核', '偏差整改'],
    requiredInputs: ['门店或项目范围', '审计周期', '执行标准'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['sop_audit', 'kitchen_audit', 'closure_tracker'],
    forceHumanReview: true,
  }),
  'food-safety-traceability-loop': createProtocol({
    skillId: 'food-safety-traceability-loop',
    intents: ['食安追溯', '风险召回', '批次闭环'],
    requiredInputs: ['风险对象范围', '批次信息', '应急时限'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['traceability_graph', 'food_safety_monitor', 'supplier_scorecard'],
    forceHumanReview: true,
  }),
  'revpash-profit-engine': createProtocol({
    skillId: 'revpash-profit-engine',
    intents: ['RevPASH优化', '座位小时利润', '翻台增益'],
    requiredInputs: ['门店或项目范围', '时间窗口', '利润目标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['revpash_analyzer', 'pricing_simulator', 'table_turn_optimizer'],
    forceHumanReview: true,
  }),
  'project-delivery': createProtocol({
    skillId: 'project-delivery',
    intents: ['里程碑管理', '交付纠偏', '协同推进'],
    requiredInputs: ['项目范围', '里程碑时点', '风险状态'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['milestone_tracker', 'risk_register', 'resource_allocator'],
  }),
  'workforce-roster': createProtocol({
    skillId: 'workforce-roster',
    intents: ['排班分析', '人力成本', '编制预警'],
    requiredInputs: ['组织范围', '班次时窗', '人力指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['gaia_roster', 'attendance_monitor', 'labor_cost_ranker'],
    forceHumanReview: true,
  }),
  'legal-review': createProtocol({
    skillId: 'legal-review',
    intents: ['合同审阅', '制度更新', '合规建议'],
    requiredInputs: ['审阅对象', '法律依据', '风险等级'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['contract_parser', 'policy_checker', 'legal_risk_guard'],
    forceHumanReview: true,
  }),
  'growth-experiment': createProtocol({
    skillId: 'growth-experiment',
    intents: ['增长实验', '渠道扩展', '商业化策略'],
    requiredInputs: ['实验范围', '目标指标', '验证周期'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['experiment_designer', 'channel_lens', 'growth_dashboard'],
  }),
  'war-room-command': createProtocol({
    skillId: 'war-room-command',
    intents: ['战情指挥', '紧急调度', '止损执行'],
    requiredInputs: ['事件范围', '影响指标', '应急时限'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['war_room_board', 'cross_team_alert', 'command_log'],
    forceHumanReview: true,
  }),
  'capital-allocation-board': createProtocol({
    skillId: 'capital-allocation-board',
    intents: ['资本配置', '预算优先级', '投资门槛'],
    requiredInputs: ['项目范围', '预算规模', '收益指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['capital_simulator', 'portfolio_ranker', 'risk_budgeting'],
    forceHumanReview: true,
  }),
  'portfolio-priority-shift': createProtocol({
    skillId: 'portfolio-priority-shift',
    intents: ['项目重排', '资源重分配', '战略转向'],
    requiredInputs: ['项目范围', '重排目标', '时间窗口'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['portfolio_ranker', 'milestone_tracker', 'resource_allocator'],
    forceHumanReview: true,
  }),
  'agent-evaluation-lab': createProtocol({
    skillId: 'agent-evaluation-lab',
    intents: ['模型评测', '回归压测', '质量基线'],
    requiredInputs: ['业务场景', '评测指标', '验证周期'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['evaluation_harness', 'prompt_regression_suite', 'quality_monitor'],
  }),
  'demand-sensing-forecast': createProtocol({
    skillId: 'demand-sensing-forecast',
    intents: ['需求预测', '补货计划', '波动预判'],
    requiredInputs: ['预测范围', '时间窗口', '销量指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['demand_forecast', 'promo_impact_model', 'auto_replenish'],
  }),
  'supplier-negotiation-copilot': createProtocol({
    skillId: 'supplier-negotiation-copilot',
    intents: ['供应商谈判', '采购议价', '合同博弈'],
    requiredInputs: ['供应对象', '谈判目标', '成本指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['supplier_scorecard', 'contract_parser', 'cost_benchmark'],
    forceHumanReview: true,
  }),
  'real-time-pnl-war-room': createProtocol({
    skillId: 'real-time-pnl-war-room',
    intents: ['实时损益', '利润止损', '异动处置'],
    requiredInputs: ['经营范围', '时间窗口', '损益指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['pnl_monitor', 'variance_analyzer', 'action_dispatcher'],
    forceHumanReview: true,
  }),
  'cashflow-stress-test': createProtocol({
    skillId: 'cashflow-stress-test',
    intents: ['现金流压力测试', '资金安全垫', '融资规划'],
    requiredInputs: ['测算范围', '时间窗口', '现金指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['cashflow_simulator', 'collection_tracker', 'liquidity_guard'],
    forceHumanReview: true,
  }),
  'labor-productivity-tuner': createProtocol({
    skillId: 'labor-productivity-tuner',
    intents: ['人效优化', '岗位重配', '班次调优'],
    requiredInputs: ['组织范围', '优化目标', '效率指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['gaia_roster', 'traffic_forecast', 'shift_optimizer'],
  }),
  'service-throughput-orchestrator': createProtocol({
    skillId: 'service-throughput-orchestrator',
    intents: ['吞吐优化', '高峰调度', '排队治理'],
    requiredInputs: ['门店范围', '时段范围', '服务指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['throughput_playbook', 'queue_monitor', 'dispatch_controller'],
  }),
  'omnichannel-campaign-optimizer': createProtocol({
    skillId: 'omnichannel-campaign-optimizer',
    intents: ['全渠道营销', '预算分配', '投放优化'],
    requiredInputs: ['目标客群', '渠道范围', '转化指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['channel_mix_model', 'content_calendar', 'attribution_analyzer'],
  }),
  'social-reputation-radar': createProtocol({
    skillId: 'social-reputation-radar',
    intents: ['舆情监测', '口碑治理', '危机响应'],
    requiredInputs: ['品牌范围', '风险级别', '修复目标'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['social_listener', 'sentiment_monitor', 'response_playbook'],
    forceHumanReview: true,
  }),
  'menu-engineering-matrix': createProtocol({
    skillId: 'menu-engineering-matrix',
    intents: ['菜单工程', 'SKU优化', '菜品调价'],
    requiredInputs: ['产品范围', '时间窗口', '毛利指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['menu_engineering', 'sku_profit_ranker', 'pricing_simulator'],
  }),
  'sensory-quality-assurance': createProtocol({
    skillId: 'sensory-quality-assurance',
    intents: ['品质管理', '感官评分', '出品一致性'],
    requiredInputs: ['产品范围', '质量目标', '异常指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['quality_scorecard', 'kitchen_audit', 'training_scheduler'],
  }),
  'program-portfolio-control': createProtocol({
    skillId: 'program-portfolio-control',
    intents: ['项目群管控', '依赖管理', '资源冲突'],
    requiredInputs: ['项目范围', '关键时点', '风险指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['portfolio_ranker', 'dependency_graph', 'capacity_planner'],
  }),
  'capex-construction-optimizer': createProtocol({
    skillId: 'capex-construction-optimizer',
    intents: ['CAPEX优化', '工程降本', '返工控制'],
    requiredInputs: ['项目范围', '投资规模', '成本指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['capex_simulator', 'contract_parser', 'quality_risk_guard'],
    forceHumanReview: true,
  }),
  'workforce-digital-twin': createProtocol({
    skillId: 'workforce-digital-twin',
    intents: ['组织画像', '技能匹配', '调度模拟'],
    requiredInputs: ['组织范围', '岗位目标', '人效指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['skill_matrix', 'gaia_roster', 'training_scheduler'],
    forceHumanReview: true,
  }),
  'labor-compliance-guardian': createProtocol({
    skillId: 'labor-compliance-guardian',
    intents: ['劳动合规', '工时审查', '风险预警'],
    requiredInputs: ['组织范围', '制度依据', '风险级别'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['attendance_monitor', 'policy_checker', 'compliance_alert'],
    forceHumanReview: true,
  }),
  'contract-redline-autopilot': createProtocol({
    skillId: 'contract-redline-autopilot',
    intents: ['合同红线审查', '条款修订', '法务审计'],
    requiredInputs: ['审阅对象', '法律依据', '风险等级'],
    requiredInputSchema: buildScopeObjectiveSchema(),
    tools: ['contract_parser', 'clause_risk_classifier', 'approval_matrix'],
    forceHumanReview: true,
  }),
  'bid-compliance-firewall': createProtocol({
    skillId: 'bid-compliance-firewall',
    intents: ['招标合规', '投标审查', '资格校验'],
    requiredInputs: ['项目范围', '法规依据', '时间节点'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['bid_rule_checker', 'document_completeness_scan', 'audit_logger'],
    forceHumanReview: true,
  }),
  'growth-experiment-factory': createProtocol({
    skillId: 'growth-experiment-factory',
    intents: ['实验池管理', '流量分配', '增长迭代'],
    requiredInputs: ['实验范围', '目标指标', '迭代周期'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['experiment_backlog', 'traffic_allocator', 'impact_estimator'],
  }),
  'pricing-pack-architecture': createProtocol({
    skillId: 'pricing-pack-architecture',
    intents: ['定价策略', '套餐设计', '价格弹性'],
    requiredInputs: ['产品范围', '定价目标', '利润指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['pricing_simulator', 'bundle_optimizer', 'elasticity_model'],
  }),
  'root-cause-closure': createProtocol({
    skillId: 'root-cause-closure',
    intents: ['异常定位', '闭环整改', '责任追踪'],
    requiredInputs: ['问题范围', '异常表现', '目标恢复指标'],
    requiredInputSchema: buildScopeMetricSchema(),
    tools: ['incident_timeline', 'rca_tree', 'closure_tracker'],
  }),
  'metric-drilldown': createProtocol({
    skillId: 'metric-drilldown',
    intents: ['指标拆解', '构成分析', '排名定位'],
    requiredInputs: ['指标名称', '时间范围', '拆解维度'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['metric_drilldown', 'ranking_board', 'variance_analyzer'],
  }),
}

const readHitByKeywords = (message: string, keywords: string[]) =>
  keywords.some((keyword) => message.includes(keyword))

const buildSkillSignals = (message: string): SkillInputSignals => {
  const normalized = message.trim()
  return {
    message: normalized,
    hasScope: readHitByKeywords(normalized, scopeKeywords),
    hasTimeRange: readHitByKeywords(normalized, timeKeywords) || /\d{4}[-/年]\d{1,2}/.test(normalized),
    hasMetric: readHitByKeywords(normalized, metricKeywords) || /(?:\d+(?:\.\d+)?%|\d+万)/.test(normalized),
    hasObjective: readHitByKeywords(normalized, objectiveKeywords),
  }
}

const collectMissingInputs = (protocol: SkillProtocolConfig, signals: SkillInputSignals) => {
  const parsed = protocol.requiredInputSchema.safeParse(signals)
  if (parsed.success) return []
  return parsed.error.issues.map((issue) => `${protocol.skillId}: ${issue.message}`)
}

const resolveProtocol = (skill: AgentSkillSpec): SkillProtocolConfig =>
  SKILL_PROTOCOLS[skill.id] ||
  createProtocol({
    skillId: skill.id,
    intents: skill.triggers,
    requiredInputs: ['范围', '时间', '指标'],
    requiredInputSchema: buildScopeTimeMetricSchema(),
    tools: ['knowledge_retrieval'],
    forceHumanReview: skill.requiresReview,
    requireReviewOnMissingInput: true,
  })

const resolveConfidenceCap = (input: {
  highStakes: boolean
  mustPause: boolean
  missingCount: number
  requiresReview: boolean
}) => {
  if (input.mustPause) return 'critical'
  if (input.missingCount >= 3) return 'low'
  if (input.missingCount > 0 || input.requiresReview || input.highStakes) return 'medium'
  return 'high'
}

const toUniqueList = (items: string[]) => Array.from(new Set(items))

const buildProtocolLine = (protocol: SkillProtocolConfig, index: number) =>
  `${index + 1}. ${protocol.skillId}｜意图=${protocol.triggerIntents.join('、')}｜工具=${protocol.tools.join('、')}｜必填=${protocol.requiredInputs.join('、')}`

const buildProtocolInstruction = (input: {
  protocols: SkillProtocolConfig[]
  missingInputs: string[]
}) => {
  const skillLines = input.protocols.map(buildProtocolLine).join('\n')
  const missingLines = input.missingInputs.length
    ? input.missingInputs.map((item) => `- ${item}`).join('\n')
    : '- 输入校验通过'
  return [
    '【统一技能协议】',
    skillLines || '- 未命中技能，按COS通用治理流程执行。',
    '',
    '【输入校验】',
    missingLines,
    '',
    `【输出模板】必须包含：${OUTPUT_TEMPLATE}`,
  ].join('\n')
}

export const evaluateSkillProtocol = (input: {
  selectedSkills: AgentSkillSpec[]
  message: string
  highStakes: boolean
}): SkillProtocolEvaluation => {
  const protocols = input.selectedSkills.map(resolveProtocol)
  const signals = buildSkillSignals(input.message)
  const missingInputs = toUniqueList(protocols.flatMap((protocol) => collectMissingInputs(protocol, signals)))
  const forceReview = protocols.some((protocol) => protocol.forceHumanReview)
  const reviewOnMissing = protocols.some((protocol) => protocol.confidenceRule.requireReviewOnMissingInput)
  const requiresHumanReview = input.highStakes || forceReview || (missingInputs.length > 0 && reviewOnMissing)
  const mustPause = input.highStakes && (forceReview || missingInputs.length > 0)
  const confidenceCap = resolveConfidenceCap({
    highStakes: input.highStakes,
    mustPause,
    missingCount: missingInputs.length,
    requiresReview: requiresHumanReview,
  })
  return {
    selectedProtocols: protocols,
    missingInputs,
    requiresHumanReview,
    mustPause,
    confidenceCap,
    protocolInstruction: buildProtocolInstruction({ protocols, missingInputs }),
  }
}

const requiredSections = ['结论', '依据', '风险', '行动项', '负责人', '截止时间'] as const
const hasSection = (content: string, section: string) =>
  new RegExp(`(^|\\n)\\s*(?:#{1,4}\\s*)?${section}\\s*[：:]`, 'm').test(content)

const stripMarkdownMarkers = (value: string) =>
  value
    .replace(/[`*_[\]【】()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const isPlaceholderValue = (value: string) => {
  const normalized = stripMarkdownMarkers(value).toLowerCase()
  return (
    normalized.length === 0 ||
    ['结论', '依据', '风险', '行动项', '负责人', '截止时间', 'todo', 'tbd', '-', '--', '---'].includes(normalized)
  )
}

const extractSectionValue = (content: string, section: string) => {
  const matched = content.match(new RegExp(`(?:^|\\n)\\s*(?:#{1,4}\\s*)?${section}\\s*[：:]\\s*(.+)`, 'm'))
  return matched?.[1]?.trim() || ''
}

const buildSummary = (content: string) => {
  const first = content
    .split(/\n|。/g)
    .map((part) => part.trim())
    .map((part) => part.replace(/^结论\s*[：:]\s*/, '').trim())
    .find((part) => part.length > 0 && !isPlaceholderValue(part))
  return first || '基于现有输入给出初步建议，需结合实时数据复核。'
}

const buildCitationSection = (citations: AgentKnowledgeCitation[]) => {
  if (citations.length === 0) return '来源引用：暂无匹配证据，请补充可追溯数据源。'
  const lines = citations.map(
    (item, index) => `${index + 1}. ${item.title}（文件=${item.fileName}，版本=${item.version}，更新=${item.updatedAt}）`
  )
  return ['来源引用：', ...lines].join('\n')
}

const buildFallbackContent = (input: {
  content: string
  missingInputs: string[]
  citations: AgentKnowledgeCitation[]
  context?: SkillResponseContext
}) => {
  const selectedSkillIds = input.context?.selectedSkillIds ?? []
  const isKnowledgeBriefing = selectedSkillIds.includes('knowledge-briefing')
  if (isKnowledgeBriefing) {
    const agentRole = input.context?.agentRole || 'COS'
    const agentName = input.context?.agentName || '智能体'
    const modelLabel = input.context?.modelLabel || '未配置模型信息'
    const skillLine = (input.context?.selectedSkillNames ?? []).join('、') || '知识讲解与能力说明'
    const ask = (input.context?.question || '').toLowerCase()
    const askHaccp = ask.includes('haccp')
    const haccpSummary = askHaccp
      ? 'HACCP 核心要点：1) 危害分析；2) 识别关键控制点(CCP)；3) 设定关键限值；4) 监控程序；5) 纠偏措施；6) 验证程序；7) 记录保存。'
      : '可按“角色能力、数据口径、风险边界、执行动作”四段式输出决策建议。'
    const actionItems = askHaccp
      ? '1) 输出门店CCP清单并绑定批次追溯码；2) 配置超限自动告警与纠偏SOP；3) 每日留存温控/留样/验收记录用于审计。'
      : '1) 补充项目/门店与时间范围；2) 指定目标指标（成本/收入/利润/食安）；3) 我将按技能协议生成执行清单。'

    return [
      `结论：我是 ${agentRole}（${agentName}），当前会话模型为 ${modelLabel}；可用技能包含 ${skillLine}。`,
      `依据：${haccpSummary}`,
      '风险：若未接入实时经营与食安数据，结论将基于知识库标准流程，需上线后复核口径差异。',
      `行动项：${actionItems}`,
      `负责人：${agentRole}（${agentName}）协同对应业务CxO。`,
      '截止时间：立即生效；建议今日完成首轮配置，T+1完成现场抽检复核。',
      buildCitationSection(input.citations),
    ].join('\n\n')
  }

  const riskNote = input.missingInputs.length ? `输入缺失：${input.missingInputs.join('；')}` : '执行中需持续监控模型偏差和数据时效。'
  return [
    `结论：${buildSummary(input.content)}`,
    `依据：结合当前技能协议与知识库证据进行判断。`,
    `风险：${riskNote}`,
    '行动项：1) 立即补齐缺失输入；2) 按职责域拆解任务并推进；3) 24小时内复盘结果。',
    '负责人：对应CxO负责人（由COS统一编排）。',
    '截止时间：T+1工作日提交初版，T+3完成复核闭环。',
    buildCitationSection(input.citations),
  ].join('\n\n')
}

export const enforceSkillResponseContract = (input: {
  content: string
  missingInputs: string[]
  citations: AgentKnowledgeCitation[]
  context?: SkillResponseContext
}) => {
  const normalized = input.content.trim()
  if (!normalized) return buildFallbackContent(input)
  const hasAllSections = requiredSections.every((section) => hasSection(normalized, section))
  const hasPlaceholderSections = requiredSections.some((section) => {
    const value = extractSectionValue(normalized, section)
    return value.length > 0 && isPlaceholderValue(value)
  })
  if (!hasAllSections || hasPlaceholderSections) return buildFallbackContent(input)
  if (normalized.includes('来源引用')) return normalized
  return `${normalized}\n\n${buildCitationSection(input.citations)}`
}
