'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { StarryBackground } from '@/components/starry-background'
import { useAuthStore } from '@/store/auth'
import { CompanyLogo } from '@/components/company-logo'
import { PRODUCT_NAME_ZH } from '@/lib/brand'
import { hasAvailableAuthService } from '@/lib/runtime-config'

const LOGIN_COMPANY_NAME_ZH = '星座厨房服务集团'
const LOGIN_COMPANY_NAME_EN = 'Star Kitchen Hospitality Group'
const MIDDLE_MANAGER_ROLES = new Set(['manager', 'supervisor'])

const normalizeRole = (value?: string) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const resolveDefaultPathByRole = (role?: string) =>
  MIDDLE_MANAGER_ROLES.has(normalizeRole(role)) ? '/middle/' : '/dashboard/'

const resolvePostLoginPath = (nextPath: string | null, role?: string) => {
  if (!nextPath) return resolveDefaultPathByRole(role)
  const normalized = nextPath.trim()
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return resolveDefaultPathByRole(role)
  if (normalized.startsWith('/login')) return resolveDefaultPathByRole(role)
  return normalized
}

const LoginNotice = ({ content, className }: { content: string; className: string }) => (
  <div className={className}>{content}</div>
)

const LoginHeader = () => (
  <CardHeader className="space-y-4 text-center">
    <div className="flex justify-center">
      <CompanyLogo variant="full" logoClassName="h-28" />
    </div>
    <div>
      <CardTitle className="text-2xl font-bold text-white">{PRODUCT_NAME_ZH}</CardTitle>
      <p className="mt-2 text-sm text-slate-300">{LOGIN_COMPANY_NAME_ZH}</p>
      <p className="mt-1 text-xs text-slate-400">{LOGIN_COMPANY_NAME_EN}</p>
    </div>
  </CardHeader>
)

const LoginCredentialFields = ({
  employeeId,
  setEmployeeId,
  password,
  setPassword,
  remember,
  setRemember,
  hasError,
}: {
  employeeId: string
  setEmployeeId: (value: string) => void
  password: string
  setPassword: (value: string) => void
  remember: boolean
  setRemember: (value: boolean) => void
  hasError: boolean
}) => (
  <div className="space-y-3">
    <div className="space-y-1.5">
      <label htmlFor="employeeId" className="text-sm text-slate-300">
        用户名 / 手机号 Username / Mobile
      </label>
      <Input
        id="employeeId"
        value={employeeId}
        onChange={(event) => setEmployeeId(event.target.value)}
        placeholder="请输入用户名或手机号"
        autoComplete="username"
        aria-invalid={hasError}
        className="h-11 border-white/15 bg-slate-900/60 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary aria-invalid:border-red-400/70 aria-invalid:ring-red-400/40"
      />
    </div>
    <div className="space-y-1.5">
      <label htmlFor="password" className="text-sm text-slate-300">
        密码 Password
      </label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="请输入密码"
        autoComplete="current-password"
        aria-invalid={hasError}
        className="h-11 border-white/15 bg-slate-900/60 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary aria-invalid:border-red-400/70 aria-invalid:ring-red-400/40"
      />
    </div>
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-300">
      <Checkbox
        checked={remember}
        onCheckedChange={(checked) => setRemember(Boolean(checked))}
        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
      记住用户名 Remember Username
    </label>
  </div>
)

const LoginSubmitButton = ({ isLoading }: { isLoading: boolean }) => (
  <Button
    type="submit"
    disabled={isLoading}
    className="h-11 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
  >
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        登录中...
      </>
    ) : (
      <span className="text-base leading-tight">
        欢迎登船！
        <span className="mt-1 block text-sm">Welcome aboard!</span>
      </span>
    )}
  </Button>
)

const LoginFooter = () => (
  <div className="mt-6 text-center">
    <p className="text-xs text-slate-500">© 2026 {LOGIN_COMPANY_NAME_EN}</p>
    <p className="mt-1 text-xs text-slate-600">{LOGIN_COMPANY_NAME_ZH}</p>
  </div>
)

const LoginPageShell = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center overflow-hidden">
    <StarryBackground />
    <div className="relative z-10 w-full max-w-md px-4">{children}</div>
  </div>
)

