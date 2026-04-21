'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Check,
  Bell, 
  ChevronRight,
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Search,
  Globe2,
  Monitor,
  Moon,
  Sun,
  SunMoon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { getRoleConfig } from '@/lib/access'
import { COMPANY_NAME_EN, COMPANY_NAME_ZH } from '@/lib/brand'
import { ProfileEditorSheet } from '@/components/profile-editor-sheet'
import { matchSearchTargets } from '@/lib/global-search'
import { cn } from '@/lib/utils'
import { UIThemeMode, useUIPreferences } from '@/components/ui-preference-provider'

interface NotificationItem {
  id: string
  title: string
  detail: string
  time: string
  read: boolean
}

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { language, themeMode, resolvedTheme, setThemeMode, toggleLanguage, text } = useUIPreferences()
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'system-deploy',
      title: '系统更新完成',
      detail: `${COMPANY_NAME_EN} 驾驶舱已成功部署`,
      time: '10 分钟前',
      read: false,
    },
    {
      id: 'user-register',
      title: '新用户注册',
      detail: '李四刚刚完成了账号注册',
      time: '1 小时前',
      read: false,
    },
    {
      id: 'report-ready',
      title: '月度报表生成',
      detail: `${COMPANY_NAME_ZH} 3 月份财务报表已就绪`,
      time: '3 小时前',
      read: false,
    },
  ])
  const roleConfig = getRoleConfig(user?.role)
  const displayName = user?.nickname?.trim() || user?.name || '用户'
  const unreadCount = notifications.filter((item) => !item.read).length
  const matchedSearchResults = useMemo(() => matchSearchTargets(searchQuery), [searchQuery])
  const isLightTheme = resolvedTheme === 'light'
  const themeOptions: Array<{ mode: UIThemeMode; label: string; icon: typeof Monitor }> = [
    { mode: 'system', label: text('跟随系统', 'System'), icon: Monitor },
    { mode: 'dark', label: text('深色', 'Dark'), icon: Moon },
    { mode: 'light', label: text('浅色', 'Light'), icon: Sun },
  ]
  const activeThemeLabel = themeOptions.find((item) => item.mode === themeMode)?.label || text('跟随系统', 'System')

  const handleLogout = () => {
    logout()
    router.push('/login/')
  }

  const getInitials = (name: string) => {
    return name?.slice(0, 2).toUpperCase() || 'U'
  }

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.some((item) => !item.read)
        ? current.map((item) => ({ ...item, read: true }))
        : current
    )
  }

  const handleNotificationOpenChange = (open: boolean) => {
    if (open) {
      markAllNotificationsRead()
    }
  }

  const openSearchTarget = (href?: string) => {
    if (!href) return
    setIsSearchPanelOpen(false)
    setIsMobileSearchOpen(false)
    router.push(href)
  }

  const handleSearchSubmit = () => {
    if (matchedSearchResults.length > 0) {
      openSearchTarget(matchedSearchResults[0].href)
      return
    }
    setIsSearchPanelOpen(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      const withCommand = event.metaKey || event.ctrlKey
      if (!withCommand || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      setIsMobileSearchOpen(true)
      setIsSearchPanelOpen(true)
      window.setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b shadow-[0_8px_30px_rgba(3,9,23,0.18)] backdrop-blur-xl',
        isLightTheme
          ? 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(242,247,255,0.9)_100%)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(12,28,66,0.9)_0%,rgba(9,22,53,0.82)_100%)]'
      )}
    >
      <div className="flex h-14 items-center justify-between px-2.5 lg:px-3.5 xl:px-4">
        {/* 左侧搜索 */}
        <div className="flex min-w-0 flex-1 items-center max-w-[20rem] lg:max-w-[24rem] xl:max-w-[28rem]">
          <div className="relative hidden w-full sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={text('搜索门店、报表、经营指标...', 'Search stores, reports, and KPI metrics...')}
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setIsSearchPanelOpen(true)
              }}
              onFocus={() => setIsSearchPanelOpen(true)}
              onBlur={() => {
                setTimeout(() => setIsSearchPanelOpen(false), 120)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSearchSubmit()
                }
                if (event.key === 'Escape') {
                  setIsSearchPanelOpen(false)
                }
              }}
              className={cn(
                'pl-10',
                isLightTheme
                  ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-primary focus:ring-primary'
                  : 'border-[#88acff]/25 bg-[#0a1b44]/65 text-white placeholder:text-slate-400 focus:border-[#8cb4ff] focus:ring-[#8cb4ff]'
              )}
            />
            <span
              className={cn(
                'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px]',
                isLightTheme
                  ? 'border-slate-200 bg-slate-100 text-slate-500'
                  : 'border-white/10 bg-white/[0.08] text-slate-300'
              )}
            >
              Ctrl/⌘K
            </span>
            {isSearchPanelOpen && searchQuery.trim().length > 0 && (
              <div
                className={cn(
                  'absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 rounded-2xl border p-2 shadow-[0_16px_40px_rgba(4,10,24,0.28)] backdrop-blur-xl',
                  isLightTheme
                    ? 'border-slate-200 bg-white/95'
                    : 'border-white/10 bg-[#071633]/95'
                )}
              >
                {matchedSearchResults.length > 0 ? (
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {matchedSearchResults.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          openSearchTarget(target.href)
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
                          isLightTheme ? 'hover:bg-slate-100' : 'hover:bg-white/[0.08]'
                        )}
                      >
                        <div>
                          <p className={cn('text-sm font-medium', isLightTheme ? 'text-slate-900' : 'text-white')}>
                            {target.title}
                          </p>
                          <p className={cn('mt-1 text-xs', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                            {target.subtitle}
                          </p>
                        </div>
                        <ChevronRight className={cn('h-4 w-4', isLightTheme ? 'text-slate-400' : 'text-slate-500')} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={cn('rounded-xl px-3 py-3 text-sm', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                    {text('未命中结果', 'No matches')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧用户菜单 */}
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-11 w-11 border border-transparent sm:hidden',
              isLightTheme
                ? 'text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-300 hover:border-white/15 hover:bg-white/[0.08] hover:text-white'
            )}
            aria-label={text('打开搜索', 'Open search')}
            onClick={() => setIsMobileSearchOpen((current) => !current)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className={cn(
              'min-h-11 gap-1.5 rounded-xl border border-transparent px-2.5',
              isLightTheme
                ? 'text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white'
            )}
            title={text('切换中英文', 'Toggle language')}
            aria-label={text('切换中英文', 'Toggle language')}
          >
            <Globe2 className="h-4 w-4" />
            <span className="text-xs font-semibold">{language === 'en' ? 'EN' : '中'}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'min-h-11 gap-1.5 rounded-xl border border-transparent px-2.5',
                  isLightTheme
                    ? 'text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white'
                )}
                title={text('主题模式', 'Theme mode')}
                aria-label={text('主题模式', 'Theme mode')}
              >
                <SunMoon className="h-4 w-4" />
                <span className="hidden text-xs font-medium xl:inline">{activeThemeLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{text('主题模式', 'Theme mode')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themeOptions.map((option) => {
                const Icon = option.icon
                const active = option.mode === themeMode
                return (
                  <DropdownMenuItem
                    key={option.mode}
                    className="cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault()
                      setThemeMode(option.mode)
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{option.label}</span>
                    {active ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 通知按钮 */}
          <DropdownMenu onOpenChange={handleNotificationOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'relative h-11 w-11 border border-transparent',
                  isLightTheme
                    ? 'text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 hover:border-white/15 hover:bg-white/[0.08] hover:text-white'
                )}
                aria-label={text('查看通知', 'View notifications')}
                onClick={markAllNotificationsRead}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{text('通知', 'Notifications')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex cursor-pointer flex-col items-start py-3"
                  >
                    <span className={item.read ? 'font-medium text-slate-200' : 'font-semibold text-white'}>
                      {item.title}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">{item.detail}</span>
                    <span className="mt-1 text-xs text-slate-500">{item.time}</span>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer justify-center text-primary"
                onSelect={(event) => {
                  event.preventDefault()
                  markAllNotificationsRead()
                }}
              >
                {text('全部标记为已读', 'Mark all as read')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'min-h-11 flex items-center gap-2 rounded-xl border border-transparent px-2',
                  isLightTheme
                    ? 'text-slate-900 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-white hover:border-white/15 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-[#4f7ceb] to-[#84a7ff] text-sm text-white">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden 2xl:flex flex-col items-start">
                  <span className={cn('text-sm font-medium', isLightTheme ? 'text-slate-900' : 'text-white')}>
                    {displayName}
                  </span>
                  <span className={cn('text-xs', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                    {roleConfig.label}
                  </span>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 md:block" />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{text('我的账号', 'My account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                    {roleConfig.label}
                  </Badge>
                  <p className="mt-2 px-2 text-xs leading-5 text-slate-500">
                    {text('权限范围', 'Scope')}: {roleConfig.dataGranularity}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsProfileEditorOpen(true)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  {text('个人资料', 'Profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault()
                    router.push('/dashboard/settings/')
                  }}
                >
                <Settings className="mr-2 h-4 w-4" />
                {text('账号设置', 'Account settings')}
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {text('退出登录', 'Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isMobileSearchOpen && (
        <div className="border-t border-white/10 px-4 pb-3 pt-2 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              placeholder={text('搜索门店、报表、经营指标...', 'Search stores, reports, and KPI metrics...')}
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setIsSearchPanelOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSearchSubmit()
                }
              }}
              className={cn(
                'h-11 pl-10',
                isLightTheme
                  ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-primary focus:ring-primary'
                  : 'border-[#88acff]/25 bg-[#0a1b44]/65 text-white placeholder:text-slate-400 focus:border-[#8cb4ff] focus:ring-[#8cb4ff]'
              )}
            />
          </div>
          {searchQuery.trim().length > 0 ? (
            <div
              className={cn(
                'mt-2 rounded-2xl border p-2 shadow-[0_16px_40px_rgba(4,10,24,0.28)] backdrop-blur-xl',
                isLightTheme ? 'border-slate-200 bg-white/95' : 'border-white/10 bg-[#071633]/95'
              )}
            >
              {matchedSearchResults.length > 0 ? (
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {matchedSearchResults.map((target) => (
                    <button
                      key={`mobile-${target.id}`}
                      type="button"
                      onClick={() => openSearchTarget(target.href)}
                      className={cn(
                        'min-h-11 w-full rounded-xl px-3 py-2 text-left transition',
                        isLightTheme ? 'hover:bg-slate-100' : 'hover:bg-white/[0.08]'
                      )}
                    >
                      <p className={cn('text-sm font-medium', isLightTheme ? 'text-slate-900' : 'text-white')}>
                        {target.title}
                      </p>
                      <p className={cn('mt-1 text-xs', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                        {target.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={cn('rounded-xl px-3 py-3 text-sm', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
                  {text('未命中结果', 'No matches')}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
      <ProfileEditorSheet open={isProfileEditorOpen} onOpenChange={setIsProfileEditorOpen} />
    </header>
  )
}
