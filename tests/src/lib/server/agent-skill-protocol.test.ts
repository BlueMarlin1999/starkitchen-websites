import { describe, expect, it } from 'vitest'
import type { AgentKnowledgeCitation, AgentSkillSpec } from '@/lib/agent-intelligence/catalog'
import {
  enforceSkillResponseContract,
  evaluateSkillProtocol,
} from '@/lib/server/agent-skill-protocol'

const sampleSkill = (skill: Partial<AgentSkillSpec> = {}): AgentSkillSpec => ({
  id: skill.id || 'financial-simulation',
  name: skill.name || '经营精算模拟',
  objective: skill.objective || '测算利润和成本结构',
  outputContract: skill.outputContract || '结论/依据/风险/行动项/负责人/截止时间',
  triggers: skill.triggers || ['利润', '成本', '预算'],
  requiresReview: skill.requiresReview ?? true,
})

const sampleCitations: AgentKnowledgeCitation[] = [
  {
    title: '收入与成本构成口径',
    fileName: 'finance-revenue-breakdown.xlsx',
    version: 'v2026.04.2',
    updatedAt: '2026-04-09',
  },
]

describe('src/lib/server/agent-skill-protocol.ts', () => {
  it('flags missing required inputs for vague message', () => {
    const evaluation = evaluateSkillProtocol({
      selectedSkills: [sampleSkill()],
      message: '帮我做个财务建议',
      highStakes: false,
    })
    expect(evaluation.missingInputs.length).toBeGreaterThan(0)
    expect(evaluation.confidenceCap).toMatch(/medium|low/)
  })

  it('passes validation for scoped metric message', () => {
    const evaluation = evaluateSkillProtocol({
      selectedSkills: [sampleSkill()],
      message: '请分析北京汇川项目本月利润和食材成本，给出优化方案',
      highStakes: false,
    })
    expect(evaluation.missingInputs).toEqual([])
    expect(evaluation.protocolInstruction).toContain('【统一技能协议】')
  })

  it('enforces response contract when model output is unstructured', () => {
    const content = enforceSkillResponseContract({
      content: '建议先看本月食材成本异常门店，再调整采购策略。',
      missingInputs: ['financial-simulation: 缺少时间范围'],
      citations: sampleCitations,
    })
    expect(content).toContain('结论：')
    expect(content).toContain('行动项：')
    expect(content).toContain('来源引用：')
  })

  it('preserves structured content and appends citations', () => {
    const structured = [
      '结论：建议先优化高成本门店采购。',
      '依据：本月成本结构显示食材成本偏高。',
      '风险：若不监控到货率，缺货风险会上升。',
      '行动项：1) 调整采购策略；2) 每日复盘。',
      '负责人：CSCO与CFO联合负责。',
      '截止时间：T+3完成首轮复盘。',
    ].join('\n')
    const content = enforceSkillResponseContract({
      content: structured,
      missingInputs: [],
      citations: sampleCitations,
    })
    expect(content).toContain('结论：建议先优化高成本门店采购。')
    expect(content).toContain('来源引用：')
  })

  it('requires human review for super skills with legal/negotiation risk', () => {
    const evaluation = evaluateSkillProtocol({
      selectedSkills: [
        sampleSkill({
          id: 'supplier-negotiation-copilot',
          name: '供应商谈判副驾',
          requiresReview: true,
          triggers: ['供应商', '谈判', '议价'],
        }),
      ],
      message: '请给上海项目本月供应商谈判降本方案，目标成本下降3%',
      highStakes: false,
    })
    expect(evaluation.selectedProtocols[0]?.tools).toContain('supplier_scorecard')
    expect(evaluation.requiresHumanReview).toBe(true)
  })

  it('supports RevPASH profit engine protocol and enforces review', () => {
    const evaluation = evaluateSkillProtocol({
      selectedSkills: [
        sampleSkill({
          id: 'revpash-profit-engine',
          name: 'RevPASH利润引擎',
          requiresReview: true,
          triggers: ['revpash', '座位小时', '翻台'],
        }),
      ],
      message: '请分析北京项目本月RevPASH和翻台率，给出利润提升方案',
      highStakes: false,
    })
    expect(evaluation.selectedProtocols[0]?.tools).toContain('revpash_analyzer')
    expect(evaluation.requiresHumanReview).toBe(true)
  })

  it('does not require extra scoped fields for knowledge briefing intent', () => {
    const evaluation = evaluateSkillProtocol({
      selectedSkills: [
        sampleSkill({
          id: 'knowledge-briefing',
          name: '知识讲解与能力说明',
          requiresReview: false,
          triggers: ['介绍', '是什么', '核心要点'],
        }),
      ],
      message: '你是谁？讲讲HACCP核心要点',
      highStakes: false,
    })
    expect(evaluation.missingInputs).toEqual([])
    expect(evaluation.requiresHumanReview).toBe(false)
  })

  it('rebuilds placeholder reply into informative knowledge briefing', () => {
    const content = enforceSkillResponseContract({
      content: '结论：**结论**',
      missingInputs: [],
      citations: sampleCitations,
      context: {
        selectedSkillIds: ['knowledge-briefing'],
        selectedSkillNames: ['知识讲解与能力说明'],
        agentName: '诸葛亮',
        agentRole: 'COS',
        modelLabel: 'DeepSeek / deepseek-reasoner',
        question: '你是谁？什么大模型？有什么技能？讲讲HACCP核心要点！',
      },
    })
    expect(content).toContain('我是 COS（诸葛亮）')
    expect(content).toContain('DeepSeek / deepseek-reasoner')
    expect(content).toContain('HACCP 核心要点')
    expect(content).not.toContain('结论：**结论**')
  })
})
