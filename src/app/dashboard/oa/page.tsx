'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  fetchOaAudit,
  fetchOaCalls,
  fetchOaContacts,
  fetchOaFiles,
  fetchOaMeetings,
  fetchOaRooms,
  OaActorContext,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import {
  ArrowRight,
  CalendarClock,
  Files,
  MessageSquareMore,
  PhoneCall,
  Shield,
  ShieldAlert,
  Sparkles,
  UsersRound,
  Wifi,
} from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

export default function OaOverviewPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [roomsCount, setRoomsCount] = useState(0)
  const [filesCount, setFilesCount] = useState(0)
  const [callsCount, setCallsCount] = useState(0)
  const [meetingsCount, setMeetingsCount] = useState(0)
  const [contactsCount, setContactsCount] = useState(0)
  const [auditTodayCount, setAuditTodayCount] = useState(0)
  const [uniqueIpCount, setUniqueIpCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [latestEvent, setLatestEvent] = useState('')

  useEffect(() => {
    let disposed = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [rooms, files, calls, meetings, contacts, audit] = await Promise.all([
          fetchOaRooms(token, actor),
          fetchOaFiles(token, actor),
          fetchOaCalls(token, actor),
          fetchOaMeetings(token, actor),
          fetchOaContacts({ search: '', orgUnitId: '' }, token, actor),
          fetchOaAudit({ page: 1, size: 20 }, token, actor),
        ])
        if (disposed) return
        setRoomsCount(rooms.length)
        setFilesCount(files.length)
        setCallsCount(calls.length)
        setMeetingsCount(meetings.length)
        setContactsCount(contacts.length)
        setAuditTodayCount(audit?.summary?.todayCount || 0)
        setUniqueIpCount(audit?.summary?.uniqueIpCount || 0)
        setFailedCount(audit?.summary?.failedCount || 0)
        setLatestEvent(audit?.items?.[0]?.timestamp || '')
      } catch (loadError) {
        if (disposed) return
        setError(loadError instanceof Error ? loadError.message : '读取 OA 数据失败')
      } finally {
        if (!disposed) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      disposed = true
    }
  }, [actor, token])

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权查看 OA 协同中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardContent className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  轻量自研 OA · 可持续扩展
                </div>
                <h1 className="mt-3 text-2xl font-semibold">协同 OA 中心</h1>
                <p className="mt-2 text-sm text-slate-300">
                  已落地对话、文件、语音/视频通话与会议能力，后续继续迭代审批、考勤与企业邮件。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                <p>最近同步时间</p>
                <p className="mt-1 text-xs text-slate-400">{formatTime(latestEvent)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {[
              {
                title: '协同会话',
                value: roomsCount,
                sub: '可访问会话数量',
                icon: UsersRound,
              },
              {
                title: '共享文件',
                value: filesCount,
                sub: '当前可访问文件',
                icon: Files,
              },
              {
                title: '即时通话',
                value: callsCount,
                sub: '语音 / 视频记录',
                icon: PhoneCall,
              },
              {
                title: '会议安排',
                value: meetingsCount,
                sub: '可访问会议数量',
                icon: CalendarClock,
              },
              {
                title: '联系人',
                value: contactsCount,
                sub: '通讯录成员',
                icon: UsersRound,
              },
              {
                title: '今日审计',
                value: auditTodayCount,
                sub: '今日事件总数',
                icon: Shield,
              },
              {
                title: 'IP 覆盖',
                value: uniqueIpCount,
                sub: '最近窗口内 IP',
                icon: ShieldAlert,
              },
              {
                title: '失败事件',
                value: failedCount,
                sub: '建议优先处理',
                icon: ShieldAlert,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className={panelClassName}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-300">{item.title}</p>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold">{isLoading ? '--' : item.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {error ? (
            <Card className="border-red-400/25 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 xl:grid-cols-6">
            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>对话中心</CardTitle>
                    <CardDescription>Chat & Presence</CardDescription>
                  </div>
                  <MessageSquareMore className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  支持项目群聊、文件串联与消息留痕，作为 OA 最小协同基线。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/chat/">
                    进入对话中心
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>通讯录组织</CardTitle>
                    <CardDescription>Contacts & Org Tree</CardDescription>
                  </div>
                  <UsersRound className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  维护企业通讯录与组织结构，支持添加/删除，并在对话中心快速选人发起沟通。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/contacts/">
                    进入通讯录组织
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>文件中枢</CardTitle>
                    <CardDescription>Secure Transfer</CardDescription>
                  </div>
                  <Files className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  支持会话内上传与下载，自动进入审计轨迹，便于追责和复盘。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/files/">
                    进入文件中枢
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>IM 桥接</CardTitle>
                    <CardDescription>WeCom & Feishu Bridge</CardDescription>
                  </div>
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  管理 12 智能体在企业微信/飞书的群聊和私聊映射，并统一查看消息与文件审计轨迹。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/im/">
                    进入 IM 桥接
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>监控审计</CardTitle>
                    <CardDescription>IP & Geo Audit</CardDescription>
                  </div>
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  记录操作人、来源 IP、地理信息与动作结果，用于纪律与隐私合规管理。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/audit/">
                    进入监控审计
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>语音 / 视频电话</CardTitle>
                    <CardDescription>Real-time Calls</CardDescription>
                  </div>
                  <PhoneCall className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  一键发起语音或视频电话，自动生成实时通话链接并写入审计轨迹。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/calls/">
                    进入通话中心
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={panelClassName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>会议中心</CardTitle>
                    <CardDescription>Schedule & Join</CardDescription>
                  </div>
                  <CalendarClock className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  创建会议并下发会议链接，支持开始时间、时长与参会人管理。
                </p>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/oa/meetings/">
                    进入会议中心
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-400/25 bg-amber-500/10 text-amber-100">
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-medium">监控合规建议</span>
              </div>
              <p className="leading-6">
                建议在登录页和员工手册明确披露审计范围、留存周期和访问边界；敏感岗位可采用双人复核查看日志。
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">透明告知</Badge>
                <Badge className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">最小权限</Badge>
                <Badge className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/20">留存治理</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
