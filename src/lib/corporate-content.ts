import {
  Bot,
  Boxes,
  Building2,
  ChefHat,
  Factory,
  Globe,
  Leaf,
  LineChart,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  Users2,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface CorporateNavItem {
  href: string
  label: string
}

export interface HeroSignal {
  value: string
  label: string
  detail: string
}

export interface CapabilityPillar {
  title: string
  description: string
  icon: LucideIcon
  points: string[]
}

export interface IndustryFocus {
  title: string
  description: string
  icon: LucideIcon
  tags: string[]
}

export interface ServiceLayer {
  title: string
  description: string
  icon: LucideIcon
}

export interface AiLoopStep {
  step: string
  title: string
  description: string
}

export interface CommitmentCard {
  title: string
  description: string
  icon: LucideIcon
}

export interface OperatingPrinciple {
  title: string
  description: string
  icon: LucideIcon
}

export interface IndustryPlaybook {
  title: string
  description: string
  icon: LucideIcon
  priorities: string[]
  response: string
}

export interface ContactChannel {
  title: string
  description: string
  icon: LucideIcon
  href: string
  cta: string
}

export interface EngagementStep {
  step: string
  title: string
  description: string
}

export interface BrandSlogan {
  en: string
  zh: string
  description: string
}

export interface BrandFoundation {
  label: string
  title: string
  description: string
}

export interface BrandDifferentiator {
  title: string
  description: string
  icon: LucideIcon
}

export interface BrandStarsPrinciple {
  letter: string
  english: string
  chinese: string
  description: string
  icon: LucideIcon
}

export const corporateNavItems: CorporateNavItem[] = [
  { href: '/', label: '首页' },
  { href: '/about', label: '关于我们' },
  { href: '/industries', label: '行业场景' },
  { href: '/capabilities', label: '核心能力' },
  { href: '/contact', label: '联系我们' },
]

export const corporateContactEmail = 'support@starkitchen.works'

export const brandPositioning =
  '以“环球美味 邻里共享”为引领，打造兼具国际标准与本土温度的餐饮与服务生态品牌。'

export const brandIntroduction =
  '由 AI、人才与供应链驱动的全球化餐饮服务商，致力于将国际星级餐饮标准，以高质价比普惠至企业、医疗、教育等全行业场景。'

export const brandSlogans: BrandSlogan[] = [
  {
    en: 'Global Flavors, Local Hearts!',
    zh: '环球美味 邻里共享!',
    description: '把全球餐饮文化带进本地日常，让国际化体验拥有邻里般的温度与亲近感。'
  },
  {
    en: 'Global Standards, Smart Solutions!',
    zh: '国际标准 数智未来!',
    description: '用国际餐饮标准托住服务质量，再以数智系统放大组织效率与长期竞争力。'
  }
]

export const brandFoundations: BrandFoundation[] = [
  {
    label: '使命',
    title: '成就更加美味与健康的生活',
    description: '以匠心美食、服务纪律和数智能力，让更多行业场景获得更稳定、更健康、更值得信赖的餐饮体验。'
  },
  {
    label: '愿景',
    title: '成为时尚有趣的国际化餐饮与服务品牌',
    description: '既拥有国际化集团的标准与效率，也保持有趣、温暖、富有审美的品牌感。'
  },
  {
    label: '简介',
    title: 'Star Kitchen Hospitality Group / 星厨集团 SK Group',
    description: '星座厨房酒店餐饮管理有限公司对外简称星厨集团 SK Group，是把餐饮、服务、供应链与 AI 经营中枢连接在一起的现代服务集团。'
  }
]

export const brandValues = ['安全', '创新', '卓越', '敏捷', '真诚', '共赢']

export const brandDifferentiators: BrandDifferentiator[] = [
  {
    title: '服务美学',
    description: '把标准化做成体验感，让每一次就餐与服务接触都带着星级秩序与温度。',
    icon: Sparkles
  },
  {
    title: '品牌时尚',
    description: '把功能性做成时尚感，让餐饮品牌既高效可信，又具有记忆点与吸引力。',
    icon: Globe
  },
  {
    title: '智慧美味',
    description: '把传统餐饮做成智慧化美味，让产品生态、运营判断与现场体验持续进化。',
    icon: Bot
  }
]

export const brandStarsPrinciples: BrandStarsPrinciple[] = [
  {
    letter: 'S',
    english: 'Safe',
    chinese: '安星之选，守护健康',
    description: '以严苛标准与全链路溯源，从产地到餐桌层层把关，让每一口都安心无忧。',
    icon: ShieldCheck
  },
  {
    letter: 'T',
    english: 'Tasty',
    chinese: '星厨匠心，味蕾绽放',
    description: '汇聚星级厨艺智慧，融合全球风味与本土精髓，让每一次品尝都成为惊喜探索。',
    icon: ChefHat
  },
  {
    letter: 'A',
    english: 'Attentive',
    chinese: '温暖入微，星级关怀',
    description: '用心倾听并提前洞察需求，以定制菜单与便捷智慧服务，提供精准周到的体验。',
    icon: Users2
  },
  {
    letter: 'R',
    english: 'Reliable',
    chinese: '星光承诺，不负所托',
    description: '以持续改进应对万变需求，用高效执行与稳定交付，成为值得长期托付的合作伙伴。',
    icon: Workflow
  },
  {
    letter: 'S',
    english: 'Smart',
    chinese: '智慧创新，星耀体验',
    description: '拥抱前沿科技，以数智化驱动运营与服务革新，从智能中台到前端互动持续升级。',
    icon: Bot
  }
]

export const heroSignals: HeroSignal[] = [
  {
    value: '04',
    label: '核心能力支柱',
    detail: '餐饮服务、中央厨房、供应链与 AI 经营系统'
  },
  {
    value: '05',
    label: '重点服务场景',
    detail: '覆盖园区、教育、医疗、酒店与工业服务空间'
  },
  {
    value: '01',
    label: '统一运营底座',
    detail: '从总部策略到现场执行，使用同一套经营语言'
  }
]

export const capabilityPillars: CapabilityPillar[] = [
  {
    title: '餐饮服务与体验设计',
    description: '围绕多场景用餐需求，统一品牌表达、菜单结构、服务动线与现场体验。',
    icon: ChefHat,
    points: ['企业与园区餐饮', '酒店与综合体餐饮', '菜单与概念焕新']
  },
  {
    title: '中央厨房与供应协同',
    description: '把采购、备料、生产、配送与门店出品标准连接起来，强化稳定性与规模效率。',
    icon: Boxes,
    points: ['中央厨房组织', '采购与补货逻辑', '损耗与成本控制']
  },
  {
    title: '现场运营与人效管理',
    description: '让班次、岗位、客流节奏和服务质量形成联动，而不是靠单点经验维持运营。',
    icon: Store,
    points: ['门店营运节奏', '班次与工时协同', '区域与总部联动']
  },
  {
    title: 'AI 经营中枢',
    description: '在传统服务集团的运营纪律之上，叠加 AI 原生的感知、分析和行动编排能力。',
    icon: Bot,
    points: ['经营驾驶舱', 'AI 预警与任务流', '多系统数据编排']
  }
]

export const industryFocus: IndustryFocus[] = [
  {
    title: '企业园区与总部空间',
    description: '为总部办公区、产业园和多楼宇场景提供稳定、高体验的日常餐饮服务。',
    icon: Building2,
    tags: ['员工餐厅', '咖啡与轻餐', '全天时服务']
  },
  {
    title: '教育与校园餐饮',
    description: '围绕高峰时段、营养结构和大客流组织，提升学校与培训园区的供餐效率。',
    icon: Users2,
    tags: ['营养配餐', '峰值供餐', '安全追溯']
  },
  {
    title: '医疗与康养空间',
    description: '强调卫生标准、流程纪律和个性化供餐，让餐饮成为服务体验的一部分。',
    icon: ShieldCheck,
    tags: ['食安标准', '特殊餐', '高可靠运营']
  },
  {
    title: '酒店与目的地餐饮',
    description: '在品牌调性、接待体验和多业态协同之间建立更统一的经营方法。',
    icon: Globe,
    tags: ['宴会与全日餐', '品牌体验', '宾客满意度']
  },
  {
    title: '工业园区与生产基地',
    description: '面向高强度班次与稳定供给要求，优化供餐节奏、人员配置和成本结构。',
    icon: Factory,
    tags: ['倒班供餐', '规模效率', '标准化执行']
  }
]

export const serviceLayers: ServiceLayer[] = [
  {
    title: '品牌与菜单策略',
    description: '把目标客群、价格带、用餐节奏和体验语言统一到菜单结构与服务模型中。',
    icon: Sparkles
  },
  {
    title: '运营与质量体系',
    description: '把日常巡检、培训、班次、食安和服务标准变成真正可执行的现场机制。',
    icon: Workflow
  },
  {
    title: '供应链与生产系统',
    description: '通过集中采购、中央生产和履约协同降低波动，让供给更稳定。',
    icon: Boxes
  },
  {
    title: '数据与 AI 决策层',
    description: '不是只看报表，而是让 AI 识别风险、排序问题并推动组织行动。',
    icon: LineChart
  }
]

export const aiLoopSteps: AiLoopStep[] = [
  {
    step: '01',
    title: 'Sense 经营感知',
    description: '汇总营收、成本、客流、供给、食安和执行状态，建立总部与现场共用的经营上下文。'
  },
  {
    step: '02',
    title: 'Decide 管理判断',
    description: '基于经营目标与阈值，对波动、异常和机会做优先级排序，而不是把问题平铺给团队。'
  },
  {
    step: '03',
    title: 'Execute 动作闭环',
    description: '把建议推进成任务、复盘和跨部门协同，让运营系统每天都在变得更聪明。'
  }
]

export const commitmentCards: CommitmentCard[] = [
  {
    title: '食安与质量先行',
    description: '把供应、生产、现场和巡检串成统一的质量链条，而不是靠事后补救。',
    icon: ShieldCheck
  },
  {
    title: '更可持续的供餐逻辑',
    description: '围绕损耗、补货、能耗与包装改进，让增长与责任感并行。',
    icon: Leaf
  },
  {
    title: '把人放在系统中心',
    description: '培训、岗位、班次与组织协同决定服务水平，AI 只是帮助团队做得更好。',
    icon: Users2
  }
]

export const operatingPrinciples: OperatingPrinciple[] = [
  {
    title: '以服务体验为起点',
    description: '我们关心的不只是供餐是否完成，而是品牌体验、顾客感受与现场秩序是否真正成立。',
    icon: ChefHat
  },
  {
    title: '以系统方法承接复杂度',
    description: '菜单、采购、生产、履约、巡检和经营判断必须共用一套方法，而不是被拆成独立部门各自运行。',
    icon: Workflow
  },
  {
    title: '以 AI 放大优秀组织能力',
    description: 'AI 不是装饰性的概念层，而是帮助总部、区域和现场更快看清问题、形成动作、完成复盘的管理层。',
    icon: Bot
  }
]

export const industryPlaybooks: IndustryPlaybook[] = [
  {
    title: '企业园区与总部空间',
    description: '典型诉求是稳定供餐、日常效率与品牌氛围并重，往往还伴随咖啡、轻餐和全天时服务需求。',
    icon: Building2,
    priorities: ['高峰平峰切换', '品牌化空间体验', '总部级经营透明度'],
    response: '通过菜单分层、时段运营和总部经营视图，把员工满意度与人效一起优化。'
  },
  {
    title: '教育与校园餐饮',
    description: '核心在于大客流、营养结构、供餐纪律与食安追溯，多峰值运营对系统要求很高。',
    icon: Users2,
    priorities: ['高峰供餐效率', '营养标准', '安全留痕'],
    response: '通过标准化生产、排队动线和履约节奏设计，降低拥堵与出品波动。'
  },
  {
    title: '医疗与康养空间',
    description: '强调卫生纪律、个性化餐食与更高可靠性，餐饮体验也是整体服务体验的一部分。',
    icon: ShieldCheck,
    priorities: ['高卫生标准', '特殊餐支持', '服务连续性'],
    response: '通过前置化质量控制和角色责任链，提升高要求场景下的稳定供给。'
  },
  {
    title: '酒店与目的地餐饮',
    description: '更关注品牌一致性、宴会与全日餐协同，以及宾客接触点的整体感受。',
    icon: Globe,
    priorities: ['多业态协同', '品牌表达', '客诉预警'],
    response: '通过体验模型与经营数据联动，让前台接待、后厨生产和管理层目标一致。'
  },
  {
    title: '工业园区与生产基地',
    description: '难点在倒班供餐、准点率、规模效率和成本控制，现场节奏通常更强、更刚性。',
    icon: Factory,
    priorities: ['班次供餐连续性', '成本纪律', '规模化执行'],
    response: '通过供给预测、班次模型和中央厨房配套能力，稳住复杂班表下的出品与人效。'
  }
]

export const contactChannels: ContactChannel[] = [
  {
    title: '集团餐饮服务合作',
    description: '适合企业园区、教育、医疗、酒店与工业服务网络的餐饮服务合作沟通。',
    icon: Building2,
    href: `mailto:${corporateContactEmail}?subject=Star%20Kitchen%20Service%20Inquiry`,
    cta: '发起服务合作沟通'
  },
  {
    title: '中央厨房与供应协同咨询',
    description: '适合围绕生产组织、采购协同、履约稳定性和成本控制的专项咨询。',
    icon: Boxes,
    href: `mailto:${corporateContactEmail}?subject=Star%20Kitchen%20Supply%20Inquiry`,
    cta: '咨询供应与履约方案'
  },
  {
    title: 'AI 经营系统与平台演示',
    description: '适合希望了解管理驾驶舱、任务闭环、Agent 与多系统整合方向的团队。',
    icon: Bot,
    href: `mailto:${corporateContactEmail}?subject=Star%20Kitchen%20AI%20Inquiry`,
    cta: '预约 AI 方案沟通'
  },
  {
    title: '通用联系与品牌沟通',
    description: '面向合作伙伴、媒体和潜在客户的通用联系入口，先建立连接，再转到对应团队。',
    icon: Mail,
    href: `mailto:${corporateContactEmail}?subject=Star%20Kitchen%20General%20Inquiry`,
    cta: '发送通用咨询邮件'
  }
]

export const engagementSteps: EngagementStep[] = [
  {
    step: '01',
    title: '了解服务场景',
    description: '先梳理你的业务类型、就餐网络、运营难点和品牌目标，明确真正的服务边界。'
  },
  {
    step: '02',
    title: '共建运营假设',
    description: '把菜单、产能、履约、食安、组织和数字化能力放到同一张工作地图里。'
  },
  {
    step: '03',
    title: '定义合作方式',
    description: '根据场景选择集团服务合作、专项咨询、平台演示或分阶段推进路径。'
  },
  {
    step: '04',
    title: '形成长期节奏',
    description: '让标准、复盘、经营视图和组织学习沉淀下来，形成可以复制的长期能力。'
  }
]
