'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Bot,
  BrainCircuit,
  Boxes,
  BookOpen,
  Coffee,
  Store,
  Truck,
  Upload,
  Link2,
  ShieldCheck,
  BadgeDollarSign,
  UserCog,
  Users, 
  Settings, 
  BarChart3, 
  Layers3,
  HelpCircle,
  LockKeyhole,
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChefHat,
  Gift,
  Gem,
  MoreHorizontal,
  PackageSearch,
  UtensilsCrossed,
  MessageSquareMore,
  Files,
  ShieldAlert,
  PhoneCall,
  CalendarClock,
  Wifi,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Permission, getRoleBaseScopePath, getRoleConfig, hasPermission } from '@/lib/access'
import type { UserRole } from '@/lib/access'
import { useAuthStore } from '@/store/auth'
import { CompanyLogo } from '@/components/company-logo'
import { COMPANY_NAME_EN, COMPANY_NAME_ZH } from '@/lib/brand'
import { UILanguage, useUIPreferences } from '@/components/ui-preference-provider'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
  children?: {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    permission: Permission
  }[]
}

const sidebarEnglishLabelMap: Record<string, string> = {
  仪表盘: 'Dashboard',
  OPR看板: 'OPR Board',
  行动中心: 'Action Center',
  项目管理: 'Project Management',
  档口分析: 'Counter Analysis',
  经营穿透: 'Business Drilldown',
  人力系统: 'HR System',
  人力总览: 'HR Overview',
  盖雅花名册: 'Gaia Roster',
  项目排班明细: 'Project Scheduling',
  排班优化: 'Shift Optimization',
  缺编追踪: 'Staffing Gap',
  异常中心: 'Exception Center',
  产品中心: 'Product Center',
  产品总览: 'Product Overview',
  菜品: 'Dishes',
  饮品: 'Beverages',
  周边: 'Peripheral',
  增值: 'Value Added',
  其它: 'Others',
  供应链中心: 'Supply Chain',
  供应总览: 'Supply Overview',
  采购到货: 'Procurement',
  配送履约: 'Dispatch Fulfillment',
  库存中心: 'Inventory',
  库存预警: 'Inventory Alerts',
  食安闭环: 'Food Safety Loop',
  财务分析: 'Finance',
  报表中心: 'Reports',
  '协同 OA': 'Collaborative OA',
  'OA 总览': 'OA Overview',
  IM桥接: 'IM Bridge',
  对话中心: 'Chat Center',
  通讯录组织: 'Directory',
  文件中枢: 'File Hub',
  通话中心: 'Calls',
  会议中心: 'Meetings',
  监控审计: 'Audit',
  管理员中心: 'Admin Center',
  租户与项目: 'Tenants & Projects',
  治理策略: 'Governance',
  用户管理: 'User Management',
  登录审计: 'Login Audit',
  系统设置: 'System Settings',
  基础设置: 'Basic Settings',
  知识库: 'Knowledge Base',
  数据导入: 'Data Imports',
  系统集成: 'Integrations',
  模型接入: 'Model Access',
  AI审批工单: 'AI Workflows',
  帮助中心: 'Help Center',
  'AI 技能中心（12）': 'AI Skills (12)',
  'AI 集群团队': 'AI Agent Team',
}

const localizeSidebarLabel = (label: string, language: UILanguage) => {
  if (language === 'zh') return label
  return sidebarEnglishLabelMap[label] || label
}

const isExecutiveRole = (role: UserRole) =>
  role === 'ceo' || role === 'coo' || role === 'vp' || role === 'director'

