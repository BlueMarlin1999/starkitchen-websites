// ── OPR Demo Data ─────────────────────────────────────────────
// Complete OPR data for all 12 CxO agents of Star Kitchen AI C-Suite
// Data represents Year 2026, current date: April 9, 2026

import type { AgentOPRData, OPRMonthly, OPRDaily } from './types';

// ── Helper: generate monthly data ────────────────────────────
function generateMonthly(
  progressByMonth: number[],
  highlightsByMonth: string[][],
): OPRMonthly[] {
  const monthLabels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  return progressByMonth.map((progress, i) => {
    const month = i + 1;
    let status: OPRMonthly['status'] = 'not_started';
    if (month > 4) status = 'not_started';
    else if (progress >= 90) status = 'completed';
    else if (progress >= 70) status = 'on_track';
    else if (progress >= 50) status = 'at_risk';
    else if (progress > 0) status = 'behind';
    return {
      month,
      monthLabel: monthLabels[i],
      progress,
      status,
      highlights: highlightsByMonth[i] || [],
    };
  });
}

// ── Helper: generate April 2026 daily data ───────────────────
function generateAprilDaily(notes: string[], baseProgress: number): OPRDaily[] {
  const days: OPRDaily[] = [];
  for (let d = 1; d <= 30; d++) {
    const date = `2026-04-${String(d).padStart(2, '0')}`;
    const dayLabel = `4月${d}日`;
    if (d <= 9) {
      const dailyProgress = Math.min(100, baseProgress + Math.round((d / 30) * 15));
      days.push({
        date,
        dayLabel,
        progress: dailyProgress,
        note: notes[d - 1] || '',
      });
    } else {
      days.push({ date, dayLabel, progress: 0, note: '' });
    }
  }
  return days;
}

