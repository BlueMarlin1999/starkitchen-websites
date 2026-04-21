'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  createOaMeeting,
  fetchOaMeetings,
  fetchOaRooms,
  OaActorContext,
  OaMeetingSession,
  OaMeetingStatus,
  OaRoom,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { CalendarClock, ExternalLink, RefreshCw, UsersRound } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const trimCsvMembers = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean)
    )
  ).slice(0, 120)

const toLocalInputValue = (value: Date) => {
  const timezoneOffset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const statusClassName = (status: OaMeetingStatus) => {
  if (status === 'live') return 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
  if (status === 'completed') return 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/20'
  return 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15'
}

const statusLabel = (status: OaMeetingStatus) => {
  if (status === 'live') return '进行中'
  if (status === 'completed') return '已结束'
  return '待开始'
}

export default function OaMeetingsPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [meetings, setMeetings] = useState<OaMeetingSession[]>([])
  const [rooms, setRooms] = useState<OaRoom[]>([])
  const [title, setTitle] = useState('')
  const [agenda, setAgenda] = useState('')
  const [roomId, setRoomId] = useState('')
  const [participants, setParticipants] = useState('')
  const [startsAt, setStartsAt] = useState(() => toLocalInputValue(new Date(Date.now() + 30 * 60_000)))
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [meetingItems, roomItems] = await Promise.all([
        fetchOaMeetings(token, actor),
        fetchOaRooms(token, actor),
      ])
      setMeetings(meetingItems)
      setRooms(roomItems)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取会议数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [actor, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreateMeeting = async () => {
    setIsCreating(true)
    setError('')
    try {
      const startsAtDate = startsAt ? new Date(startsAt).toISOString() : undefined
      const session = await createOaMeeting(
        {
          title: title.trim(),
          agenda: agenda.trim() || undefined,
          roomId: roomId || undefined,
          participants: trimCsvMembers(participants),
          startsAt: startsAtDate,
          durationMinutes: Number.parseInt(durationMinutes, 10) || 30,
        },
        token,
        actor
      )
      setMeetings((previous) => {
        const next = [session, ...previous]
        return next.sort((left, right) => left.startsAt.localeCompare(right.startsAt)).slice(0, 200)
      })
      setTitle('')
      setAgenda('')
      setParticipants('')
      setRoomId('')
      setStartsAt(toLocalInputValue(new Date(Date.now() + 30 * 60_000)))
      setDurationMinutes('30')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建会议失败')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权访问 OA 会议中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>OA 会议中心</CardTitle>
                  <CardDescription>Meeting Scheduling & Join Links</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => void loadData()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs text-slate-400">安排会议</p>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例如：区域经营周会"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <Input
                    value={agenda}
                    onChange={(event) => setAgenda(event.target.value)}
                    placeholder="议程摘要（可选）"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-slate-400">
                      开始时间
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(event) => setStartsAt(event.target.value)}
                        className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-slate-400">
                      时长（分钟）
                      <Input
                        type="number"
                        min={15}
                        max={480}
                        value={durationMinutes}
                        onChange={(event) => setDurationMinutes(event.target.value)}
                        className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                      />
                    </label>
                  </div>
                  <select
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                  >
                    <option value="">不绑定会话（临时会议）</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={participants}
                    onChange={(event) => setParticipants(event.target.value)}
                    placeholder="参会人 employeeId，用逗号分隔；留空默认仅自己"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <Button
                    className="min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => void handleCreateMeeting()}
                    disabled={isCreating || !title.trim()}
                  >
                    {isCreating ? '创建中...' : '创建会议'}
                  </Button>
                  <p className="text-xs text-slate-400">
                    会议会生成可直接加入的真实链接，支持语音与视频。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">会议列表</p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{meetings.length}</Badge>
                  </div>
                  <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{meeting.title}</p>
                          <Badge className={statusClassName(meeting.status)}>{statusLabel(meeting.status)}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="inline-flex items-center">
                            <CalendarClock className="mr-1 h-3.5 w-3.5 text-primary" />
                            {formatTime(meeting.startsAt)}
                          </span>
                          <span>{meeting.durationMinutes} 分钟</span>
                          <span className="inline-flex items-center">
                            <UsersRound className="mr-1 h-3.5 w-3.5 text-primary" />
                            {meeting.participants.length} 人
                          </span>
                        </div>
                        {meeting.agenda ? (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-400">{meeting.agenda}</p>
                        ) : null}
                        <div className="mt-3">
                          <a
                            href={meeting.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                          >
                            加入会议
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {meetings.length === 0 && !isLoading ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-400">
                        当前没有会议安排，先创建第一场会议
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-red-400/25 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
