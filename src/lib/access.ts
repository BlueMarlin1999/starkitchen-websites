import { DEFAULT_SCOPE_PATH, getScopeHierarchyNodeByPath } from '@/lib/business-metrics'

export type UserRole = 'ceo' | 'coo' | 'vp' | 'director' | 'manager' | 'supervisor'

export type Permission =
  | 'view_dashboard'
  | 'use_ai_chat'
  | 'view_reports'
  | 'view_documents'
  | 'view_help'
  | 'manage_users'
  | 'manage_settings'
  | 'manage_access_control'
  | 'manage_tenants'
  | 'view_integrations'
  | 'manage_integrations'
  | 'import_documents'
  | 'import_multimodal_sources'
  | 'configure_ai_workflows'

export interface AppUser {
  id: string
  name: string
  nickname?: string
  employeeId: string
  avatar?: string
  role: UserRole
  scopePath?: string[]
}

export interface RoleConfig {
  role: UserRole
  label: string
  description: string
  loginHint: string
  dataGranularity: string
  permissions: Permission[]
}

export const ROLE_HIERARCHY: UserRole[] = ['ceo', 'coo', 'vp', 'director', 'manager', 'supervisor']

const ROLE_DEFAULT_SCOPE_PATHS: Record<UserRole, string[]> = {
  ceo: ['global'],
  coo: ['global', 'china'],
  vp: ['global', 'china', 'east-china'],
  director: ['global', 'china', 'east-china', 'jiangsu'],
  manager: ['global', 'china', 'east-china', 'jiangsu', 'suzhou'],
  supervisor: ['global', 'china', 'east-china', 'jiangsu', 'suzhou', 'a-sz011-bidi-2'],
}

const ROLE_MIN_SCOPE_DEPTH: Record<UserRole, number> = {
  ceo: 1,
  coo: 2,
  vp: 3,
  director: 4,
  manager: 5,
  supervisor: 6,
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ceo: {
    role: 'ceo',
    label: 'CEO',
    description: '集团最高经营权限，可跨全部组织查看并管理系统能力。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '全球 → 门店（全链路）',
    permissions: [
      'view_dashboard',
      'use_ai_chat',
      'view_reports',
      'view_documents',
      'view_help',
      'manage_users',
      'manage_settings',
      'manage_access_control',
      'manage_tenants',
      'view_integrations',
      'manage_integrations',
      'import_documents',
      'import_multimodal_sources',
      'configure_ai_workflows',
    ],
  },
  coo: {
    role: 'coo',
    label: 'COO',
    description: '集团运营负责人，聚焦中国口径经营分析与组织执行。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '中国 → 门店',
    permissions: [
      'view_dashboard',
      'use_ai_chat',
      'view_reports',
      'view_documents',
      'view_help',
      'view_integrations',
      'manage_integrations',
      'import_documents',
      'import_multimodal_sources',
      'configure_ai_workflows',
    ],
  },
  vp: {
    role: 'vp',
    label: 'VP',
    description: '区域 VP，负责区域经营表现、成本结构和增长质量。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '大区 → 门店',
    permissions: [
      'view_dashboard',
      'use_ai_chat',
      'view_reports',
      'view_documents',
      'view_help',
      'view_integrations',
      'import_documents',
    ],
  },
  director: {
    role: 'director',
    label: '总监',
    description: '省区总监，关注省内城市项目与跨门店执行。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '省级 → 门店',
    permissions: [
      'view_dashboard',
      'use_ai_chat',
      'view_reports',
      'view_documents',
      'view_help',
      'view_integrations',
    ],
  },
  manager: {
    role: 'manager',
    label: '经理',
    description: '城市/项目经理，以经营执行和异常闭环为主。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '城市 → 门店',
    permissions: [
      'view_dashboard',
      'use_ai_chat',
      'view_reports',
      'view_documents',
      'view_help',
    ],
  },
  supervisor: {
    role: 'supervisor',
    label: '主管',
    description: '门店/项目主管，仅查看本责任范围内数据，不开放高阶能力。',
    loginHint: '由管理员分配凭证',
    dataGranularity: '门店/项目级',
    permissions: ['view_dashboard', 'view_reports', 'view_help'],
  },
}

