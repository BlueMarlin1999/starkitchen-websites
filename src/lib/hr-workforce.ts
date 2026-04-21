import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'

export type GaiaEmploymentType = '全职' | '兼职' | '外包'
export type GaiaEmployeeStatus = '在岗' | '休假' | '离岗'
export type HrRankingDimension = 'realtimeCost' | 'overtimeHours' | 'abnormalScore' | 'hourlyCost'

export interface GaiaEmployeeRecord {
  employeeId: string
  name: string
  roleTitle: string
  city: string
  projectSlug: string
  projectName: string
  scopePath: string[]
  hourlyCost: number
  overtimeMultiplier: number
  employmentType: GaiaEmploymentType
  status: GaiaEmployeeStatus
  gaiaOrgUnit: string
  hiredAt: string
  tags: string[]
}

export interface HrShiftTemplate {
  key: string
  label: string
  startAt: string
  endAt: string
}

export interface HrShiftSnapshot {
  employeeId: string
  projectSlug: string
  shiftLabel: string
  startAt: string
  endAt: string
  plannedHours: number
  overtimeHours: number
  abnormalTags: string[]
  abnormalScore: number
}

export interface HrProjectStaffingRow {
  employee: GaiaEmployeeRecord
  shift: HrShiftSnapshot
  realtimeHours: number
  scheduledHours: number
  realtimeLaborCost: number
  fullShiftLaborCost: number
  overtimeCost: number
}

export interface GaiaCsvParseResult {
  items: GaiaEmployeeRecord[]
  errors: string[]
}

interface GaiaRoleSeed {
  title: string
  baseHourlyCost: number
  tags: string[]
}

const surnameSeeds = [
  '张',
  '王',
  '李',
  '赵',
  '刘',
  '陈',
  '杨',
  '黄',
  '周',
  '吴',
  '徐',
  '孙',
  '马',
  '朱',
  '胡',
  '郭',
  '何',
  '高',
  '林',
  '罗',
  '郑',
  '梁',
]

const givenSeeds = [
  '晨',
  '雨',
  '嘉',
  '子',
  '亦',
  '思',
  '佳',
  '浩',
  '文',
  '清',
  '泽',
  '昊',
  '梓',
  '宸',
  '诗',
  '安',
  '可',
  '一',
  '若',
  '宁',
  '雅',
  '明',
  '远',
  '睿',
]

const roleSeeds: GaiaRoleSeed[] = [
  { title: '厨师长', baseHourlyCost: 66, tags: ['后厨', '班组管理'] },
  { title: '档口负责人', baseHourlyCost: 58, tags: ['前厅', '出餐节奏'] },
  { title: '热厨', baseHourlyCost: 49, tags: ['热菜', '锅气'] },
  { title: '冷厨', baseHourlyCost: 44, tags: ['冷菜', '摆盘'] },
  { title: '切配', baseHourlyCost: 38, tags: ['预处理', '刀工'] },
  { title: '收银', baseHourlyCost: 36, tags: ['收银', '会员核销'] },
  { title: '督导', baseHourlyCost: 72, tags: ['巡店', 'SOP'] },
  { title: '采购专员', baseHourlyCost: 63, tags: ['供应链', '询价'] },
  { title: '运营专员', baseHourlyCost: 56, tags: ['经营复盘', '人效'] },
]

const defaultHourlyCostByRole = roleSeeds.reduce<Record<string, number>>((acc, item) => {
  acc[item.title] = item.baseHourlyCost
  return acc
}, {})

const shiftTemplates: HrShiftTemplate[] = [
  { key: 'prep-morning', label: '晨间备餐', startAt: '06:30', endAt: '10:30' },
  { key: 'lunch-peak', label: '午高峰', startAt: '10:30', endAt: '14:30' },
  { key: 'full-day', label: '全日班', startAt: '09:00', endAt: '18:00' },
  { key: 'swing', label: '机动班', startAt: '11:00', endAt: '20:00' },
  { key: 'dinner-peak', label: '晚高峰', startAt: '16:30', endAt: '21:00' },
  { key: 'night-restock', label: '夜间备货', startAt: '19:00', endAt: '23:00' },
]

