'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, UserCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth'

interface UserAccountRow {
  id: string
  name: string
  employeeId: string
  role: string
  scopePath: string[]
  mobileMasked: string
  status: 'active' | 'inactive'
  updatedAt: string
}

interface AccountApiPayload {
  id?: string
  name?: string
  employeeId?: string
  role?: string
  scopePath?: string[]
  mobileMasked?: string
  status?: 'active' | 'disabled'
  updatedAt?: string
}

const toStatus = (value: unknown): 'active' | 'inactive' =>
  value === 'disabled' ? 'inactive' : 'active'

const normalizeAccountRow = (item: AccountApiPayload): UserAccountRow | null => {
  const employeeId = typeof item.employeeId === 'string' ? item.employeeId.trim() : ''
  if (!employeeId) return null
  const role = typeof item.role === 'string' ? item.role.trim() : 'manager'
  return {
    id: typeof item.id === 'string' ? item.id : employeeId,
    name: typeof item.name === 'string' ? item.name : employeeId,
    employeeId,
    role,
    scopePath: Array.isArray(item.scopePath) ? item.scopePath.map((segment) => String(segment)) : [],
    mobileMasked: typeof item.mobileMasked === 'string' ? item.mobileMasked : '未绑定',
    status: toStatus(item.status),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
  }
}

const buildAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const formatDateTime = (value: string) => {
  if (!value) return '-'
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '-'
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

const joinScope = (scopePath: string[]) => (scopePath.length > 0 ? scopePath.join(' / ') : '-')

export default function UsersPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserAccountRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    role: '',
    scopePath: '',
    mobile: '',
    password: '',
  })

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/accounts', {
        method: 'GET',
        headers: buildAuthHeaders(token),
        credentials: 'include',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `读取账号失败 (${response.status})`
        )
      }
      const items = Array.isArray(payload?.items) ? (payload.items as AccountApiPayload[]) : []
      const rows = items
        .map((item) => normalizeAccountRow(item))
        .filter(Boolean) as UserAccountRow[]
      setUsers(rows)
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取账号失败'
      toast({
        title: '读取失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return users
    return users.filter((user) => {
      const text = `${user.name} ${user.employeeId} ${user.role} ${joinScope(user.scopePath)} ${user.mobileMasked}`.toLowerCase()
      return text.includes(normalizedKeyword)
    })
  }, [keyword, users])

  const resetForm = () => {
    setForm({
      name: '',
      employeeId: '',
      role: '',
      scopePath: '',
      mobile: '',
      password: '',
    })
    setEditingEmployeeId(null)
    setIsCreating(false)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    const name = form.name.trim()
    const employeeId = form.employeeId.trim()
    const role = form.role.trim()
    const scopePath = form.scopePath.trim()
    const mobile = form.mobile.trim()
    const password = form.password.trim()

    if (!name || !employeeId || !role || (!editingEmployeeId && !mobile)) {
      toast({
        title: '信息不完整',
        description: editingEmployeeId
          ? '请填写姓名、工号和角色。'
          : '请填写姓名、工号、角色和手机号。',
      })
      return
    }

    if (!editingEmployeeId && password.length < 8) {
      toast({
        title: '密码不符合要求',
        description: '新建账号时密码至少 8 位。',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingEmployeeId) {
        const response = await fetch(`/api/auth/accounts/${encodeURIComponent(editingEmployeeId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(token),
          },
          credentials: 'include',
          body: JSON.stringify({
            name,
            role,
            scopePath,
            ...(mobile ? { mobile } : {}),
            ...(password ? { password } : {}),
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string' ? payload.message : `更新账号失败 (${response.status})`
          )
        }
        toast({
          title: '用户已更新',
          description: `${name} 的账号信息已保存。`,
        })
      } else {
        const response = await fetch('/api/auth/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(token),
          },
          credentials: 'include',
          body: JSON.stringify({
            employeeId,
            password,
            name,
            role,
            scopePath,
            mobile,
            disabled: false,
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string' ? payload.message : `创建账号失败 (${response.status})`
          )
        }
        toast({
          title: '用户已创建',
          description: `${name} 已加入用户列表。`,
        })
      }

      resetForm()
      await loadUsers()
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存账号失败',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: UserAccountRow) => {
    setEditingEmployeeId(user.employeeId)
    setIsCreating(true)
    setForm({
      name: user.name,
      employeeId: user.employeeId,
      role: user.role,
      scopePath: user.scopePath.join('/'),
      mobile: '',
      password: '',
    })
  }

  const handleToggleStatus = async (user: UserAccountRow) => {
    try {
      const response = await fetch(`/api/auth/accounts/${encodeURIComponent(user.employeeId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(token),
        },
        credentials: 'include',
        body: JSON.stringify({
          disabled: user.status === 'active',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `状态更新失败 (${response.status})`
        )
      }
      toast({
        title: '状态已更新',
        description: `${user.name} 已切换为${user.status === 'active' ? '禁用' : '活跃'}。`,
      })
      await loadUsers()
    } catch (error) {
      toast({
        title: '状态更新失败',
        description: error instanceof Error ? error.message : '更新账号状态失败',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (user: UserAccountRow) => {
    if (!window.confirm(`确认删除账号 ${user.employeeId}（${user.name}）吗？`)) return
    setPendingDeleteId(user.employeeId)
    try {
      const response = await fetch(`/api/auth/accounts/${encodeURIComponent(user.employeeId)}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
        credentials: 'include',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `删除账号失败 (${response.status})`
        )
      }
      toast({
        title: '用户已删除',
        description: `${user.name} 已从列表移除。`,
      })
      await loadUsers()
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除账号失败',
        variant: 'destructive',
      })
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="manage_users" title="当前账号无权管理用户">
        <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>账号管理 User Access</CardDescription>
              </div>
              <Button
                className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setIsCreating(true)
                  setEditingEmployeeId(null)
                  setForm({
                    name: '',
                    employeeId: '',
                    role: '',
                    scopePath: '',
                    mobile: '',
                    password: '',
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                新建用户
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索姓名、工号、角色、数据范围..."
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                />
              </div>
              <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                命中 {filteredUsers.length} 人
              </Badge>
              <Button
                variant="outline"
                className="h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  void loadUsers()
                }}
                disabled={isLoading}
              >
                {isLoading ? '刷新中...' : '刷新'}
              </Button>
            </div>

            {isCreating ? (
              <div className="mb-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-medium text-white">{editingEmployeeId ? '编辑用户' : '新建用户'}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="姓名"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={form.employeeId}
                    onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
                    placeholder="工号（如 SK00001）"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    disabled={Boolean(editingEmployeeId)}
                  />
                  <Input
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    placeholder="角色（如 director）"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={form.scopePath}
                    onChange={(event) => setForm((current) => ({ ...current, scopePath: event.target.value }))}
                    placeholder="数据范围（如 global/china/east-china）"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    value={form.mobile}
                    onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                    placeholder={editingEmployeeId ? '手机号（留空表示不修改）' : '手机号（如 13800138000）'}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder={editingEmployeeId ? '不修改密码可留空' : '设置密码（至少8位）'}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 md:col-span-2"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      void handleSubmit()
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '保存中...' : editingEmployeeId ? '保存修改' : '确认创建'}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                    onClick={resetForm}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/35">
              <table className="w-full min-w-[980px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">姓名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">工号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">手机号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">数据范围</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">更新时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3 text-slate-400">{user.employeeId}</td>
                      <td className="px-4 py-3 uppercase">{user.role}</td>
                      <td className="px-4 py-3 text-slate-300">{user.mobileMasked}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{joinScope(user.scopePath)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            user.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                          }
                        >
                          {user.status === 'active' ? '活跃' : '禁用'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{formatDateTime(user.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                            onClick={() => {
                              void handleToggleStatus(user)
                            }}
                          >
                            <UserCheck className="mr-1 h-4 w-4" />
                            {user.status === 'active' ? '禁用' : '启用'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/15 hover:text-red-100"
                            onClick={() => {
                              void handleDelete(user)
                            }}
                            disabled={pendingDeleteId === user.employeeId}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {pendingDeleteId === user.employeeId ? '删除中...' : '删除'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={9}>
                        暂无账号数据，请先创建用户或检查账号管理接口权限。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </AccessGuard>
    </DashboardLayout>
  )
}
