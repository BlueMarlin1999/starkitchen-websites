import { ROLE_HIERARCHY, normalizeRole, type UserRole } from '@/lib/access'

const roleRank = (role: string | undefined) => {
  const normalized = normalizeRole(role)
  const index = ROLE_HIERARCHY.indexOf(normalized)
  return index >= 0 ? index : ROLE_HIERARCHY.length - 1
}

export const canRoleAccessMinRole = (viewerRole: string | undefined, minRole: UserRole) =>
  roleRank(viewerRole) <= roleRank(minRole)

export const getRoleLabelZh = (role: string | undefined) => {
  const normalized = normalizeRole(role)
  if (normalized === 'ceo') return 'CEO'
  if (normalized === 'coo') return 'COO'
  if (normalized === 'vp') return 'VP'
  if (normalized === 'director') return '总监'
  if (normalized === 'manager') return '经理'
  return '主管'
}

