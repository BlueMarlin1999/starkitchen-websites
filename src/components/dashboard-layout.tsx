'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bot, LayoutDashboard, BadgeDollarSign, Store, Truck } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { isLocalAdminSession, useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { hasAvailableAuthService } from '@/lib/runtime-config'
import { cn } from '@/lib/utils'
import { useUIPreferences } from '@/components/ui-preference-provider'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [hasManualSidebarPreference, setHasManualSidebarPreference] = useState(false)
  const AUTO_COLLAPSE_BREAKPOINT = 900
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hasHydrated, logout, user, token } = useAuthStore()
  const { resolvedTheme, text } = useUIPreferences()
  const isLightTheme = resolvedTheme === 'light'
  const authServiceConfigured = hasAvailableAuthService()
  const allowStandaloneAdmin = isLocalAdminSession(user, token)

  const buildLoginHref = useCallback(
    (timeout?: boolean) => {
      const params = new URLSearchParams()
      if (timeout) {
        params.set('timeout', '1')
      }

      if (typeof window !== 'undefined') {
        const currentPath = `${window.location.pathname}${window.location.search}`
        if (currentPath && !currentPath.startsWith('/login')) {
          params.set('next', currentPath)
        }
      }

      const query = params.toString()
      return query ? `/login/?${query}` : '/login/'
    },
    []
  )

  useEffect(() => {
    if (!hasHydrated) return

    if (!authServiceConfigured) {
      if (isAuthenticated && !allowStandaloneAdmin) {
        logout()
      }

      if (!isAuthenticated || !allowStandaloneAdmin) {
        router.replace(buildLoginHref())
      }
      return
    }

    if (!isAuthenticated) {
      router.replace(buildLoginHref())
    }
  }, [
    allowStandaloneAdmin,
    authServiceConfigured,
    buildLoginHref,
    hasHydrated,
    isAuthenticated,
    logout,
    router,
  ])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return

    const SESSION_TIMEOUT_MS = 30 * 60 * 1000
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        logout()
        router.replace(buildLoginHref(true))
      }, SESSION_TIMEOUT_MS)
    }

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer))
    }
  }, [buildLoginHref, hasHydrated, isAuthenticated, logout, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateSidebarState = () => {
      const viewportWidth = window.innerWidth

      if (hasManualSidebarPreference) return

      setIsSidebarCollapsed(viewportWidth < AUTO_COLLAPSE_BREAKPOINT)
    }

    updateSidebarState()
    window.addEventListener('resize', updateSidebarState)

    return () => {
      window.removeEventListener('resize', updateSidebarState)
    }
  }, [AUTO_COLLAPSE_BREAKPOINT, hasManualSidebarPreference])

  const handleSidebarCollapsed = (value: boolean) => {
    setHasManualSidebarPreference(true)
    setIsSidebarCollapsed(value)
  }

  if (!hasHydrated) {
    return (
      <div
        className={cn(
          'flex min-h-screen min-h-[100dvh] items-center justify-center',
          isLightTheme
            ? 'bg-[radial-gradient(circle_at_top,rgba(123,167,255,0.2),transparent_34%),linear-gradient(180deg,#f3f7ff_0%,#e8f0ff_45%,#d9e8ff_100%)] text-slate-900'
            : 'bg-[radial-gradient(circle_at_top,_rgba(126,167,255,0.16),_transparent_30%),linear-gradient(180deg,_#04102a_0%,_#0b2450_45%,_#123a74_100%)] text-white'
        )}
      >
        <div
          className={cn(
            'rounded-2xl border px-6 py-4 text-sm backdrop-blur',
            isLightTheme
              ? 'border-slate-200 bg-white/80 text-slate-600'
              : 'border-white/10 bg-white/[0.06] text-slate-300'
          )}
        >
          {text('正在验证登录状态...', 'Verifying sign-in status...')}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          'flex min-h-screen min-h-[100dvh] items-center justify-center px-6',
          isLightTheme
            ? 'bg-[radial-gradient(circle_at_top,rgba(123,167,255,0.2),transparent_34%),linear-gradient(180deg,#f3f7ff_0%,#e8f0ff_45%,#d9e8ff_100%)] text-slate-900'
            : 'bg-[radial-gradient(circle_at_top,_rgba(126,167,255,0.16),_transparent_30%),linear-gradient(180deg,_#04102a_0%,_#0b2450_45%,_#123a74_100%)] text-white'
        )}
      >
        <div
          className={cn(
            'max-w-md rounded-2xl border p-6 text-center backdrop-blur',
            isLightTheme ? 'border-slate-200 bg-white/85' : 'border-white/10 bg-slate-950/55'
          )}
        >
          <p className={cn('text-base', isLightTheme ? 'text-slate-700' : 'text-slate-200')}>
            {text('当前未登录，无法访问驾驶舱内容。', 'You are not signed in and cannot access the cockpit.')}
          </p>
          <p className={cn('mt-2 text-sm', isLightTheme ? 'text-slate-500' : 'text-slate-400')}>
            {text('跳转登录中...', 'Redirecting to login...')}
          </p>
          <Button asChild className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login/" className="inline-block">
              {text('前往登录', 'Go to sign in')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-screen min-h-[100dvh] overflow-x-hidden',
        isLightTheme
          ? 'bg-[linear-gradient(180deg,#f4f8ff_0%,#eaf2ff_38%,#deeaff_100%)] text-slate-900'
          : 'bg-[linear-gradient(180deg,_#02091d_0%,_#061739_38%,_#08204a_100%)] text-white'
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            'absolute inset-0',
            isLightTheme
              ? 'bg-[radial-gradient(circle_at_10%_0%,rgba(120,172,255,0.24),transparent_34%),radial-gradient(circle_at_88%_16%,rgba(143,168,255,0.18),transparent_38%),radial-gradient(circle_at_30%_90%,rgba(104,161,255,0.16),transparent_47%)]'
              : 'bg-[radial-gradient(circle_at_10%_0%,rgba(140,196,255,0.24),transparent_32%),radial-gradient(circle_at_88%_16%,rgba(141,111,255,0.2),transparent_36%),radial-gradient(circle_at_30%_90%,rgba(96,154,255,0.18),transparent_45%)]'
          )}
        />
        <div
          className={cn(
            'absolute -bottom-36 left-[12%] h-[22rem] w-[60rem] rotate-[-8deg] rounded-[999px] blur-3xl',
            isLightTheme
              ? 'bg-[conic-gradient(from_150deg_at_50%_50%,rgba(95,144,255,0)_0deg,rgba(140,195,255,0.45)_94deg,rgba(160,145,255,0.38)_160deg,rgba(171,229,255,0.45)_216deg,rgba(95,144,255,0)_360deg)] opacity-55'
              : 'bg-[conic-gradient(from_150deg_at_50%_50%,rgba(118,164,255,0)_0deg,rgba(128,214,255,0.75)_92deg,rgba(140,108,255,0.8)_156deg,rgba(170,242,255,0.7)_212deg,rgba(118,164,255,0)_360deg)] opacity-60'
          )}
        />
        <div
          className={cn(
            'absolute inset-0 bg-[linear-gradient(rgba(146,172,230,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(146,172,230,0.08)_1px,transparent_1px)] bg-[size:78px_78px]',
            isLightTheme ? 'opacity-[0.06]' : 'opacity-[0.07]'
          )}
        />
      </div>

      <div className="relative z-20">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={handleSidebarCollapsed} 
        />
      </div>
      
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden px-1.5 py-3 pb-[5.8rem] sm:px-2 lg:px-2.5 lg:py-3 lg:pb-3 xl:px-2.5 2xl:px-3">
          {children}
        </main>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-2 backdrop-blur lg:hidden',
          isLightTheme
            ? 'border-slate-200 bg-[linear-gradient(180deg,rgba(250,252,255,0.96)_0%,rgba(241,247,255,0.98)_100%)] shadow-[0_-10px_28px_rgba(107,143,201,0.2)]'
            : 'border-white/10 bg-[linear-gradient(180deg,rgba(8,22,52,0.96)_0%,rgba(6,18,45,0.98)_100%)] shadow-[0_-12px_36px_rgba(2,8,24,0.5)]'
        )}
      >
        <div className="grid grid-cols-5 gap-1">
          {[
            { href: '/dashboard/', label: text('仪表盘', 'Dashboard'), icon: LayoutDashboard, match: /^\/dashboard\/?$/ },
            { href: '/dashboard/stores/', label: text('项目', 'Projects'), icon: Store, match: /^\/dashboard\/stores(\/|$)/ },
            { href: '/dashboard/supply/', label: text('供应链', 'Supply'), icon: Truck, match: /^\/dashboard\/supply(\/|$)|^\/dashboard\/inventory(\/|$)/ },
            { href: '/dashboard/finance/', label: text('财务', 'Finance'), icon: BadgeDollarSign, match: /^\/dashboard\/finance(\/|$)/ },
            { href: '/dashboard/agents/', label: 'AI', icon: Bot, match: /^\/dashboard\/agents(\/|$)|^\/ai\/agent(\/|$)|^\/dashboard\/chat(\/|$)|^\/dashboard\/ai(\/|$)/ },
          ].map((item) => {
            const Icon = item.icon
            const isActive = Boolean(pathname && item.match.test(pathname))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center rounded-xl px-1.5 text-[10px] transition-colors',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : isLightTheme
                      ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
