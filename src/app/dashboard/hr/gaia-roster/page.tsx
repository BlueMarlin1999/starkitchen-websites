'use client'

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileUp, RefreshCcw, Search, Users } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { GaiaEmployeeRecord } from '@/lib/hr-workforce'
import { isStrictLiveMode } from '@/lib/live-mode'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const statusClassName = {
  在岗: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
  休假: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  离岗: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
} as const

type GaiaImportSource = 'seed' | 'csv' | 'gaia-api' | 'empty'

interface GaiaImportSummary {
  source: GaiaImportSource
  importedAt: string
  importedRows: number
  errorCount: number
  errors: string[]
}

const createDefaultImportSummary = (): GaiaImportSummary => ({
  source: 'empty',
  importedAt: '',
  importedRows: 0,
  errorCount: 0,
  errors: [],
})

const buildAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const importSourceLabelMap: Record<GaiaImportSource, string> = {
  seed: '系统基准数据',
  csv: 'CSV 导入',
  'gaia-api': '盖雅 API',
  empty: '未导入',
}

const isPublicFlagEnabled = (value: string | undefined) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

export default function HrGaiaRosterPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const strictLiveMode = useMemo(() => isStrictLiveMode(), [])
  const allowSeedReset = useMemo(
    () => !strictLiveMode && isPublicFlagEnabled(process.env.NEXT_PUBLIC_ENABLE_HR_SEED_RESET),
    [strictLiveMode]
  )
  const [roster, setRoster] = useState<GaiaEmployeeRecord[]>([])
  const [importSummary, setImportSummary] = useState<GaiaImportSummary>(createDefaultImportSummary())
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSubmittingCsv, setIsSubmittingCsv] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | '在岗' | '休假' | '离岗'>('all')
  const [csvDraft, setCsvDraft] = useState('')
  const [importMessage, setImportMessage] = useState('')

  const applyRosterPayload = useCallback((payload: Record<string, unknown>) => {
    const rosterItems = (Array.isArray(payload?.roster) ? payload.roster : []) as GaiaEmployeeRecord[]
    setRoster(rosterItems)
    const summary = payload?.importSummary as Partial<GaiaImportSummary> | undefined
    setImportSummary({
      source:
        summary?.source === 'seed' ||
        summary?.source === 'csv' ||
        summary?.source === 'gaia-api' ||
        summary?.source === 'empty'
          ? summary.source
          : 'empty',
      importedAt: typeof summary?.importedAt === 'string' ? summary.importedAt : '',
      importedRows: typeof summary?.importedRows === 'number' ? summary.importedRows : 0,
      errorCount: typeof summary?.errorCount === 'number' ? summary.errorCount : 0,
      errors: Array.isArray(summary?.errors) ? summary.errors.map((item) => String(item)) : [],
    })
  }, [])

  const loadRoster = useCallback(
    async (source: 'stored' | 'auto' | 'gaia-api' = 'stored') => {
      setIsLoading(true)
      try {
        const query = new URLSearchParams({
          source,
          strictRemote: strictLiveMode ? '1' : '0',
        })
        const response = await fetch(`/api/hr/gaia/roster?${query.toString()}`, {
          method: 'GET',
          headers: buildAuthHeaders(token),
          credentials: 'include',
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string' ? payload.message : `读取花名册失败 (${response.status})`
          )
        }
        applyRosterPayload(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : '读取花名册失败'
        setImportMessage(message)
      } finally {
        setIsLoading(false)
      }
    },
    [applyRosterPayload, strictLiveMode, token]
  )

  useEffect(() => {
    void loadRoster('stored')
  }, [loadRoster])

  const cityOptions = useMemo(
    () => Array.from(new Set(roster.map((item) => item.city))).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [roster]
  )
  const projectOptions = useMemo(
    () =>
      Array.from(new Set(roster.map((item) => `${item.projectSlug}|${item.projectName}`)))
        .map((item) => {
          const [projectSlug, projectName] = item.split('|')
          return { projectSlug, projectName }
        })
        .sort((left, right) => left.projectName.localeCompare(right.projectName, 'zh-CN')),
    [roster]
  )

  const filteredRoster = useMemo(
    () =>
      roster.filter((item) => {
        const matchKeyword =
          keyword.trim().length === 0 ||
          `${item.employeeId} ${item.name} ${item.roleTitle} ${item.projectName} ${item.city}`
            .toLowerCase()
            .includes(keyword.trim().toLowerCase())
        const matchCity = selectedCity === 'all' || item.city === selectedCity
        const matchProject = selectedProject === 'all' || item.projectSlug === selectedProject
        const matchStatus = selectedStatus === 'all' || item.status === selectedStatus
        return matchKeyword && matchCity && matchProject && matchStatus
      }),
    [keyword, roster, selectedCity, selectedProject, selectedStatus]
  )

  const summary = useMemo(() => {
    const projectCount = new Set(roster.map((item) => item.projectSlug)).size
    const onDutyCount = roster.filter((item) => item.status === '在岗').length
    const leaveCount = roster.filter((item) => item.status === '休假').length
    const avgHourlyCost =
      roster.length > 0
        ? roster.reduce((sum, item) => sum + item.hourlyCost, 0) / roster.length
        : 0
    return {
      total: roster.length,
      projectCount,
      onDutyCount,
      leaveCount,
      avgHourlyCost,
    }
  }, [roster])

  const runImport = useCallback(
    async (csvText: string) => {
      const content = csvText.trim()
      if (!content) {
        setImportMessage('请先粘贴 CSV 内容。')
        return
      }
      setIsSubmittingCsv(true)
      try {
        const response = await fetch('/api/hr/gaia/roster', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(token),
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'import_csv',
            csvText: content,
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof payload?.message === 'string' ? payload.message : `CSV 导入失败 (${response.status})`
          )
        }
        applyRosterPayload(payload)
        const importedRows = typeof payload?.importedRows === 'number' ? payload.importedRows : 0
        const errorCount = typeof payload?.errorCount === 'number' ? payload.errorCount : 0
        setImportMessage(
          importedRows > 0
            ? errorCount > 0
              ? `导入完成：成功 ${importedRows} 条，异常 ${errorCount} 条（见下方错误清单）。`
              : `导入完成：成功 ${importedRows} 条。`
            : '导入完成：未识别到有效记录。'
        )
      } catch (error) {
        setImportMessage(error instanceof Error ? error.message : 'CSV 导入失败')
      } finally {
        setIsSubmittingCsv(false)
      }
    },
    [applyRosterPayload, token]
  )

  const syncFromGaia = useCallback(async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/hr/gaia/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(token),
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'sync',
          source: strictLiveMode ? 'gaia-api' : 'auto',
          strictRemote: strictLiveMode,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `盖雅同步失败 (${response.status})`
        )
      }
      applyRosterPayload(payload)
      setImportMessage(
        `同步完成：导入 ${payload?.importSummary?.importedRows || 0} 条。`
      )
      toast({
        title: '盖雅同步完成',
        description: '花名册已更新为最新远程数据。',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '盖雅同步失败'
      setImportMessage(message)
      toast({
        title: '盖雅同步失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }, [applyRosterPayload, strictLiveMode, token, toast])

  const resetToSeed = useCallback(async () => {
    if (strictLiveMode) return
    setIsResetting(true)
    try {
      const response = await fetch('/api/hr/gaia/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(token),
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reset_seed',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string' ? payload.message : `重置失败 (${response.status})`
        )
      }
      applyRosterPayload(payload)
      setImportMessage('已重置为系统基准花名册。')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : '重置失败')
    } finally {
      setIsResetting(false)
    }
  }, [applyRosterPayload, strictLiveMode, token])

  const handleCsvFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const raw = await file.text()
    setCsvDraft(raw)
    await runImport(raw)
    event.target.value = ''
  }

  const importErrors = importSummary.errors.slice(0, 8)
  const importAtText = importSummary.importedAt
    ? new Date(importSummary.importedAt).toLocaleString('zh-CN')
    : '-'

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看盖雅花名册">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                盖雅企业伙伴花名册（全体员工清单）
              </CardTitle>
              <CardDescription className="text-slate-300">
                Gaia Roster · 按工号增量导入，可在项目排班中实时看到每个人的人力成本与异常
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">伙伴总数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">覆盖项目</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.projectCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">在岗人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.onDutyCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">休假人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.leaveCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">平均小时成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">¥{summary.avgHourlyCost.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>导入与同步</CardTitle>
                <CardDescription className="text-slate-300">
                  CSV Import & Sync
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-white/[0.05] px-3 text-xs text-slate-200 hover:bg-white/[0.1]">
                    <FileUp className="mr-1.5 h-3.5 w-3.5" />
                    {isSubmittingCsv ? 'CSV 导入中...' : '上传 CSV 并导入'}
                    <input type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={handleCsvFileSelect} />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 border-white/20 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] hover:text-white"
                    onClick={() => {
                      void syncFromGaia()
                    }}
                    disabled={isSyncing}
                  >
                    <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                    {isSyncing ? '同步中...' : '同步盖雅远程花名册'}
                  </Button>
                </div>

                <Textarea
                  value={csvDraft}
                  onChange={(event) => setCsvDraft(event.target.value)}
                  placeholder="可直接粘贴 CSV。表头示例：employeeId,name,roleTitle,projectSlug,hourlyCost,employmentType,status,hiredAt"
                  className="min-h-[140px] border-white/20 bg-[#071633]/70 text-slate-100 placeholder:text-slate-400 focus-visible:ring-primary/40"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      void runImport(csvDraft)
                    }}
                    disabled={!csvDraft.trim() || isSubmittingCsv}
                  >
                    {isSubmittingCsv ? '导入中...' : '导入文本内容'}
                  </Button>
                  {allowSeedReset ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 border-white/20 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] hover:text-white"
                      onClick={() => {
                        void resetToSeed()
                      }}
                      disabled={isResetting}
                    >
                      {isResetting ? '重置中...' : '重置花名册'}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 border-white/20 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] hover:text-white"
                    onClick={() => {
                      void loadRoster('stored')
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? '刷新中...' : '刷新'}
                  </Button>
                  {importMessage ? <span className="text-xs text-primary">{importMessage}</span> : null}
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>最近导入状态</CardTitle>
                <CardDescription className="text-slate-300">
                  Last Import Summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                  <p className="text-xs text-slate-300">来源</p>
                  <p className="mt-2 text-sm font-semibold text-white">{importSourceLabelMap[importSummary.source]}</p>
                  <p className="mt-1 text-xs text-slate-400">导入时间: {importAtText}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-xs text-slate-300">成功导入</p>
                    <p className="mt-2 text-xl font-semibold text-white">{importSummary.importedRows}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <p className="text-xs text-slate-300">导入异常</p>
                    <p className="mt-2 text-xl font-semibold text-white">{importSummary.errorCount}</p>
                  </div>
                </div>
                {importErrors.length > 0 ? (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
                    <p className="text-xs font-medium text-red-200">导入错误（最多展示 8 条）</p>
                    <div className="mt-2 space-y-1">
                      {importErrors.map((error) => (
                        <p key={error} className="text-xs leading-5 text-red-100/90">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">当前无导入错误。</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>花名册明细</CardTitle>
              <CardDescription className="text-slate-300">
                Enterprise Partner Roster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索姓名/工号/项目"
                    className="min-h-11 border-white/20 bg-[#071633]/65 pl-10 text-white placeholder:text-slate-400"
                  />
                </div>
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/65 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">全部城市</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedProject}
                  onChange={(event) => setSelectedProject(event.target.value)}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/65 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">全部项目</option>
                  {projectOptions.map((project) => (
                    <option key={project.projectSlug} value={project.projectSlug}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value as 'all' | '在岗' | '休假' | '离岗')}
                  className="min-h-11 rounded-md border border-white/20 bg-[#071633]/65 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">全部状态</option>
                  <option value="在岗">在岗</option>
                  <option value="休假">休假</option>
                  <option value="离岗">离岗</option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[#071633]/60 p-3">
                <p className="text-xs text-slate-300">字段映射 Field Mapping</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    'employeeId→工号',
                    'name→姓名',
                    'roleTitle→岗位',
                    'projectSlug→项目编码',
                    'projectName→项目名称',
                    'employmentType→用工类型',
                    'hourlyCost→小时成本',
                    'status→状态',
                  ].map((item) => (
                    <Badge key={item} className="bg-white/10 text-slate-200 hover:bg-white/10">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#081538]/55">
                <table className="w-full min-w-[1160px] text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03]">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">工号</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">姓名</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">岗位</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">城市 / 项目</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">用工类型</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">状态</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">小时成本</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.map((item) => (
                      <tr key={item.employeeId} className="border-b border-white/10 last:border-b-0 hover:bg-white/[0.04]">
                        <td className="px-3 py-3 text-slate-200 whitespace-nowrap">{item.employeeId}</td>
                        <td className="px-3 py-3 text-slate-100 whitespace-nowrap">{item.name}</td>
                        <td className="px-3 py-3 text-slate-200 whitespace-nowrap">{item.roleTitle}</td>
                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                          {item.city} · {item.projectName}
                        </td>
                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{item.employmentType}</td>
                        <td className="px-3 py-3">
                          <Badge className={statusClassName[item.status]}>{item.status}</Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-200 whitespace-nowrap">¥{item.hourlyCost.toFixed(2)}</td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/dashboard/hr/projects/?project=${encodeURIComponent(item.projectSlug)}&employee=${encodeURIComponent(item.employeeId)}`}
                            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                          >
                            查看项目排班
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400">当前筛选结果 {filteredRoster.length} 条。</p>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
