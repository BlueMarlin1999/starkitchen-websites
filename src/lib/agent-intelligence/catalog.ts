import { AGENT_PROFILES } from '@/components/AgentLegion/types'

export type AgentKnowledgeLayer = 'L0' | 'L1' | 'L2'
export type AgentSkillLevel = 'core' | 'advanced' | 'elite'
export type AgentKnowledgeDomain =
  | 'governance'
  | 'finance'
  | 'operations'
  | 'supply_chain'
  | 'hr'
  | 'product'
  | 'marketing'
  | 'project'
  | 'legal'
  | 'growth'
  | 'ai'
  | 'oa'

export interface AgentSkillSpec {
  id: string
  name: string
  objective: string
  outputContract: string
  triggers: string[]
  requiresReview: boolean
  level?: AgentSkillLevel
  domain?: AgentKnowledgeDomain
  kpis?: string[]
  toolchain?: string[]
}

export interface AgentKnowledgeDoc {
  id: string
  layer: AgentKnowledgeLayer
  domain: AgentKnowledgeDomain
  title: string
  summary: string
  owner: string
  fileName: string
  version: string
  updatedAt: string
  tags: string[]
  audiences: string[]
}

export interface AgentExecutionContext {
  selectedSkills: AgentSkillSpec[]
  matchedKnowledge: AgentKnowledgeDoc[]
  collaborators: string[]
}

export interface AgentKnowledgeCitation {
  title: string
  fileName: string
  version: string
  updatedAt: string
}

export interface AgentKnowledgeIndexNode {
  layer: AgentKnowledgeLayer
  domain: AgentKnowledgeDomain
  docCount: number
  owners: string[]
  lastUpdatedAt: string
}

const AGENT_NAME_BY_ID = Object.fromEntries(
  AGENT_PROFILES.map((agent) => [agent.id, `${agent.role}·${agent.name_zh}`]),
) as Record<string, string>

const createSkill = (input: AgentSkillSpec): AgentSkillSpec => ({
  level: input.level ?? 'advanced',
  domain: input.domain ?? 'governance',
  kpis: input.kpis ?? [],
  toolchain: input.toolchain ?? [],
  ...input,
})

const SHARED_SUPER_SKILLS: AgentSkillSpec[] = [
  createSkill({
    id: 'knowledge-briefing',
    name: '知识讲解与能力说明',
    objective: '回答术语解释、能力边界、模型信息和方法论要点。',
    outputContract: '结论/依据/风险/行动项/负责人/截止时间。',
    triggers: ['你是谁', '是什么', '介绍', '讲讲', '核心要点', '技能', '模型', 'haccp'],
    requiresReview: false,
    level: 'core',
    domain: 'governance',
    kpis: ['知识问答准确率', '引用完整率'],
    toolchain: ['knowledge_retrieval', 'agent_profile', 'model_runtime_introspect'],
  }),
  createSkill({
    id: 'root-cause-closure',
    name: '异常根因闭环引擎',
    objective: '定位根因并形成责任到人的闭环动作清单与追责路径。',
    outputContract: '问题定义/根因分析/动作清单/负责人/截止时间。',
    triggers: ['异常', '投诉', '波动', '事故', '失败', '风险'],
    requiresReview: false,
    level: 'core',
    domain: 'operations',
    kpis: ['异常闭环时长', '重复发生率', '整改达成率'],
    toolchain: ['incident_timeline', 'rca_tree', 'closure_tracker'],
  }),
  createSkill({
    id: 'metric-drilldown',
    name: '经营指标分层钻取',
    objective: '将总指标拆分到项目、门店、班次和品类级别。',
    outputContract: '拆解口径/贡献排名/异常项/验证计划。',
    triggers: ['明细', '构成', '拆解', '占比', '排名', '对比'],
    requiresReview: false,
    level: 'core',
    domain: 'finance',
    kpis: ['指标可解释率', '异常定位命中率', '复盘闭环率'],
    toolchain: ['metric_drilldown', 'variance_analyzer', 'ranking_board'],
  }),
]

const buildRoleSkillPack = (skills: AgentSkillSpec[]): AgentSkillSpec[] => [
  ...skills.map(createSkill),
  ...SHARED_SUPER_SKILLS,
]

