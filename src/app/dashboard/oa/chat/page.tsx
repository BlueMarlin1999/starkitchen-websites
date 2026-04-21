'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  createOaRoom,
  fetchOaContacts,
  downloadOaFile,
  fetchOaMessages,
  fetchOaOrgUnits,
  fetchOaRooms,
  OaActorContext,
  OaContact,
  OaMessage,
  OaOrgUnit,
  OaRoom,
  sendOaMessage,
  uploadOaFile,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { ArrowRight, Download, MessageSquareMore, Paperclip, Plus, RefreshCw, Send, UsersRound } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const trimCsvMembers = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean)
    )
  ).slice(0, 60)

const appendCsvMember = (seed: string, employeeId: string) => {
  const normalizedEmployeeId = employeeId.trim()
  if (!normalizedEmployeeId) return seed
  return trimCsvMembers([seed, normalizedEmployeeId].filter(Boolean).join(',')).join(', ')
}

const MessageBlock = ({
  item,
  selfId,
  onDownload,
}: {
  item: OaMessage
  selfId: string
  onDownload: (fileId: string, fileName: string) => void
}) => {
  const isSelf = item.senderId === selfId
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl border px-3 py-2.5 ${
          isSelf
            ? 'border-primary/30 bg-primary/20 text-slate-100'
            : 'border-white/10 bg-slate-950/45 text-slate-100'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-300">{item.senderName}</span>
          <span className="text-[11px] text-slate-400">{formatTime(item.createdAt)}</span>
        </div>
        {item.content ? <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p> : null}
        {item.attachments.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {item.attachments.map((attachment) => (
              <button
                key={attachment.fileId}
                type="button"
                onClick={() => onDownload(attachment.fileId, attachment.fileName)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1.5 text-left text-xs text-primary transition hover:bg-primary/20"
              >
                <span className="truncate">{attachment.fileName}</span>
                <Download className="h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function OaChatPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [rooms, setRooms] = useState<OaRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState('')
  const [messages, setMessages] = useState<OaMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomMembers, setNewRoomMembers] = useState('')
  const [contacts, setContacts] = useState<OaContact[]>([])
  const [orgUnits, setOrgUnits] = useState<OaOrgUnit[]>([])
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactOrgFilter, setContactOrgFilter] = useState('all')

  const refreshRooms = useCallback(async () => {
    setIsLoadingRooms(true)
    setError('')
    try {
      const items = await fetchOaRooms(token, actor)
      setRooms(items)
      setActiveRoomId((currentRoomId) => {
        if (!currentRoomId && items.length > 0) {
          return items[0].id
        }
        if (currentRoomId && items.every((item) => item.id !== currentRoomId)) {
          return items[0]?.id || ''
        }
        return currentRoomId
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取会话失败')
    } finally {
      setIsLoadingRooms(false)
    }
  }, [actor, token])

  const refreshMessages = useCallback(async (roomId: string) => {
    if (!roomId) {
      setMessages([])
      return
    }
    setIsLoadingMessages(true)
    setError('')
    try {
      const items = await fetchOaMessages(roomId, token, actor, 160)
      setMessages(items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取消息失败')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [actor, token])

  const refreshDirectory = useCallback(async () => {
    setIsLoadingDirectory(true)
    try {
      const [contactItems, orgItems] = await Promise.all([
        fetchOaContacts({ search: '', orgUnitId: '' }, token, actor),
        fetchOaOrgUnits(token, actor),
      ])
      setContacts(contactItems)
      setOrgUnits(orgItems)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取联系人目录失败')
    } finally {
      setIsLoadingDirectory(false)
    }
  }, [actor, token])

  const orgNameMap = useMemo(
    () =>
      new Map(
        orgUnits.map((orgUnit) => [orgUnit.id, orgUnit.name])
      ),
    [orgUnits]
  )

  const filteredContacts = useMemo(() => {
    const keyword = contactSearch.trim().toLowerCase()
    return contacts
      .filter((contact) => {
        if (contactOrgFilter !== 'all' && contact.orgUnitId !== contactOrgFilter) return false
        if (!keyword) return true
        const merged = `${contact.employeeId} ${contact.name} ${contact.title} ${contact.mobile} ${contact.email}`.toLowerCase()
        return merged.includes(keyword)
      })
      .slice(0, 12)
  }, [contactOrgFilter, contactSearch, contacts])

  useEffect(() => {
    void refreshRooms()
  }, [refreshRooms])

  useEffect(() => {
    void refreshDirectory()
  }, [refreshDirectory])

  useEffect(() => {
    if (!activeRoomId) return
    void refreshMessages(activeRoomId)
    const timer = window.setInterval(() => {
      void refreshMessages(activeRoomId)
    }, 5000)
    return () => {
      window.clearInterval(timer)
    }
  }, [activeRoomId, refreshMessages])

  const handleCreateRoom = async () => {
    const name = newRoomName.trim()
    if (!name) {
      setError('请先填写会话名称')
      return
    }
    try {
      const room = await createOaRoom(
        {
          name,
          type: 'group',
          members: trimCsvMembers(newRoomMembers),
        },
        token,
        actor
      )
      setNewRoomName('')
      setNewRoomMembers('')
      setActiveRoomId(room.id)
      await refreshRooms()
      await refreshMessages(room.id)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建会话失败')
    }
  }

  const handleStartDirectChat = async (contact: OaContact) => {
    try {
      const room = await createOaRoom(
        {
          name: `${actor.displayName} × ${contact.name}`,
          type: 'direct',
          members: [contact.employeeId],
        },
        token,
        actor
      )
      setActiveRoomId(room.id)
      await refreshRooms()
      await refreshMessages(room.id)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '发起私聊失败')
    }
  }

  const handleSend = async () => {
    if (!activeRoomId) {
      setError('请先选择会话')
      return
    }
    const content = input.trim()
    if (!content) return

    setIsSending(true)
    setError('')
    try {
      await sendOaMessage({ roomId: activeRoomId, content }, token, actor)
      setInput('')
      await refreshMessages(activeRoomId)
      await refreshRooms()
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '发送失败')
    } finally {
      setIsSending(false)
    }
  }

  const handleUpload = async (file: File | null) => {
    if (!file) return
    if (!activeRoomId) {
      setError('请先选择会话后再上传附件')
      return
    }
    if (file.size <= 0) {
      setError('文件为空，请重新选择')
      return
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setError(`文件过大，单个文件请控制在 ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB 以内`)
      return
    }
    setIsUploading(true)
    setError('')
    try {
      await uploadOaFile({ file, roomId: activeRoomId }, token, actor)
      await refreshMessages(activeRoomId)
      await refreshRooms()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadOaFile(fileId, fileName, token, actor)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : '下载失败')
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权访问 OA 对话中心">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>OA 对话中心</CardTitle>
                  <CardDescription>Project Conversations & File Threads</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => {
                    void refreshRooms()
                    void refreshMessages(activeRoomId)
                    void refreshDirectory()
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                <Card className="border-white/10 bg-slate-950/35 text-white">
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400">联系人与组织</p>
                      <Button asChild variant="outline" size="sm" className="h-7 border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10">
                        <Link href="/dashboard/oa/contacts/">
                          管理
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>

                    <Input
                      value={contactSearch}
                      onChange={(event) => setContactSearch(event.target.value)}
                      placeholder="搜索姓名 / 工号 / 手机"
                      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    />
                    <select
                      value={contactOrgFilter}
                      onChange={(event) => setContactOrgFilter(event.target.value)}
                      className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    >
                      <option value="all" className="bg-[#0b1230] text-white">全部组织</option>
                      {orgUnits.map((orgUnit) => (
                        <option key={orgUnit.id} value={orgUnit.id} className="bg-[#0b1230] text-white">
                          {orgUnit.name}
                        </option>
                      ))}
                    </select>

                    <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                      {filteredContacts.map((contact) => (
                        <div key={contact.employeeId} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">{contact.name}</p>
                              <p className="truncate text-[11px] text-slate-400">
                                {contact.employeeId} · {contact.title || '未设岗位'} · {orgNameMap.get(contact.orgUnitId) || '未分配组织'}
                              </p>
                            </div>
                            <Badge className="h-5 bg-white/10 text-[10px] text-slate-200 hover:bg-white/10">
                              {contact.status === 'active' ? '在岗' : '停用'}
                            </Badge>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-white/15 bg-white/5 text-[11px] text-slate-200 hover:bg-white/10"
                              onClick={() =>
                                setNewRoomMembers((seed) => appendCsvMember(seed, contact.employeeId))
                              }
                            >
                              加入成员
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 bg-primary text-[11px] text-primary-foreground hover:bg-primary/90"
                              onClick={() => void handleStartDirectChat(contact)}
                            >
                              <UsersRound className="mr-1 h-3 w-3" />
                              私聊
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!isLoadingDirectory && filteredContacts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-slate-400">
                          未找到联系人，请前往“通讯录组织”添加。
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-950/35 text-white">
                  <CardContent className="space-y-2 p-3">
                    <p className="text-xs text-slate-400">新建会话</p>
                    <Input
                      value={newRoomName}
                      onChange={(event) => setNewRoomName(event.target.value)}
                      placeholder="例如：华东供应链战情群"
                      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    />
                    <Input
                      value={newRoomMembers}
                      onChange={(event) => setNewRoomMembers(event.target.value)}
                      placeholder="成员 employeeId，用逗号分隔"
                      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    />
                    <Button
                      className="min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleCreateRoom}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      创建会话
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-950/35 text-white">
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">会话列表</p>
                      <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{rooms.length}</Badge>
                    </div>
                    <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setActiveRoomId(room.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                            activeRoomId === room.id
                              ? 'border-primary/40 bg-primary/20 text-white'
                              : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                          }`}
                        >
                          <p className="truncate text-sm font-medium">{room.name}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{formatTime(room.lastMessageAt)}</p>
                        </button>
                      ))}
                      {rooms.length === 0 && !isLoadingRooms ? (
                        <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-slate-400">
                          当前没有可访问会话
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageSquareMore className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        {rooms.find((item) => item.id === activeRoomId)?.name || '请选择会话'}
                      </CardTitle>
                    </div>
                    <Badge className="bg-white/10 text-slate-300 hover:bg-white/10">
                      {isLoadingMessages ? '同步中' : `${messages.length} 条消息`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-[520px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#061331]/55 p-3">
                    {messages.map((item) => (
                      <MessageBlock
                        key={item.id}
                        item={item}
                        selfId={actor.employeeId}
                        onDownload={handleDownload}
                      />
                    ))}
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        暂无消息，开始发第一条吧
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                    <Input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          void handleSend()
                        }
                      }}
                      placeholder="输入消息，Enter 发送"
                      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs transition ${
                          activeRoomId
                            ? 'cursor-pointer border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                            : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-slate-500'
                        }`}
                      >
                        <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                        {isUploading ? '上传中...' : '上传文件'}
                        <input
                          type="file"
                          className="sr-only"
                          disabled={!activeRoomId || isUploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null
                            void handleUpload(file)
                            event.currentTarget.value = ''
                          }}
                        />
                      </label>
                      <Button
                        className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => void handleSend()}
                        disabled={!input.trim() || !activeRoomId || isSending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isSending ? '发送中' : '发送'}
                      </Button>
                    </div>
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