export const HR_RANKING_DIMENSION_LABEL: Record<HrRankingDimension, string> = {
  realtimeCost: '实时人力成本',
  overtimeHours: '加班工时',
  abnormalScore: '异常严重度',
  hourlyCost: '小时成本',
}

const cloneScopePath = (scopePath: string[]) => [...scopePath]

const cloneTags = (tags: string[]) => [...tags]

const normalizeNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const round2 = (value: number) => Number(value.toFixed(2))

const parseClockMinutes = (value: string) => {
  const [hourPart, minutePart] = value.split(':')
  const hour = Number.parseInt(hourPart || '0', 10)
  const minute = Number.parseInt(minutePart || '0', 10)
  return hour * 60 + minute
}

const normalizeHeaderToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_\-（）()]/g, '')

const stableHash = (seed: string) => {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

const composeName = (index: number) => {
  const surname = surnameSeeds[index % surnameSeeds.length]
  const given1 = givenSeeds[(index * 3) % givenSeeds.length]
  const given2 = givenSeeds[(index * 7 + 5) % givenSeeds.length]
  return `${surname}${given1}${index % 2 === 0 ? given2 : ''}`
}

const resolveEmploymentType = (index: number): GaiaEmploymentType => {
  if (index % 17 === 0) return '外包'
  if (index % 9 === 0) return '兼职'
  return '全职'
}

const resolveEmployeeStatus = (index: number): GaiaEmployeeStatus => {
  if (index % 53 === 0) return '离岗'
  if (index % 29 === 0) return '休假'
  return '在岗'
}

const resolveOvertimeMultiplier = (employmentType: GaiaEmploymentType) => {
  if (employmentType === '兼职') return 1.3
  if (employmentType === '外包') return 1.2
  return 1.5
}

const resolveRoleSeed = (index: number, projectSlug: string) => {
  const hash = stableHash(`${projectSlug}-${index}`)
  return roleSeeds[hash % roleSeeds.length]
}

const projectBySlugMap = new Map(
  REAL_CATERING_PROJECTS.map((project) => [project.siteSlug.toLowerCase(), project])
)

const projectByNameMap = new Map(
  REAL_CATERING_PROJECTS.map((project) => [project.name.toLowerCase(), project])
)

const normalizeStatus = (value: string): GaiaEmployeeStatus => {
  const normalized = value.trim()
  if (normalized === '休假') return '休假'
  if (normalized === '离岗') return '离岗'
  return '在岗'
}

const normalizeEmploymentType = (value: string): GaiaEmploymentType => {
  const normalized = value.trim()
  if (normalized === '兼职') return '兼职'
  if (normalized === '外包') return '外包'
  return '全职'
}

const createEmployeeRecord = (input: {
  employeeId: string
  name: string
  roleTitle: string
  projectSlug: string
  hourlyCost: number
  employmentType: GaiaEmploymentType
  status: GaiaEmployeeStatus
  hiredAt: string
  tags: string[]
}) => {
  const project = projectBySlugMap.get(input.projectSlug.toLowerCase())
  if (!project) return null

  return {
    employeeId: input.employeeId,
    name: input.name,
    roleTitle: input.roleTitle,
    city: project.city,
    projectSlug: project.siteSlug,
    projectName: project.name,
    scopePath: cloneScopePath(project.scopePath),
    hourlyCost: round2(input.hourlyCost),
    overtimeMultiplier: resolveOvertimeMultiplier(input.employmentType),
    employmentType: input.employmentType,
    status: input.status,
    gaiaOrgUnit: `${project.city}运营单元`,
    hiredAt: input.hiredAt,
    tags: cloneTags(input.tags),
  } satisfies GaiaEmployeeRecord
}

export const cloneGaiaEmployeeRecord = (item: GaiaEmployeeRecord): GaiaEmployeeRecord => ({
  ...item,
  scopePath: cloneScopePath(item.scopePath),
  tags: cloneTags(item.tags),
})

export const buildGaiaSeedRoster = (total = 288): GaiaEmployeeRecord[] =>
  Array.from({ length: total }).map((_, index) => {
    const project = REAL_CATERING_PROJECTS[index % REAL_CATERING_PROJECTS.length]
    const roleSeed = resolveRoleSeed(index, project.siteSlug)
    const employmentType = resolveEmploymentType(index)
    const status = resolveEmployeeStatus(index)
    const hourlyDelta = ((index * 7) % 9) - 4
    const hourlyCost = normalizeNumber(roleSeed.baseHourlyCost + hourlyDelta * 0.8, 28, 96)
    const hiredAt = new Date(2018 + (index % 8), index % 12, 1 + (index % 26))
      .toISOString()
      .slice(0, 10)

    return {
      employeeId: `GY${(100000 + index).toString()}`,
      name: composeName(index),
      roleTitle: roleSeed.title,
      city: project.city,
      projectSlug: project.siteSlug,
      projectName: project.name,
      scopePath: cloneScopePath(project.scopePath),
      hourlyCost: round2(hourlyCost),
      overtimeMultiplier: resolveOvertimeMultiplier(employmentType),
      employmentType,
      status,
      gaiaOrgUnit: `${project.city}运营单元`,
      hiredAt,
      tags: [...roleSeed.tags, project.strategicLevel],
    } satisfies GaiaEmployeeRecord
  })

export const GAIA_SEED_ROSTER: GaiaEmployeeRecord[] = buildGaiaSeedRoster()

const getTemplateHours = (template: HrShiftTemplate) => {
  const startMinutes = parseClockMinutes(template.startAt)
  const endMinutes = parseClockMinutes(template.endAt)
  return (endMinutes - startMinutes) / 60
}

const getShiftTemplateByEmployee = (employee: GaiaEmployeeRecord) => {
  const hash = stableHash(`${employee.employeeId}|${employee.projectSlug}`)
  return shiftTemplates[hash % shiftTemplates.length]
}

const buildShiftSnapshot = (employee: GaiaEmployeeRecord): HrShiftSnapshot => {
  const hash = stableHash(`${employee.employeeId}|${employee.projectSlug}|${employee.status}`)
  const template = getShiftTemplateByEmployee(employee)
  const plannedHours = getTemplateHours(template)
  const overtimeHours = employee.status === '在岗' ? [0, 0, 0.5, 1, 1.5][hash % 5] : 0

  const abnormalTags: string[] = []
  if (employee.status !== '在岗') {
    abnormalTags.push(employee.status === '休假' ? '休假替班' : '离岗未排班')
  } else {
    if (hash % 9 === 0) abnormalTags.push('打卡迟到')
    if (hash % 11 === 0) abnormalTags.push('跨项目支援')
    if (hash % 13 === 0) abnormalTags.push('岗前培训占用工时')
    if (overtimeHours >= 1.5) abnormalTags.push('加班超阈')
  }

  const abnormalScore = abnormalTags.reduce((score, tag) => {
    if (tag === '加班超阈' || tag === '离岗未排班') return score + 2
    return score + 1
  }, 0)

  return {
    employeeId: employee.employeeId,
    projectSlug: employee.projectSlug,
    shiftLabel: template.label,
    startAt: template.startAt,
    endAt: template.endAt,
    plannedHours,
    overtimeHours,
    abnormalTags,
    abnormalScore,
  }
}

const getCurrentMinutes = (now: Date) =>
  now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

const getRealtimeHours = (shift: HrShiftSnapshot, now: Date, status: GaiaEmployeeStatus) => {
  if (status !== '在岗') return 0
  const startMinutes = parseClockMinutes(shift.startAt)
  const fullMinutes = (shift.plannedHours + shift.overtimeHours) * 60
  const elapsedMinutes = normalizeNumber(getCurrentMinutes(now) - startMinutes, 0, fullMinutes)
  return round2(elapsedMinutes / 60)
}

const calculateLaborCost = (
  employee: GaiaEmployeeRecord,
  shift: HrShiftSnapshot,
  workedHours: number
) => {
  const baseHours = Math.min(workedHours, shift.plannedHours)
  const overtimeHoursWorked = Math.max(0, workedHours - shift.plannedHours)
  const baseCost = baseHours * employee.hourlyCost
  const overtimeCost = overtimeHoursWorked * employee.hourlyCost * employee.overtimeMultiplier
  return round2(baseCost + overtimeCost)
}

export const buildEmployeeRealtimeSnapshot = (
  employee: GaiaEmployeeRecord,
  now = new Date()
): HrProjectStaffingRow => {
  const shift = buildShiftSnapshot(employee)
  const realtimeHours = getRealtimeHours(shift, now, employee.status)
  const scheduledHours = round2(shift.plannedHours + shift.overtimeHours)
  const realtimeLaborCost = calculateLaborCost(employee, shift, realtimeHours)
  const fullShiftLaborCost = calculateLaborCost(employee, shift, scheduledHours)
  const overtimeCost = round2(shift.overtimeHours * employee.hourlyCost * employee.overtimeMultiplier)

  return {
    employee,
    shift,
    realtimeHours,
    scheduledHours,
    realtimeLaborCost,
    fullShiftLaborCost,
    overtimeCost,
  }
}

export const buildProjectStaffingRows = (
  projectSlug: string,
  employees: GaiaEmployeeRecord[],
  now = new Date()
): HrProjectStaffingRow[] =>
  employees
    .filter(
      (employee) =>
        employee.projectSlug === projectSlug &&
        (employee.status === '在岗' || employee.status === '休假')
    )
    .map((employee) => buildEmployeeRealtimeSnapshot(employee, now))
    .sort((left, right) => right.realtimeLaborCost - left.realtimeLaborCost)

export const formatLaborCostValue = (value: number) =>
  `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const csvHeaderAliasMap: Record<string, keyof GaiaEmployeeRecord | 'projectName'> = {
  employeeid: 'employeeId',
  工号: 'employeeId',
  姓名: 'name',
  name: 'name',
  岗位: 'roleTitle',
  roletitle: 'roleTitle',
  city: 'city',
  城市: 'city',
  projectslug: 'projectSlug',
  项目编码: 'projectSlug',
  projectname: 'projectName',
  项目: 'projectName',
  hourlycost: 'hourlyCost',
  小时成本: 'hourlyCost',
  employmenttype: 'employmentType',
  用工类型: 'employmentType',
  status: 'status',
  在岗状态: 'status',
  hiredat: 'hiredAt',
  入职日期: 'hiredAt',
}

const parseCsvLine = (line: string, delimiter: string) =>
  line
    .split(delimiter)
    .map((item) => item.trim().replace(/^"|"$/g, ''))

const resolveProjectByInput = (projectSlugInput: string, projectNameInput: string, cityInput: string) => {
  const bySlug = projectBySlugMap.get(projectSlugInput.trim().toLowerCase())
  if (bySlug) return bySlug

  const byName = projectByNameMap.get(projectNameInput.trim().toLowerCase())
  if (byName) return byName

  return REAL_CATERING_PROJECTS.find((project) => project.city === cityInput.trim()) || null
}

export interface GaiaFlexibleInputRecord {
  employeeId: string
  name: string
  roleTitle?: string
  projectSlug?: string
  projectName?: string
  city?: string
  hourlyCost?: number
  employmentType?: string
  status?: string
  hiredAt?: string
  tags?: string[]
}

export const buildGaiaEmployeeRecord = (input: GaiaFlexibleInputRecord) => {
  const project = resolveProjectByInput(input.projectSlug || '', input.projectName || '', input.city || '')
  if (!project) return null
  const roleTitle = input.roleTitle?.trim() || '运营专员'
  const hourlyCostSeed = Number.isFinite(input.hourlyCost) ? Number(input.hourlyCost) : Number.NaN
  const hourlyCost =
    Number.isFinite(hourlyCostSeed) && hourlyCostSeed > 0
      ? hourlyCostSeed
      : defaultHourlyCostByRole[roleTitle] || defaultHourlyCostByRole['运营专员']
  const employmentType = normalizeEmploymentType(input.employmentType || '')
  const status = normalizeStatus(input.status || '')
  const hiredAt = (input.hiredAt || '').trim() || new Date().toISOString().slice(0, 10)
  const tags = input.tags && input.tags.length
    ? Array.from(new Set([roleTitle, project.strategicLevel, ...input.tags.filter(Boolean)]))
    : [roleTitle, project.strategicLevel, 'GaiaRemote']

  return createEmployeeRecord({
    employeeId: (input.employeeId || '').trim(),
    name: (input.name || '').trim(),
    roleTitle,
    projectSlug: project.siteSlug,
    hourlyCost,
    employmentType,
    status,
    hiredAt,
    tags,
  })
}

export const parseGaiaRosterCsv = (csvText: string): GaiaCsvParseResult => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length <= 1) {
    return { items: [], errors: ['CSV 内容为空或仅包含表头。'] }
  }

  const delimiter = (lines[0].match(/\t/g) || []).length > (lines[0].match(/,/g) || []).length ? '\t' : ','
  const rawHeaders = parseCsvLine(lines[0], delimiter)
  const normalizedHeaders = rawHeaders.map((header) => normalizeHeaderToken(header))
  const fieldMap = normalizedHeaders.map((token) => csvHeaderAliasMap[token])

  const requiredFields: Array<keyof GaiaEmployeeRecord | 'projectName'> = [
    'employeeId',
    'name',
    'roleTitle',
    'hourlyCost',
    'employmentType',
    'status',
  ]
  const missingRequired = requiredFields.filter((field) => !fieldMap.includes(field))
  if (missingRequired.length > 0) {
    return {
      items: [],
      errors: [`CSV 缺少必要字段: ${missingRequired.join(' / ')}`],
    }
  }

  const errors: string[] = []
  const items: GaiaEmployeeRecord[] = []

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = parseCsvLine(lines[lineIndex], delimiter)
    const rowRecord: Record<string, string> = {}
    fieldMap.forEach((field, index) => {
      if (!field) return
      rowRecord[field] = row[index] || ''
    })

    const project = resolveProjectByInput(
      rowRecord.projectSlug || '',
      rowRecord.projectName || '',
      rowRecord.city || ''
    )
    if (!project) {
      errors.push(`第 ${lineIndex + 1} 行项目无法匹配: ${rowRecord.projectSlug || rowRecord.projectName || '空'}`)
      continue
    }

    const roleTitle = rowRecord.roleTitle?.trim() || '运营专员'
    const hourlySeed = Number.parseFloat(rowRecord.hourlyCost || '')
    const hourlyCost =
      Number.isFinite(hourlySeed) && hourlySeed > 0
        ? hourlySeed
        : defaultHourlyCostByRole[roleTitle] || defaultHourlyCostByRole['运营专员']
    const employmentType = normalizeEmploymentType(rowRecord.employmentType || '')
    const status = normalizeStatus(rowRecord.status || '')
    const hiredAt = (rowRecord.hiredAt || '').trim() || new Date().toISOString().slice(0, 10)

    const item = createEmployeeRecord({
      employeeId: (rowRecord.employeeId || '').trim(),
      name: (rowRecord.name || '').trim(),
      roleTitle,
      projectSlug: project.siteSlug,
      hourlyCost,
      employmentType,
      status,
      hiredAt,
      tags: [roleTitle, project.strategicLevel, 'GaiaCSV'],
    })

    if (!item) {
      errors.push(`第 ${lineIndex + 1} 行创建员工记录失败。`)
      continue
    }
    if (!item.employeeId || !item.name) {
      errors.push(`第 ${lineIndex + 1} 行缺少工号或姓名。`)
      continue
    }

    items.push(item)
  }

  return { items, errors }
}