const navItems: NavItem[] = [
  {
    title: '仪表盘',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'view_dashboard',
    children: [
      { title: 'OPR看板', href: '/dashboard/opr/', icon: BarChart3, permission: 'use_ai_chat' },
    ],
  },
  { title: '行动中心', href: '/dashboard/tasks', icon: ClipboardList, permission: 'view_dashboard' },
  {
    title: '项目管理',
    href: '/dashboard/stores',
    icon: Store,
    permission: 'view_dashboard',
    children: [
      { title: '档口分析', href: '/dashboard/stores/counters', icon: ChefHat, permission: 'view_dashboard' },
      { title: '经营穿透', href: '/dashboard/finance/drilldown/global', icon: Layers3, permission: 'view_dashboard' },
    ],
  },
  {
    title: '人力系统',
    href: '/dashboard/hr',
    icon: Users,
    permission: 'view_dashboard',
    children: [
      { title: '人力总览', href: '/dashboard/hr/overview', icon: Users, permission: 'view_dashboard' },
      { title: '盖雅花名册', href: '/dashboard/hr/gaia-roster', icon: BookOpen, permission: 'view_dashboard' },
      { title: '项目排班明细', href: '/dashboard/hr/projects', icon: ClipboardList, permission: 'view_dashboard' },
      { title: '排班优化', href: '/dashboard/hr/shift-optimization', icon: ChefHat, permission: 'view_dashboard' },
      { title: '缺编追踪', href: '/dashboard/hr/staffing-gap', icon: Users, permission: 'view_dashboard' },
      { title: '异常中心', href: '/dashboard/hr/exception-center', icon: BookOpen, permission: 'view_dashboard' },
    ],
  },
  {
    title: '产品中心',
    href: '/dashboard/products',
    icon: PackageSearch,
    permission: 'view_dashboard',
    children: [
      { title: '产品总览', href: '/dashboard/products', icon: PackageSearch, permission: 'view_dashboard' },
      { title: '菜品', href: '/dashboard/products/category/dishes', icon: UtensilsCrossed, permission: 'view_dashboard' },
      { title: '饮品', href: '/dashboard/products/category/beverages', icon: Coffee, permission: 'view_dashboard' },
      { title: '周边', href: '/dashboard/products/category/peripheral', icon: Gift, permission: 'view_dashboard' },
      { title: '增值', href: '/dashboard/products/category/value-added', icon: Gem, permission: 'view_dashboard' },
      { title: '其它', href: '/dashboard/products/category/others', icon: MoreHorizontal, permission: 'view_dashboard' },
    ],
  },
  {
    title: '供应链中心',
    href: '/dashboard/supply',
    icon: Truck,
    permission: 'view_dashboard',
    children: [
      { title: '供应总览', href: '/dashboard/supply', icon: Truck, permission: 'view_dashboard' },
      { title: '采购到货', href: '/dashboard/supply/procurement', icon: Truck, permission: 'view_dashboard' },
      { title: '配送履约', href: '/dashboard/supply/dispatch', icon: Link2, permission: 'view_dashboard' },
      { title: '库存中心', href: '/dashboard/supply/inventory', icon: Boxes, permission: 'view_dashboard' },
      { title: '库存预警', href: '/dashboard/supply/inventory/alerts', icon: Boxes, permission: 'view_dashboard' },
      { title: '食安闭环', href: '/dashboard/supply/inventory/food-safety', icon: ShieldCheck, permission: 'view_dashboard' },
    ],
  },
  { title: '财务分析', href: '/dashboard/finance', icon: BadgeDollarSign, permission: 'view_dashboard' },
  { title: '报表中心', href: '/dashboard/reports', icon: BarChart3, permission: 'view_reports' },
  {
    title: '协同 OA',
    href: '/dashboard/oa',
    icon: MessageSquareMore,
    permission: 'view_dashboard',
    children: [
      { title: 'OA 总览', href: '/dashboard/oa', icon: MessageSquareMore, permission: 'view_dashboard' },
      { title: 'IM桥接', href: '/dashboard/oa/im', icon: Wifi, permission: 'manage_access_control' },
      { title: '对话中心', href: '/dashboard/oa/chat', icon: MessageSquareMore, permission: 'view_dashboard' },
      { title: '通讯录组织', href: '/dashboard/oa/contacts', icon: Users, permission: 'view_dashboard' },
      { title: '文件中枢', href: '/dashboard/oa/files', icon: Files, permission: 'view_dashboard' },
      { title: '通话中心', href: '/dashboard/oa/calls', icon: PhoneCall, permission: 'view_dashboard' },
      { title: '会议中心', href: '/dashboard/oa/meetings', icon: CalendarClock, permission: 'view_dashboard' },
      { title: '监控审计', href: '/dashboard/oa/audit', icon: ShieldAlert, permission: 'manage_access_control' },
    ],
  },
  {
    title: '管理员中心',
    href: '/dashboard/admin',
    icon: ShieldCheck,
    permission: 'manage_access_control',
    children: [
      { title: '租户与项目', href: '/dashboard/admin#tenant-management', icon: Store, permission: 'manage_access_control' },
      { title: '治理策略', href: '/dashboard/admin#governance-policy', icon: ShieldCheck, permission: 'manage_access_control' },
      { title: '用户管理', href: '/dashboard/admin/users', icon: UserCog, permission: 'manage_users' },
      { title: '登录审计', href: '/dashboard/admin#login-audit', icon: BookOpen, permission: 'manage_access_control' },
    ],
  },
  {
    title: '系统设置',
    href: '/dashboard/settings',
    icon: Settings,
    permission: 'manage_settings',
    children: [
      { title: '基础设置', href: '/dashboard/settings', icon: Settings, permission: 'manage_settings' },
      { title: '知识库', href: '/dashboard/documents', icon: BookOpen, permission: 'view_documents' },
      { title: '数据导入', href: '/dashboard/documents/imports', icon: Upload, permission: 'import_documents' },
      { title: '系统集成', href: '/dashboard/integrations', icon: Link2, permission: 'view_integrations' },
      { title: '模型接入', href: '/dashboard/integrations/llm', icon: Bot, permission: 'view_integrations' },
      { title: 'AI审批工单', href: '/dashboard/ai/workflows', icon: ClipboardList, permission: 'use_ai_chat' },
    ],
  },
  { title: '帮助中心', href: '/dashboard/help', icon: HelpCircle, permission: 'view_help' },
]

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { language, resolvedTheme, text } = useUIPreferences()
  const [mobileExpandedGroups, setMobileExpandedGroups] = useState<Record<string, boolean>>({})
  const [desktopExpandedGroups, setDesktopExpandedGroups] = useState<Record<string, boolean>>({})
  const [supportsHover, setSupportsHover] = useState(true)
  const lastPointerTypeRef = useRef<'mouse' | 'touch' | 'pen'>('mouse')
  const roleConfig = getRoleConfig(user?.role)
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const scopedDrilldownHref = `/dashboard/finance/drilldown/${roleScopePath.join('/')}`
  const canAccessStarshipAgent = hasPermission(user?.role, 'use_ai_chat')
  const canAccessAgentsLegion = canAccessStarshipAgent && isExecutiveRole(roleConfig.role)
  const isLightTheme = resolvedTheme === 'light'
  const filteredNavItems = navItems
    .map((item) => {
      const isParentAllowed = hasPermission(user?.role, item.permission)
      const filteredChildren = (item.children || [])
        .filter((child) => hasPermission(user?.role, child.permission))
        .map((child) => ({
          ...child,
          href: child.href === '/dashboard/finance/drilldown/global' ? scopedDrilldownHref : child.href,
        }))

      if (!isParentAllowed && filteredChildren.length === 0) {
        return null
      }

      const resolvedParentHref =
        item.href === '/dashboard/finance/drilldown/global' ? scopedDrilldownHref : item.href

      return {
        ...item,
        href: isParentAllowed ? resolvedParentHref : filteredChildren[0].href,
        children: filteredChildren,
      }
    })
    .filter(Boolean) as NavItem[]
  if (canAccessAgentsLegion) {
    filteredNavItems.push({
      title: 'AI Agents Legion',
      href: '/dashboard/agents/',
      icon: BrainCircuit,
      permission: 'use_ai_chat',
      children: [
        {
          title: 'AI 技能中心（12）',
          href: '/dashboard/ai/',
          icon: Bot,
          permission: 'use_ai_chat',
        },
        {
          title: 'AI 集群团队',
          href: '/dashboard/agents/',
          icon: ShieldCheck,
          permission: 'use_ai_chat',
        },
      ],
    })
  }
  const effectiveCollapsed = isCollapsed

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const updateHoverSupport = () => {
      setSupportsHover(mediaQuery.matches)
    }

    updateHoverSupport()
    mediaQuery.addEventListener('change', updateHoverSupport)
    return () => {
      mediaQuery.removeEventListener('change', updateHoverSupport)
    }
  }, [])

  const normalizeNavHref = (href: string) => href.split(/[?#]/)[0]
  const isPathActive = (href: string) => {
    const normalizedHref = normalizeNavHref(href)
    return pathname === normalizedHref || pathname?.startsWith(`${normalizedHref}/`)
  }
  const toggleMobileGroup = (groupKey: string) => {
    setMobileExpandedGroups((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }))
  }
  const isMobileGroupExpanded = (item: NavItem) => {
    if (!item.children?.length) return false
    if (mobileExpandedGroups[item.href] !== undefined) return mobileExpandedGroups[item.href]
    return item.children.some((child) => isPathActive(child.href))
  }
  const toggleDesktopGroup = (groupKey: string) => {
    setDesktopExpandedGroups((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }))
  }
  const isDesktopGroupExpanded = (item: NavItem) => {
    if (!item.children?.length) return false
    if (desktopExpandedGroups[item.href] !== undefined) return desktopExpandedGroups[item.href]
    return item.children.some((child) => isPathActive(child.href))
  }

  const NavContent = () => (
    <>
      <div className="px-4 pb-4 pt-5">
        <div className={cn(
          "flex w-full min-w-0 items-center gap-3.5 overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(23,44,96,0.7)_0%,rgba(14,28,66,0.8)_100%)] p-3.5 shadow-[0_10px_30px_rgba(2,7,24,0.45)] transition-all duration-300",
          effectiveCollapsed && "justify-center px-2"
        )}>
          <CompanyLogo iconClassName="h-12 w-12 rounded-xl bg-white/95 p-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.28)]" />
          {!effectiveCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-5 text-white">
                {language === 'en' ? COMPANY_NAME_EN : COMPANY_NAME_ZH}
              </p>
              <p className="truncate text-[11px] leading-4 text-slate-300/80">{COMPANY_NAME_EN}</p>
            </div>
          )}
        </div>
        {effectiveCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="mt-2 min-h-11 w-full items-center justify-center text-slate-300 hover:bg-white/[0.06] hover:text-white"
            title={text('展开导航', 'Expand navigation')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <Separator className="mx-4 w-auto" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isChildActive = (item.children || []).some((child) => isPathActive(child.href))
          const isActive = isPathActive(item.href) || isChildActive
          const hasChildren = Boolean(item.children && item.children.length > 0)
          const isDesktopExpanded = isDesktopGroupExpanded(item)
          const Icon = item.icon
          
          return (
            <div key={item.href} className="group/nav space-y-1">
              <Link
                href={item.href}
                onPointerDown={(event) => {
                  const pointerType = event.pointerType
                  if (pointerType === 'touch' || pointerType === 'pen' || pointerType === 'mouse') {
                    lastPointerTypeRef.current = pointerType
                  }
                }}
                onClick={(event) => {
                  if (!hasChildren) return
                  const clickedByTouch =
                    lastPointerTypeRef.current === 'touch' || lastPointerTypeRef.current === 'pen'
                  if (clickedByTouch || !supportsHover) {
                    event.preventDefault()
                    toggleDesktopGroup(item.href)
                  }
                }}
                className={cn(
                  "group flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-white/20 bg-[linear-gradient(120deg,rgba(103,145,255,0.98)_0%,rgba(88,120,233,0.98)_100%)] text-white shadow-[0_12px_30px_rgba(79,124,235,0.45)]"
                    : isLightTheme
                      ? "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      : "border-transparent text-slate-200/90 hover:border-white/15 hover:bg-white/[0.08] hover:text-white",
                  effectiveCollapsed && "justify-center px-2"
                )}
                title={effectiveCollapsed ? localizeSidebarLabel(item.title, language) : undefined}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  {!effectiveCollapsed && (
                    <span className="whitespace-nowrap">{localizeSidebarLabel(item.title, language)}</span>
                  )}
                </span>
                {!effectiveCollapsed && hasChildren ? (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-200',
                      (isDesktopExpanded || isChildActive) && 'rotate-180'
                    )}
                  />
                ) : null}
              </Link>

              {!effectiveCollapsed && item.children && item.children.length > 0 ? (
                <div
                  className={cn(
                    'space-y-1 overflow-hidden pl-4 transition-all duration-200',
                    'max-h-0 opacity-0 pointer-events-none',
                    'group-hover/nav:max-h-96 group-hover/nav:opacity-100 group-hover/nav:pointer-events-auto',
                    'group-focus-within/nav:max-h-96 group-focus-within/nav:opacity-100 group-focus-within/nav:pointer-events-auto',
                    (isDesktopExpanded || isChildActive) && 'max-h-96 opacity-100 pointer-events-auto'
                  )}
                >
                  {item.children.map((child) => {
                    const isChildCurrent = isPathActive(child.href)
                    const ChildIcon = child.icon

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "group flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                          isChildCurrent
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : isLightTheme
                              ? "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                              : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-200"
                        )}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{localizeSidebarLabel(child.title, language)}</span>
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="px-3 pb-3">
        {canAccessStarshipAgent && !canAccessAgentsLegion ? (
          <div
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-sm text-slate-400",
              effectiveCollapsed && "justify-center px-2"
            )}
            title={effectiveCollapsed ? text('AI Agents Legion（仅高管可见）', 'AI Agents Legion (executive only)') : undefined}
          >
            <LockKeyhole className="h-5 w-5 shrink-0" />
            {!effectiveCollapsed && (
              <span className="whitespace-nowrap">
                {text('AI Agents Legion（仅高管）', 'AI Agents Legion (executive only)')}
              </span>
            )}
          </div>
        ) : null}

        {!effectiveCollapsed && (
          <p className="mt-2 px-1 text-[11px] leading-5 text-slate-400">
            {text('权限同步 Access Synced', 'Access Synced')}
          </p>
        )}
      </div>

      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!effectiveCollapsed)}
          className={cn(
            "min-h-11 w-full flex items-center justify-center",
            isLightTheme
              ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
            effectiveCollapsed && "px-2"
          )}
        >
          {effectiveCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">{text('收起侧边栏', 'Collapse sidebar')}</span>
            </>
          )}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-[100dvh] shrink-0 flex-col overflow-y-auto overscroll-contain border-r shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl lg:flex transition-all duration-300",
          isLightTheme
            ? "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,247,255,0.95)_56%,rgba(233,243,255,0.98)_100%)]"
            : "border-white/10 bg-[linear-gradient(180deg,rgba(4,14,39,0.94)_0%,rgba(7,23,58,0.9)_56%,rgba(3,10,29,0.94)_100%)]",
          effectiveCollapsed ? "w-[4rem]" : "w-[14rem]"
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={text('打开导航菜单', 'Open navigation')}
            className={cn(
              'mr-2 h-11 w-11',
              isLightTheme
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'text-white hover:bg-white/10 hover:text-white'
            )}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            'w-64 p-0',
            isLightTheme
              ? 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,247,255,0.95)_56%,rgba(233,243,255,0.98)_100%)] text-slate-900'
              : 'border-white/10 bg-[linear-gradient(180deg,rgba(4,14,39,0.96)_0%,rgba(7,23,58,0.95)_56%,rgba(3,10,29,0.96)_100%)] text-white'
          )}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3">
                <CompanyLogo iconClassName="h-8 w-8 rounded-lg p-0.5" />
                <div className="min-w-0">
                  <p className={cn('truncate text-sm font-semibold', isLightTheme ? 'text-slate-900' : undefined)}>
                    {language === 'en' ? COMPANY_NAME_EN : COMPANY_NAME_ZH}
                  </p>
                  <p className={cn('truncate text-[10px]', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                    {COMPANY_NAME_EN}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="mx-4 w-auto" />
            
            <nav className="flex-1 px-3 py-4 space-y-1">
              {filteredNavItems.map((item) => {
                const isChildActive = (item.children || []).some((child) => isPathActive(child.href))
                const isActive = isPathActive(item.href) || isChildActive
                const hasChildren = Boolean(item.children && item.children.length > 0)
                const isGroupExpanded = isMobileGroupExpanded(item)
                const Icon = item.icon
                
                return (
                  <div key={item.href} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex min-h-11 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-r from-[#4f7ceb] to-[#84a7ff] text-white shadow-md shadow-[#4f7ceb]/30"
                              : isLightTheme
                                ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{localizeSidebarLabel(item.title, language)}</span>
                        </Link>
                      </SheetClose>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleMobileGroup(item.href)}
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-lg border transition',
                            isLightTheme
                              ? 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                          )}
                          aria-label={
                            isGroupExpanded
                              ? text(
                                  `收起${localizeSidebarLabel(item.title, language)}二级菜单`,
                                  `Collapse ${localizeSidebarLabel(item.title, language)} submenu`
                                )
                              : text(
                                  `展开${localizeSidebarLabel(item.title, language)}二级菜单`,
                                  `Expand ${localizeSidebarLabel(item.title, language)} submenu`
                                )
                          }
                        >
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              isGroupExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && isGroupExpanded ? (
                      <div className="space-y-1 pl-5">
                        {(item.children || []).map((child) => {
                          const isChildCurrent = isPathActive(child.href)
                          const ChildIcon = child.icon

                          return (
                            <SheetClose asChild key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                                  isChildCurrent
                                    ? "border border-primary/35 bg-primary/15 text-primary"
                                    : isLightTheme
                                      ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5" />
                                <span>{localizeSidebarLabel(child.title, language)}</span>
                              </Link>
                            </SheetClose>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>

            <div className="px-3 pb-4">
              {canAccessStarshipAgent && !canAccessAgentsLegion ? (
                <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2.5 text-sm text-slate-400">
                  <LockKeyhole className="w-5 h-5" />
                  <span>{text('AI Agents Legion（仅高管）', 'AI Agents Legion (executive only)')}</span>
                </div>
              ) : null}
              <p className="mt-2 px-1 text-[11px] leading-5 text-slate-400">
                {text('权限同步 Access Synced', 'Access Synced')}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