export const AGENT_SKILL_PACKS: Record<string, AgentSkillSpec[]> = {
  cos_zhuge_liang: buildRoleSkillPack([
    {
      id: 'cross-agent-routing',
      name: '跨CxO路由编排',
      objective: '拆解任务并分配到最匹配的高管角色，保障节奏和依赖关系。',
      outputContract: '责任矩阵/优先级/协同节奏/审批节点。',
      triggers: ['协同', '跨部门', '协调', '推进', '路线图', '拆解'],
      requiresReview: false,
      level: 'elite',
      domain: 'governance',
      kpis: ['跨部门任务准时率', '协同阻塞时长', '行动项按时关闭率'],
      toolchain: ['task_orchestrator', 'meeting_scheduler', 'decision_tracker'],
    },
    {
      id: 'decision-gating',
      name: '决策分级门控',
      objective: '按 L1-L4 规则判断是否强制人工复核并确保留痕。',
      outputContract: '决策等级/门控条件/审计要求/执行限制。',
      triggers: ['审批', '拍板', '授权', '高风险', '合规'],
      requiresReview: true,
      level: 'elite',
      domain: 'governance',
      kpis: ['高风险漏审率', '审批链完整率', '审计追溯通过率'],
      toolchain: ['approval_matrix', 'risk_policy_guard', 'audit_logger'],
    },
    {
      id: 'war-room-command',
      name: '战情室指挥',
      objective: '在重大经营波动时提供日级别战情看板与统一调度指令。',
      outputContract: '战情快报/优先级/责任人/24小时动作清单。',
      triggers: ['战情', '紧急', '止损', '突发', '危机', '应急'],
      requiresReview: true,
      level: 'elite',
      domain: 'operations',
      kpis: ['异常恢复时长', '跨部门响应时长', '止损达成率'],
      toolchain: ['war_room_board', 'cross_team_alert', 'command_log'],
    },
  ]),
  ceo_zhang_wuji: buildRoleSkillPack([
    {
      id: 'strategy-review',
      name: '战略评审',
      objective: '评估战略选项的收益、风险与资源匹配并形成拍板建议。',
      outputContract: '战略选项/资源评估/风险清单/拍板建议。',
      triggers: ['战略', '年度', '投资', '扩张', '并购', '目标'],
      requiresReview: true,
      level: 'elite',
      domain: 'growth',
      kpis: ['战略目标达成率', '投资回报率', '关键项目成功率'],
      toolchain: ['strategy_canvas', 'capital_simulator', 'scenario_compare'],
    },
    {
      id: 'capital-allocation-board',
      name: '资本配置看板',
      objective: '在多项目竞争资源下制定资本配置优先级和门槛。',
      outputContract: '项目优先级/资本投放节奏/回报门槛/退出条件。',
      triggers: ['资本', '投资组合', '预算分配', '回报', '优先级'],
      requiresReview: true,
      level: 'advanced',
      domain: 'finance',
      kpis: ['资本效率', '回收周期', '组合波动率'],
      toolchain: ['capital_simulator', 'portfolio_ranker', 'risk_budgeting'],
    },
    {
      id: 'portfolio-priority-shift',
      name: '项目组合优先级重排',
      objective: '根据经营信号调整项目组合优先级并给出组织动作。',
      outputContract: '重排原则/项目排序/资源调整/组织沟通方案。',
      triggers: ['优先级', '组合', '项目重排', '资源倾斜', '战略转向'],
      requiresReview: true,
      level: 'advanced',
      domain: 'project',
      kpis: ['关键里程碑兑现率', '资源利用率', '项目延期率'],
      toolchain: ['portfolio_ranker', 'milestone_tracker', 'resource_allocator'],
    },
  ]),
  caio_alan_turing: buildRoleSkillPack([
    {
      id: 'model-governance',
      name: '模型治理',
      objective: '优化模型路由、成本、质量与安全边界。',
      outputContract: '模型对比/路由策略/风险边界/监控指标。',
      triggers: ['模型', '路由', '幻觉', '质量', '推理', '延迟'],
      requiresReview: false,
      level: 'elite',
      domain: 'ai',
      kpis: ['回答准确率', '单位请求成本', '平均响应时延', '幻觉率'],
      toolchain: ['model_router', 'safety_guard', 'hallucination_evaluator'],
    },
    {
      id: 'workflow-automation',
      name: '流程自动化',
      objective: '将业务流程设计为可执行工作流并具备异常回退。',
      outputContract: '触发器/节点编排/异常回退/审计字段。',
      triggers: ['自动化', '流程', '工作流', '编排', '触发'],
      requiresReview: false,
      level: 'advanced',
      domain: 'ai',
      kpis: ['自动化覆盖率', '人工介入率', '流程成功率'],
      toolchain: ['workflow_engine', 'event_bus', 'audit_logger'],
    },
    {
      id: 'agent-evaluation-lab',
      name: '智能体评测实验室',
      objective: '建立技能级评测基线并持续压测稳定性、鲁棒性和合规性。',
      outputContract: '评测集/基线分数/退化告警/修复优先级。',
      triggers: ['评测', '基线', '压测', '鲁棒性', '退化', '回归'],
      requiresReview: false,
      level: 'elite',
      domain: 'ai',
      kpis: ['回归通过率', '高风险误判率', '版本稳定性'],
      toolchain: ['evaluation_harness', 'prompt_regression_suite', 'quality_monitor'],
    },
  ]),
  csco_ray_kroc: buildRoleSkillPack([
    {
      id: 'supply-fulfillment',
      name: '供应履约优化',
      objective: '优化采购-配送-到货链路并降低缺货损耗。',
      outputContract: '瓶颈定位/补货策略/供应商动作/风险预案。',
      triggers: ['采购', '到货', '配送', '缺货', '库存', '损耗'],
      requiresReview: false,
      level: 'elite',
      domain: 'supply_chain',
      kpis: ['到货准时率', '缺货率', '损耗率', '库存周转天数'],
      toolchain: ['supplier_scorecard', 'inventory_center', 'food_safety_monitor'],
    },
    {
      id: 'food-safety-traceability-loop',
      name: '食安追溯闭环',
      objective: '从批次、供应商到门店快速追溯风险源并生成召回与复检闭环。',
      outputContract: '追溯链路/风险分级/召回动作/复检计划。',
      triggers: ['食安', '追溯', '批次', '召回', '留样', '供应链风险'],
      requiresReview: true,
      level: 'elite',
      domain: 'supply_chain',
      kpis: ['追溯完成时长', '风险批次召回率', '复检通过率'],
      toolchain: ['traceability_graph', 'supplier_scorecard', 'food_safety_monitor'],
    },
    {
      id: 'demand-sensing-forecast',
      name: '需求感知预测',
      objective: '结合销售节律、天气和活动信号生成需求预测。',
      outputContract: '预测曲线/置信区间/补货建议/风险门店清单。',
      triggers: ['预测', '需求', '销量', '节假日', '天气', '波动'],
      requiresReview: false,
      level: 'advanced',
      domain: 'supply_chain',
      kpis: ['预测MAPE', '备货命中率', '缺货损失'],
      toolchain: ['demand_forecast', 'promo_impact_model', 'auto_replenish'],
    },
    {
      id: 'supplier-negotiation-copilot',
      name: '供应商谈判副驾',
      objective: '基于价格、质量、交期和违约历史产出谈判方案。',
      outputContract: '谈判策略/底线区间/让步路径/合规提醒。',
      triggers: ['供应商', '谈判', '议价', '合同', '价格', '交付'],
      requiresReview: true,
      level: 'advanced',
      domain: 'supply_chain',
      kpis: ['采购降本率', '供应商绩效提升', '违约率'],
      toolchain: ['supplier_scorecard', 'contract_parser', 'cost_benchmark'],
    },
  ]),
  cfo_buffett: buildRoleSkillPack([
    {
      id: 'financial-simulation',
      name: '经营精算模拟',
      objective: '测算利润、成本、现金流与敏感性变化。',
      outputContract: '测算假设/利润桥/敏感性/经营建议。',
      triggers: ['利润', '毛利', '成本', '现金流', '预算', '预测'],
      requiresReview: true,
      level: 'elite',
      domain: 'finance',
      kpis: ['净利率', 'EBITDA', '现金流覆盖率', '预算偏差率'],
      toolchain: ['finance_simulator', 'cost_bridge', 'budget_guard'],
    },
    {
      id: 'revpash-profit-engine',
      name: 'RevPASH利润引擎',
      objective: '以每可用座位小时收入驱动菜单、定价、翻台与人效联动优化。',
      outputContract: 'RevPASH拆解/驱动因子/利润提升杠杆/执行排程。',
      triggers: ['revpash', '座位小时', '翻台', '客单价', '利润引擎'],
      requiresReview: true,
      level: 'elite',
      domain: 'finance',
      kpis: ['RevPASH', '座位利用率', '翻台率', '小时毛利'],
      toolchain: ['revpash_analyzer', 'pricing_simulator', 'table_turn_optimizer'],
    },
    {
      id: 'real-time-pnl-war-room',
      name: '实时损益战情',
      objective: '分钟级监控损益波动并触发止损动作。',
      outputContract: '损益异动/归因分解/止损方案/执行责任。',
      triggers: ['实时损益', 'pnl', '止损', '异动', '波动'],
      requiresReview: true,
      level: 'elite',
      domain: 'finance',
      kpis: ['利润异动响应时长', '止损达成率', '异常归因准确率'],
      toolchain: ['pnl_monitor', 'variance_analyzer', 'action_dispatcher'],
    },
    {
      id: 'cashflow-stress-test',
      name: '现金流压力测试',
      objective: '评估多场景现金流安全垫和融资需求。',
      outputContract: '压力场景/缺口时点/应对预案/预警阈值。',
      triggers: ['现金流', '压力测试', '回款', '融资', '安全垫'],
      requiresReview: true,
      level: 'advanced',
      domain: 'finance',
      kpis: ['现金覆盖月数', '回款及时率', '融资成本'],
      toolchain: ['cashflow_simulator', 'collection_tracker', 'liquidity_guard'],
    },
  ]),
  coo_howard_schultz: buildRoleSkillPack([
    {
      id: 'operation-standard',
      name: '运营标准稽核',
      objective: '将 SOP 偏差转化为可追踪整改动作。',
      outputContract: '偏差清单/标准动作/稽核节奏/责任人。',
      triggers: ['门店', '运营', 'sop', '稽核', '排班', '效率'],
      requiresReview: false,
      level: 'elite',
      domain: 'operations',
      kpis: ['SOP达标率', '出餐时长', '投诉率'],
      toolchain: ['sop_audit', 'schedule_optimizer', 'store_ops_board'],
    },
    {
      id: 'sop-execution-audit',
      name: 'SOP执行审计',
      objective: '对前后场SOP执行进行实时抽检、偏差取证和整改追踪。',
      outputContract: '执行抽检/偏差证据/整改计划/复核结论。',
      triggers: ['sop执行', '审计', '抽检', '偏差', '标准动作', '复核'],
      requiresReview: true,
      level: 'elite',
      domain: 'operations',
      kpis: ['SOP执行率', '审计发现闭环率', '重复偏差率'],
      toolchain: ['sop_audit', 'kitchen_audit', 'closure_tracker'],
    },
    {
      id: 'labor-productivity-tuner',
      name: '人效调优器',
      objective: '联动客流、班次与岗位结构优化人效与服务体验。',
      outputContract: '岗位重配/班次建议/人效提升值/执行计划。',
      triggers: ['人效', '岗位', '班次', '客流', '效率'],
      requiresReview: false,
      level: 'advanced',
      domain: 'operations',
      kpis: ['人效产出', '工时利用率', '服务等待时长'],
      toolchain: ['gaia_roster', 'traffic_forecast', 'shift_optimizer'],
    },
    {
      id: 'service-throughput-orchestrator',
      name: '高峰吞吐编排',
      objective: '高峰期通过前后场协同提升吞吐并降低排队流失。',
      outputContract: '高峰策略/岗位节拍/物料保障/应急预案。',
      triggers: ['高峰', '吞吐', '排队', '翻台', '忙时'],
      requiresReview: false,
      level: 'advanced',
      domain: 'operations',
      kpis: ['高峰出单量', '平均等待时长', '流失率'],
      toolchain: ['throughput_playbook', 'queue_monitor', 'dispatch_controller'],
    },
  ]),
  cmo_philip_kotler: buildRoleSkillPack([
    {
      id: 'campaign-planning',
      name: '营销战役规划',
      objective: '产出可执行的投放、内容与复盘方案。',
      outputContract: '客群/渠道/预算/节奏/复盘指标。',
      triggers: ['营销', '品牌', '投放', '活动', '社媒', '拉新'],
      requiresReview: false,
      level: 'elite',
      domain: 'marketing',
      kpis: ['获客成本', '转化率', '活动ROI'],
      toolchain: ['campaign_planner', 'channel_allocator', 'growth_tracker'],
    },
    {
      id: 'omnichannel-campaign-optimizer',
      name: '全渠道战役优化',
      objective: '统一门店、私域、外卖与社媒渠道节奏与预算。',
      outputContract: '渠道预算/内容日历/人群策略/投放实验计划。',
      triggers: ['全渠道', '预算分配', '私域', '外卖', '内容节奏'],
      requiresReview: false,
      level: 'advanced',
      domain: 'marketing',
      kpis: ['渠道ROI', '跨渠道复购率', '品牌触达增量'],
      toolchain: ['channel_mix_model', 'content_calendar', 'attribution_analyzer'],
    },
    {
      id: 'social-reputation-radar',
      name: '社媒口碑雷达',
      objective: '监控多平台口碑并快速修复舆情与体验问题。',
      outputContract: '舆情分级/根因归类/修复策略/复盘机制。',
      triggers: ['口碑', '舆情', '差评', '社媒', '投诉'],
      requiresReview: true,
      level: 'advanced',
      domain: 'marketing',
      kpis: ['负面舆情响应时长', '差评修复率', 'NPS变化'],
      toolchain: ['social_listener', 'sentiment_monitor', 'response_playbook'],
    },
  ]),
  cco_escoffier: buildRoleSkillPack([
    {
      id: 'recipe-optimization',
      name: '菜品与Recipe优化',
      objective: '兼顾品质稳定与成本优化。',
      outputContract: '配方建议/SOP要点/食安提醒/成本影响。',
      triggers: ['菜品', 'recipe', '口味', '出品', '标准', '食材'],
      requiresReview: false,
      level: 'elite',
      domain: 'product',
      kpis: ['出品一致性', '菜品毛利率', '客诉率'],
      toolchain: ['recipe_library', 'sop_center', 'food_cost_analyzer'],
    },
    {
      id: 'menu-engineering-matrix',
      name: '菜单工程矩阵',
      objective: '按销量与毛利识别明星款、引流款和待淘汰款。',
      outputContract: '矩阵分类/调价建议/上下架策略/预估收益。',
      triggers: ['菜单工程', '销量', '毛利', '上下架', '明星款'],
      requiresReview: false,
      level: 'advanced',
      domain: 'product',
      kpis: ['菜单贡献毛利', '低效SKU占比', '上新成功率'],
      toolchain: ['menu_engineering', 'sku_profit_ranker', 'pricing_simulator'],
    },
    {
      id: 'sensory-quality-assurance',
      name: '感官质量守护',
      objective: '构建口味、温度、摆盘与时效的质控评分闭环。',
      outputContract: '质控评分/偏差项/复训动作/抽检计划。',
      triggers: ['品质', '口味', '温度', '摆盘', '质控'],
      requiresReview: false,
      level: 'advanced',
      domain: 'product',
      kpis: ['质控达标率', '复训闭环率', '退菜率'],
      toolchain: ['quality_scorecard', 'kitchen_audit', 'training_scheduler'],
    },
  ]),
  cpo_bei_yuming: buildRoleSkillPack([
    {
      id: 'project-delivery',
      name: '项目交付管控',
      objective: '保障里程碑、预算、资源协同推进。',
      outputContract: '里程碑状态/阻塞项/纠偏动作/责任人。',
      triggers: ['项目', '里程碑', '交付', '延期', '工程', '验收'],
      requiresReview: false,
      level: 'elite',
      domain: 'project',
      kpis: ['里程碑按时率', '预算偏差率', '验收一次通过率'],
      toolchain: ['milestone_tracker', 'risk_register', 'resource_allocator'],
    },
    {
      id: 'program-portfolio-control',
      name: '项目群组合管控',
      objective: '对多项目并行进行依赖管理与资源冲突优化。',
      outputContract: '关键路径/依赖关系/冲突化解/资源重排。',
      triggers: ['项目群', '依赖', '资源冲突', '关键路径', '组合'],
      requiresReview: false,
      level: 'advanced',
      domain: 'project',
      kpis: ['关键路径达成率', '资源冲突解决时长', '项目群健康度'],
      toolchain: ['portfolio_ranker', 'dependency_graph', 'capacity_planner'],
    },
    {
      id: 'capex-construction-optimizer',
      name: 'CAPEX建造优化',
      objective: '优化建设投入、周期和质量，控制返工风险。',
      outputContract: 'CAPEX结构/降本建议/工期压缩方案/质量风险。',
      triggers: ['capex', '建造', '工程成本', '返工', '施工'],
      requiresReview: true,
      level: 'advanced',
      domain: 'project',
      kpis: ['CAPEX节约率', '工期压缩率', '返工率'],
      toolchain: ['capex_simulator', 'contract_parser', 'quality_risk_guard'],
    },
  ]),
  chro_peter_drucker: buildRoleSkillPack([
    {
      id: 'workforce-roster',
      name: '编制与排班分析',
      objective: '识别人力缺口、排班异常和成本波动。',
      outputContract: '编制结构/班次建议/成本排名/风险名单。',
      triggers: ['花名册', '排班', '缺编', '人力成本', '考勤', '班次'],
      requiresReview: true,
      level: 'elite',
      domain: 'hr',
      kpis: ['缺编率', '排班达成率', '人力成本率'],
      toolchain: ['gaia_roster', 'attendance_monitor', 'labor_cost_ranker'],
    },
    {
      id: 'workforce-digital-twin',
      name: '人力数字孪生',
      objective: '在岗位/班次/技能维度构建组织能力实时画像。',
      outputContract: '能力分布/岗位缺口/调度建议/培训计划。',
      triggers: ['数字孪生', '能力', '岗位', '技能', '调度'],
      requiresReview: true,
      level: 'advanced',
      domain: 'hr',
      kpis: ['岗位匹配率', '跨岗覆盖率', '调度响应时长'],
      toolchain: ['skill_matrix', 'gaia_roster', 'training_scheduler'],
    },
    {
      id: 'labor-compliance-guardian',
      name: '用工合规守卫',
      objective: '监测工时、加班、休假和用工红线并自动预警。',
      outputContract: '违规风险/法律条款/整改动作/责任归属。',
      triggers: ['劳动法', '加班', '工时', '休假', '合规'],
      requiresReview: true,
      level: 'elite',
      domain: 'legal',
      kpis: ['劳动合规风险数', '整改及时率', '重复违规率'],
      toolchain: ['attendance_monitor', 'policy_checker', 'compliance_alert'],
    },
  ]),
  clo_napoleon: buildRoleSkillPack([
    {
      id: 'legal-review',
      name: '法务审阅',
      objective: '识别法律风险并给出可执行修订意见。',
      outputContract: '风险条款/法律依据/修订文本/审批建议。',
      triggers: ['合同', '法务', '制度', '合规', '招标', '标书'],
      requiresReview: true,
      level: 'elite',
      domain: 'legal',
      kpis: ['法务审核通过率', '重大风险拦截率', '合同周期'],
      toolchain: ['contract_parser', 'policy_checker', 'legal_risk_guard'],
    },
    {
      id: 'contract-redline-autopilot',
      name: '合同红线自动审查',
      objective: '自动识别禁改条款、付款风险与违约责任不对称问题。',
      outputContract: '红线条款/风险等级/改写建议/审批要求。',
      triggers: ['红线', '条款', '违约', '付款条件', '审查'],
      requiresReview: true,
      level: 'elite',
      domain: 'legal',
      kpis: ['红线识别召回率', '条款修订采纳率', '法务处理时长'],
      toolchain: ['contract_parser', 'clause_risk_classifier', 'approval_matrix'],
    },
    {
      id: 'bid-compliance-firewall',
      name: '招投标合规防火墙',
      objective: '校验招投标流程与文档完整性，阻断合规缺口。',
      outputContract: '缺失清单/违规条款/补证动作/复核计划。',
      triggers: ['招标', '投标', '资格', '合规', '法务审查'],
      requiresReview: true,
      level: 'advanced',
      domain: 'legal',
      kpis: ['招采合规通过率', '材料完整率', '违规事件数'],
      toolchain: ['bid_rule_checker', 'document_completeness_scan', 'audit_logger'],
    },
  ]),
  cgo_elon_musk: buildRoleSkillPack([
    {
      id: 'growth-experiment',
      name: '增长实验设计',
      objective: '设计可快速验证的增长实验。',
      outputContract: '实验假设/样本规则/指标定义/迭代节奏。',
      triggers: ['增长', '实验', '转化', '渠道', 'gmv', '复购'],
      requiresReview: false,
      level: 'elite',
      domain: 'growth',
      kpis: ['实验成功率', '转化提升', '复购提升'],
      toolchain: ['experiment_designer', 'channel_lens', 'growth_dashboard'],
    },
    {
      id: 'growth-experiment-factory',
      name: '增长实验工厂',
      objective: '并行管理多实验并自动进行优先级与流量分配。',
      outputContract: '实验池/优先级/资源分配/淘汰规则。',
      triggers: ['实验池', '并行实验', '流量分配', '优先级'],
      requiresReview: false,
      level: 'advanced',
      domain: 'growth',
      kpis: ['实验吞吐量', '单位实验收益', '实验周期'],
      toolchain: ['experiment_backlog', 'traffic_allocator', 'impact_estimator'],
    },
    {
      id: 'pricing-pack-architecture',
      name: '价格与套餐架构',
      objective: '通过价格带和套餐策略提升客单、毛利和复购。',
      outputContract: '价格带设计/套餐组合/敏感度分析/上线节奏。',
      triggers: ['定价', '套餐', '客单价', '价格带', '毛利'],
      requiresReview: false,
      level: 'advanced',
      domain: 'growth',
      kpis: ['客单价', '套餐渗透率', '毛利增量'],
      toolchain: ['pricing_simulator', 'bundle_optimizer', 'elasticity_model'],
    },
  ]),
}