const roleAliases: Record<string, UserRole> = {
  ceo: 'ceo',
  coo: 'coo',
  vp: 'vp',
  director: 'director',
  manager: 'manager',
  supervisor: 'supervisor',
  总裁: 'ceo',
  首席执行官: 'ceo',
  首席运营官: 'coo',
  运营副总裁: 'vp',
  总监: 'director',
  经理: 'manager',
  主管: 'supervisor',
  // 兼容旧角色命名
  super_admin: 'ceo',
  admin: 'ceo',
  超级管理员: 'ceo',
  ops_director: 'coo',
  operations_director: 'coo',
  经营管理层: 'coo',
  运营总监: 'director',
  area_manager: 'vp',
  区域经理: 'vp',
  region_manager: 'vp',
  store_manager: 'manager',
  门店经理: 'manager',
  店长: 'manager',
  customer_demo: 'supervisor',
  demo: 'supervisor',
  客户演示: 'supervisor',
}

const isPathPrefix = (prefix: string[], target: string[]) =>
  prefix.length <= target.length && prefix.every((segment, index) => segment === target[index])

export const normalizeRole = (value?: string): UserRole => {
  if (!value) return 'supervisor'
  const trimmed = value.trim()
  if (!trimmed) return 'supervisor'
  return roleAliases[trimmed] || roleAliases[trimmed.toLowerCase()] || 'supervisor'
}

export const normalizeScopePath = (input?: string[] | string | null): string[] => {
  if (!input) return []
  const segments = Array.isArray(input) ? input : input.split('/')
  return segments.map((segment) => segment.trim().toLowerCase()).filter(Boolean)
}

export const getRoleConfig = (role?: string) => ROLE_CONFIGS[normalizeRole(role)]

export const getPermissionsForRole = (role?: string) => getRoleConfig(role).permissions

export const hasPermission = (role: string | undefined, permission: Permission) =>
  getPermissionsForRole(role).includes(permission)

export const getRoleDefaultScopePath = (role?: string) => {
  const normalizedRole = normalizeRole(role)
  return ROLE_DEFAULT_SCOPE_PATHS[normalizedRole]
}

export const getRoleBaseScopePath = (
  role?: string,
  assignedScopePath?: string[] | string | null
): string[] => {
  const normalizedRole = normalizeRole(role)
  const fallbackPath = getRoleDefaultScopePath(normalizedRole)
  const assignedPath = normalizeScopePath(assignedScopePath)

  if (!assignedPath.length) {
    return fallbackPath
  }

  const assignedNode = getScopeHierarchyNodeByPath(assignedPath)
  if (!assignedNode) {
    return fallbackPath
  }

  if (assignedNode.depth < ROLE_MIN_SCOPE_DEPTH[normalizedRole]) {
    return fallbackPath
  }

  return assignedNode.path
}

export const clampScopePathByRole = (
  role?: string,
  requestedPath?: string[] | string | null,
  assignedScopePath?: string[] | string | null
) => {
  const normalizedRole = normalizeRole(role)
  const basePath = getRoleBaseScopePath(normalizedRole, assignedScopePath)
  const normalizedRequestedPath = normalizeScopePath(requestedPath)

  if (!normalizedRequestedPath.length) {
    return basePath
  }

  const requestedNode = getScopeHierarchyNodeByPath(normalizedRequestedPath)
  if (!requestedNode) {
    return basePath
  }

  if (normalizedRole === 'ceo') {
    return requestedNode.path
  }

  return isPathPrefix(basePath, requestedNode.path) ? requestedNode.path : basePath
}

export const canAccessScopePath = (
  role?: string,
  targetPath?: string[] | string | null,
  assignedScopePath?: string[] | string | null
) => {
  const normalizedTargetPath = normalizeScopePath(targetPath)
  if (!normalizedTargetPath.length) return false
  const clampedPath = clampScopePathByRole(role, normalizedTargetPath, assignedScopePath)
  return clampedPath.join('/') === normalizedTargetPath.join('/')
}

export const isScopePathWithin = (scopeBasePath: string[], targetPath: string[]) =>
  isPathPrefix(scopeBasePath, targetPath)

export const getUserScopePath = (user?: Pick<AppUser, 'role' | 'scopePath'> | null) =>
  getRoleBaseScopePath(user?.role, user?.scopePath || DEFAULT_SCOPE_PATH)

export const getMockRoleByEmployeeId = (employeeId: string): UserRole => {
  const normalized = employeeId.trim().toLowerCase()

  if (normalized.startsWith('ceo') || normalized.startsWith('admin')) return 'ceo'
  if (normalized.startsWith('coo') || normalized.startsWith('ops')) return 'coo'
  if (normalized.startsWith('vp') || normalized.startsWith('area')) return 'vp'
  if (normalized.startsWith('dir') || normalized.startsWith('director')) return 'director'
  if (normalized.startsWith('mgr') || normalized.startsWith('manager') || normalized.startsWith('store')) return 'manager'
  if (normalized.startsWith('sup') || normalized.startsWith('supervisor') || normalized.startsWith('demo')) return 'supervisor'

  return 'manager'
}
