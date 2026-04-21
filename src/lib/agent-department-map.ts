import { AGENT_PROFILES } from '@/components/AgentLegion/types'

export interface AgentDepartmentOwner {
  agentId: string
  role: string
  ownerEmployeeId: string
  ownerName: string
  ownerTitle: string
  departmentName: string
  orgUnitId: string
}

const OWNER_MAP: Record<string, Omit<AgentDepartmentOwner, 'agentId' | 'role'>> = {
  cos_zhuge_liang: {
    ownerEmployeeId: 'Marlins',
    ownerName: '林总',
    ownerTitle: 'CEO',
    departmentName: '总部战略办',
    orgUnitId: 'org-hq',
  },
  ceo_zhang_wuji: {
    ownerEmployeeId: 'Marlins',
    ownerName: '林总',
    ownerTitle: 'CEO',
    departmentName: '集团总部',
    orgUnitId: 'org-hq',
  },
  caio_alan_turing: {
    ownerEmployeeId: 'it001',
    ownerName: '技术负责人',
    ownerTitle: 'CAIO负责人',
    departmentName: '技术与AI中心',
    orgUnitId: 'org-tech',
  },
  csco_ray_kroc: {
    ownerEmployeeId: 'supply001',
    ownerName: '雷克洛克',
    ownerTitle: '供应链负责人',
    departmentName: '供应链中心',
    orgUnitId: 'org-supply',
  },
  cfo_buffett: {
    ownerEmployeeId: 'finance001',
    ownerName: '财务经理',
    ownerTitle: '财务负责人',
    departmentName: '财务中心',
    orgUnitId: 'org-finance',
  },
  coo_howard_schultz: {
    ownerEmployeeId: 'coo001',
    ownerName: '舒尔茨',
    ownerTitle: '运营负责人',
    departmentName: '运营中心',
    orgUnitId: 'org-ops',
  },
  cmo_philip_kotler: {
    ownerEmployeeId: 'marketing001',
    ownerName: '营销负责人',
    ownerTitle: 'CMO负责人',
    departmentName: '品牌营销中心',
    orgUnitId: 'org-marketing',
  },
  cco_escoffier: {
    ownerEmployeeId: 'culinary001',
    ownerName: '品控负责人',
    ownerTitle: 'CCO负责人',
    departmentName: '产品与品控中心',
    orgUnitId: 'org-culinary',
  },
  cpo_bei_yuming: {
    ownerEmployeeId: 'project001',
    ownerName: '项目负责人',
    ownerTitle: 'CPO负责人',
    departmentName: '项目交付中心',
    orgUnitId: 'org-project',
  },
  chro_peter_drucker: {
    ownerEmployeeId: 'hr001',
    ownerName: '人力经理',
    ownerTitle: '人力负责人',
    departmentName: '人力中心',
    orgUnitId: 'org-hr',
  },
  clo_napoleon: {
    ownerEmployeeId: 'legal001',
    ownerName: '法务负责人',
    ownerTitle: 'CLO负责人',
    departmentName: '法务合规中心',
    orgUnitId: 'org-legal',
  },
  cgo_elon_musk: {
    ownerEmployeeId: 'growth001',
    ownerName: '增长负责人',
    ownerTitle: 'CGO负责人',
    departmentName: '增长中心',
    orgUnitId: 'org-growth',
  },
}

export const listAgentDepartmentOwners = (): AgentDepartmentOwner[] =>
  AGENT_PROFILES.map((agent) => {
    const owner = OWNER_MAP[agent.id] || {
      ownerEmployeeId: 'Marlins',
      ownerName: '林总',
      ownerTitle: '负责人',
      departmentName: '集团总部',
      orgUnitId: 'org-hq',
    }
    return {
      agentId: agent.id,
      role: agent.role,
      ...owner,
    }
  })

export const getAgentDepartmentOwner = (agentId: string): AgentDepartmentOwner => {
  const found = listAgentDepartmentOwners().find((item) => item.agentId === agentId)
  if (found) return found
  return {
    agentId,
    role: 'COS',
    ownerEmployeeId: 'Marlins',
    ownerName: '林总',
    ownerTitle: '负责人',
    departmentName: '集团总部',
    orgUnitId: 'org-hq',
  }
}