const LoginCardView = ({
  error,
  isSessionTimeout,
  authServiceConfigured,
  handleLogin,
  employeeId,
  setEmployeeId,
  password,
  setPassword,
  remember,
  setRemember,
  isLoading,
}: {
  error: string
  isSessionTimeout: boolean
  authServiceConfigured: boolean
  handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>
  employeeId: string
  setEmployeeId: (value: string) => void
  password: string
  setPassword: (value: string) => void
  remember: boolean
  setRemember: (value: boolean) => void
  isLoading: boolean
}) => (
  <Card className="border-white/10 bg-slate-950/40 text-white shadow-[0_24px_80px_rgba(2,8,20,0.45)] backdrop-blur-xl">
    <LoginHeader />
    <CardContent>
      <form className="space-y-6" onSubmit={handleLogin}>
        {error ? (
          <LoginNotice
            content={error}
            className="rounded-lg bg-red-500/10 py-2 text-center text-sm text-red-400"
          />
        ) : null}
        {isSessionTimeout ? (
          <LoginNotice
            content="会话已超时，请重新登录 Session expired."
            className="rounded-lg bg-amber-500/10 py-2 text-center text-sm text-amber-200"
          />
        ) : null}
        {!authServiceConfigured ? (
          <LoginNotice
            content="当前环境未开放登录服务，请联系管理员检查认证配置。"
            className="rounded-lg bg-amber-500/10 py-2 text-center text-sm text-amber-200"
          />
        ) : null}
        <LoginCredentialFields
          employeeId={employeeId}
          setEmployeeId={setEmployeeId}
          password={password}
          setPassword={setPassword}
          remember={remember}
          setRemember={setRemember}
          hasError={Boolean(error)}
        />
        <LoginSubmitButton isLoading={isLoading} />
        <p className="text-center text-xs text-slate-500">管理员分配账号 Admin managed.</p>
      </form>
      <LoginFooter />
    </CardContent>
  </Card>
)

const useLoginRedirectGuard = ({
  hasHydrated,
  rememberedEmployeeId,
  isAuthenticated,
  nextPath,
  userRole,
  router,
  setEmployeeId,
  setRemember,
}: {
  hasHydrated: boolean
  rememberedEmployeeId: string
  isAuthenticated: boolean
  nextPath: string | null
  userRole?: string
  router: ReturnType<typeof useRouter>
  setEmployeeId: (value: string) => void
  setRemember: (value: boolean) => void
}) => {
  useEffect(() => {
    if (!hasHydrated) return
    if (rememberedEmployeeId) {
      setEmployeeId(rememberedEmployeeId)
      setRemember(true)
    }
    if (isAuthenticated) {
      router.push(resolvePostLoginPath(nextPath, userRole))
    }
  }, [
    hasHydrated,
    isAuthenticated,
    nextPath,
    rememberedEmployeeId,
    router,
    setEmployeeId,
    setRemember,
    userRole,
  ])
}

const createLoginSubmitHandler = ({
  login,
  employeeId,
  password,
  remember,
  nextPath,
  router,
  setError,
  setIsLoading,
}: {
  login: (employeeId: string, password: string, remember: boolean) => Promise<{ success: boolean; message?: string }>
  employeeId: string
  password: string
  remember: boolean
  nextPath: string | null
  router: ReturnType<typeof useRouter>
  setError: (value: string) => void
  setIsLoading: (value: boolean) => void
}) => {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const normalizedEmployeeId = employeeId.trim()
    if (!normalizedEmployeeId || !password) {
      setError('请输入用户名/手机号和密码')
      return
    }
    try {
      setIsLoading(true)
      const result = await login(normalizedEmployeeId, password, remember)
      if (result.success) {
        const role = useAuthStore.getState().user?.role
        router.push(resolvePostLoginPath(nextPath, role))
      } else {
        setError(result.message || '用户名或密码错误，请重试')
      }
    } catch {
      setError('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, hasHydrated, rememberedEmployeeId, user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const isSessionTimeout = searchParams.get('timeout') === '1'
  const authServiceConfigured = hasAvailableAuthService()
  const nextPath = searchParams.get('next')
  useLoginRedirectGuard({
    hasHydrated,
    rememberedEmployeeId,
    isAuthenticated,
    nextPath,
    userRole: user?.role,
    router,
    setEmployeeId,
    setRemember,
  })
  const handleLogin = createLoginSubmitHandler({
    login,
    employeeId,
    password,
    remember,
    nextPath,
    router,
    setError,
    setIsLoading,
  })
  const cardProps = { error, isSessionTimeout, authServiceConfigured, handleLogin, employeeId, setEmployeeId, password, setPassword, remember, setRemember, isLoading }

  return (
    <LoginPageShell>
      <LoginCardView {...cardProps} />
    </LoginPageShell>
  )
}