// ═══════════════════════════════════════════════════════════════
// 1. COS 诸葛亮 — Chief of Staff
// ═══════════════════════════════════════════════════════════════
const cosZhugeLiang: AgentOPRData = {
  agentId: 'cos_zhuge_liang',
  agentRole: 'COS',
  agentName: '诸葛亮',
  agentNameEn: 'Zhuge Liang',
  agentEmoji: '🪄',
  agentColor: 'slate',
  objectives: [
    {
      id: 'cos-obj-1',
      agentId: 'cos_zhuge_liang', agentRole: 'COS', agentName: '诸葛亮', agentEmoji: '🪄',
      title: '路由准确率达到97%以上',
      description: '确保用户问题被精准路由到最合适的CxO专家，减少错误路由和二次转发',
      category: 'technology',
      year: 2026,
      overallProgress: 88,
      status: 'on_track',
      paths: [
        { id: 'cos-p-1', title: '优化意图识别模型精度', description: '对12类业务场景的意图识别进行精调', milestone: 'Q1 2026', progress: 95, status: 'completed' },
        { id: 'cos-p-2', title: '建立路由反馈闭环机制', description: '用户可标记路由是否正确，数据回流优化模型', milestone: 'Q2 2026', progress: 72, status: 'on_track' },
        { id: 'cos-p-3', title: '多Agent协作路由能力', description: '实现L3/L4级别的多Agent协同处理链路', milestone: 'Q3 2026', progress: 45, status: 'on_track' },
      ],
      results: [
        { id: 'cos-r-1', metric: '路由准确率', target: '≥97%', current: '94.6%', progress: 88, trend: 'up', unit: '%' },
        { id: 'cos-r-2', metric: '平均响应时间', target: '≤2秒', current: '1.8秒', progress: 90, trend: 'down', unit: '秒' },
        { id: 'cos-r-3', metric: '二次转发率', target: '≤3%', current: '4.2%', progress: 72, trend: 'down', unit: '%' },
      ],
    },
    {
      id: 'cos-obj-2',
      agentId: 'cos_zhuge_liang', agentRole: 'COS', agentName: '诸葛亮', agentEmoji: '🪄',
      title: '跨部门协作效率提升30%',
      description: '通过优化协调流程，减少部门间信息传递时间和决策延迟',
      category: 'operational',
      year: 2026,
      overallProgress: 65,
      status: 'on_track',
      paths: [
        { id: 'cos-p-4', title: '统一协作工作流平台', description: '打通12个CxO的信息流转通道', milestone: 'Q2 2026', progress: 70, status: 'on_track' },
        { id: 'cos-p-5', title: '自动化决策升级机制', description: '建立L1→L4的自动升级触发条件', milestone: 'Q3 2026', progress: 55, status: 'at_risk' },
      ],
      results: [
        { id: 'cos-r-4', metric: '协作效率提升', target: '30%', current: '22%', progress: 73, trend: 'up', unit: '%' },
        { id: 'cos-r-5', metric: '平均决策耗时', target: '≤4小时', current: '5.2小时', progress: 62, trend: 'down', unit: '小时' },
      ],
    },
  ],
  monthly: generateMonthly(
    [85, 88, 90, 78, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['完成意图识别模型V2训练', '路由准确率突破93%'],
      ['上线路由反馈系统', '处理2,400+条路由记录'],
      ['准确率达94.6%', '启动多Agent协作设计'],
      ['多Agent协作POC启动', '优化响应时间至1.8s'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '完成多Agent协作架构设计文档',
    '路由模型热更新机制测试通过',
    '与CTO协调API网关升级方案',
    '处理L3级别的跨部门协作请求42件',
    '二次转发率降至4.0%',
    '周末系统维护窗口',
    '路由日志分析报告完成',
    '启动Q2路由优化冲刺',
    '准确率当日达95.1%',
  ], 78),
};

// ═══════════════════════════════════════════════════════════════
// 2. CEO 张无忌 — Chief Executive Officer
// ═══════════════════════════════════════════════════════════════
const ceoZhangWuji: AgentOPRData = {
  agentId: 'ceo_zhang_wuji',
  agentRole: 'CEO',
  agentName: '张无忌',
  agentNameEn: 'Zhang Wuji',
  agentEmoji: '⚔️',
  agentColor: 'amber',
  objectives: [
    {
      id: 'ceo-obj-1',
      agentId: 'ceo_zhang_wuji', agentRole: 'CEO', agentName: '张无忌', agentEmoji: '⚔️',
      title: '年度营收增长25%达到¥2.5亿',
      description: '通过品牌升级、门店扩张和数字化转型实现集团营收目标',
      category: 'growth',
      year: 2026,
      overallProgress: 72,
      status: 'on_track',
      paths: [
        { id: 'ceo-p-1', title: '新开8家直营门店', description: '在成都、重庆、杭州等城市拓展', milestone: 'Q4 2026', progress: 38, status: 'on_track' },
        { id: 'ceo-p-2', title: '品牌战略升级发布', description: '完成品牌VI更新和全渠道形象统一', milestone: 'Q2 2026', progress: 80, status: 'on_track' },
        { id: 'ceo-p-3', title: '数字化转型里程碑', description: 'AI C-Suite全面上线运营', milestone: 'Q3 2026', progress: 60, status: 'on_track' },
      ],
      results: [
        { id: 'ceo-r-1', metric: '累计营收', target: '¥2.5亿', current: '¥0.78亿', progress: 31, trend: 'up', unit: '亿' },
        { id: 'ceo-r-2', metric: '门店数量', target: '28家', current: '22家', progress: 79, trend: 'up', unit: '家' },
        { id: 'ceo-r-3', metric: '品牌完整性评分', target: '≥95分', current: '91分', progress: 96, trend: 'up', unit: '分' },
      ],
    },
    {
      id: 'ceo-obj-2',
      agentId: 'ceo_zhang_wuji', agentRole: 'CEO', agentName: '张无忌', agentEmoji: '⚔️',
      title: '战略决策响应效率提升40%',
      description: '利用AI C-Suite系统加速战略级决策流程',
      category: 'operational',
      year: 2026,
      overallProgress: 58,
      status: 'at_risk',
      paths: [
        { id: 'ceo-p-4', title: 'L4决策流程数字化', description: '将CEO拍板流程嵌入AI审批链', milestone: 'Q2 2026', progress: 65, status: 'at_risk' },
        { id: 'ceo-p-5', title: '战略仪表盘上线', description: '实时汇总12个CxO关键指标', milestone: 'Q1 2026', progress: 90, status: 'completed' },
      ],
      results: [
        { id: 'ceo-r-4', metric: '决策响应速度提升', target: '40%', current: '28%', progress: 70, trend: 'up', unit: '%' },
        { id: 'ceo-r-5', metric: 'L4决策平均耗时', target: '≤24小时', current: '32小时', progress: 58, trend: 'down', unit: '小时' },
      ],
    },
  ],
  monthly: generateMonthly(
    [60, 68, 75, 72, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['战略仪表盘V1上线', '完成年度战略目标拆解'],
      ['品牌升级方案定稿', '新增2家门店签约'],
      ['成都首店开业', 'AI系统试运营'],
      ['Q1营收达¥0.78亿', '启动Q2扩张计划'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '审批成都二店选址方案',
    'AI C-Suite月度运营评审',
    '品牌VI更新最终确认',
    '与CGO讨论外卖渠道战略',
    '投资人季度沟通会',
    '周末战略思考',
    '杭州市场调研报告评审',
    'Q2预算审批完成',
    '门店扩张时间表调整',
  ], 72),
};

// ═══════════════════════════════════════════════════════════════
// 3. CFO 巴菲特 — Chief Financial Officer
// ═══════════════════════════════════════════════════════════════
const cfoBuFfett: AgentOPRData = {
  agentId: 'cfo_buffett',
  agentRole: 'CFO',
  agentName: '沃伦·巴菲特',
  agentNameEn: 'Warren Buffett',
  agentEmoji: '💰',
  agentColor: 'green',
  objectives: [
    {
      id: 'cfo-obj-1',
      agentId: 'cfo_buffett', agentRole: 'CFO', agentName: '沃伦·巴菲特', agentEmoji: '💰',
      title: '全年食材成本率控制在33%以下',
      description: '通过供应商优化、价格监控和采购流程改进控制核心成本',
      category: 'financial',
      year: 2026,
      overallProgress: 85,
      status: 'on_track',
      paths: [
        { id: 'cfo-p-1', title: '建立供应商价格浮动预警机制', description: '实时监控50+核心食材价格波动', milestone: 'Q1 2026', progress: 95, status: 'completed' },
        { id: 'cfo-p-2', title: '季度成本审计 + 采购优化', description: '每季度完成全品类成本分析与优化建议', milestone: 'Q4 2026', progress: 60, status: 'on_track' },
        { id: 'cfo-p-3', title: '中央厨房集采模式推广', description: '将集中采购覆盖率从60%提升至85%', milestone: 'Q3 2026', progress: 52, status: 'on_track' },
      ],
      results: [
        { id: 'cfo-r-1', metric: '食材成本率', target: '≤33%', current: '30.8%', progress: 93, trend: 'down', unit: '%' },
        { id: 'cfo-r-2', metric: '年度采购节约', target: '¥500万', current: '¥380万', progress: 76, trend: 'up', unit: '万' },
      ],
    },
    {
      id: 'cfo-obj-2',
      agentId: 'cfo_buffett', agentRole: 'CFO', agentName: '沃伦·巴菲特', agentEmoji: '💰',
      title: '净利润率达到15%',
      description: '在营收增长的同时确保盈利能力稳步提升',
      category: 'financial',
      year: 2026,
      overallProgress: 68,
      status: 'at_risk',
      paths: [
        { id: 'cfo-p-4', title: '人力成本优化方案', description: '通过AI辅助排班降低人力成本占比2个百分点', milestone: 'Q2 2026', progress: 55, status: 'at_risk' },
        { id: 'cfo-p-5', title: '门店盈利模型标准化', description: '建立单店盈利分析模型并推广', milestone: 'Q3 2026', progress: 40, status: 'on_track' },
      ],
      results: [
        { id: 'cfo-r-3', metric: '净利润率', target: '15%', current: '12.3%', progress: 82, trend: 'up', unit: '%' },
        { id: 'cfo-r-4', metric: '人力成本占比', target: '≤28%', current: '30.1%', progress: 65, trend: 'down', unit: '%' },
      ],
    },
    {
      id: 'cfo-obj-3',
      agentId: 'cfo_buffett', agentRole: 'CFO', agentName: '沃伦·巴菲特', agentEmoji: '💰',
      title: '财务自动化率达到80%',
      description: '实现报表生成、费用审批、发票核验的自动化处理',
      category: 'technology',
      year: 2026,
      overallProgress: 72,
      status: 'on_track',
      paths: [
        { id: 'cfo-p-6', title: '自动化报表系统上线', description: '日/周/月报自动生成并推送', milestone: 'Q1 2026', progress: 90, status: 'completed' },
        { id: 'cfo-p-7', title: 'AI费用审批流程', description: '小额费用（≤¥5000）AI自动审批', milestone: 'Q2 2026', progress: 65, status: 'on_track' },
      ],
      results: [
        { id: 'cfo-r-5', metric: '财务自动化率', target: '80%', current: '68%', progress: 85, trend: 'up', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [70, 78, 82, 75, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['供应商预警系统上线', 'Q4 2025审计完成'],
      ['集采模式扩展到3个城市', '自动化报表V1上线'],
      ['食材成本率降至30.8%', 'Q1财报闭环'],
      ['启动人力成本优化', '费用AI审批试点'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '月度成本分析报告提交',
    '供应商价格异动预警：猪肉涨幅8%',
    '与COO协调排班优化省人力方案',
    '季度采购合同续签审核',
    '净利润率月度追踪：12.5%',
    '周末',
    '费用AI审批系统Bug修复',
    '新门店财务模型评审',
    '发布4月第一周财务速报',
  ], 75),
};

// ═══════════════════════════════════════════════════════════════
// 4. COO 霍华德·舒尔茨 — Chief Operating Officer
// ═══════════════════════════════════════════════════════════════
const cooRayKroc: AgentOPRData = {
  agentId: 'coo_howard_schultz',
  agentRole: 'COO',
  agentName: '霍华德·舒尔茨',
  agentNameEn: 'Howard Schultz',
  agentEmoji: '☕',
  agentColor: 'orange',
  objectives: [
    {
      id: 'coo-obj-1',
      agentId: 'coo_howard_schultz', agentRole: 'COO', agentName: '霍华德·舒尔茨', agentEmoji: '☕',
      title: '门店运营标准化覆盖率达95%',
      description: '通过SOP数字化和AI巡检确保所有门店运营达标',
      category: 'operational',
      year: 2026,
      overallProgress: 80,
      status: 'on_track',
      paths: [
        { id: 'coo-p-1', title: 'SOP数字化平台建设', description: '将200+项SOP转化为数字化检查清单', milestone: 'Q1 2026', progress: 92, status: 'completed' },
        { id: 'coo-p-2', title: 'AI视觉巡检系统部署', description: '门店后厨AI监控覆盖', milestone: 'Q3 2026', progress: 48, status: 'on_track' },
        { id: 'coo-p-3', title: '门店评分考核体系上线', description: '月度门店运营评分排名制度', milestone: 'Q2 2026', progress: 75, status: 'on_track' },
      ],
      results: [
        { id: 'coo-r-1', metric: '标准化覆盖率', target: '95%', current: '88%', progress: 93, trend: 'up', unit: '%' },
        { id: 'coo-r-2', metric: '门店评分均值', target: '≥90分', current: '86.5分', progress: 85, trend: 'up', unit: '分' },
      ],
    },
    {
      id: 'coo-obj-2',
      agentId: 'coo_howard_schultz', agentRole: 'COO', agentName: '霍华德·舒尔茨', agentEmoji: '☕',
      title: '顾客满意度NPS达到70+',
      description: '通过服务流程优化和投诉快速响应提升顾客体验',
      category: 'operational',
      year: 2026,
      overallProgress: 62,
      status: 'at_risk',
      paths: [
        { id: 'coo-p-4', title: '投诉15分钟响应机制', description: '建立门店→总部实时投诉通道', milestone: 'Q1 2026', progress: 85, status: 'on_track' },
        { id: 'coo-p-5', title: '服务培训季度考核', description: '每季度全员服务技能考核', milestone: 'Q4 2026', progress: 35, status: 'at_risk' },
      ],
      results: [
        { id: 'coo-r-3', metric: 'NPS分数', target: '70+', current: '62', progress: 89, trend: 'up', unit: '' },
        { id: 'coo-r-4', metric: '投诉响应时间', target: '≤15分钟', current: '18分钟', progress: 72, trend: 'down', unit: '分钟' },
      ],
    },
  ],
  monthly: generateMonthly(
    [72, 76, 82, 71, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['SOP数字化平台V1发布', '覆盖120项核心SOP'],
      ['投诉响应系统上线', 'NPS突破60'],
      ['标准化覆盖率达88%', '启动AI巡检POC'],
      ['门店评分系统试运行', '优化排班算法'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '门店日报汇总：22家门店全部正常',
    '3号门店设备报修处理',
    '新SOP推送：夏季食品安全专项',
    '排班AI优化建议采纳率72%',
    '周度运营例会',
    '巡店：5号门店评分提升',
    'AI巡检系统需求评审',
    '投诉响应时间降至16分钟',
    '4月培训计划发布',
  ], 71),
};

// ═══════════════════════════════════════════════════════════════
// 5. CLO 拿破仑 — Chief Legal Officer
// ═══════════════════════════════════════════════════════════════
const cloNapoleon: AgentOPRData = {
  agentId: 'clo_napoleon',
  agentRole: 'CLO',
  agentName: '拿破仑·波拿巴',
  agentNameEn: 'Napoleon Bonaparte',
  agentEmoji: '⚖️',
  agentColor: 'indigo',
  objectives: [
    {
      id: 'clo-obj-1',
      agentId: 'clo_napoleon', agentRole: 'CLO', agentName: '拿破仑·波拿巴', agentEmoji: '⚖️',
      title: '合规审查通过率100%',
      description: '确保所有门店通过食品安全、消防、卫生等各项合规检查',
      category: 'legal',
      year: 2026,
      overallProgress: 92,
      status: 'on_track',
      paths: [
        { id: 'clo-p-1', title: '合规自检系统全覆盖', description: '每月门店合规自检 + AI分析', milestone: 'Q1 2026', progress: 100, status: 'completed' },
        { id: 'clo-p-2', title: '法规变更自动追踪', description: '实时监控食品安全法规更新', milestone: 'Q2 2026', progress: 80, status: 'on_track' },
        { id: 'clo-p-3', title: '年度食安审计预演', description: '模拟政府检查并整改', milestone: 'Q3 2026', progress: 45, status: 'on_track' },
      ],
      results: [
        { id: 'clo-r-1', metric: '合规通过率', target: '100%', current: '100%', progress: 100, trend: 'flat', unit: '%' },
        { id: 'clo-r-2', metric: '食安审计评分', target: '≥95分', current: '97分', progress: 100, trend: 'up', unit: '分' },
        { id: 'clo-r-3', metric: '法规更新响应时间', target: '≤48小时', current: '36小时', progress: 90, trend: 'down', unit: '小时' },
      ],
    },
    {
      id: 'clo-obj-2',
      agentId: 'clo_napoleon', agentRole: 'CLO', agentName: '拿破仑·波拿巴', agentEmoji: '⚖️',
      title: '合同审核周期缩短至3个工作日',
      description: '通过AI辅助合同审核加速商业合同签约流程',
      category: 'legal',
      year: 2026,
      overallProgress: 70,
      status: 'on_track',
      paths: [
        { id: 'clo-p-4', title: 'AI合同审核引擎上线', description: '自动识别风险条款并标注', milestone: 'Q2 2026', progress: 68, status: 'on_track' },
        { id: 'clo-p-5', title: '标准合同模板库建设', description: '覆盖采购、租赁、劳动等8大类', milestone: 'Q1 2026', progress: 88, status: 'on_track' },
      ],
      results: [
        { id: 'clo-r-4', metric: '合同审核周期', target: '≤3天', current: '4.2天', progress: 71, trend: 'down', unit: '天' },
        { id: 'clo-r-5', metric: '风险条款识别率', target: '≥95%', current: '89%', progress: 94, trend: 'up', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [88, 90, 93, 82, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['合规自检系统全覆盖上线', '标准合同模板V1发布'],
      ['Q1食安审计全部通过', '合同模板扩展至8类'],
      ['法规追踪系统部署', 'AI合同审核POC完成'],
      ['新门店合规预审', '劳动法规更新应对'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '4月合规自检报告汇总',
    '新租赁合同风险审查',
    '食品安全法规更新追踪',
    '3家门店消防检查预演',
    '劳动合同模板更新',
    '周末',
    'AI合同审核系统测试',
    '供应商合同续签审核',
    '合规培训月度推送',
  ], 82),
};

// ═══════════════════════════════════════════════════════════════
// 6. CGO 马斯克 — Chief Growth Officer
// ═══════════════════════════════════════════════════════════════
const cgoElonMusk: AgentOPRData = {
  agentId: 'cgo_elon_musk',
  agentRole: 'CGO',
  agentName: '埃隆·马斯克',
  agentNameEn: 'Elon Musk',
  agentEmoji: '🚀',
  agentColor: 'sky',
  objectives: [
    {
      id: 'cgo-obj-1',
      agentId: 'cgo_elon_musk', agentRole: 'CGO', agentName: '埃隆·马斯克', agentEmoji: '🚀',
      title: '外卖及新零售渠道营收占比达30%',
      description: '拓展线上渠道，将外卖、小程序商城、直播带货纳入增长引擎',
      category: 'growth',
      year: 2026,
      overallProgress: 55,
      status: 'at_risk',
      paths: [
        { id: 'cgo-p-1', title: '外卖平台运营优化', description: '美团/饿了么评分提升至4.8+', milestone: 'Q2 2026', progress: 70, status: 'on_track' },
        { id: 'cgo-p-2', title: '小程序商城上线', description: '自有渠道预订+外卖+周边商城', milestone: 'Q2 2026', progress: 45, status: 'at_risk' },
        { id: 'cgo-p-3', title: '直播带货月度常态化', description: '每月至少4场直播，单场GMV≥¥5万', milestone: 'Q3 2026', progress: 30, status: 'behind' },
      ],
      results: [
        { id: 'cgo-r-1', metric: '线上渠道营收占比', target: '30%', current: '18%', progress: 60, trend: 'up', unit: '%' },
        { id: 'cgo-r-2', metric: '外卖平台评分', target: '4.8', current: '4.6', progress: 88, trend: 'up', unit: '' },
        { id: 'cgo-r-3', metric: '月度新客获取', target: '5000人', current: '3200人', progress: 64, trend: 'up', unit: '人' },
      ],
    },
    {
      id: 'cgo-obj-2',
      agentId: 'cgo_elon_musk', agentRole: 'CGO', agentName: '埃隆·马斯克', agentEmoji: '🚀',
      title: '会员体系注册用户突破50万',
      description: '建立忠诚度计划，提高复购率和客户终身价值',
      category: 'growth',
      year: 2026,
      overallProgress: 62,
      status: 'on_track',
      paths: [
        { id: 'cgo-p-4', title: '会员积分系统上线', description: '消费积分 + 等级权益 + 生日礼遇', milestone: 'Q1 2026', progress: 88, status: 'on_track' },
        { id: 'cgo-p-5', title: '会员日活动策划', description: '每月28日会员专享活动', milestone: 'Q4 2026', progress: 50, status: 'on_track' },
      ],
      results: [
        { id: 'cgo-r-4', metric: '会员注册数', target: '50万', current: '28万', progress: 56, trend: 'up', unit: '万' },
        { id: 'cgo-r-5', metric: '会员复购率', target: '≥40%', current: '34%', progress: 85, trend: 'up', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [50, 55, 60, 58, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['会员系统正式上线', '外卖优化方案启动'],
      ['会员突破20万', '外卖评分4.5'],
      ['小程序商城MVP完成', '首场直播测试'],
      ['线上占比达18%', '会员28万'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '外卖平台数据周报分析',
    '小程序商城UI评审',
    '直播团队组建面试',
    '会员日活动复盘',
    '美团运营策略调整',
    '周末',
    '新客获取渠道分析',
    '与CMO协调推广资源',
    '4月增长目标调整会议',
  ], 58),
};

// ═══════════════════════════════════════════════════════════════
// 7. CCO 埃斯科菲耶 — Chief Culinary Officer
// ═══════════════════════════════════════════════════════════════
const ccoEscoffier: AgentOPRData = {
  agentId: 'cco_escoffier',
  agentRole: 'CCO',
  agentName: '奥古斯特·埃斯科菲耶',
  agentNameEn: 'Auguste Escoffier',
  agentEmoji: '👨‍🍳',
  agentColor: 'red',
  objectives: [
    {
      id: 'cco-obj-1',
      agentId: 'cco_escoffier', agentRole: 'CCO', agentName: '奥古斯特·埃斯科菲耶', agentEmoji: '👨‍🍳',
      title: '菜品满意度评分≥4.7/5.0',
      description: '通过菜品研发、品控管理和季节性创新保持高满意度',
      category: 'brand',
      year: 2026,
      overallProgress: 82,
      status: 'on_track',
      paths: [
        { id: 'cco-p-1', title: '季度新品研发计划', description: '每季度推出3-5款新品', milestone: 'Q4 2026', progress: 75, status: 'on_track' },
        { id: 'cco-p-2', title: '出品标准SOP数字化', description: '核心菜品出品标准全部数字化', milestone: 'Q2 2026', progress: 85, status: 'on_track' },
        { id: 'cco-p-3', title: '食材品质追溯系统', description: '从田间到餐桌的全链路追溯', milestone: 'Q3 2026', progress: 40, status: 'on_track' },
      ],
      results: [
        { id: 'cco-r-1', metric: '菜品满意度', target: '4.7', current: '4.5', progress: 91, trend: 'up', unit: '' },
        { id: 'cco-r-2', metric: '新品推出数', target: '16款/年', current: '5款', progress: 31, trend: 'up', unit: '款' },
        { id: 'cco-r-3', metric: '出品合格率', target: '≥98%', current: '96.8%', progress: 94, trend: 'up', unit: '%' },
      ],
    },
    {
      id: 'cco-obj-2',
      agentId: 'cco_escoffier', agentRole: 'CCO', agentName: '奥古斯特·埃斯科菲耶', agentEmoji: '👨‍🍳',
      title: '厨师团队技能认证通过率90%',
      description: '建立厨师技能分级认证体系，提升团队整体水平',
      category: 'people',
      year: 2026,
      overallProgress: 58,
      status: 'on_track',
      paths: [
        { id: 'cco-p-4', title: '技能认证标准制定', description: '初/中/高三级认证标准', milestone: 'Q1 2026', progress: 92, status: 'completed' },
        { id: 'cco-p-5', title: '季度技能考核执行', description: '每季度一次实操考核', milestone: 'Q4 2026', progress: 35, status: 'on_track' },
      ],
      results: [
        { id: 'cco-r-4', metric: '认证通过率', target: '90%', current: '78%', progress: 87, trend: 'up', unit: '%' },
        { id: 'cco-r-5', metric: '厨师流失率', target: '≤10%', current: '12%', progress: 75, trend: 'down', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [68, 75, 80, 72, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['技能认证标准发布', 'Q1新品3款上线'],
      ['出品SOP数字化50%', '满意度4.4'],
      ['春季新品2款上线', '满意度提升至4.5'],
      ['Q1技能考核完成', '食材追溯系统设计'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '新品研发：夏季凉菜系列方案',
    '出品标准检查：3号门店',
    '食材供应商品鉴会',
    '厨师技能考核结果汇总',
    '菜品满意度数据分析',
    '周末',
    '新菜品试味会',
    '出品SOP更新推送',
    '与CSCO讨论夏季食材采购',
  ], 72),
};

// ═══════════════════════════════════════════════════════════════
// 8. CHRO 德鲁克 — Chief Human Resources Officer
// ═══════════════════════════════════════════════════════════════
const chroDrucker: AgentOPRData = {
  agentId: 'chro_peter_drucker',
  agentRole: 'CHRO',
  agentName: '彼得·德鲁克',
  agentNameEn: 'Peter Drucker',
  agentEmoji: '🤝',
  agentColor: 'teal',
  objectives: [
    {
      id: 'chro-obj-1',
      agentId: 'chro_peter_drucker', agentRole: 'CHRO', agentName: '彼得·德鲁克', agentEmoji: '🤝',
      title: '全年员工离职率控制在15%以下',
      description: '通过薪酬优化、职业发展和文化建设降低核心人才流失',
      category: 'people',
      year: 2026,
      overallProgress: 70,
      status: 'at_risk',
      paths: [
        { id: 'chro-p-1', title: '薪酬竞争力分析与调整', description: '对标行业P75分位调整薪资结构', milestone: 'Q1 2026', progress: 85, status: 'on_track' },
        { id: 'chro-p-2', title: '职业发展双通道建设', description: '管理通道 + 专业通道双轨晋升', milestone: 'Q2 2026', progress: 60, status: 'at_risk' },
        { id: 'chro-p-3', title: '员工关怀计划', description: '生日关怀、节日福利、心理咨询', milestone: 'Q4 2026', progress: 45, status: 'on_track' },
      ],
      results: [
        { id: 'chro-r-1', metric: '年化离职率', target: '≤15%', current: '18.2%', progress: 68, trend: 'down', unit: '%' },
        { id: 'chro-r-2', metric: '员工满意度', target: '≥85分', current: '79分', progress: 93, trend: 'up', unit: '分' },
      ],
    },
    {
      id: 'chro-obj-2',
      agentId: 'chro_peter_drucker', agentRole: 'CHRO', agentName: '彼得·德鲁克', agentEmoji: '🤝',
      title: '培训完成率达到95%',
      description: '确保全员完成岗位技能培训和合规培训',
      category: 'people',
      year: 2026,
      overallProgress: 78,
      status: 'on_track',
      paths: [
        { id: 'chro-p-4', title: '在线学习平台上线', description: '移动端学习 + 考核 + 积分', milestone: 'Q1 2026', progress: 95, status: 'completed' },
        { id: 'chro-p-5', title: '季度培训计划标准化', description: '每季度发布标准培训清单', milestone: 'Q4 2026', progress: 65, status: 'on_track' },
      ],
      results: [
        { id: 'chro-r-3', metric: '培训完成率', target: '95%', current: '88%', progress: 93, trend: 'up', unit: '%' },
        { id: 'chro-r-4', metric: '培训满意度', target: '≥4.5分', current: '4.3分', progress: 91, trend: 'up', unit: '分' },
      ],
    },
  ],
  monthly: generateMonthly(
    [65, 70, 76, 72, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['薪酬调整方案发布', '学习平台上线'],
      ['Q1培训计划执行', '离职率降至19%'],
      ['双通道晋升制度初稿', '培训完成率85%'],
      ['员工关怀计划启动', '春季招聘完成'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '月度离职数据统计',
    '春季校招结果汇总',
    '双通道晋升制度评审',
    '员工满意度调查发布',
    'Q2培训计划定稿',
    '周末',
    '新员工入职培训',
    '薪酬报告提交CFO',
    '员工关怀计划4月执行',
  ], 72),
};

// ═══════════════════════════════════════════════════════════════
// 9. CAIO 图灵 — Chief AI Officer
// ═══════════════════════════════════════════════════════════════
const caioTuring: AgentOPRData = {
  agentId: 'caio_alan_turing',
  agentRole: 'CAIO',
  agentName: '阿兰·图灵',
  agentNameEn: 'Alan Turing',
  agentEmoji: '🧠',
  agentColor: 'violet',
  objectives: [
    {
      id: 'caio-obj-1',
      agentId: 'caio_alan_turing', agentRole: 'CAIO', agentName: '阿兰·图灵', agentEmoji: '🧠',
      title: 'AI治理框架合规率100%',
      description: '确保所有AI系统符合国家AI治理法规和企业伦理标准',
      category: 'technology',
      year: 2026,
      overallProgress: 85,
      status: 'on_track',
      paths: [
        { id: 'caio-p-1', title: 'AI伦理审查委员会运营', description: '月度审查会 + 季度报告', milestone: 'Q4 2026', progress: 80, status: 'on_track' },
        { id: 'caio-p-2', title: 'AI偏见检测体系', description: '所有模型输出的偏见检测与修正', milestone: 'Q2 2026', progress: 72, status: 'on_track' },
        { id: 'caio-p-3', title: 'AI可解释性报告', description: '关键决策的可解释性记录', milestone: 'Q3 2026', progress: 55, status: 'on_track' },
      ],
      results: [
        { id: 'caio-r-1', metric: 'AI治理合规率', target: '100%', current: '96%', progress: 96, trend: 'up', unit: '%' },
        { id: 'caio-r-2', metric: 'Agent准确率', target: '≥95%', current: '93.2%', progress: 92, trend: 'up', unit: '%' },
      ],
    },
    {
      id: 'caio-obj-2',
      agentId: 'caio_alan_turing', agentRole: 'CAIO', agentName: '阿兰·图灵', agentEmoji: '🧠',
      title: 'AI系统安全零事故',
      description: '防止AI幻觉、注入攻击和数据泄露等安全事件',
      category: 'technology',
      year: 2026,
      overallProgress: 92,
      status: 'on_track',
      paths: [
        { id: 'caio-p-4', title: '注入攻击防护升级', description: '多层防注入机制 + 实时监控', milestone: 'Q1 2026', progress: 98, status: 'completed' },
        { id: 'caio-p-5', title: 'AI幻觉检测与修正', description: '输出置信度分级 + 人工确认机制', milestone: 'Q2 2026', progress: 85, status: 'on_track' },
      ],
      results: [
        { id: 'caio-r-3', metric: '安全事故数', target: '0', current: '0', progress: 100, trend: 'flat', unit: '次' },
        { id: 'caio-r-4', metric: '注入攻击拦截率', target: '100%', current: '100%', progress: 100, trend: 'flat', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [80, 85, 88, 85, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['注入防护V2上线', '首次AI伦理审查会'],
      ['偏见检测系统Alpha版', '准确率提升至92%'],
      ['治理框架通过外审', '安全零事故保持'],
      ['可解释性报告V1', 'Agent准确率93.2%'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    'AI伦理月度审查报告',
    'Agent偏见检测结果分析',
    '安全事件0发生 — 持续保持',
    '可解释性报告模板设计',
    '与CTO协调模型更新计划',
    '周末',
    'AI治理法规更新追踪',
    '置信度分级系统优化',
    'Agent准确率日监控：94.1%',
  ], 85),
};

// ═══════════════════════════════════════════════════════════════
// 11. CPO 贝聿铭 — Chief Project Officer
// ═══════════════════════════════════════════════════════════════
const cpoPei: AgentOPRData = {
  agentId: 'cpo_bei_yuming',
  agentRole: 'CPO',
  agentName: '贝聿铭',
  agentNameEn: 'I.M. Pei',
  agentEmoji: '🏛️',
  agentColor: 'cyan',
  objectives: [
    {
      id: 'cpo-obj-1',
      agentId: 'cpo_bei_yuming', agentRole: 'CPO', agentName: '贝聿铭', agentEmoji: '🏛️',
      title: '项目按时交付率≥90%',
      description: '确保门店装修、系统上线等关键项目按期完成',
      category: 'operational',
      year: 2026,
      overallProgress: 75,
      status: 'on_track',
      paths: [
        { id: 'cpo-p-1', title: '项目管理平台标准化', description: '统一使用项目管理工具追踪里程碑', milestone: 'Q1 2026', progress: 90, status: 'completed' },
        { id: 'cpo-p-2', title: '施工队伍评级体系', description: '建立施工方ABC评级淘汰机制', milestone: 'Q2 2026', progress: 65, status: 'on_track' },
        { id: 'cpo-p-3', title: '新店标准化装修包', description: '3种门店类型的标准装修方案', milestone: 'Q2 2026', progress: 72, status: 'on_track' },
      ],
      results: [
        { id: 'cpo-r-1', metric: '按时交付率', target: '90%', current: '82%', progress: 91, trend: 'up', unit: '%' },
        { id: 'cpo-r-2', metric: '项目预算偏差', target: '≤5%', current: '7.2%', progress: 70, trend: 'down', unit: '%' },
      ],
    },
    {
      id: 'cpo-obj-2',
      agentId: 'cpo_bei_yuming', agentRole: 'CPO', agentName: '贝聿铭', agentEmoji: '🏛️',
      title: '新店开业周期缩短至45天',
      description: '优化新店从签约到开业的全流程时间',
      category: 'operational',
      year: 2026,
      overallProgress: 60,
      status: 'at_risk',
      paths: [
        { id: 'cpo-p-4', title: '并行施工流程设计', description: '将串行工序改为并行执行', milestone: 'Q2 2026', progress: 55, status: 'at_risk' },
        { id: 'cpo-p-5', title: '供应商预制件采购', description: '核心装修部件预制化降低现场工期', milestone: 'Q3 2026', progress: 35, status: 'on_track' },
      ],
      results: [
        { id: 'cpo-r-3', metric: '开业周期', target: '45天', current: '58天', progress: 62, trend: 'down', unit: '天' },
        { id: 'cpo-r-4', metric: '施工返工率', target: '≤3%', current: '5.1%', progress: 59, trend: 'down', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [60, 68, 73, 68, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['项目管理平台上线', '标准装修包V1'],
      ['成都店装修启动', '施工评级初版'],
      ['成都店按期完工', '并行施工方案设计'],
      ['重庆店装修启动', '预制件采购对接'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '成都二店选址评估',
    '重庆店装修进度检查',
    '施工队评级数据收集',
    '标准装修包V2评审',
    '项目预算月度审计',
    '周末',
    '并行施工方案测试',
    '供应商预制件样品验收',
    '项目周报汇总',
  ], 68),
};

// ═══════════════════════════════════════════════════════════════
// 12. CMO 科特勒 — Chief Marketing Officer
// ═══════════════════════════════════════════════════════════════
const cmoKotler: AgentOPRData = {
  agentId: 'cmo_philip_kotler',
  agentRole: 'CMO',
  agentName: '菲利普·科特勒',
  agentNameEn: 'Philip Kotler',
  agentEmoji: '📣',
  agentColor: 'pink',
  objectives: [
    {
      id: 'cmo-obj-1',
      agentId: 'cmo_philip_kotler', agentRole: 'CMO', agentName: '菲利普·科特勒', agentEmoji: '📣',
      title: '品牌知名度提升至城市TOP10餐饮',
      description: '通过内容营销、PR和社交媒体运营提升品牌影响力',
      category: 'brand',
      year: 2026,
      overallProgress: 65,
      status: 'on_track',
      paths: [
        { id: 'cmo-p-1', title: '社交媒体矩阵运营', description: '抖音/小红书/微信三平台日更', milestone: 'Q4 2026', progress: 72, status: 'on_track' },
        { id: 'cmo-p-2', title: 'KOL合作计划', description: '季度合作10+美食KOL', milestone: 'Q4 2026', progress: 55, status: 'on_track' },
        { id: 'cmo-p-3', title: '品牌PR活动', description: '每季度1场品牌主题活动', milestone: 'Q4 2026', progress: 50, status: 'on_track' },
      ],
      results: [
        { id: 'cmo-r-1', metric: '品牌搜索指数', target: 'TOP10', current: '第15名', progress: 67, trend: 'up', unit: '' },
        { id: 'cmo-r-2', metric: '社媒粉丝总量', target: '100万', current: '62万', progress: 62, trend: 'up', unit: '万' },
        { id: 'cmo-r-3', metric: '营销ROI', target: '≥5:1', current: '4.2:1', progress: 84, trend: 'up', unit: '' },
      ],
    },
    {
      id: 'cmo-obj-2',
      agentId: 'cmo_philip_kotler', agentRole: 'CMO', agentName: '菲利普·科特勒', agentEmoji: '📣',
      title: '营销获客成本降至¥35/人',
      description: '优化渠道投放效率，降低单客获取成本',
      category: 'financial',
      year: 2026,
      overallProgress: 58,
      status: 'at_risk',
      paths: [
        { id: 'cmo-p-4', title: '数据驱动投放优化', description: 'AI分析投放数据，自动调整出价', milestone: 'Q2 2026', progress: 62, status: 'at_risk' },
        { id: 'cmo-p-5', title: '口碑传播激励体系', description: '老带新奖励机制', milestone: 'Q2 2026', progress: 48, status: 'at_risk' },
      ],
      results: [
        { id: 'cmo-r-4', metric: '获客成本', target: '¥35/人', current: '¥42/人', progress: 70, trend: 'down', unit: '元' },
        { id: 'cmo-r-5', metric: '口碑推荐占比', target: '≥25%', current: '18%', progress: 72, trend: 'up', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [55, 60, 65, 62, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['社媒矩阵全面启动', '春节营销活动'],
      ['KOL合作5位', '粉丝突破50万'],
      ['品牌活动："星座美食节"', '获客成本¥44'],
      ['投放策略优化', '口碑传播系统设计'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '4月内容日历定稿',
    '抖音短视频数据复盘',
    'KOL合作方案评审',
    '品牌VI应用检查',
    '投放数据周分析',
    '周末',
    '小红书爆款内容策划',
    '口碑传播方案设计',
    '营销预算月度审计',
  ], 62),
};

// ═══════════════════════════════════════════════════════════════
// 12. CSCO 雷·克罗克 — Chief Supply Chain Officer
// ═══════════════════════════════════════════════════════════════
const cscoKroc: AgentOPRData = {
  agentId: 'csco_ray_kroc',
  agentRole: 'CSCO',
  agentName: '雷·克罗克',
  agentNameEn: 'Ray Kroc',
  agentEmoji: '🚛',
  agentColor: 'yellow',
  objectives: [
    {
      id: 'csco-obj-1',
      agentId: 'csco_ray_kroc', agentRole: 'CSCO', agentName: '雷·克罗克', agentEmoji: '🚛',
      title: '供应链准时交付率达到98%',
      description: '确保食材和物料按时按质到达各门店',
      category: 'operational',
      year: 2026,
      overallProgress: 82,
      status: 'on_track',
      paths: [
        { id: 'csco-p-1', title: '供应商绩效管理系统', description: '建立供应商KPI评估和淘汰机制', milestone: 'Q1 2026', progress: 90, status: 'completed' },
        { id: 'csco-p-2', title: '智能库存管理系统', description: 'AI预测需求 + 自动补货', milestone: 'Q2 2026', progress: 68, status: 'on_track' },
        { id: 'csco-p-3', title: '冷链物流优化', description: '全程温控监控 + 路线优化', milestone: 'Q3 2026', progress: 50, status: 'on_track' },
      ],
      results: [
        { id: 'csco-r-1', metric: '准时交付率', target: '98%', current: '95.6%', progress: 92, trend: 'up', unit: '%' },
        { id: 'csco-r-2', metric: '库存周转天数', target: '≤3天', current: '3.8天', progress: 72, trend: 'down', unit: '天' },
        { id: 'csco-r-3', metric: '食材损耗率', target: '≤2%', current: '2.5%', progress: 80, trend: 'down', unit: '%' },
      ],
    },
    {
      id: 'csco-obj-2',
      agentId: 'csco_ray_kroc', agentRole: 'CSCO', agentName: '雷·克罗克', agentEmoji: '🚛',
      title: '供应链成本降低10%',
      description: '通过集约化采购和物流优化降低供应链总成本',
      category: 'financial',
      year: 2026,
      overallProgress: 55,
      status: 'at_risk',
      paths: [
        { id: 'csco-p-4', title: '集约化采购平台', description: '整合22家门店采购需求统一谈判', milestone: 'Q2 2026', progress: 60, status: 'at_risk' },
        { id: 'csco-p-5', title: '物流路线优化', description: '减少空载率和配送频次', milestone: 'Q3 2026', progress: 35, status: 'on_track' },
      ],
      results: [
        { id: 'csco-r-4', metric: '供应链成本降幅', target: '10%', current: '5.8%', progress: 58, trend: 'up', unit: '%' },
        { id: 'csco-r-5', metric: '空载率', target: '≤10%', current: '15%', progress: 67, trend: 'down', unit: '%' },
      ],
    },
  ],
  monthly: generateMonthly(
    [65, 72, 78, 70, 0, 0, 0, 0, 0, 0, 0, 0],
    [
      ['供应商KPI系统上线', '冷链监控部署'],
      ['库存周转优化至4.0天', '采购整合启动'],
      ['准时交付率95.6%', '智能补货Alpha'],
      ['冷链路线优化设计', '损耗率降至2.5%'],
      [], [], [], [], [], [], [], [],
    ],
  ),
  daily: generateAprilDaily([
    '供应商月度绩效评估',
    '智能库存系统需求评审',
    '冷链物流温度异常处理',
    '集约采购谈判：蔬菜类',
    '食材损耗数据分析',
    '周末',
    '物流路线优化方案评审',
    '新供应商资质审核',
    '供应链周报发布',
  ], 70),
};

// ═══════════════════════════════════════════════════════════════
// Export: all 12 agents
// ═══════════════════════════════════════════════════════════════

export const ALL_OPR_DATA: AgentOPRData[] = [
  cosZhugeLiang,
  ceoZhangWuji,
  cfoBuFfett,
  cooRayKroc,
  cloNapoleon,
  cgoElonMusk,
  ccoEscoffier,
  chroDrucker,
  caioTuring,
  cpoPei,
  cmoKotler,
  cscoKroc,
];

export function getAgentOPRData(agentId: string): AgentOPRData | undefined {
  return ALL_OPR_DATA.find(d => d.agentId === agentId);
}

export function getAllObjectives() {
  return ALL_OPR_DATA.flatMap(d => d.objectives);
}
