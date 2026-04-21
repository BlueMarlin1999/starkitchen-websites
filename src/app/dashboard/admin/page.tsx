'use client'

import Link from 'next/link'
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ROLE_CONFIGS, getRoleConfig } from '@/lib/access'
import { AI_AGENT_CAPABILITY_LIBRARY } from '@/lib/ai-agent-capabilities'
import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildApiUrl } from '@/lib/runtime-config'
import { useAuthStore } from '@/store/auth'
import {
  AlertTriangle,
  BadgeCheck,
  BrainCircuit,
  Building2,
  ChevronRight,
  Globe2,
  Network,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

type TenantStatus = 'active' | 'pilot' | 'pending'
type ProjectDirectoryItem = (typeof REAL_CATERING_PROJECTS)[number]

interface TenantCityProfile {
  name: string
  tier: string
  region: string
  aiScope: string
  status: TenantStatus
}

interface TenantDisplayItem {
  city: string
  name: string
  tier: string
  region: string
  projects: number
  aiScope: string
  status: TenantStatus
  projectMenus: Array<{ title: string; href: string }>
}

const TENANT_CITY_ORDER = ['上海', '苏州', '北京', '鄂尔多斯', '无锡', '太仓', '赤峰', '十堰', '大连']
const MAX_PROJECT_MENUS_PER_CITY = 6

const TENANT_CITY_PROFILES: Record<string, TenantCityProfile> = {
  上海: {
    name: '上海城市运营中心',
    tier: '城市运营',
    region: '中国·华东',
    aiScope: '城市经营 + 项目分析',
    status: 'active',
  },
  苏州: {
    name: '苏州城市运营中心',
    tier: '城市运营',
    region: '中国·华东',
    aiScope: '产业园团餐 + AI 驾驶舱',
    status: 'active',
  },
  北京: {
    name: '北京区域运营中心',
    tier: '区域运营',
    region: '中国·华北',
    aiScope: '区域经营 + 风险预警',
    status: 'active',
  },
  鄂尔多斯: {
    name: '鄂尔多斯项目群',
    tier: '项目群',
    region: '中国·华北',
    aiScope: '项目经营 + 成本联动',
    status: 'active',
  },
  无锡: {
    name: '无锡项目组',
    tier: '项目组',
    region: '中国·华东',
    aiScope: '项目履约 + 成本跟踪',
    status: 'pilot',
  },
  太仓: {
    name: '太仓项目组',
    tier: '项目组',
    region: '中国·华东',
    aiScope: '项目履约 + 成本跟踪',
    status: 'pilot',
  },
  赤峰: {
    name: '赤峰项目组',
    tier: '项目组',
    region: '中国·华北',
    aiScope: '项目履约 + 供应协同',
    status: 'pilot',
  },
  十堰: {
    name: '十堰项目组',
    tier: '项目组',
    region: '中国·华北',
    aiScope: '项目履约 + 供应协同',
    status: 'pilot',
  },
  大连: {
    name: '大连项目组',
    tier: '项目组',
    region: '中国·华北',
    aiScope: '机场项目 + 质量监控',
    status: 'pilot',
  },
}

const userAccessRows = [
  {
    name: '林总',
    org: '星座厨房集团总部',
    role: 'CEO',
    dataScope: '全球 → 门店（全量）',
    aiScope: 'AI 全量能力 + 接入配置',
    status: '启用',
  },
  {
    name: '周总',
    org: '星座厨房集团总部',
    role: 'COO',
    dataScope: '中国 → 门店',
    aiScope: '经营分析 + 文件导入',
    status: '启用',
  },
  {
    name: '王VP',
    org: '上海城市运营中心',
    role: 'VP',
    dataScope: '上海城市 → 项目',
    aiScope: '城市 AI 分析 + 区域导入',
    status: '启用',
  },
  {
    name: '李总监',
    org: '苏州城市运营中心',
    role: '总监',
    dataScope: '江苏省 → 门店',
    aiScope: '省区 AI 分析',
    status: '启用',
  },
  {
    name: '赵经理',
    org: '苏州城市运营中心',
    role: '经理',
    dataScope: '苏州城市 → 门店',
    aiScope: '城市 AI 分析',
    status: '启用',
  },
  {
    name: '陈主管',
    org: 'A-sz011-碧迪二厂',
    role: '主管',
    dataScope: '门店/项目级',
    aiScope: '不可访问核心 AI',
    status: '受限',
  },
]

const aiPolicies = [
  {
    title: '驾驶舱 AI 功能授权',
    description: '权限一致 Access Sync',
    icon: BrainCircuit,
  },
  {
    title: '多租户隔离',
    description: '租户隔离 Tenant Isolation',
    icon: Building2,
  },
  {
    title: '全球商业化模板',
    description: '模板分层 Global Templates',
    icon: Globe2,
  },
]

type LoginStatus = 'success' | 'failed' | 'blocked'
type RiskLevel = 'low' | 'medium' | 'high'

interface LoginAuditRecord {
  id: string
  loginAt: string
  username: string
  phone: string
  fullName: string
  position: string
  location: string
  ip: string
  device: string
  mfa: string
  status: LoginStatus
  risk: RiskLevel
  securityFlag: string
}

const fallbackLoginAuditRecords: LoginAuditRecord[] = [
  {
    id: 'LA-260402-001',
    loginAt: '2026-04-02 08:35',
    username: 'Marlins',
    phone: '138****8821',
    fullName: '林总',
    position: 'CEO',
    location: '中国·上海·总部内网',
    ip: '117.136.24.89',
    device: 'MacOS / Safari',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'low',
    securityFlag: '可信设备 Trusted Device',
  },
  {
    id: 'LA-260402-002',
    loginAt: '2026-04-02 08:18',
    username: 'coo001',
    phone: '139****3316',
    fullName: '周总',
    position: 'COO',
    location: '中国·北京·集团VPN',
    ip: '223.72.111.6',
    device: 'Windows 11 / Edge',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'low',
    securityFlag: 'VPN白名单 IP Allowlist',
  },
  {
    id: 'LA-260402-003',
    loginAt: '2026-04-02 07:54',
    username: 'vp001',
    phone: '137****9512',
    fullName: '王VP',
    position: 'VP',
    location: '中国·江苏·苏州',
    ip: '49.76.102.88',
    device: 'iPhone / Safari',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'medium',
    securityFlag: '新设备 New Device',
  },
  {
    id: 'LA-260402-004',
    loginAt: '2026-04-02 07:40',
    username: 'dir001',
    phone: '136****6720',
    fullName: '李总监',
    position: '总监',
    location: '中国·江苏·南京',
    ip: '58.211.91.44',
    device: 'Android / Chrome',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'low',
    securityFlag: '正常登录 Normal',
  },
  {
    id: 'LA-260402-005',
    loginAt: '2026-04-02 07:32',
    username: 'mgr001',
    phone: '135****4208',
    fullName: '赵经理',
    position: '经理',
    location: '中国·江苏·苏州·A-sz046-亿腾医药',
    ip: '180.102.199.31',
    device: 'MacOS / Chrome',
    mfa: '未开启 Disabled',
    status: 'success',
    risk: 'medium',
    securityFlag: '需补开MFA MFA Missing',
  },
  {
    id: 'LA-260402-006',
    loginAt: '2026-04-02 07:19',
    username: 'sup001',
    phone: '134****7765',
    fullName: '陈主管',
    position: '主管',
    location: '中国·江苏·苏州·A-sz011-碧迪二厂',
    ip: '36.156.18.67',
    device: 'Windows 10 / Chrome',
    mfa: '不要求 Not Required',
    status: 'success',
    risk: 'low',
    securityFlag: '门店终端 Store Terminal',
  },
  {
    id: 'LA-260402-007',
    loginAt: '2026-04-02 06:58',
    username: 'mgr001',
    phone: '135****4208',
    fullName: '赵经理',
    position: '经理',
    location: '中国·江苏·苏州',
    ip: '45.88.103.219',
    device: 'Unknown / API Client',
    mfa: '失败 Failed',
    status: 'blocked',
    risk: 'high',
    securityFlag: '疑似撞库 Credential Stuffing',
  },
  {
    id: 'LA-260402-008',
    loginAt: '2026-04-02 06:57',
    username: 'Marlins',
    phone: '138****8821',
    fullName: '林总',
    position: 'CEO',
    location: '海外·新加坡',
    ip: '103.84.16.12',
    device: 'Linux / Firefox',
    mfa: '失败 Failed',
    status: 'blocked',
    risk: 'high',
    securityFlag: '异地高风险 Geo Anomaly',
  },
  {
    id: 'LA-260402-009',
    loginAt: '2026-04-02 06:56',
    username: 'unknown',
    phone: '未识别',
    fullName: '未知账号',
    position: 'N/A',
    location: '海外·迪拜',
    ip: '185.12.99.144',
    device: 'Bot / Script',
    mfa: '无 None',
    status: 'failed',
    risk: 'high',
    securityFlag: '自动化攻击 Bot Attack',
  },
  {
    id: 'LA-260402-010',
    loginAt: '2026-04-02 06:42',
    username: 'vp001',
    phone: '137****9512',
    fullName: '王VP',
    position: 'VP',
    location: '中国·上海·高铁网络',
    ip: '112.65.190.73',
    device: 'iPadOS / Safari',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'medium',
    securityFlag: '跨城市登录 Inter-city',
  },
  {
    id: 'LA-260402-011',
    loginAt: '2026-04-02 06:30',
    username: 'ops_fin_07',
    phone: '151****3148',
    fullName: '何财务',
    position: '财务经理',
    location: '中国·上海·蓝枪鱼上海碧云店',
    ip: '111.33.72.58',
    device: 'Windows 11 / Chrome',
    mfa: '已通过 Passed',
    status: 'success',
    risk: 'low',
    securityFlag: '正常登录 Normal',
  },
  {
    id: 'LA-260402-012',
    loginAt: '2026-04-02 05:51',
    username: 'ops_hr_13',
    phone: '152****6430',
    fullName: '沈人力',
    position: 'HRBP',
    location: '中国·无锡·移动网络',
    ip: '58.215.122.94',
    device: 'Android / Chrome',
    mfa: '已通过 Passed',
    status: 'failed',
    risk: 'medium',
    securityFlag: '密码错误 Wrong Password',
  },
]

const statusOptions: Array<{ key: 'all' | LoginStatus; label: string }> = [
  { key: 'all', label: '全部状态 All' },
  { key: 'success', label: '成功 Success' },
  { key: 'failed', label: '失败 Failed' },
  { key: 'blocked', label: '拦截 Blocked' },
]

const riskOptions: Array<{ key: 'all' | RiskLevel; label: string }> = [
  { key: 'all', label: '全部风险 All' },
  { key: 'high', label: '高风险 High' },
  { key: 'medium', label: '中风险 Medium' },
  { key: 'low', label: '低风险 Low' },
]

const statusMeta: Record<LoginStatus, { label: string; className: string }> = {
  success: {
    label: '成功 Success',
    className: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  },
  failed: {
    label: '失败 Failed',
    className: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  },
  blocked: {
    label: '拦截 Blocked',
    className: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/15',
  },
}

const riskMeta: Record<RiskLevel, { label: string; className: string }> = {
  high: {
    label: '高 High',
    className: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/15',
  },
  medium: {
    label: '中 Medium',
    className: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  },
  low: {
    label: '低 Low',
    className: 'bg-[#1a4a88]/20 text-[#9ab6de] hover:bg-[#1a4a88]/20',
  },
}

const securityHardeningPolicies = [
  {
    title: '高权限账号强制二次验证',
    description: 'CEO / COO / VP 强制 MFA',
    status: 'enabled',
  },
  {
    title: '异常地域与高危 IP 自动封禁',
    description: 'Geo Fence + Threat IP Block',
    status: 'enabled',
  },
  {
    title: '失败登录阈值锁定',
    description: '5 次失败锁定 15 分钟',
    status: 'enabled',
  },
  {
    title: '会话风控与设备指纹',
    description: 'Session Revoke + Device Fingerprint',
    status: 'monitoring',
  },
  {
    title: '审计日志防篡改',
    description: 'WORM + Hash Chain',
    status: 'planned',
  },
]

interface AuthAuditApiRecord {
  id?: string
  timestamp?: string
  identifier?: string
  employeeId?: string
  fullName?: string
  role?: string
  mobileMasked?: string
  location?: string
  ipAddress?: string
  device?: string
  deviceModel?: string
  mfa?: string
  status?: LoginStatus
  risk?: RiskLevel
  securityFlag?: string
  reason?: string
}

interface AuthAccountApiRecord {
  id?: string
  employeeId?: string
  name?: string
  role?: string
  scopePath?: string[]
  status?: 'active' | 'disabled'
  mobileMasked?: string
  mobileBound?: boolean
  createdAt?: string
  updatedAt?: string
  lastPasswordChangedAt?: string
}

interface AuthAccountFormState {
  employeeId: string
  name: string
  mobile: string
  role: string
  scopePath: string
  password: string
}

const formatAuditTime = (timestamp?: string) => {
  if (!timestamp) return '未知时间'
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return timestamp
  return parsed.toLocaleString('zh-CN', { hour12: false })
}

const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return '—'
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return timestamp
  return parsed.toLocaleString('zh-CN', { hour12: false })
}