const createKnowledgeDoc = (input: AgentKnowledgeDoc): AgentKnowledgeDoc => input

export const AGENT_KNOWLEDGE_BASE: AgentKnowledgeDoc[] = [
  createKnowledgeDoc({
    id: 'policy-approval-matrix-2026',
    layer: 'L0',
    domain: 'governance',
    title: '集团审批矩阵（2026版）',
    summary: '采购、合同、预算、编制事项的审批门槛与签批链路。',
    owner: '法务与审计中心',
    fileName: 'approval-matrix-2026.pdf',
    version: 'v2026.03',
    updatedAt: '2026-03-15',
    tags: ['审批', '预算', '合同', '授权', '签批'],
    audiences: ['*'],
  }),
  createKnowledgeDoc({
    id: 'policy-food-safety-closed-loop',
    layer: 'L0',
    domain: 'operations',
    title: '食安闭环制度',
    summary: '定义异常上报、复盘、整改、复检的红线和时效。',
    owner: '运营与品控中心',
    fileName: 'food-safety-closed-loop.pdf',
    version: 'v2026.02',
    updatedAt: '2026-02-12',
    tags: ['食安', 'haccp', '异常', '整改', '复检', '闭环'],
    audiences: ['cco_escoffier', 'coo_howard_schultz', 'csco_ray_kroc', 'cos_zhuge_liang'],
  }),
  createKnowledgeDoc({
    id: 'policy-contract-template-master',
    layer: 'L0',
    domain: 'legal',
    title: '合同模板主库',
    summary: '采购、项目、服务三大类合同标准条款与禁改项。',
    owner: '法务中心',
    fileName: 'contract-template-master.docx',
    version: 'v2026.04',
    updatedAt: '2026-04-01',
    tags: ['合同', '条款', '法务', '禁改', '模板'],
    audiences: ['clo_napoleon', 'ceo_zhang_wuji', 'cfo_buffett', 'csco_ray_kroc'],
  }),
  createKnowledgeDoc({
    id: 'policy-ai-governance-standard',
    layer: 'L0',
    domain: 'ai',
    title: 'AI治理与审计标准',
    summary: '模型接入、评测、回滚、越权防护、日志审计与人工复核标准。',
    owner: 'AI治理委员会',
    fileName: 'ai-governance-standard-2026.pdf',
    version: 'v2026.04',
    updatedAt: '2026-04-10',
    tags: ['AI治理', '评测', '审计', '人工复核', '安全'],
    audiences: ['caio_alan_turing', 'cos_zhuge_liang', 'clo_napoleon'],
  }),
  createKnowledgeDoc({
    id: 'policy-data-classification',
    layer: 'L0',
    domain: 'governance',
    title: '数据分级分域与PII规范',
    summary: '定义敏感数据处理等级、脱敏规则和访问审批流程。',
    owner: '信息安全办公室',
    fileName: 'data-classification-pii-policy.pdf',
    version: 'v2026.01',
    updatedAt: '2026-01-29',
    tags: ['PII', '数据分级', '脱敏', '权限', '审计'],
    audiences: ['*'],
  }),
  createKnowledgeDoc({
    id: 'fact-hr-gaia-roster-live',
    layer: 'L1',
    domain: 'hr',
    title: '盖雅花名册与排班快照',
    summary: '项目/门店/姓名/班次/工时/人力成本/异常标签实时快照。',
    owner: '人力系统',
    fileName: 'gaia-roster-live.csv',
    version: 'daily',
    updatedAt: '2026-04-12',
    tags: ['花名册', '排班', '工时', '人力成本', '异常'],
    audiences: ['chro_peter_drucker', 'coo_howard_schultz', 'cfo_buffett'],
  }),
  createKnowledgeDoc({
    id: 'fact-hr-labor-cost-live',
    layer: 'L1',
    domain: 'hr',
    title: '人力成本实时排行',
    summary: '按项目/门店/岗位/个人聚合人力成本、缺勤和异常加班。',
    owner: '人力与财务联合组',
    fileName: 'labor-cost-live.parquet',
    version: 'hourly',
    updatedAt: '2026-04-12',
    tags: ['人力成本', '排名', '缺勤', '加班', '岗位'],
    audiences: ['chro_peter_drucker', 'cfo_buffett', 'coo_howard_schultz'],
  }),
  createKnowledgeDoc({
    id: 'fact-finance-revenue-breakdown',
    layer: 'L1',
    domain: 'finance',
    title: '收入与成本构成口径',
    summary: '早餐/午餐/茶歇/晚餐/夜宵/宴会收入与食材/人力成本映射。',
    owner: '财务分析中心',
    fileName: 'finance-revenue-breakdown.xlsx',
    version: 'v2026.04.2',
    updatedAt: '2026-04-09',
    tags: ['收入', '早餐', '午餐', '宴会', '食材成本', '人力成本'],
    audiences: ['cfo_buffett', 'ceo_zhang_wuji', 'cos_zhuge_liang', 'coo_howard_schultz'],
  }),
  createKnowledgeDoc({
    id: 'fact-finance-cashflow-forecast',
    layer: 'L1',
    domain: 'finance',
    title: '现金流滚动预测',
    summary: '未来13周现金流入流出、回款风险、资金缺口预警。',
    owner: '资金管理中心',
    fileName: 'cashflow-forecast-13w.xlsx',
    version: 'v2026.04.3',
    updatedAt: '2026-04-12',
    tags: ['现金流', '回款', '资金缺口', '预测', '预警'],
    audiences: ['cfo_buffett', 'ceo_zhang_wuji'],
  }),
  createKnowledgeDoc({
    id: 'fact-revpash-profit-engine',
    layer: 'L1',
    domain: 'finance',
    title: 'RevPASH利润引擎明细',
    summary: '按时段/餐段/座位利用率拆解RevPASH与毛利贡献。',
    owner: '财务经营分析中心',
    fileName: 'revpash-profit-engine.xlsx',
    version: 'daily',
    updatedAt: '2026-04-13',
    tags: ['RevPASH', '座位小时', '翻台', '客单价', '毛利'],
    audiences: ['cfo_buffett', 'coo_howard_schultz', 'ceo_zhang_wuji'],
  }),
  createKnowledgeDoc({
    id: 'fact-store-realtime-kpi',
    layer: 'L1',
    domain: 'operations',
    title: '门店实时经营KPI流',
    summary: '客流、转化、客单、翻台、投诉、退菜等分钟级指标。',
    owner: '门店运营中心',
    fileName: 'store-kpi-stream.jsonl',
    version: 'realtime',
    updatedAt: '2026-04-12',
    tags: ['门店', '客流', '转化', '客单', '翻台', '投诉'],
    audiences: ['coo_howard_schultz', 'cfo_buffett', 'ceo_zhang_wuji'],
  }),
  createKnowledgeDoc({
    id: 'fact-sop-execution-audit-log',
    layer: 'L1',
    domain: 'operations',
    title: 'SOP执行审计日志',
    summary: '按项目/门店/班次记录SOP抽检结果、偏差证据与整改状态。',
    owner: '运营稽核中心',
    fileName: 'sop-execution-audit-log.parquet',
    version: 'hourly',
    updatedAt: '2026-04-13',
    tags: ['sop', '执行审计', '抽检', '偏差', '整改'],
    audiences: ['coo_howard_schultz', 'cco_escoffier', 'cos_zhuge_liang'],
  }),
  createKnowledgeDoc({
    id: 'fact-supply-fulfillment-kpi',
    layer: 'L1',
    domain: 'supply_chain',
    title: '供应履约 KPI 日清',
    summary: '采购到货率、配送时效、缺货率、损耗率、供应商评分。',
    owner: '供应链中心',
    fileName: 'supply-fulfillment-kpi.json',
    version: 'daily',
    updatedAt: '2026-04-12',
    tags: ['采购', '到货', '配送', '缺货', '损耗', '供应商'],
    audiences: ['csco_ray_kroc', 'coo_howard_schultz', 'cfo_buffett'],
  }),
  createKnowledgeDoc({
    id: 'fact-food-safety-traceability-chain',
    layer: 'L1',
    domain: 'supply_chain',
    title: '食安追溯链路数据',
    summary: '原料批次、供应商、到货温控、门店留样和召回记录全链路追踪。',
    owner: '食安与供应链联合组',
    fileName: 'food-safety-traceability-chain.parquet',
    version: 'hourly',
    updatedAt: '2026-04-13',
    tags: ['食安', '追溯', '批次', '温控', '召回', '留样'],
    audiences: ['csco_ray_kroc', 'cco_escoffier', 'coo_howard_schultz', 'clo_napoleon'],
  }),
  createKnowledgeDoc({
    id: 'fact-supplier-scorecard-quarterly',
    layer: 'L1',
    domain: 'supply_chain',
    title: '供应商绩效评分卡',
    summary: '价格、质量、交付、食安、配合度多维评分。',
    owner: '供应商管理部',
    fileName: 'supplier-scorecard-q2.xlsx',
    version: 'v2026.q2',
    updatedAt: '2026-04-07',
    tags: ['供应商', '评分', '交付', '质量', '食安'],
    audiences: ['csco_ray_kroc', 'cfo_buffett', 'clo_napoleon'],
  }),
  createKnowledgeDoc({
    id: 'fact-product-recipe-library',
    layer: 'L1',
    domain: 'product',
    title: '产品库 Recipe & SOP',
    summary: '菜品/饮品/周边/增值/其它五类产品的配方、SOP、成本。',
    owner: '产品中心',
    fileName: 'product-recipe-library.db',
    version: 'v2026.04.5',
    updatedAt: '2026-04-11',
    tags: ['产品', 'recipe', 'sop', '菜品', '饮品', '成本'],
    audiences: ['cco_escoffier', 'cmo_philip_kotler', 'coo_howard_schultz', 'cgo_elon_musk'],
  }),
  createKnowledgeDoc({
    id: 'fact-menu-engineering-matrix',
    layer: 'L1',
    domain: 'product',
    title: '菜单工程矩阵数据集',
    summary: 'SKU销量、毛利、复购、备货损耗和菜品生命周期。',
    owner: '产品策略组',
    fileName: 'menu-engineering-matrix.parquet',
    version: 'weekly',
    updatedAt: '2026-04-10',
    tags: ['菜单工程', 'SKU', '毛利', '复购', '生命周期'],
    audiences: ['cco_escoffier', 'cfo_buffett', 'cgo_elon_musk'],
  }),
  createKnowledgeDoc({
    id: 'fact-marketing-funnel-live',
    layer: 'L1',
    domain: 'marketing',
    title: '全渠道增长漏斗实时看板',
    summary: '曝光、点击、到店、下单、复购和会员活跃指标。',
    owner: '品牌增长中心',
    fileName: 'marketing-funnel-live.json',
    version: 'hourly',
    updatedAt: '2026-04-12',
    tags: ['增长', '漏斗', '投放', '到店', '复购', '会员'],
    audiences: ['cmo_philip_kotler', 'cgo_elon_musk', 'ceo_zhang_wuji'],
  }),
  createKnowledgeDoc({
    id: 'fact-oa-audit-timeline',
    layer: 'L1',
    domain: 'oa',
    title: 'OA 审批沟通审计索引',
    summary: '审批、文件、会议、对话记录按项目和人员聚合索引。',
    owner: '协同OA中心',
    fileName: 'oa-audit-timeline.parquet',
    version: 'hourly',
    updatedAt: '2026-04-12',
    tags: ['oa', '审批', '会议', '文件', '审计', '沟通'],
    audiences: ['cos_zhuge_liang', 'ceo_zhang_wuji', 'clo_napoleon', 'cpo_bei_yuming'],
  }),
  createKnowledgeDoc({
    id: 'fact-project-delivery-board',
    layer: 'L1',
    domain: 'project',
    title: '项目交付里程碑看板',
    summary: '项目群进度、预算使用、风险状态和验收结果快照。',
    owner: '项目管理办公室',
    fileName: 'project-delivery-board.csv',
    version: 'daily',
    updatedAt: '2026-04-12',
    tags: ['项目', '里程碑', '预算', '风险', '验收'],
    audiences: ['cpo_bei_yuming', 'ceo_zhang_wuji', 'cfo_buffett', 'coo_howard_schultz'],
  }),
  createKnowledgeDoc({
    id: 'playbook-qsr-throughput',
    layer: 'L2',
    domain: 'operations',
    title: '高峰吞吐优化打法',
    summary: '高峰前后场节拍优化与排班协同最佳实践。',
    owner: '运营赋能组',
    fileName: 'playbook-qsr-throughput.md',
    version: 'v1.8',
    updatedAt: '2026-01-20',
    tags: ['高峰', '吞吐', '效率', '排班', '出品'],
    audiences: ['coo_howard_schultz', 'chro_peter_drucker', 'cco_escoffier'],
  }),
  createKnowledgeDoc({
    id: 'playbook-procurement-negotiation',
    layer: 'L2',
    domain: 'supply_chain',
    title: '餐饮采购谈判作战手册',
    summary: '供应商分层、价格带、谈判让步路径与风险防线。',
    owner: '采购战略组',
    fileName: 'playbook-procurement-negotiation.md',
    version: 'v2.3',
    updatedAt: '2026-02-05',
    tags: ['采购', '谈判', '价格带', '供应商', '降本'],
    audiences: ['csco_ray_kroc', 'cfo_buffett', 'clo_napoleon'],
  }),
  createKnowledgeDoc({
    id: 'playbook-demand-forecast-casebook',
    layer: 'L2',
    domain: 'supply_chain',
    title: '需求预测案例库',
    summary: '节假日、天气、活动联动下的需求预测与补货案例。',
    owner: '数据科学中心',
    fileName: 'demand-forecast-casebook.md',
    version: 'v1.6',
    updatedAt: '2026-02-19',
    tags: ['预测', '需求', '补货', '节假日', '天气'],
    audiences: ['csco_ray_kroc', 'coo_howard_schultz', 'caio_alan_turing'],
  }),
  createKnowledgeDoc({
    id: 'playbook-workforce-optimization',
    layer: 'L2',
    domain: 'hr',
    title: '排班与人效优化案例',
    summary: '以门店客流和岗位技能匹配驱动人效提升的案例集。',
    owner: '组织效能组',
    fileName: 'workforce-optimization-playbook.md',
    version: 'v2.0',
    updatedAt: '2026-03-02',
    tags: ['排班', '人效', '岗位匹配', '培训', '组织'],
    audiences: ['chro_peter_drucker', 'coo_howard_schultz', 'cfo_buffett'],
  }),
  createKnowledgeDoc({
    id: 'playbook-menu-innovation',
    layer: 'L2',
    domain: 'product',
    title: '菜单创新方法论',
    summary: '从客群洞察、测试到上市复盘的新品流程方法。',
    owner: '产品创新中心',
    fileName: 'menu-innovation-playbook.md',
    version: 'v1.9',
    updatedAt: '2026-03-06',
    tags: ['新品', '菜单', '测试', '上市', '复盘'],
    audiences: ['cco_escoffier', 'cmo_philip_kotler', 'cgo_elon_musk'],
  }),
  createKnowledgeDoc({
    id: 'playbook-marketing-funnel',
    layer: 'L2',
    domain: 'marketing',
    title: '餐饮增长漏斗模板',
    summary: '曝光-到店-转化-复购完整漏斗与内容节奏模板。',
    owner: '品牌增长中心',
    fileName: 'playbook-marketing-funnel.md',
    version: 'v2.1',
    updatedAt: '2026-01-08',
    tags: ['增长', '漏斗', '投放', '复购', '内容'],
    audiences: ['cmo_philip_kotler', 'cgo_elon_musk', 'ceo_zhang_wuji'],
  }),
  createKnowledgeDoc({
    id: 'playbook-war-room-governance',
    layer: 'L2',
    domain: 'governance',
    title: '战情室治理手册',
    summary: '经营异常升级、跨部门调度与24小时复盘机制。',
    owner: '战略运营办公室',
    fileName: 'war-room-governance-playbook.md',
    version: 'v1.3',
    updatedAt: '2026-02-27',
    tags: ['战情室', '升级', '调度', '复盘', '治理'],
    audiences: ['cos_zhuge_liang', 'ceo_zhang_wuji', 'coo_howard_schultz'],
  }),
  createKnowledgeDoc({
    id: 'playbook-growth-expansion',
    layer: 'L2',
    domain: 'growth',
    title: '连锁扩张增长案例',
    summary: '区域扩张、渠道开拓和商业化策略案例与指标框架。',
    owner: '增长战略组',
    fileName: 'growth-expansion-casebook.md',
    version: 'v2.4',
    updatedAt: '2026-03-10',
    tags: ['扩张', '渠道', '增长', '商业化', '策略'],
    audiences: ['cgo_elon_musk', 'ceo_zhang_wuji', 'cmo_philip_kotler'],
  }),
]

