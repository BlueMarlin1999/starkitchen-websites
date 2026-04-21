'use client'

import Link from 'next/link'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { WorkflowTaskList } from '@/components/workflow-task-list'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { canAccessScopePath, getRoleBaseScopePath } from '@/lib/access'
import { getScopeHierarchyNodeByPath } from '@/lib/business-metrics'
import { REAL_CATERING_PROJECTS } from '@/lib/project-directory'
import { buildScopeDrilldownHref, getScopePathByName } from '@/lib/scope-drilldown'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

type StoreStatus = '正常' | '未填报' | '人工超标' | '食安待确认'

const statusSequence: StoreStatus[] = ['正常', '正常', '人工超标', '未填报', '食安待确认', '正常']

const storeRows = REAL_CATERING_PROJECTS.map((project, index) => {
  const status = statusSequence[index % statusSequence.length]
  const revenue = 46 + ((index * 11) % 96)
  const fillRate = status === '未填报' ? 0 : 100
  const laborRate =
    status === '人工超标'
      ? 33.2 + ((index % 3) * 0.4)
      : 26.1 + (((index * 7) % 58) / 10)

  return {
    ...project,
    level: project.strategicLevel,
    revenue,
    fillRate,
    laborRate,
    status,
  }
})

export default function StoresPage() {
  const { user } = useAuthStore()
  const roleScopePath = getRoleBaseScopePath(user?.role, user?.scopePath)
  const roleScopeNode = getScopeHierarchyNodeByPath(roleScopePath)
  const visibleStoreRows = storeRows
    .filter((row) => canAccessScopePath(user?.role, row.scopePath, user?.scopePath))
    .map((row) => {
      const cityScopePath = getScopePathByName(row.city, {
        preferredLevels: ['city'],
        fallbackPath: row.scopePath,
      })

      return {
        ...row,
        cityScopePath,
        cityDrilldownHref: buildScopeDrilldownHref(cityScopePath, 'revenue'),
        projectDrilldownHref: buildScopeDrilldownHref(row.scopePath, 'revenue'),
      }
    })

  const totalStoreCount = visibleStoreRows.length
  const averageFillRate =
    totalStoreCount > 0
      ? visibleStoreRows.reduce((sum, row) => sum + row.fillRate, 0) / totalStoreCount
      : 0
  const abnormalStoreCount = visibleStoreRows.filter((row) => row.status !== '正常').length
  const averageLaborRate =
    totalStoreCount > 0
      ? visibleStoreRows.reduce((sum, row) => sum + row.laborRate, 0) / totalStoreCount
      : 0
  const strategicCount = visibleStoreRows.filter((row) => row.level === 'VVIP' || row.level === 'KA').length
  const unreportedCount = visibleStoreRows.filter((row) => row.fillRate < 100).length

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看门店管理模块">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                title: '可见项目数',
                value: `${totalStoreCount}`,
                sub: `${roleScopeNode?.name || '当前范围'} 授权口径`,
                href: '#store-health-table',
              },
              {
                title: '今日填报率',
                value: `${averageFillRate.toFixed(1)}%`,
                sub: `${unreportedCount} 个项目待补录`,
                href: '#reporting-tracker',
              },
              {
                title: '异常项目',
                value: `${abnormalStoreCount}`,
                sub: '人工/库存/食安异常',
                href: '/dashboard/hr/exception-center/',
              },
              {
                title: '战略客户项目',
                value: `${strategicCount}`,
                sub: `平均人工成本率 ${averageLaborRate.toFixed(1)}%`,
                href: `/dashboard/finance/labor-cost/?scope=${encodeURIComponent(roleScopePath.join('/'))}`,
              },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group block">
                <Card className={`${panelClassName} transition-all hover:border-primary/40 hover:bg-white/[0.09]`}>
                  <CardContent className="px-5 py-4">
                    <p className="text-xs text-slate-300">{item.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">{item.sub}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.25fr_0.75fr]">
            <Card id="store-health-table" className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  项目经营健康度
                </CardTitle>
                <CardDescription className="text-slate-300">
                  项目范围 Scope by Role
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {visibleStoreRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left">
                      <thead className="border-y border-white/10 bg-white/[0.05] text-xs uppercase tracking-[0.08em] text-slate-400">
                        <tr>
                          <th className="px-5 py-3">项目名称</th>
                          <th className="px-5 py-3">城市</th>
                          <th className="px-5 py-3">负责人</th>
                          <th className="px-5 py-3">战略等级</th>
                          <th className="px-5 py-3">今日营收</th>
                          <th className="px-5 py-3">填报率</th>
                          <th className="px-5 py-3">人工成本率</th>
                          <th className="px-5 py-3">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleStoreRows.map((row) => (
                          <tr key={`${row.name}-${row.owner}`} className="border-b border-white/10 text-sm text-slate-200">
                            <td className="px-5 py-3 font-medium text-white">
                              <Link
                                href={row.projectDrilldownHref}
                                className="rounded-sm hover:text-primary"
                              >
                                {row.name}
                              </Link>
                            </td>
                            <td className="px-5 py-3">
                              <Link
                                href={row.cityDrilldownHref}
                                className="inline-flex items-center gap-1 rounded-sm hover:text-primary"
                              >
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {row.city}
                              </Link>
                            </td>
                            <td className="px-5 py-3">
                              <p className="text-white">{row.owner}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{row.ownerTitle}</p>
                            </td>
                            <td className="px-5 py-3">
                              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{row.level}</Badge>
                            </td>
                            <td className="px-5 py-3">{row.revenue} 万元</td>
                            <td className="px-5 py-3">{row.fillRate}%</td>
                            <td className="px-5 py-3">{row.laborRate.toFixed(1)}%</td>
                            <td className="px-5 py-3">
                              <Badge
                                className={
                                  row.status === '正常'
                                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                                    : row.status === '未填报'
                                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                                      : 'bg-red-500/15 text-red-300 hover:bg-red-500/15'
                                }
                              >
                                {row.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-sm text-slate-300">
                    暂无门店明细权限 No Store Detail Access.
                  </div>
                )}
              </CardContent>
            </Card>

            <div id="reporting-tracker">
              <WorkflowTaskList
                module="stores"
                title="填报追踪待办"
                description="今日闭环 Today Actions"
              />
            </div>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>门店经营联动入口</CardTitle>
              <CardDescription className="text-slate-300">
                联动入口 Linked Actions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/reports/"
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                导出未填报名单
              </Link>
              <Link
                href={`/dashboard/finance/revenue/?scope=${encodeURIComponent(roleScopePath.join('/'))}`}
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                查看收入异常详情
              </Link>
              <Link
                href={`/dashboard/stores/counters/?scope=${encodeURIComponent(roleScopePath.join('/'))}`}
                className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
              >
                进入当口分析
              </Link>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
