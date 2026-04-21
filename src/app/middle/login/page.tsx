'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'

const ALLOWED_ROLES = new Set(['manager', 'supervisor'])

const normalizeRole = (value?: string) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

export default function MiddleLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, hasHydrated, logout } = useAuthStore()
  const [employeeId, setEmployeeId] = useState('Chef')
  const [password, setPassword] = useState('12345678')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isAllowedRole = useMemo(() => ALLOWED_ROLES.has(normalizeRole(user?.role)), [user?.role])

  useEffect(() => {
    if (!hasHydrated) return
    if (isAuthenticated && isAllowedRole) {
      router.replace('/middle/')
    }
  }, [hasHydrated, isAuthenticated, isAllowedRole, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    const result = await login(employeeId.trim(), password, true)
    if (!result.success) {
      setLoading(false)
      setError(result.message || '登录失败，请重试。')
      return
    }

    const currentUser = useAuthStore.getState().user
    const role = normalizeRole(currentUser?.role)
    if (!ALLOWED_ROLES.has(role)) {
      logout()
      setLoading(false)
      setError('该账号不属于中层入口授权范围，请联系管理员。')
      return
    }

    setLoading(false)
    router.replace('/middle/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1d4d9c_0%,#0a1d46_48%,#040d24_100%)] p-4">
      <Card className="w-full max-w-md border-white/15 bg-slate-950/70 text-white backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">中层管理入口</CardTitle>
          <CardDescription className="text-slate-300">
            项目经理 / 厨师长专用
          </CardDescription>
          <p className="text-xs text-slate-400">默认账号：Chef / 12345678</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="text-sm text-slate-300">
                用户名
              </label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                autoComplete="username"
                className="h-11 border-white/20 bg-slate-900/70 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm text-slate-300">
                密码
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 border-white/20 bg-slate-900/70 text-white"
              />
            </div>
            {error ? (
              <div className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            <Button
              type="submit"
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '进入中层驾驶舱'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