const AGENT_COLLABORATION_MAP: Record<string, string[]> = {
  cos_zhuge_liang: ['ceo_zhang_wuji', 'cfo_buffett', 'coo_howard_schultz'],
  ceo_zhang_wuji: ['cfo_buffett', 'coo_howard_schultz', 'clo_napoleon'],
  caio_alan_turing: ['cos_zhuge_liang', 'coo_howard_schultz', 'cgo_elon_musk'],
  csco_ray_kroc: ['coo_howard_schultz', 'cfo_buffett', 'cco_escoffier'],
  cfo_buffett: ['ceo_zhang_wuji', 'chro_peter_drucker', 'csco_ray_kroc'],
  coo_howard_schultz: ['csco_ray_kroc', 'chro_peter_drucker', 'cco_escoffier'],
  cmo_philip_kotler: ['cgo_elon_musk', 'cco_escoffier', 'ceo_zhang_wuji'],
  cco_escoffier: ['coo_howard_schultz', 'csco_ray_kroc', 'cmo_philip_kotler'],
  cpo_bei_yuming: ['coo_howard_schultz', 'cfo_buffett', 'cos_zhuge_liang'],
  chro_peter_drucker: ['coo_howard_schultz', 'cfo_buffett', 'cos_zhuge_liang'],
  clo_napoleon: ['ceo_zhang_wuji', 'cfo_buffett', 'cos_zhuge_liang'],
  cgo_elon_musk: ['cmo_philip_kotler', 'ceo_zhang_wuji', 'caio_alan_turing'],
}

