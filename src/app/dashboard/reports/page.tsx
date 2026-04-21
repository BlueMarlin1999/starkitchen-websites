'use client'

import Link from 'next/link'
import { CalendarClock, Download, FileSpreadsheet, FileText, FileType2, ShieldCheck } from 'lucide-react'
import { AccessGuard } from '@/components/access-guard'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const reportTemplates = [
  {
    name: '经营日报',
    scope: '营业收入、成本结构、门店填报、异常闭环',
    formats: ['Excel', 'PDF'],
    frequency: '每日 18:30 自动生成',
  },
  {
    name: '人力周报',
    scope: '排班、工时、人效、人工成本率、缺编率',
    formats: ['Excel', 'PDF', 'Word'],
    frequency: '每周一 09:00',
  },
  {
    name: '供应链周报',
    scope: '采购到货、质检、调拨、冷链履约、库存联动',
    formats: ['Excel', 'PDF'],
    frequency: '每周一 10:00',
  },
  {
    name: '区域经营月报',
    scope: '城市经营健康度、利润结构、重点门店诊断',
    formats: ['PDF', 'Word'],
    frequency: '每月 2 日 08:00',
  },
]

const exportTasks = [
  { name: '华东区域经营日报', format: 'Excel', owner: '区域经理 王区', time: '今天 18:36', status: '已完成' },
  { name: '总部经营月报（董事会版）', format: 'PDF', owner: '集团经营分析组', time: '今天 16:10', status: '审核中' },
  { name: '食安巡检周报', format: 'Word', owner: '食安督导组', time: '今天 15:20', status: '已完成' },
  { name: '加盟商标准经营包', format: 'PDF', owner: '商业化中心', time: '今天 14:55', status: '待生成' },
]

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const downloadExcelTsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const tsv = [headers, ...rows]
    .map((row) => row.map((cell) => String(cell).replaceAll('\t', ' ')).join('\t'))
    .join('\n')

  const blob = new Blob([`\uFEFF${tsv}`], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { toast } = useToast()

  return (
    <DashboardLayout>
      <AccessGuard permission="view_reports" title="当前账号无权进入报表中心">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {[
              ['今日可导出报表', '18', '总部 / 区域 / 门店多口径'],
              ['自动生成成功率', '99.1%', '近 30 日'],
              ['待审批导出', '3', '含敏感指标'],
              ['已归档报表', '486', '支持 Word / Excel / PDF'],
            ].map(([title, value, sub]) => (
              <Card key={title} className={panelClassName}>
                <CardContent className="px-5 py-4">
                  <p className="text-xs text-slate-300">{title}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-xs text-slate-400">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>标准报表模板</CardTitle>
                    <CardDescription className="text-slate-300">
                      模板中心 Report Templates
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      downloadCsv(
                        `报表模板总表_${new Date().toISOString().slice(0, 10)}.csv`,
                        ['模板名称', '覆盖范围', '可导出格式', '生成频率'],
                        reportTemplates.map((template) => [
                          template.name,
                          template.scope,
                          template.formats.join('/'),
                          template.frequency,
                        ])
                      )
                      toast({
                        title: '导出成功',
                        description: '已下载 CSV（可直接用 Excel 打开）。',
                      })
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出全部模板
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      downloadExcelTsv(
                        `报表模板总表_${new Date().toISOString().slice(0, 10)}.xls`,
                        ['模板名称', '覆盖范围', '可导出格式', '生成频率'],
                        reportTemplates.map((template) => [
                          template.name,
                          template.scope,
                          template.formats.join('/'),
                          template.frequency,
                        ])
                      )
                      toast({
                        title: '导出成功',
                        description: '已下载 Excel（.xls）。',
                      })
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    导出 Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportTemplates.map((template) => (
                  <div key={template.name} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{template.name}</p>
                      <div className="flex items-center gap-2">
                        {template.formats.map((format) => (
                          <Badge key={`${template.name}-${format}`} className="bg-white/10 text-slate-200 hover:bg-white/10">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{template.scope}</p>
                    <p className="mt-2 text-xs text-slate-400">生成频率: {template.frequency}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-11 rounded-lg bg-white/10 text-slate-100 hover:bg-white/15"
                        onClick={() => {
                          downloadCsv(
                            `${template.name}_${new Date().toISOString().slice(0, 10)}.csv`,
                            ['模板名称', '覆盖范围', '可导出格式', '生成频率'],
                            [[template.name, template.scope, template.formats.join('/'), template.frequency]]
                          )
                          toast({
                            title: `${template.name} 已导出`,
                            description: 'CSV 文件已下载。',
                          })
                        }}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        导出 CSV
                      </Button>
                      <Button
                        size="sm"
                        disabled={!template.formats.includes('Excel')}
                        title={template.formats.includes('Excel') ? '导出 Excel' : '该模板暂不支持 Excel'}
                        className="h-11 rounded-lg border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white disabled:border-white/10 disabled:text-slate-500"
                        onClick={() => {
                          if (!template.formats.includes('Excel')) return
                          downloadExcelTsv(
                            `${template.name}_${new Date().toISOString().slice(0, 10)}.xls`,
                            ['模板名称', '覆盖范围', '可导出格式', '生成频率'],
                            [[template.name, template.scope, template.formats.join('/'), template.frequency]]
                          )
                          toast({
                            title: `${template.name} 已导出`,
                            description: 'Excel 文件已下载。',
                          })
                        }}
                      >
                        导出 Excel
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  最近导出任务
                </CardTitle>
                <CardDescription className="text-slate-300">
                  导出追踪 Export Logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exportTasks.map((task) => (
                  <div key={`${task.name}-${task.time}`} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{task.name}</p>
                      <Badge
                        className={
                          task.status === '已完成'
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                            : task.status === '审核中'
                              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
                              : 'bg-[#7ca5ff]/20 text-[#b8d8ff] hover:bg-[#7ca5ff]/20'
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{task.owner}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {task.time} · {task.format}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>报表治理与安全策略</CardTitle>
              <CardDescription className="text-slate-300">
                治理规则 Governance Rules
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
              {[
                {
                  title: '按角色控制导出范围',
                  detail: '权限边界 Role Boundaries',
                  icon: ShieldCheck,
                },
                {
                  title: '支持多格式输出',
                  detail: '统一格式 Unified Output',
                  icon: FileType2,
                },
                {
                  title: '报表留痕审计',
                  detail: '全程留痕 Audit Trail',
                  icon: FileText,
                },
                {
                  title: '联动数据导入',
                  detail: '导入联动 Data Refresh',
                  icon: FileSpreadsheet,
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl border border-white/15 bg-[#081538]/55 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{item.detail}</p>
                  </div>
                )
              })}
            </CardContent>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <Link
                  href="/dashboard/documents/imports/"
                  className="inline-flex min-h-11 items-center rounded-md px-2.5 text-primary hover:bg-white/[0.06] hover:text-primary/90"
                >
                  进入数据导入中心
                </Link>
                <Link
                  href="/dashboard/integrations/"
                  className="inline-flex min-h-11 items-center rounded-md px-2.5 text-primary hover:bg-white/[0.06] hover:text-primary/90"
                >
                  查看系统集成策略
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
