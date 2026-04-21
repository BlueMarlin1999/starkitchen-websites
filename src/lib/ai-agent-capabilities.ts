import { LlmProviderId, LlmRouteProfileId } from '@/lib/llm-catalog'

export type AiAgentCapabilityId =
  | 'contract_review'
  | 'policy_generation'
  | 'tender_generation'
  | 'report_summary'
  | 'copywriting'
  | 'product_generation'
  | 'menu_generation'
  | 'audio_generation'
  | 'image_generation'
  | 'video_generation'
  | 'social_content'
  | 'other'

export interface AiAgentCapabilityTemplate {
  id: AiAgentCapabilityId
  title: string
  shortTitle: string
  description: string
  starterPrompt: string
  recommendedRoute: LlmRouteProfileId
  recommendedProvider: LlmProviderId
  recommendedModel: string
}

export const AI_AGENT_CAPABILITY_LIBRARY: AiAgentCapabilityTemplate[] = [
  {
    id: 'contract_review',
    title: '合同审阅',
    shortTitle: '合同审阅',
    description: '识别风险条款、履约节点、付款条件与法务改写建议。',
    starterPrompt:
      '请扮演法务与采购联合审阅官，审阅以下合同文本并输出：1) 高/中/低风险条款清单 2) 风险原因与业务影响 3) 建议改写条款 4) 审批建议。合同内容：',
    recommendedRoute: 'long_context',
    recommendedProvider: 'moonshot',
    recommendedModel: 'moonshot-v1-128k',
  },
  {
    id: 'policy_generation',
    title: '制度生成及更新',
    shortTitle: '制度生成',
    description: '根据目标场景生成制度初稿，并与旧版差异化更新。',
    starterPrompt:
      '请基于以下业务场景生成可落地的制度文件，输出格式为：制度目的、适用范围、角色职责、流程步骤、考核指标、异常处理、版本号与生效日期。如有旧版内容请给出差异更新表。输入信息：',
    recommendedRoute: 'reasoning',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-reasoner',
  },
  {
    id: 'tender_generation',
    title: '标书生成',
    shortTitle: '标书生成',
    description: '按招标需求自动生成投标方案、商务响应和实施计划。',
    starterPrompt:
      '请根据以下招标需求，生成可直接用于投标的文档大纲与正文草稿，必须包含：项目理解、技术方案、实施计划、组织配置、风险控制、报价说明、服务承诺、附录清单。招标需求如下：',
    recommendedRoute: 'long_context',
    recommendedProvider: 'moonshot',
    recommendedModel: 'moonshot-v1-128k',
  },
  {
    id: 'report_summary',
    title: '报告总结',
    shortTitle: '报告总结',
    description: '对周报/月报/复盘报告做结构化总结与行动建议提炼。',
    starterPrompt:
      '请对以下报告内容进行管理层摘要，输出：1) 关键结论 2) 风险与机会 3) 需决策事项 4) 下周行动清单（含负责人和截止时间）5) 一句话给 CEO 的建议。报告内容：',
    recommendedRoute: 'long_context',
    recommendedProvider: 'moonshot',
    recommendedModel: 'moonshot-v1-128k',
  },
  {
    id: 'copywriting',
    title: '文案生成',
    shortTitle: '文案生成',
    description: '按品牌语气生成海报文案、活动文案、私域触达文案。',
    starterPrompt:
      '请根据以下产品与活动信息，生成多版本文案：短标题、长标题、正文、CTA。分别给出“稳健商务风”“年轻活力风”“高端品质风”三套版本。输入信息：',
    recommendedRoute: 'default',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-chat',
  },
  {
    id: 'product_generation',
    title: '产品生成',
    shortTitle: '产品生成',
    description: '围绕目标客群生成新品方案、成本结构与定价建议。',
    starterPrompt:
      '请基于以下业务目标生成新品方案，输出：1) 产品定位 2) 核心卖点 3) 配方与成本结构（食材/包装/人工）4) 建议售价与毛利率区间 5) 上市节奏与营销建议。输入信息：',
    recommendedRoute: 'default',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-chat',
  },
  {
    id: 'menu_generation',
    title: '菜单生成',
    shortTitle: '菜单生成',
    description: '按场景输出菜单结构、菜品组合、成本与毛利策略。',
    starterPrompt:
      '请根据以下门店定位与客群需求生成菜单方案，输出：1) 菜单分层结构（引流款/利润款/形象款）2) 每道菜核心描述 3) 估算成本与建议售价 4) 毛利率与销量预期 5) 季节迭代建议。输入信息：',
    recommendedRoute: 'reasoning',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-reasoner',
  },
  {
    id: 'audio_generation',
    title: '音频生成',
    shortTitle: '音频生成',
    description: '生成播报脚本、配音分镜与 TTS 指令参数。',
    starterPrompt:
      '请基于以下主题生成可直接用于音频制作的内容包：1) 60 秒播报文案 2) 分段语气与停顿标记 3) 背景音乐建议 4) TTS 参数建议（语速、音高、情绪）5) 30 秒精简版。主题：',
    recommendedRoute: 'agent',
    recommendedProvider: 'openai',
    recommendedModel: 'gpt-4o-mini-tts',
  },
  {
    id: 'image_generation',
    title: '图片生成',
    shortTitle: '图片生成',
    description: '生成主视觉描述、构图规范与图像生成提示词。',
    starterPrompt:
      '请输出可直接用于图片生成模型的完整提示词包：正向提示词、负向提示词、构图说明、光线风格、色彩风格、品牌元素约束，并给出 3 套风格版本。设计需求：',
    recommendedRoute: 'agent',
    recommendedProvider: 'openai',
    recommendedModel: 'gpt-image-1',
  },
  {
    id: 'video_generation',
    title: '视频生成',
    shortTitle: '视频生成',
    description: '生成视频脚本、镜头清单、旁白与转场提示词。',
    starterPrompt:
      '请根据以下主题生成 30-60 秒短视频制作包：分镜脚本（镜头号/时长/画面/旁白/字幕）、配乐节奏建议、转场建议、封面标题与发布时间建议。主题与目标人群如下：',
    recommendedRoute: 'agent',
    recommendedProvider: 'openai',
    recommendedModel: 'sora-2',
  },
  {
    id: 'social_content',
    title: '社交媒体内容生成',
    shortTitle: '社媒生成',
    description: '按平台输出短视频标题、文案、标签与发布时间策略。',
    starterPrompt:
      '请围绕以下活动生成社交媒体内容包，分别输出抖音/小红书/视频号/公众号四个平台版本，包含：标题、正文、标签、封面文案、评论区引导语、发布时间建议。活动信息：',
    recommendedRoute: 'default',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-chat',
  },
  {
    id: 'other',
    title: '精算专家',
    shortTitle: '精算专家',
    description: '进行经营测算、敏感性分析与利润模型推演。',
    starterPrompt:
      '请作为餐饮经营精算专家，基于以下数据输出：1) 成本与利润测算表 2) 关键变量敏感性分析 3) 保本点与目标利润所需销量 4) 风险预警与调价建议 5) 可执行的经营动作清单。输入数据：',
    recommendedRoute: 'reasoning',
    recommendedProvider: 'deepseek',
    recommendedModel: 'deepseek-reasoner',
  },
]

export const getAiAgentCapabilityById = (id: string) =>
  AI_AGENT_CAPABILITY_LIBRARY.find((item) => item.id === id) || null

export const buildCapabilityChatHref = (capabilityId: AiAgentCapabilityId) => {
  const capability = getAiAgentCapabilityById(capabilityId)
  if (!capability) return '/dashboard/chat/'
  const params = new URLSearchParams({
    capability: capability.id,
    route: capability.recommendedRoute,
    provider: capability.recommendedProvider,
    model: capability.recommendedModel,
  })
  return `/dashboard/chat/?${params.toString()}`
}