const tokenizeText = (value: string) =>
  (value.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]{1,}/g) ?? []).filter(Boolean)

const toTermFrequency = (tokens: string[]) => {
  const vector = new Map<string, number>()
  for (const token of tokens) {
    vector.set(token, (vector.get(token) ?? 0) + 1)
  }
  return vector
}

const cosineSimilarity = (left: Map<string, number>, right: Map<string, number>) => {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  left.forEach((value) => {
    leftNorm += value * value
  })
  right.forEach((value) => {
    rightNorm += value * value
  })
  left.forEach((value, token) => {
    const other = right.get(token)
    if (other) dot += value * other
  })
  if (!dot || !leftNorm || !rightNorm) return 0
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
}

const includesKeyword = (message: string, keyword: string) =>
  message.toLowerCase().includes(keyword.toLowerCase())

const scoreSkillByKeywords = (message: string, skill: AgentSkillSpec) =>
  skill.triggers.reduce((count, keyword) => count + (includesKeyword(message, keyword) ? 1 : 0), 0)

const informationalIntentKeywords = [
  '你是谁',
  '是什么',
  '介绍',
  '讲讲',
  '核心要点',
  '技能',
  '模型',
  '能力',
  '原理',
  'haccp',
  '说明',
]

const isInformationalIntent = (message: string) =>
  informationalIntentKeywords.some((keyword) => includesKeyword(message, keyword))

