'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserRole, hasPermission, normalizeRole } from '@/lib/access'
import { isStrictLiveMode } from '@/lib/live-mode'
import {
  createOaContact,
  createOaOrgUnit,
  deleteOaContact,
  deleteOaOrgUnit,
  fetchOaContacts,
  fetchOaOrgUnits,
  OaActorContext,
  OaContact,
  OaOrgUnit,
  syncOaContactsFromGaia,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { ArrowLeft, Building2, Plus, RefreshCw, Trash2, UserPlus } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const countDirectChildren = (orgUnits: OaOrgUnit[], parentId: string) => orgUnits.filter((item) => item.parentId === parentId).length
const DIRECTORY_ADMIN_ROLES = new Set<UserRole>(['ceo', 'coo', 'vp', 'director'])

const canManageDirectoryByRole = (role: UserRole) =>
  DIRECTORY_ADMIN_ROLES.has(role) || hasPermission(role, 'manage_users') || hasPermission(role, 'manage_access_control')

export default function OaContactsPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )
  const userRole = useMemo(() => normalizeRole(user?.role), [user?.role])
  const canManageDirectory = useMemo(() => canManageDirectoryByRole(userRole), [userRole])
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])

  const [orgUnits, setOrgUnits] = useState<OaOrgUnit[]>([])
  const [contacts, setContacts] = useState<OaContact[]>([])
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [syncSummary, setSyncSummary] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [gaiaSource, setGaiaSource] = useState<'auto' | 'gaia-api'>('gaia-api')
  const [strictRemote, setStrictRemote] = useState(strictLiveMode)

  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgParentId, setNewOrgParentId] = useState('')
  const [newOrgManagerId, setNewOrgManagerId] = useState('')

  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newContactTitle, setNewContactTitle] = useState('')
  const [newContactOrgId, setNewContactOrgId] = useState('')
  const [newContactMobile, setNewContactMobile] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactWecomUserId, setNewContactWecomUserId] = useState('')
  const [newContactFeishuUserId, setNewContactFeishuUserId] = useState('')
  const [newContactFeishuOpenId, setNewContactFeishuOpenId] = useState('')

  const loadDirectory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orgItems, contactItems] = await Promise.all([
        fetchOaOrgUnits(token, actor),
        fetchOaContacts({ search: '', orgUnitId: '' }, token, actor),
      ])
      setOrgUnits(orgItems)
      setContacts(contactItems)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取通讯录失败')
    } finally {
      setLoading(false)
    }
  }, [actor, token])

  useEffect(() => {
    void loadDirectory()
  }, [loadDirectory])

  const orgNameMap = useMemo(
    () => new Map(orgUnits.map((item) => [item.id, item.name])),
    [orgUnits]
  )

  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (orgFilter !== 'all' && contact.orgUnitId !== orgFilter) return false
      if (!keyword) return true
      const merged = [
        contact.employeeId,
        contact.name,
        contact.title,
        contact.mobile,
        contact.email,
        contact.wecomUserId,
        contact.feishuUserId,
        contact.feishuOpenId,
      ]
        .join(' ')
        .toLowerCase()
      return merged.includes(keyword)
    })
  }, [contacts, orgFilter, search])

  const handleCreateOrg = async () => {
    if (!canManageDirectory) return
    const name = newOrgName.trim()
    if (!name) {
      setError('请输入组织名称')
      return
    }
    try {
      await createOaOrgUnit(
        {
          name,
          parentId: newOrgParentId || undefined,
          managerEmployeeId: newOrgManagerId || undefined,
        },
        token,
        actor
      )
      setNewOrgName('')
      setNewOrgParentId('')
      setNewOrgManagerId('')
      await loadDirectory()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建组织失败')
    }
  }

  const handleDeleteOrg = async (orgUnit: OaOrgUnit) => {
    if (!canManageDirectory) return
    if (!window.confirm(`确认删除组织「${orgUnit.name}」吗？`)) return
    try {
      await deleteOaOrgUnit(orgUnit.id, token, actor)
      await loadDirectory()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除组织失败')
    }
  }

  const handleCreateContact = async () => {
    if (!canManageDirectory) return
    const employeeId = newEmployeeId.trim()
    const name = newContactName.trim()
    if (!employeeId || !name) {
      setError('联系人工号和姓名必填')
      return
    }
    try {
      await createOaContact(
        {
          employeeId,
          name,
          title: newContactTitle || undefined,
          orgUnitId: newContactOrgId || undefined,
          mobile: newContactMobile || undefined,
          email: newContactEmail || undefined,
          wecomUserId: newContactWecomUserId || undefined,
          feishuUserId: newContactFeishuUserId || undefined,
          feishuOpenId: newContactFeishuOpenId || undefined,
          status: 'active',
        },
        token,
        actor
      )
      setNewEmployeeId('')
      setNewContactName('')
      setNewContactTitle('')
      setNewContactOrgId('')
      setNewContactMobile('')
      setNewContactEmail('')
      setNewContactWecomUserId('')
      setNewContactFeishuUserId('')
      setNewContactFeishuOpenId('')
      await loadDirectory()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建联系人失败')
    }
  }

  const handleDeleteContact = async (contact: OaContact) => {
    if (!canManageDirectory) return
    if (!window.confirm(`确认删除联系人「${contact.name} (${contact.employeeId})」吗？`)) return
    try {
      await deleteOaContact(contact.employeeId, token, actor)
      await loadDirectory()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除联系人失败')
    }
  }

  const handleSyncGaia = async () => {
    if (!canManageDirectory) return
    setIsSyncing(true)
    setError('')
    setSyncSummary('')
    try {
      const result = await syncOaContactsFromGaia(
        {
          source: gaiaSource,
          strictRemote: strictLiveMode ? true : strictRemote,
          onlyActive: false,
        },
        token,
        actor
      )
      const warningSummary =
        result.warnings && result.warnings.length
          ? `，告警 ${result.warnings.length} 条（${result.warnings[0]}）`
          : ''
      setSyncSummary(
        `同步完成(${result.source}/${result.mode || 'seed'})：导入 ${result.imported}，新增 ${result.created}，更新 ${result.updated}，新增组织 ${result.orgCreated}${warningSummary}`
      )
      await loadDirectory()
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : '盖雅同步失败')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权访问 OA 通讯录组织">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardContent className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">OA 通讯录组织</h1>
                <p className="mt-2 text-sm text-slate-300">支持联系人检索、组织架构新增/删除，并可在对话中心直接选人发起沟通。</p>
              </div>
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
                <Link href="/dashboard/oa/chat/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回对话中心
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  组织架构
                </CardTitle>
                <CardDescription>新增组织并维护负责人，删除前需先清空下级与联系人。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!canManageDirectory ? (
                  <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    当前角色仅可查看通讯录与组织；新增、删除、盖雅同步需要总监及以上权限。
                  </div>
                ) : null}
                <Input
                  value={newOrgName}
                  onChange={(event) => setNewOrgName(event.target.value)}
                  placeholder="组织名称"
                  className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  disabled={!canManageDirectory}
                />
                <select
                  value={newOrgParentId}
                  onChange={(event) => setNewOrgParentId(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                  disabled={!canManageDirectory}
                >
                  <option value="" className="bg-[#0b1230] text-white">无上级组织（根节点）</option>
                  {orgUnits.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#0b1230] text-white">
                      {item.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={newOrgManagerId}
                  onChange={(event) => setNewOrgManagerId(event.target.value)}
                  placeholder="负责人 employeeId（可选）"
                  className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  disabled={!canManageDirectory}
                />
                <Button
                  className="min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleCreateOrg}
                  disabled={!canManageDirectory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增组织
                </Button>

                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {orgUnits.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white">{item.name}</p>
                          <p className="text-[11px] text-slate-400">
                            上级：{item.parentId ? orgNameMap.get(item.parentId) || item.parentId : '根组织'} · 负责人：
                            {item.managerEmployeeId || '未设置'}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            下级组织 {countDirectChildren(orgUnits, item.id)} 个 · 联系人 {contacts.filter((contact) => contact.orgUnitId === item.id).length} 人
                          </p>
                        </div>
                        {!item.id.startsWith('org-hq') ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            onClick={() => void handleDeleteOrg(item)}
                            disabled={!canManageDirectory}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-primary" />
                  联系人管理
                </CardTitle>
                <CardDescription>按姓名 / 工号 / 部门检索，可新增和删除联系人。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={newEmployeeId}
                    onChange={(event) => setNewEmployeeId(event.target.value)}
                    placeholder="员工工号（必填）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactName}
                    onChange={(event) => setNewContactName(event.target.value)}
                    placeholder="姓名（必填）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactTitle}
                    onChange={(event) => setNewContactTitle(event.target.value)}
                    placeholder="岗位"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <select
                    value={newContactOrgId}
                    onChange={(event) => setNewContactOrgId(event.target.value)}
                    className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    disabled={!canManageDirectory}
                  >
                    <option value="" className="bg-[#0b1230] text-white">选择组织（可选）</option>
                    {orgUnits.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#0b1230] text-white">
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newContactMobile}
                    onChange={(event) => setNewContactMobile(event.target.value)}
                    placeholder="手机号"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactEmail}
                    onChange={(event) => setNewContactEmail(event.target.value)}
                    placeholder="邮箱"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactWecomUserId}
                    onChange={(event) => setNewContactWecomUserId(event.target.value)}
                    placeholder="企业微信 UserID（可选）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactFeishuUserId}
                    onChange={(event) => setNewContactFeishuUserId(event.target.value)}
                    placeholder="飞书 UserID（可选）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                  <Input
                    value={newContactFeishuOpenId}
                    onChange={(event) => setNewContactFeishuOpenId(event.target.value)}
                    placeholder="飞书 OpenID（可选）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    disabled={!canManageDirectory}
                  />
                </div>
                <Button
                  className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleCreateContact}
                  disabled={!canManageDirectory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增联系人
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => void handleSyncGaia()}
                  disabled={isSyncing || !canManageDirectory}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? '同步中...' : '同步盖雅花名册'}
                </Button>

                <div className="grid gap-2 md:grid-cols-[220px_1fr]">
                  <select
                    value={gaiaSource}
                    onChange={(event) => setGaiaSource(event.target.value as 'auto' | 'gaia-api')}
                    className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    disabled={!canManageDirectory || isSyncing}
                  >
                    <option value="auto" className="bg-[#0b1230] text-white">
                      自动（远程优先）
                    </option>
                    <option value="gaia-api" className="bg-[#0b1230] text-white">仅远程盖雅 API</option>
                  </select>
                  <label className="flex min-h-10 items-center rounded-md border border-white/15 bg-white/5 px-3 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={strictRemote}
                      onChange={(event) => setStrictRemote(event.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-white/30 bg-white/10 accent-primary"
                      disabled={!canManageDirectory || isSyncing || strictLiveMode}
                    />
                    {strictLiveMode ? '严格远程模式（系统已强制开启）' : '严格远程模式（远程失败即报错）'}
                  </label>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_220px_auto]">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索姓名 / 工号 / 手机 / 邮箱 / 平台ID"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <select
                    value={orgFilter}
                    onChange={(event) => setOrgFilter(event.target.value)}
                    className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                  >
                    <option value="all" className="bg-[#0b1230] text-white">全部组织</option>
                    {orgUnits.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#0b1230] text-white">
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" onClick={() => void loadDirectory()}>
                    刷新
                  </Button>
                </div>

                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {filteredContacts.map((contact) => (
                    <div key={contact.employeeId} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white">
                            {contact.name} <span className="text-xs text-slate-400">({contact.employeeId})</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {contact.title || '未设岗位'} · {orgNameMap.get(contact.orgUnitId) || '未分配组织'}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {contact.mobile || '未填写手机号'} · {contact.email || '未填写邮箱'}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            企微:{' '}
                            <span className="font-mono">{contact.wecomUserId || '-'}</span>
                            {' · '}飞书User:{' '}
                            <span className="font-mono">{contact.feishuUserId || '-'}</span>
                            {' · '}飞书Open:{' '}
                            <span className="font-mono">{contact.feishuOpenId || '-'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="h-5 bg-white/10 text-[10px] text-slate-200 hover:bg-white/10">
                            {contact.status === 'active' ? '在岗' : '停用'}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            onClick={() => void handleDeleteContact(contact)}
                            disabled={!canManageDirectory}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && filteredContacts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                      当前筛选条件下没有联系人
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {error ? (
            <Card className="border-red-400/25 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}
          {syncSummary ? (
            <Card className="border-emerald-400/25 bg-emerald-500/10 text-emerald-100">
              <CardContent className="p-4 text-sm">{syncSummary}</CardContent>
            </Card>
          ) : null}
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