const normalizeAccountForm = (form: AuthAccountFormState) => ({
  employeeId: form.employeeId.trim(),
  name: form.name.trim(),
  mobile: form.mobile.trim(),
  role: form.role,
  scopePath: form.scopePath.trim(),
  password: form.password,
})

const hasRequiredAccountFields = (form: ReturnType<typeof normalizeAccountForm>) =>
  Boolean(form.employeeId && form.name && form.mobile && form.scopePath && form.password)

const resolveApiMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    const message = payload.message.trim()
    if (message) return message
  }
  return fallback
}

const upsertAccountByApi = async (token: string, payload: ReturnType<typeof normalizeAccountForm>) => {
  const response = await fetch(buildApiUrl('/auth/accounts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const responsePayload = await response.json().catch(() => ({}))
  return {
    ok: response.ok,
    payload: responsePayload,
  }
}

const toLoginAuditRecord = (record: AuthAuditApiRecord): LoginAuditRecord => {
  const role = (record.role || 'N/A').toUpperCase()
  const securityFlag = record.securityFlag || record.reason || '未标记'
  return {
    id: record.id || `LA-${Date.now()}`,
    loginAt: formatAuditTime(record.timestamp),
    username: record.employeeId || record.identifier || 'unknown',
    phone: record.mobileMasked || '未绑定',
    fullName: record.fullName || '未知账号',
    position: role,
    location: record.location || '未知',
    ip: record.ipAddress || '0.0.0.0',
    device: [record.device || 'Unknown', record.deviceModel || 'Unknown'].join(' / '),
    mfa: record.mfa || '未配置',
    status: record.status || 'failed',
    risk: record.risk || 'medium',
    securityFlag,
  }
}

export default function AdminPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const roleConfig = getRoleConfig(user?.role)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | LoginStatus>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [loginAuditRecords, setLoginAuditRecords] = useState<LoginAuditRecord[]>(
    strictLiveMode ? [] : fallbackLoginAuditRecords
  )
  const [authAccounts, setAuthAccounts] = useState<AuthAccountApiRecord[]>([])
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false)
  const [accountForm, setAccountForm] = useState<AuthAccountFormState>({
    employeeId: '',
    name: '',
    mobile: '',
    role: 'manager',
    scopePath: 'global/china',
    password: '',
  })
  const deferredSearchKeyword = useDeferredValue(searchKeyword)

  useEffect(() => {
    if (!token) return
    let active = true

    const loadAuthAudit = async () => {
      try {
        const response = await fetch(buildApiUrl('/auth/audit?page=1&size=300'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) return
        const payload = await response.json().catch(() => ({}))
        if (!Array.isArray(payload?.items)) return

        const mapped = payload.items.map((item: AuthAuditApiRecord) => toLoginAuditRecord(item))
        if (active && mapped.length) {
          setLoginAuditRecords(mapped)
        }
      } catch {
        if (!active) return
        if (strictLiveMode) {
          setLoginAuditRecords([])
        }
      }
    }

    void loadAuthAudit()
    return () => {
      active = false
    }
  }, [strictLiveMode, token])

  useEffect(() => {
    if (!token) return
    let active = true

    const loadAuthAccounts = async () => {
      try {
        const response = await fetch(buildApiUrl('/auth/accounts'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) return
        const payload = await response.json().catch(() => ({}))
        if (!Array.isArray(payload?.items)) return
        if (active) {
          setAuthAccounts(payload.items as AuthAccountApiRecord[])
        }
      } catch {
        // Keep empty list if account directory API is unavailable.
      }
    }

    void loadAuthAccounts()
    return () => {
      active = false
    }
  }, [token])

  const indexedLoginAudit = useMemo(
    () =>
      loginAuditRecords.map((record) => ({
        record,
        searchable: [
          record.username,
          record.phone,
          record.fullName,
          record.position,
          record.location,
          record.ip,
          record.device,
          record.securityFlag,
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [loginAuditRecords]
  )

  const filteredLoginAudit = useMemo(() => {
    const keyword = deferredSearchKeyword.trim().toLowerCase()

    return indexedLoginAudit
      .filter(({ record, searchable }) => {
        const statusMatched = statusFilter === 'all' || record.status === statusFilter
        const riskMatched = riskFilter === 'all' || record.risk === riskFilter
        if (!statusMatched || !riskMatched) return false

        if (!keyword) return true

        return searchable.includes(keyword)
      })
      .map(({ record }) => record)
  }, [deferredSearchKeyword, indexedLoginAudit, riskFilter, statusFilter])

  const filteredAuditStats = useMemo(
    () =>
      filteredLoginAudit.reduce(
        (acc, record) => {
          acc.total += 1
          acc[record.status] += 1
          return acc
        },
        { total: 0, success: 0, failed: 0, blocked: 0 }
      ),
    [filteredLoginAudit]
  )

  const securitySnapshot = useMemo(() => {
    const failedAttempts = loginAuditRecords.filter((record) => record.status === 'failed').length
    const blockedAttempts = loginAuditRecords.filter((record) => record.status === 'blocked').length
    const highRiskIps = new Set(
      loginAuditRecords
        .filter((record) => record.risk === 'high')
        .map((record) => record.ip)
    ).size
    const geoAnomalies = loginAuditRecords.filter((record) =>
      record.securityFlag.includes('异地')
    ).length

    return {
      failedAttempts,
      blockedAttempts,
      highRiskIps,
      geoAnomalies,
    }
  }, [loginAuditRecords])

  const tenantRows = useMemo<TenantDisplayItem[]>(() => {
    const groupedProjects = REAL_CATERING_PROJECTS.reduce<Map<string, ProjectDirectoryItem[]>>(
      (acc, project) => {
        const current = acc.get(project.city) || []
        current.push(project)
        acc.set(project.city, current)
        return acc
      },
      new Map<string, ProjectDirectoryItem[]>()
    )

    const dynamicCities = Array.from(groupedProjects.keys())
      .filter((city) => !TENANT_CITY_ORDER.includes(city))
      .sort((cityA, cityB) => cityA.localeCompare(cityB, 'zh-CN'))
    const orderedCities = [...TENANT_CITY_ORDER, ...dynamicCities]

    return orderedCities
      .filter((city) => groupedProjects.has(city))
      .map((city) => {
        const cityProjects = groupedProjects.get(city) || []
        const profile = TENANT_CITY_PROFILES[city] || {
          name: `${city}项目组`,
          tier: '项目组',
          region: '中国',
          aiScope: '项目经营分析',
          status: cityProjects.length > 1 ? 'active' : 'pilot',
        }
        const projectMenus = cityProjects.slice(0, MAX_PROJECT_MENUS_PER_CITY).map((project) => ({
          title: project.name,
          href: `/dashboard/finance/drilldown/${project.scopePath.join('/')}/`,
        }))

        return {
          city,
          name: profile.name,
          tier: profile.tier,
          region: profile.region,
          projects: cityProjects.length,
          aiScope: profile.aiScope,
          status: profile.status,
          projectMenus,
        }
      })
  }, [])

  const roleTemplateOptions = useMemo(
    () =>
      Object.values(ROLE_CONFIGS).map((item) => ({
        value: item.role,
        label: item.label,
      })),
    []
  )

  const refreshAuthAccounts = async () => {
    if (!token) return
    try {
      const response = await fetch(buildApiUrl('/auth/accounts'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) return
      const payload = await response.json().catch(() => ({}))
      if (Array.isArray(payload?.items)) {
        setAuthAccounts(payload.items as AuthAccountApiRecord[])
      }
    } catch {
      // Ignore refresh failures.
    }
  }

  const handleCreateOrUpdateAccount = async () => {
    const normalizedForm = normalizeAccountForm(accountForm)
    if (!hasRequiredAccountFields(normalizedForm)) {
      toast({
        title: '请补全字段',
        description: '用户名、姓名、手机号、数据范围和密码均为必填。',
      })
      return
    }

    if (!token) {
      toast({
        title: '未登录',
        description: '请先登录管理账号。',
      })
      return
    }

    setIsSubmittingAccount(true)
    try {
      const result = await upsertAccountByApi(token, normalizedForm)
      if (!result.ok) {
        toast({
          title: '账号开通失败',
          description: resolveApiMessage(result.payload, '账号开通失败，请检查参数。'),
          variant: 'destructive',
        })
        return
      }

      toast({
        title: '账号已开通',
        description: `${normalizedForm.employeeId} 已保存。密码已加密存储，不会明文展示。`,
      })

      setAccountForm((prev) => ({
        ...prev,
        password: '',
      }))
      await refreshAuthAccounts()
    } catch {
      toast({
        title: '请求失败',
        description: '网络异常，请稍后重试。',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingAccount(false)
    }
  }

  const handleExportAudit = () => {
    if (!filteredLoginAudit.length) {
      toast({
        title: '暂无可导出数据',
        description: '请先调整筛选条件。No audit rows to export.',
      })
      return
    }

    const headers = ['时间', '用户名', '手机号', '姓名', '职务', '登录地址', 'IP', '设备', 'MFA', '状态', '风险', '安全标记']
    const rows = filteredLoginAudit.map((record) => [
      record.loginAt,
      record.username,
      record.phone,
      record.fullName,
      record.position,
      record.location,
      record.ip,
      record.device,
      record.mfa,
      statusMeta[record.status].label,
      riskMeta[record.risk].label,
      record.securityFlag,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `login-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: '导出成功',
      description: `已导出 ${filteredLoginAudit.length} 条登录审计记录。`,
    })
  }

  const handleResetFilters = () => {
    startTransition(() => {
      setSearchKeyword('')
      setStatusFilter('all')
      setRiskFilter('all')
    })
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="manage_access_control" title="当前账号无权进入管理员中心">
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Shield className="h-3.5 w-3.5" />
                    商业化治理 Commercial Admin
                  </div>
                  <div>
                    <CardTitle>管理员中心</CardTitle>
                    <CardDescription>
                      用户、租户与审计一体治理 Access, Tenant and Audit Governance
                    </CardDescription>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
                  <div>当前管理员角色: {roleConfig.label}</div>
                  <div className="mt-1 text-xs text-slate-500">Scope: {roleConfig.dataGranularity}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: '租户与项目', href: '/dashboard/admin#tenant-management', icon: Building2 },
                  { title: '治理策略', href: '/dashboard/admin#governance-policy', icon: ShieldCheck },
                  { title: '权限分配', href: '/dashboard/admin#user-access', icon: UserCog },
                  { title: '账号开通', href: '/dashboard/admin#auth-accounts', icon: Users },
                  { title: '登录审计', href: '/dashboard/admin#login-audit', icon: Search },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group inline-flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-200 transition hover:border-primary/40 hover:bg-white/[0.08] hover:text-white"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {item.title}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                {[
                  { title: '租户组织', value: '18', hint: '直营/加盟/海外', icon: Building2 },
                  { title: '授权账号', value: '436', hint: '分层权限 Role-based', icon: Users },
                  { title: 'AI 功能模板', value: `${AI_AGENT_CAPABILITY_LIBRARY.length}`, hint: '能力模板 AI Packs', icon: BrainCircuit },
                  { title: '待审核加盟', value: '5', hint: '待开通 Pending', icon: BadgeCheck },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Card key={item.title} className="border-white/10 bg-slate-950/35 text-white">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-slate-400">{item.title}</p>
                            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                            <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card id="tenant-management" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>租户 / 加盟商管理</CardTitle>
                <CardDescription>
                  租户边界 Tenant Boundaries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantRows.map((tenant) => (
                  <div
                    key={tenant.name}
                    className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {tenant.region} · {tenant.projects} 个真实项目 · {tenant.aiScope}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{tenant.tier}</Badge>
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{tenant.city}</Badge>
                        <Badge
                          className={
                            tenant.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                              : tenant.status === 'pilot'
                                ? 'bg-[#1a4a88]/20 text-[#9ab6de] hover:bg-[#1a4a88]/20'
                                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                          }
                        >
                          {tenant.status === 'active' ? '已开通' : tenant.status === 'pilot' ? '试点中' : '待开通'}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#081538]/55 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">二级菜单 Project Menu</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {tenant.projectMenus.map((project) => (
                          <Link
                            key={project.href}
                            href={project.href}
                            className="group inline-flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 transition hover:border-primary/40 hover:bg-white/[0.08] hover:text-white"
                          >
                            <span className="truncate">{project.title}</span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        ))}
                      </div>
                      {tenant.projects > tenant.projectMenus.length ? (
                        <p className="mt-2 text-xs text-slate-500">
                          +{tenant.projects - tenant.projectMenus.length} 个项目，进入城市口径可查看全部。
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card id="governance-policy" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>平台治理策略</CardTitle>
                <CardDescription>
                  平台治理 Governance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiPolicies.map((policy) => {
                  const Icon = policy.icon
                  return (
                    <div key={policy.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{policy.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{policy.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <Card id="user-access" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>用户权限与 AI 能力分配</CardTitle>
                  <CardDescription>
                    谁可看哪些数据，就开放对应 AI 能力，避免越权分析
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" className="border-white/20 bg-slate-950/35 text-slate-100 hover:bg-white/[0.08] hover:text-white">
                    <Link href="/dashboard/admin/users/">
                      <Users className="mr-2 h-4 w-4" />
                      打开用户管理
                    </Link>
                  </Button>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/admin/users/?view=templates">
                      <UserCog className="mr-2 h-4 w-4" />
                      新建权限模板
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {userAccessRows.map((row) => (
                <div
                  key={`${row.org}-${row.name}`}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 2xl:grid-cols-[1.1fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{row.org}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">角色与数据域</p>
                    <p className="mt-2 text-sm text-slate-200">{row.role}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.dataScope}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">AI 能力</p>
                    <p className="mt-2 text-sm text-slate-200">{row.aiScope}</p>
                  </div>
                  <div className="flex items-start justify-end">
                    <Badge
                      className={
                        row.status === '启用'
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                      }
                    >
                      {row.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="auth-accounts" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle>账号开通（手机号实名）</CardTitle>
                <CardDescription>
                  可直接创建/更新员工账号（用户名 + 真实手机号 + 密码）。密码只做加密哈希存储，后台不会回显明文。
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Input
                  value={accountForm.employeeId}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      employeeId: event.target.value,
                    }))
                  }
                  placeholder="账号（如 ceo001）"
                  className="border-white/15 bg-slate-950/45 text-slate-100 placeholder:text-slate-500"
                />
                <Input
                  value={accountForm.name}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="姓名（如 林总）"
                  className="border-white/15 bg-slate-950/45 text-slate-100 placeholder:text-slate-500"
                />
                <Input
                  value={accountForm.mobile}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      mobile: event.target.value,
                    }))
                  }
                  placeholder="手机号（如 13800138000）"
                  className="border-white/15 bg-slate-950/45 text-slate-100 placeholder:text-slate-500"
                />
                <label className="flex flex-col gap-2 text-xs text-slate-400">
                  角色模板 Role
                  <select
                    value={accountForm.role}
                    onChange={(event) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="h-10 rounded-md border border-white/15 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition focus:border-primary/50"
                  >
                    {roleTemplateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  value={accountForm.scopePath}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      scopePath: event.target.value,
                    }))
                  }
                  placeholder="数据范围（如 global/china/east-china）"
                  className="border-white/15 bg-slate-950/45 text-slate-100 placeholder:text-slate-500"
                />
                <Input
                  type="password"
                  value={accountForm.password}
                  onChange={(event) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="设置密码（至少8位）"
                  className="border-white/15 bg-slate-950/45 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleCreateOrUpdateAccount}
                  disabled={isSubmittingAccount}
                >
                  {isSubmittingAccount ? '保存中...' : '开通 / 更新账号'}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-slate-950/35 text-slate-100 hover:bg-white/[0.08] hover:text-white"
                  onClick={() => {
                    void refreshAuthAccounts()
                  }}
                >
                  刷新账号列表
                </Button>
                <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                  当前账号数 {authAccounts.length}
                </Badge>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">账号</th>
                        <th className="px-4 py-3 font-medium">姓名</th>
                        <th className="px-4 py-3 font-medium">手机号</th>
                        <th className="px-4 py-3 font-medium">角色</th>
                        <th className="px-4 py-3 font-medium">数据范围</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">密码最后更新</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-200">
                      {authAccounts.map((account) => (
                        <tr key={account.id || account.employeeId} className="border-b border-white/10 transition hover:bg-white/[0.05]">
                          <td className="px-4 py-3 font-medium text-white">{account.employeeId || '—'}</td>
                          <td className="px-4 py-3">{account.name || '—'}</td>
                          <td className="px-4 py-3">{account.mobileMasked || '未绑定'}</td>
                          <td className="px-4 py-3">{(account.role || 'N/A').toUpperCase()}</td>
                          <td className="px-4 py-3 text-xs text-slate-300">{(account.scopePath || []).join(' / ') || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                account.status === 'disabled'
                                  ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                              }
                            >
                              {account.status === 'disabled' ? '禁用' : '启用'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300">
                            {formatDateTime(account.lastPasswordChangedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {authAccounts.length === 0 ? (
                  <div className="border-t border-white/10 px-4 py-6 text-sm text-slate-400">
                    暂无账号数据。请先创建账号，或检查 `/api/auth/accounts` 接口权限配置。
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>入侵风险态势 Security Risk</CardTitle>
                <CardDescription>过去 24 小时 24h Snapshot</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: '失败登录',
                    value: securitySnapshot.failedAttempts,
                    unit: '次',
                    icon: AlertTriangle,
                  },
                  {
                    title: '拦截攻击',
                    value: securitySnapshot.blockedAttempts,
                    unit: '次',
                    icon: Shield,
                  },
                  {
                    title: '高风险 IP',
                    value: securitySnapshot.highRiskIps,
                    unit: '个',
                    icon: Network,
                  },
                  {
                    title: '异地异常',
                    value: securitySnapshot.geoAnomalies,
                    unit: '条',
                    icon: Globe2,
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">{item.title}</p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {item.value}
                            <span className="ml-1 text-base font-medium text-slate-300">{item.unit}</span>
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>防护策略 Hardening Controls</CardTitle>
                <CardDescription>登录安全策略 Login Security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityHardeningPolicies.map((policy) => (
                  <div
                    key={policy.title}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{policy.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{policy.description}</p>
                    </div>
                    <Badge
                      className={
                        policy.status === 'enabled'
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                          : policy.status === 'monitoring'
                            ? 'bg-[#1a4a88]/20 text-[#9ab6de] hover:bg-[#1a4a88]/20'
                            : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                      }
                    >
                      {policy.status === 'enabled'
                        ? '已启用 Enabled'
                        : policy.status === 'monitoring'
                          ? '监控中 Monitoring'
                          : '待上线 Planned'}
                    </Badge>
                  </div>
                ))}
                <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-slate-100">
                  建议动作 Recommended: 对未开启 MFA 的账号立即补开；对高风险 IP 自动封禁 24 小时并触发短信告警。
                </div>
              </CardContent>
            </Card>
          </div>

          <Card id="login-audit" className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>登录审计 Login Audit</CardTitle>
                  <CardDescription>
                    支持按状态与风险筛选，支持导出复盘（用户名 / 手机号 / 姓名 / IP / 设备）
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-white/20 bg-slate-950/35 text-slate-100 hover:bg-white/[0.08] hover:text-white"
                    onClick={handleResetFilters}
                  >
                    重置筛选 Reset
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleExportAudit}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    导出审计 Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 2xl:grid-cols-[1.5fr_1fr_1fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="搜索用户名/手机号/姓名/职务/地址/IP"
                    className="border-white/15 bg-slate-950/45 pl-9 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setStatusFilter(option.key)
                        })
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs transition ${
                        statusFilter === option.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-2">
                  {riskOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setRiskFilter(option.key)
                        })
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs transition ${
                        riskFilter === option.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  当前结果 {filteredAuditStats.total} 条
                </Badge>
                <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                  成功 {filteredAuditStats.success}
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
                  失败 {filteredAuditStats.failed}
                </Badge>
                <Badge className="bg-rose-500/15 text-rose-300 hover:bg-rose-500/15">
                  拦截 {filteredAuditStats.blocked}
                </Badge>
                {searchKeyword !== deferredSearchKeyword ? (
                  <Badge className="bg-white/10 text-slate-300 hover:bg-white/10">
                    搜索处理中...
                  </Badge>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">时间 Time</th>
                        <th className="px-4 py-3 font-medium">用户名</th>
                        <th className="px-4 py-3 font-medium">手机号</th>
                        <th className="px-4 py-3 font-medium">姓名</th>
                        <th className="px-4 py-3 font-medium">职务</th>
                        <th className="px-4 py-3 font-medium">登录地址</th>
                        <th className="px-4 py-3 font-medium">IP</th>
                        <th className="px-4 py-3 font-medium">设备</th>
                        <th className="px-4 py-3 font-medium">MFA</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">风险</th>
                        <th className="px-4 py-3 font-medium">安全标记</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-200">
                      {filteredLoginAudit.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-white/10 transition hover:bg-white/[0.05]"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-slate-300">{record.loginAt}</td>
                          <td className="px-4 py-3 font-medium text-white">{record.username}</td>
                          <td className="px-4 py-3">{record.phone}</td>
                          <td className="px-4 py-3">{record.fullName}</td>
                          <td className="px-4 py-3">{record.position}</td>
                          <td className="px-4 py-3">{record.location}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">{record.ip}</td>
                          <td className="px-4 py-3">{record.device}</td>
                          <td className="px-4 py-3">{record.mfa}</td>
                          <td className="px-4 py-3">
                            <Badge className={statusMeta[record.status].className}>
                              {statusMeta[record.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={riskMeta[record.risk].className}>
                              {riskMeta[record.risk].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{record.securityFlag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredLoginAudit.length === 0 && (
                  <div className="border-t border-white/10 px-4 py-6 text-sm text-slate-400">
                    无匹配记录 No matching audit logs.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <CardTitle>角色模板总览</CardTitle>
              <CardDescription>
                标准模板 Role Templates
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {Object.values(ROLE_CONFIGS).map((role) => (
                <div key={role.role} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{role.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{role.loginHint}</p>
                    </div>
                    <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                      {role.permissions.length} 权限
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">Scope: {role.dataGranularity}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <Badge key={permission} className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {permission}
                      </Badge>
                    ))}
                    {role.permissions.length > 5 && (
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                        +{role.permissions.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