const scoreKnowledgeByKeywords = (message: string, doc: AgentKnowledgeDoc) => {
  const fields = [doc.title, doc.summary, ...doc.tags]
  return fields.reduce((count, field) => count + (includesKeyword(message, field) ? 1 : 0), 0)
}

const getLayerBoost = (layer: AgentKnowledgeLayer) => {
  if (layer === 'L0') return 0.7
  if (layer === 'L1') return 0.4
  return 0.15
}

const getRecencyBoost = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt)
  if (Number.isNaN(timestamp)) return 0
  const days = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24))
  if (days <= 7) return 0.3
  if (days <= 30) return 0.2
  if (days <= 90) return 0.1
  return 0
}

const scoreKnowledgeHybrid = (message: string, doc: AgentKnowledgeDoc) => {
  const queryVector = toTermFrequency(tokenizeText(message))
  const docText = `${doc.title} ${doc.summary} ${doc.tags.join(' ')}`
  const docVector = toTermFrequency(tokenizeText(docText))
  const keywordScore = scoreKnowledgeByKeywords(message, doc)
  const vectorScore = cosineSimilarity(queryVector, docVector)
  return keywordScore * 0.55 + vectorScore * 0.25 + getLayerBoost(doc.layer) + getRecencyBoost(doc.updatedAt)
}

