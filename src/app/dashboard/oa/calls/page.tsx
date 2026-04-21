'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  createOaCall,
  fetchOaCalls,
  fetchOaRooms,
  OaActorContext,
  OaCallMode,
  OaCallSession,
  OaRoom,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { ExternalLink, PhoneCall, RefreshCw, Video } from 'lucide-react'

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

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const modeLabel = (mode: OaCallMode) => (mode === 'voice' ? '语音通话' : '视频通话')

export default function OaCallsPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [calls, setCalls] = useState<OaCallSession[]>([])
  const [rooms, setRooms] = useState<OaRoom[]>([])
  const [mode, setMode] = useState<OaCallMode>('voice')
  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState('')
  const [participants, setParticipants] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [callItems, roomItems] = await Promise.all([
        fetchOaCalls(token, actor),
        fetchOaRooms(token, actor),
      ])
      setCalls(callItems)
      setRooms(roomItems)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取通话数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [actor, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreateCall = async () => {
    setIsCreating(true)
    setError('')
    try {
      const session = await createOaCall(
        {
          mode,
          title: title.trim() || undefined,
          roomId: roomId || undefined,
          participants: trimCsvMembers(participants),
        },
        token,
        actor
      )
      setCalls((previous) => [session, ...previous].slice(0, 200))
      setTitle('')
      setParticipants('')
      if (typeof window !== 'undefined') {
        window.open(session.joinUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '发起通话失败')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权访问 OA 通话中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>OA 通话中心</CardTitle>
                  <CardDescription>Voice & Video Calls via Jitsi</CardDescription>
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
                  <p className="text-xs text-slate-400">发起即时通话</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode('voice')}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        mode === 'voice'
                          ? 'border-primary/40 bg-primary/20 text-white'
                          : 'border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]'
                      }`}
                    >
                      <PhoneCall className="h-4 w-4" />
                      <p className="mt-1 text-sm font-medium">语音电话</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('video')}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        mode === 'video'
                          ? 'border-primary/40 bg-primary/20 text-white'
                          : 'border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      <p className="mt-1 text-sm font-medium">视频电话</p>
                    </button>
                  </div>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={`例如：${mode === 'voice' ? '华东采购紧急语音沟通' : '经营例会视频沟通'}`}
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <select
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                  >
                    <option value="">不绑定会话（临时通话）</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={participants}
                    onChange={(event) => setParticipants(event.target.value)}
                    placeholder="参与人 employeeId，用逗号分隔；留空默认仅自己"
                    className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                  />
                  <Button
                    className="min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => void handleCreateCall()}
                    disabled={isCreating}
                  >
                    {isCreating ? '创建中...' : `发起${mode === 'voice' ? '语音' : '视频'}通话`}
                  </Button>
                  <p className="text-xs text-slate-400">
                    创建后会自动打开真实会议链接，可直接通话。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">最近通话记录</p>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{calls.length}</Badge>
                  </div>
                  <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
                    {calls.map((call) => (
                      <div key={call.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{call.title}</p>
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                            {modeLabel(call.mode)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span>{formatTime(call.startedAt)}</span>
                          <span>发起人：{call.createdByName}</span>
                          <span>参与人：{call.participants.length}</span>
                        </div>
                        <div className="mt-3">
                          <a
                            href={call.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-xs text-primary hover:bg-white/[0.06] hover:text-primary/90"
                          >
                            立即加入通话
                            <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {calls.length === 0 && !isLoading ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-400">
                        还没有通话记录，先发起第一通电话
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
