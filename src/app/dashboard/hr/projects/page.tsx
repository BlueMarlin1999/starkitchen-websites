'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Clock3, ListOrdered, TrendingUp, Users } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  GaiaEmployeeRecord,
  HR_RANKING_DIMENSION_LABEL,
  HrProjectStaffingRow,
  HrRankingDimension,
  buildProjectStaffingRows,
  formatLaborCostValue,
} from '@/lib/hr-workforce'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const rankingDimensions: HrRankingDimension[] = [
  'realtimeCost',
  'overtimeHours',
  'abnormalScore',
  'hourlyCost',
]

const abnormalSeverityClassName = {
  high: 'bg-red-500/15 text-red-300 hover:bg-red-500/15',
  medium: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
  low: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15',
} as const

const getDimensionValue = (row: HrProjectStaffingRow, dimension: HrRankingDimension) => {
  if (dimension === 'realtimeCost') return row.realtimeLaborCost
  if (dimension === 'overtimeHours') return row.shift.overtimeHours
  if (dimension === 'abnormalScore') return row.shift.abnormalScore
  return row.employee.hourlyCost
}

const getAbnormalSeverity = (row: HrProjectStaffingRow) => {
  if (row.shift.abnormalScore >= 3 || row.shift.abnormalTags.includes('离岗未排班')) return 'high'
  if (row.shift.abnormalScore >= 1) return 'medium'
  return 'low'
}

const buildAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export default function HrProjectStaffingPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialProject = searchParams.get('project') || ''
  const initialEmployee = searchParams.get('employee') || ''
  const [roster, setRoster] = useState<GaiaEmployeeRecord[]>([])
  const [isRosterLoading, setIsRosterLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(initialProject)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployee)
  const [rankingDimension, setRankingDimension] = useState<HrRankingDimension>('realtimeCost')
  const [keyword, setKeyword] = useState('')
  const [tick, setTick] = useState(() => Date.now())

  const loadRoster = useCallback(async () => {
    setIsRosterLoading(true)
    try {
      const response = await fetch('/api/hr/gaia/roster?source=stored', {
        method: 'GET',
        headers: buildAuthHeaders(token),
        credentials: 'include',
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.message === 'string'
            ? payload.message
            : `读取项目排班花名册失败 (${response.status})`
        )
      }
      const items = Array.isArray(payload?.roster) ? (payload.roster as GaiaEmployeeRecord[]) : []
      setRoster(items)
    } catch (error) {
      toast({
        title: '花名册读取失败',
        description: error instanceof Error ? error.message : '读取项目排班花名册失败',
        variant: 'destructive',
      })
    } finally {
      setIsRosterLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    void loadRoster()
  }, [loadRoster])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(Date.now())
    }, 15000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

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

  useEffect(() => {
    if (projectOptions.length === 0) return
    const hasCurrentProject = projectOptions.some((item) => item.projectSlug === selectedProject)
    if (!selectedProject || !hasCurrentProject) {
      setSelectedProject(projectOptions[0].projectSlug)
    }
  }, [projectOptions, selectedProject])

  const rankedRows = useMemo(() => {
    if (!selectedProject) return [] as HrProjectStaffingRow[]

    const rows = buildProjectStaffingRows(selectedProject, roster, new Date(tick)).filter((row) => {
      const normalizedKeyword = keyword.trim().toLowerCase()
      if (!normalizedKeyword) return true
      return `${row.employee.employeeId} ${row.employee.name} ${row.employee.roleTitle} ${row.shift.shiftLabel}`
        .toLowerCase()
        .includes(normalizedKeyword)
    })

    return [...rows].sort((left, right) => {
      const valueGap = getDimensionValue(right, rankingDimension) - getDimensionValue(left, rankingDimension)
      if (Math.abs(valueGap) > 0.001) return valueGap
      return left.employee.name.localeCompare(right.employee.name, 'zh-CN')
    })
  }, [keyword, rankingDimension, roster, selectedProject, tick])

  useEffect(() => {
    if (rankedRows.length === 0) {
      setSelectedEmployeeId('')
      return
    }
    const hasSelected = rankedRows.some((row) => row.employee.employeeId === selectedEmployeeId)
    if (!selectedEmployeeId || !hasSelected) {
      setSelectedEmployeeId(rankedRows[0].employee.employeeId)
    }
  }, [rankedRows, selectedEmployeeId])

  const selectedRow = useMemo(
    () => rankedRows.find((row) => row.employee.employeeId === selectedEmployeeId) || null,
    [rankedRows, selectedEmployeeId]
  )

  const selectedProjectMeta = projectOptions.find((item) => item.projectSlug === selectedProject)

  const summary = useMemo(() => {
    const totalRealtimeCost = rankedRows.reduce((sum, row) => sum + row.realtimeLaborCost, 0)
    const totalFullShiftCost = rankedRows.reduce((sum, row) => sum + row.fullShiftLaborCost, 0)
    const overtimeHours = rankedRows.reduce((sum, row) => sum + row.shift.overtimeHours, 0)
    const abnormalCount = rankedRows.filter((row) => row.shift.abnormalScore > 0).length
    return {
      count: rankedRows.length,
      totalRealtimeCost,
      totalFullShiftCost,
      overtimeHours,
      abnormalCount,
    }
  }, [rankedRows])

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看项目排班明细">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                项目排班与人力成本实时明细
              </CardTitle>
              <CardDescription className="text-slate-300">
                Project Staffing Detail · 姓名、班次、人力成本、异常状态、排名维度联动
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4 md:col-span-2">
                <p className="text-xs text-slate-300">当前项目</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedProjectMeta?.projectName || '未选择项目'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  刷新频率 15 秒 · 实时口径 {isRosterLoading ? '· 花名册刷新中' : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">在岗人数</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.count}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">实时人力成本</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatLaborCostValue(summary.totalRealtimeCost)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                <p className="text-xs text-slate-300">异常人数 / 加班工时</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summary.abnormalCount} / {summary.overtimeHours.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle>项目排班列表</CardTitle>
                <CardDescription className="text-slate-300">
                  点击任一人员可查看成本细节和异常明细
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={selectedProject}
                    onChange={(event) => setSelectedProject(event.target.value)}
                    className="min-h-11 rounded-md border border-white/20 bg-[#071633]/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {projectOptions.map((project) => (
                      <option key={project.projectSlug} value={project.projectSlug}>
                        {project.projectName}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索姓名/工号/岗位"
                    className="min-h-11 border-white/20 bg-[#071633]/70 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {rankingDimensions.map((dimension) => (
                    <button
                      key={dimension}
                      type="button"
                      onClick={() => setRankingDimension(dimension)}
                      className={
                        rankingDimension === dimension
                          ? 'min-h-11 rounded-md border border-primary/50 bg-primary/20 px-2.5 text-xs text-primary'
                          : 'min-h-11 rounded-md border border-white/20 bg-white/[0.03] px-2.5 text-xs text-slate-300 hover:bg-white/[0.08]'
                      }
                    >
                      {HR_RANKING_DIMENSION_LABEL[dimension]}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#081538]/55">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03]">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">排名</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">姓名 / 岗位</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">班次</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">实时工时</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">实时成本</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">预计全班成本</th>
                        <th className="px-3 py-3 text-left text-xs text-slate-300">异常</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedRows.map((row, index) => {
                        const isSelected = row.employee.employeeId === selectedEmployeeId
                        const abnormalSeverity = getAbnormalSeverity(row)
                        const abnormalText = row.shift.abnormalTags.length > 0 ? row.shift.abnormalTags.join(' / ') : '正常'

                        return (
                          <tr
                            key={row.employee.employeeId}
                            onClick={() => setSelectedEmployeeId(row.employee.employeeId)}
                            className={
                              isSelected
                                ? 'cursor-pointer border-b border-white/10 bg-primary/10 last:border-b-0'
                                : 'cursor-pointer border-b border-white/10 last:border-b-0 hover:bg-white/[0.05]'
                            }
                          >
                            <td className="px-3 py-3 text-slate-200">#{index + 1}</td>
                            <td className="px-3 py-3">
                              <p className="text-slate-100">{row.employee.name}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {row.employee.employeeId} · {row.employee.roleTitle}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-slate-200">
                              {row.shift.shiftLabel}
                              <p className="mt-1 text-xs text-slate-400">
                                {row.shift.startAt} - {row.shift.endAt}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-slate-200">{row.realtimeHours.toFixed(2)}h</td>
                            <td className="px-3 py-3 text-slate-100">{formatLaborCostValue(row.realtimeLaborCost)}</td>
                            <td className="px-3 py-3 text-slate-200">{formatLaborCostValue(row.fullShiftLaborCost)}</td>
                            <td className="px-3 py-3">
                              <Badge className={abnormalSeverityClassName[abnormalSeverity]}>{abnormalText}</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-primary" />
                  人员详情与排名口径
                </CardTitle>
                <CardDescription className="text-slate-300">
                  点击左侧任一人员查看明细
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedRow ? (
                  <>
                    <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                      <p className="text-sm font-medium text-white">
                        {selectedRow.employee.name} · {selectedRow.employee.roleTitle}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {selectedRow.employee.employeeId} · {selectedRow.employee.city} · {selectedRow.employee.projectName}
                      </p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-300">实时成本</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {formatLaborCostValue(selectedRow.realtimeLaborCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">预计全班成本</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {formatLaborCostValue(selectedRow.fullShiftLaborCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">加班工时 / 成本</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {selectedRow.shift.overtimeHours.toFixed(1)}h / {formatLaborCostValue(selectedRow.overtimeCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">小时成本</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            ¥{selectedRow.employee.hourlyCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-white">班次与异常</p>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">
                        {selectedRow.shift.shiftLabel} · {selectedRow.shift.startAt} - {selectedRow.shift.endAt}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        计划工时 {selectedRow.shift.plannedHours.toFixed(1)}h，排班工时 {selectedRow.scheduledHours.toFixed(1)}h
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        异常标签: {selectedRow.shift.abnormalTags.length > 0 ? selectedRow.shift.abnormalTags.join(' / ') : '无异常'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[#081538]/55 px-4 py-8 text-sm text-slate-300">
                    当前筛选下无可查看人员。
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/hr/gaia-roster/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    返回盖雅花名册
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/hr/shift-optimization/"
                    className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                  >
                    <TrendingUp className="mr-1 h-3.5 w-3.5" />
                    查看排班优化策略
                  </Link>
                </div>
                <p className="text-xs text-slate-400">
                  全班预计总成本 {formatLaborCostValue(summary.totalFullShiftCost)} · 排名维度 {HR_RANKING_DIMENSION_LABEL[rankingDimension]}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