const formatSkillLine = (skill: AgentSkillSpec, index: number) =>
  `${index + 1}. ${skill.name}：${skill.objective}；输出=${skill.outputContract}`

const formatKnowledgeLine = (doc: AgentKnowledgeDoc) =>
  `- [${doc.layer}/${doc.domain}] ${doc.title}（文件=${doc.fileName}，版本=${doc.version}，更新=${doc.updatedAt}）`

export const listAgentSkillPack = (agentId: string) =>
  AGENT_SKILL_PACKS[agentId] ?? SHARED_SUPER_SKILLS

export const listAgentKnowledgeDocs = (agentId: string) =>
  AGENT_KNOWLEDGE_BASE.filter((doc) => doc.audiences.includes('*') || doc.audiences.includes(agentId))

export const resolveAgentCollaborators = (agentId: string) =>
  (AGENT_COLLABORATION_MAP[agentId] ?? []).map((id) => AGENT_NAME_BY_ID[id] ?? id)

export const resolveSkillsForMessage = (agentId: string, message: string, limit = 4) => {
  const pack = listAgentSkillPack(agentId)
  const ranked = pack
    .map((skill) => ({ skill, score: scoreSkillByKeywords(message, skill) }))
    .sort((left, right) => right.score - left.score)
  const matched = ranked.filter((item) => item.score > 0).slice(0, limit).map((item) => item.skill)
  if (matched.length > 0) return matched
  if (isInformationalIntent(message)) {
    const briefing = pack.find((skill) => skill.id === 'knowledge-briefing')
    if (briefing) return [briefing]
  }
  return pack.slice(0, Math.max(1, Math.min(limit, pack.length)))
}

