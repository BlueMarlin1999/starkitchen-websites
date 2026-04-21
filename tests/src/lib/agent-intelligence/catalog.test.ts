import { describe, expect, it } from 'vitest'
import {
  buildAgentExecutionContext,
  buildAgentPromptKnowledgeSection,
  listKnowledgeIndex,
  resolveKnowledgeForMessage,
  resolveSkillsForMessage,
  validateAgentKnowledgeCoverage,
  validateAgentSkillCoverage,
} from '@/lib/agent-intelligence/catalog'

describe('src/lib/agent-intelligence/catalog.ts', () => {
  it('ensures all agents have at least 5 skills', () => {
    const issues = validateAgentSkillCoverage(5)
    expect(issues).toEqual([])
  })

  it('matches workforce skill for CHRO requests', () => {
    const skills = resolveSkillsForMessage(
      'chro_peter_drucker',
      '请按北京项目本周排班和人力成本给出缺编预警'
    )
    expect(skills.some((skill) => skill.id === 'workforce-roster')).toBe(true)
  })

  it('routes generic explanation question to knowledge briefing skill', () => {
    const skills = resolveSkillsForMessage(
      'cos_zhuge_liang',
      '你是谁？什么大模型？有什么技能？讲讲HACCP核心要点'
    )
    expect(skills[0]?.id).toBe('knowledge-briefing')
  })

  it('returns layered knowledge docs for finance context', () => {
    const docs = resolveKnowledgeForMessage('cfo_buffett', '分析本月北京项目收入构成和食材成本占比')
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0]?.layer).toMatch(/L0|L1|L2/)
    expect(docs.some((doc) => doc.domain.length > 0)).toBe(true)
    expect(docs.some((doc) => doc.fileName.length > 0)).toBe(true)
  })

  it('can retrieve HACCP evidence for COS explanation request', () => {
    const docs = resolveKnowledgeForMessage('cos_zhuge_liang', '讲讲 HACCP 核心要点', 6)
    expect(docs.some((doc) => doc.tags.some((tag) => tag.toLowerCase() === 'haccp'))).toBe(true)
  })

  it('matches food safety traceability skill for CSCO requests', () => {
    const skills = resolveSkillsForMessage(
      'csco_ray_kroc',
      '请对本周高风险批次做食安追溯和召回闭环'
    )
    expect(skills.some((skill) => skill.id === 'food-safety-traceability-loop')).toBe(true)
  })

  it('matches SOP execution audit skill for COO requests', () => {
    const skills = resolveSkillsForMessage(
      'coo_howard_schultz',
      '请对上海项目本周SOP执行审计并输出偏差整改计划'
    )
    expect(skills.some((skill) => skill.id === 'sop-execution-audit')).toBe(true)
  })

  it('matches RevPASH profit engine skill for CFO requests', () => {
    const skills = resolveSkillsForMessage(
      'cfo_buffett',
      '请给出北京门店本月 RevPASH 利润优化策略'
    )
    expect(skills.some((skill) => skill.id === 'revpash-profit-engine')).toBe(true)
  })

  it('ensures every agent has knowledge docs across layers', () => {
    const issues = validateAgentKnowledgeCoverage(3, 2)
    expect(issues).toEqual([])
  })

  it('builds layered knowledge index with L0/L1/L2 entries', () => {
    const nodes = listKnowledgeIndex()
    expect(nodes.length).toBeGreaterThan(0)
    expect(nodes.some((node) => node.layer === 'L0')).toBe(true)
    expect(nodes.some((node) => node.layer === 'L1')).toBe(true)
    expect(nodes.some((node) => node.layer === 'L2')).toBe(true)
  })

  it('builds prompt section with protocol and citation instructions', () => {
    const context = buildAgentExecutionContext({
      agentId: 'cos_zhuge_liang',
      message: '请协调财务和人力给出本周成本下降方案',
    })
    const section = buildAgentPromptKnowledgeSection(context)
    expect(section).toContain('【技能协议】')
    expect(section).toContain('【知识库证据（L0 > L1 > L2）】')
    expect(section).toContain('回答必须包含：结论、依据、风险、行动项、负责人、截止时间。')
  })
})