export const resolveKnowledgeForMessage = (agentId: string, message: string, limit = 4) => {
  const docs = listAgentKnowledgeDocs(agentId)
  return docs
    .map((doc) => ({ doc, score: scoreKnowledgeHybrid(message, doc) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.doc)
}

export const buildAgentExecutionContext = (input: {
  agentId: string
  message: string
}): AgentExecutionContext => ({
  selectedSkills: resolveSkillsForMessage(input.agentId, input.message),
  matchedKnowledge: resolveKnowledgeForMessage(input.agentId, input.message),
  collaborators: resolveAgentCollaborators(input.agentId),
})

export const buildAgentPromptKnowledgeSection = (context: AgentExecutionContext) => {
  const skillLines = context.selectedSkills.map(formatSkillLine).join('\n')
  const knowledgeLines = context.matchedKnowledge.map(formatKnowledgeLine).join('\n')
  const collaborators = context.collaborators.length ? context.collaborators.join('、') : '无固定协同角色'
  return [
    '【技能协议】',
    skillLines || '- 无技能命中，请按通用治理流程回答。',
    '',
    '【知识库证据（L0 > L1 > L2）】',
    knowledgeLines || '- 未命中证据，请先声明缺失数据并给补数清单。',
    '',
    `【默认协同角色】${collaborators}`,
    '回答必须包含：结论、依据、风险、行动项、负责人、截止时间。',
  ].join('\n')
}

export const buildKnowledgeCitations = (docs: AgentKnowledgeDoc[]): AgentKnowledgeCitation[] =>
  docs.map((doc) => ({
    title: doc.title,
    fileName: doc.fileName,
    version: doc.version,
    updatedAt: doc.updatedAt,
  }))

export const getAgentSkillHighlights = (agentId: string, limit = 6) =>
  listAgentSkillPack(agentId)
    .slice(0, Math.max(1, limit))
    .map((skill) => skill.name)

export const getAgentKnowledgeFocus = (agentId: string) =>
  listAgentKnowledgeDocs(agentId)
    .flatMap((doc) => [doc.domain, ...doc.tags.slice(0, 1)])
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 8)

export const listKnowledgeIndex = (): AgentKnowledgeIndexNode[] => {
  const bucket = new Map<string, AgentKnowledgeIndexNode>()
  for (const doc of AGENT_KNOWLEDGE_BASE) {
    const key = `${doc.layer}:${doc.domain}`
    const current = bucket.get(key)
    if (!current) {
      bucket.set(key, {
        layer: doc.layer,
        domain: doc.domain,
        docCount: 1,
        owners: [doc.owner],
        lastUpdatedAt: doc.updatedAt,
      })
      continue
    }
    current.docCount += 1
    if (!current.owners.includes(doc.owner)) current.owners.push(doc.owner)
    if (Date.parse(doc.updatedAt) > Date.parse(current.lastUpdatedAt)) {
      current.lastUpdatedAt = doc.updatedAt
    }
  }
  return Array.from(bucket.values()).sort((left, right) => {
    const byLayer = left.layer.localeCompare(right.layer)
    if (byLayer !== 0) return byLayer
    return left.domain.localeCompare(right.domain)
  })
}

export interface AgentSkillCoverageIssue {
  agentId: string
  role: string
  skillCount: number
}

export interface AgentKnowledgeCoverageIssue {
  agentId: string
  role: string
  docCount: number
  layerCount: number
}

export const validateAgentSkillCoverage = (minimum = 5): AgentSkillCoverageIssue[] =>
  AGENT_PROFILES.map((agent) => ({
    agentId: agent.id,
    role: agent.role,
    skillCount: listAgentSkillPack(agent.id).length,
  })).filter((item) => item.skillCount < minimum)

export const validateAgentKnowledgeCoverage = (
  minimumDocs = 3,
  minimumLayers = 2,
): AgentKnowledgeCoverageIssue[] =>
  AGENT_PROFILES.map((agent) => {
    const docs = listAgentKnowledgeDocs(agent.id)
    const layers = new Set(docs.map((doc) => doc.layer))
    return {
      agentId: agent.id,
      role: agent.role,
      docCount: docs.length,
      layerCount: layers.size,
    }
  }).filter((item) => item.docCount < minimumDocs || item.layerCount < minimumLayers)
