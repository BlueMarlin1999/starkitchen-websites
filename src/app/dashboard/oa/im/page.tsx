'use client'

import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  bootstrapOaImChannels,
  fetchOaImChannels,
  fetchOaImHistory,
  OaActorContext,
  OaImAgentChannel,
  OaImChannelMode,
  OaImBridgeFileLog,
  OaImBridgeMessageLog,
  OaImPlatform,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { RefreshCw, Wifi } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

interface ImBridgeMutableState {
  platform: OaImPlatform
  setPlatform: (value: OaImPlatform) => void
  appId: string
  setAppId: (value: string) => void
  tenantId: string
  setTenantId: (value: string) => void
  webhookTokenHint: string
  setWebhookTokenHint: (value: string) => void
  integrationEnabled: boolean
  setIntegrationEnabled: Dispatch<SetStateAction<boolean>>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  isBootstrapping: boolean
  setIsBootstrapping: Dispatch<SetStateAction<boolean>>
  error: string
  setError: Dispatch<SetStateAction<string>>
  channels: OaImAgentChannel[]
  setChannels: Dispatch<SetStateAction<OaImAgentChannel[]>>
  messages: OaImBridgeMessageLog[]
  setMessages: Dispatch<SetStateAction<OaImBridgeMessageLog[]>>
  files: OaImBridgeFileLog[]
  setFiles: Dispatch<SetStateAction<OaImBridgeFileLog[]>>
  historyAgentId: string
  setHistoryAgentId: Dispatch<SetStateAction<string>>
  historyMode: '' | OaImChannelMode
  setHistoryMode: Dispatch<SetStateAction<'' | OaImChannelMode>>
  historyDirection: '' | 'inbound' | 'outbound'
  setHistoryDirection: Dispatch<SetStateAction<'' | 'inbound' | 'outbound'>>
  historySenderEmployeeId: string
  setHistorySenderEmployeeId: Dispatch<SetStateAction<string>>
  historyChannelId: string
  setHistoryChannelId: Dispatch<SetStateAction<string>>
}

const useImBridgeMutableState = (): ImBridgeMutableState => {
  const [platform, setPlatform] = useState<OaImPlatform>('wecom')
  const [appId, setAppId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [webhookTokenHint, setWebhookTokenHint] = useState('')
  const [integrationEnabled, setIntegrationEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState<OaImAgentChannel[]>([])
  const [messages, setMessages] = useState<OaImBridgeMessageLog[]>([])
  const [files, setFiles] = useState<OaImBridgeFileLog[]>([])
  const [historyAgentId, setHistoryAgentId] = useState('')
  const [historyMode, setHistoryMode] = useState<'' | OaImChannelMode>('')
  const [historyDirection, setHistoryDirection] = useState<'' | 'inbound' | 'outbound'>('')
  const [historySenderEmployeeId, setHistorySenderEmployeeId] = useState('')
  const [historyChannelId, setHistoryChannelId] = useState('')
  return {
    platform, setPlatform, appId, setAppId, tenantId, setTenantId, webhookTokenHint, setWebhookTokenHint,
    integrationEnabled, setIntegrationEnabled, isLoading, setIsLoading, isBootstrapping, setIsBootstrapping,
    error, setError, channels, setChannels, messages, setMessages, files, setFiles,
    historyAgentId, setHistoryAgentId, historyMode, setHistoryMode, historyDirection, setHistoryDirection,
    historySenderEmployeeId, setHistorySenderEmployeeId, historyChannelId, setHistoryChannelId,
  }
}

interface ImBridgeViewModel {
  platform: OaImPlatform
  setPlatform: (value: OaImPlatform) => void
  appId: string
  setAppId: (value: string) => void
  tenantId: string
  setTenantId: (value: string) => void
  webhookTokenHint: string
  setWebhookTokenHint: (value: string) => void
  integrationEnabled: boolean
  toggleEnabled: () => void
  isLoading: boolean
  isBootstrapping: boolean
  error: string
  channels: OaImAgentChannel[]
  messages: OaImBridgeMessageLog[]
  files: OaImBridgeFileLog[]
  historyAgentId: string
  setHistoryAgentId: Dispatch<SetStateAction<string>>
  historyMode: '' | OaImChannelMode
  setHistoryMode: Dispatch<SetStateAction<'' | OaImChannelMode>>
  historyDirection: '' | 'inbound' | 'outbound'
  setHistoryDirection: Dispatch<SetStateAction<'' | 'inbound' | 'outbound'>>
  historySenderEmployeeId: string
  setHistorySenderEmployeeId: Dispatch<SetStateAction<string>>
  historyChannelId: string
  setHistoryChannelId: Dispatch<SetStateAction<string>>
  refresh: () => Promise<void>
  bootstrap: () => Promise<void>
}

const useImBridgeRefresh = (input: {
  actor: OaActorContext
  token: string
  state: ImBridgeMutableState
}) => {
  const { actor, token, state } = input
  return useCallback(async () => {
    state.setIsLoading(true)
    state.setError('')
    try {
      const [channelPayload, historyPayload] = await Promise.all([
        fetchOaImChannels(
          {
            platform: state.platform,
            agentId: state.historyAgentId || undefined,
            mode: state.historyMode || undefined,
          },
          token,
          actor
        ),
        fetchOaImHistory(
          {
            platform: state.platform,
            agentId: state.historyAgentId || undefined,
            mode: state.historyMode || undefined,
            direction: state.historyDirection || undefined,
            senderEmployeeId: state.historySenderEmployeeId || undefined,
            channelId: state.historyChannelId || undefined,
            limit: 200,
          },
          token,
          actor
        ),
      ])
      state.setChannels(channelPayload.channels || [])
      state.setMessages(historyPayload.messages || [])
      state.setFiles(historyPayload.files || [])
      const config = (channelPayload.integrations || []).find((item) => item.platform === state.platform)
      if (config) {
        state.setAppId(config.appId || '')
        state.setTenantId(config.tenantId || '')
        state.setWebhookTokenHint(config.webhookTokenHint || '')
        state.setIntegrationEnabled(config.enabled !== false)
      }
    } catch (loadError) {
      state.setError(loadError instanceof Error ? loadError.message : '读取 IM 数据失败')
    } finally {
      state.setIsLoading(false)
    }
  }, [actor, state, token])
}

const useImBridgeBootstrap = (input: {
  actor: OaActorContext
  token: string
  state: ImBridgeMutableState
  refresh: () => Promise<void>
}) => {
  const { actor, token, state, refresh } = input
  return useCallback(async () => {
    state.setIsBootstrapping(true)
    state.setError('')
    try {
      await bootstrapOaImChannels(
        {
          platform: state.platform,
          integration: {
            enabled: state.integrationEnabled,
            appId: state.appId,
            tenantId: state.tenantId,
            webhookTokenHint: state.webhookTokenHint,
          },
          directorySync: {
            source: 'auto',
            strictRemote: false,
            onlyActive: false,
          },
        },
        token,
        actor
      )
      await refresh()
    } catch (bootstrapError) {
      state.setError(bootstrapError instanceof Error ? bootstrapError.message : '创建映射失败')
    } finally {
      state.setIsBootstrapping(false)
    }
  }, [actor, refresh, state, token])
}

const useImBridgeActions = (input: {
  actor: OaActorContext
  token: string
  state: ImBridgeMutableState
}) => {
  const refresh = useImBridgeRefresh(input)
  const bootstrap = useImBridgeBootstrap({ ...input, refresh })
  return { refresh, bootstrap }
}

const useImBridgeViewModel = (actor: OaActorContext, token: string): ImBridgeViewModel => {
  const state = useImBridgeMutableState()
  const { refresh, bootstrap } = useImBridgeActions({ actor, token, state })
  useEffect(() => {
    void refresh()
  }, [refresh])
  return {
    platform: state.platform,
    setPlatform: state.setPlatform,
    appId: state.appId,
    setAppId: state.setAppId,
    tenantId: state.tenantId,
    setTenantId: state.setTenantId,
    webhookTokenHint: state.webhookTokenHint,
    setWebhookTokenHint: state.setWebhookTokenHint,
    integrationEnabled: state.integrationEnabled,
    toggleEnabled: () => state.setIntegrationEnabled((value) => !value),
    isLoading: state.isLoading,
    isBootstrapping: state.isBootstrapping,
    error: state.error,
    channels: state.channels,
    messages: state.messages,
    files: state.files,
    historyAgentId: state.historyAgentId,
    setHistoryAgentId: state.setHistoryAgentId,
    historyMode: state.historyMode,
    setHistoryMode: state.setHistoryMode,
    historyDirection: state.historyDirection,
    setHistoryDirection: state.setHistoryDirection,
    historySenderEmployeeId: state.historySenderEmployeeId,
    setHistorySenderEmployeeId: state.setHistorySenderEmployeeId,
    historyChannelId: state.historyChannelId,
    setHistoryChannelId: state.setHistoryChannelId,
    refresh,
    bootstrap,
  }
}

const BridgeStatusCard = ({ view }: { view: ImBridgeViewModel }) => (
  <Card className={panelClassName}>
    <CardHeader>
      <CardTitle>企微 / 飞书桥接总览</CardTitle>
      <CardDescription>12 智能体群聊与私聊映射 + 消息/文件可审计</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-200">
        <p>Webhook（企微）: <code>/api/oa/im/webhook/wecom?token=***</code></p>
        <p>Webhook（飞书）: <code>/api/oa/im/webhook/feishu?token=***</code></p>
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-200">
        <p>平台：{view.platform === 'wecom' ? '企业微信' : '飞书'}</p>
        <p>通道：{view.isLoading ? '--' : view.channels.length}</p>
        <p>消息：{view.isLoading ? '--' : view.messages.length}</p>
        <p>文件：{view.isLoading ? '--' : view.files.length}</p>
      </div>
    </CardContent>
  </Card>
)

const BridgeConfigCard = ({ view }: { view: ImBridgeViewModel }) => (
  <Card className={panelClassName}>
    <CardHeader>
      <CardTitle>配置与建群</CardTitle>
      <CardDescription>一键创建 12 智能体 ×（群聊 + 私聊）映射</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3 md:grid-cols-5">
      <select
        value={view.platform}
        onChange={(event) => view.setPlatform(event.target.value as OaImPlatform)}
        className="h-11 rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
      >
        <option value="wecom" className="bg-[#0b1230] text-white">企业微信</option>
        <option value="feishu" className="bg-[#0b1230] text-white">飞书</option>
      </select>
      <Input value={view.appId} onChange={(event) => view.setAppId(event.target.value)} placeholder="App ID" className="border-white/15 bg-white/10 text-white placeholder:text-slate-400" />
      <Input value={view.tenantId} onChange={(event) => view.setTenantId(event.target.value)} placeholder="Tenant ID" className="border-white/15 bg-white/10 text-white placeholder:text-slate-400" />
      <Input value={view.webhookTokenHint} onChange={(event) => view.setWebhookTokenHint(event.target.value)} placeholder="Webhook Token Hint" className="border-white/15 bg-white/10 text-white placeholder:text-slate-400" />
      <Button variant="outline" onClick={view.toggleEnabled} className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
        {view.integrationEnabled ? '已启用' : '已停用'}
      </Button>
      <div className="md:col-span-5 flex flex-wrap gap-2">
        <Button onClick={() => void view.bootstrap()} disabled={view.isBootstrapping} className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
          <Wifi className="mr-2 h-4 w-4" />
          {view.isBootstrapping ? '创建中...' : '一键创建映射'}
        </Button>
        <Button variant="outline" onClick={() => void view.refresh()} className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
        <Button asChild variant="outline" className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
          <Link href="/dashboard/oa/chat/">打开 OA 对话中心</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)

const HISTORY_MODE_OPTIONS: Array<{ value: '' | OaImChannelMode; label: string }> = [
  { value: '', label: '全部模式' },
  { value: 'group', label: '群聊' },
  { value: 'direct', label: '私聊' },
]

const HISTORY_DIRECTION_OPTIONS: Array<{ value: '' | 'inbound' | 'outbound'; label: string }> = [
  { value: '', label: '全部方向' },
  { value: 'inbound', label: '外部入站' },
  { value: 'outbound', label: '智能体出站' },
]

const resetHistoryFilters = (view: ImBridgeViewModel) => {
  view.setHistoryAgentId('')
  view.setHistoryMode('')
  view.setHistoryDirection('')
  view.setHistorySenderEmployeeId('')
  view.setHistoryChannelId('')
}

const HistoryFilterControls = ({ view }: { view: ImBridgeViewModel }) => (
  <>
    <Input
      value={view.historyAgentId}
      onChange={(event) => view.setHistoryAgentId(event.target.value.trim())}
      placeholder="agentId（如 cos_zhuge_liang）"
      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
    />
    <select
      value={view.historyMode}
      onChange={(event) => view.setHistoryMode(event.target.value as '' | OaImChannelMode)}
      className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
    >
      {HISTORY_MODE_OPTIONS.map((option) => (
        <option key={option.label} value={option.value} className="bg-[#0b1230] text-white">{option.label}</option>
      ))}
    </select>
    <select
      value={view.historyDirection}
      onChange={(event) => view.setHistoryDirection(event.target.value as '' | 'inbound' | 'outbound')}
      className="h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
    >
      {HISTORY_DIRECTION_OPTIONS.map((option) => (
        <option key={option.label} value={option.value} className="bg-[#0b1230] text-white">{option.label}</option>
      ))}
    </select>
    <Input
      value={view.historySenderEmployeeId}
      onChange={(event) => view.setHistorySenderEmployeeId(event.target.value.trim())}
      placeholder="发送人 employeeId"
      className="border-white/15 bg-white/10 text-white placeholder:text-slate-400"
    />
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => void view.refresh()}
        className="h-10 flex-1 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
      >
        应用
      </Button>
      <Button
        variant="outline"
        onClick={() => resetHistoryFilters(view)}
        className="h-10 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
      >
        清空
      </Button>
    </div>
  </>
)

const HistoryFilterCard = ({ view }: { view: ImBridgeViewModel }) => (
  <Card className={panelClassName}>
    <CardHeader>
      <CardTitle>审计筛选器</CardTitle>
      <CardDescription>按智能体 / 通道 / 人员 / 方向快速定位对话与文件。</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3 md:grid-cols-5">
      <HistoryFilterControls view={view} />
      <Input
        value={view.historyChannelId}
        onChange={(event) => view.setHistoryChannelId(event.target.value.trim())}
        placeholder="通道ID / 点击左侧映射自动填充"
        className="md:col-span-5 border-white/15 bg-white/10 text-white placeholder:text-slate-400"
      />
    </CardContent>
  </Card>
)

const ChannelListCard = (input: {
  channels: OaImAgentChannel[]
  selectedChannelId: string
  onSelectChannel: (channelId: string) => void
}) => (
  <Card className={panelClassName}>
    <CardHeader>
      <CardTitle>通道映射（{input.channels.length}）</CardTitle>
    </CardHeader>
    <CardContent className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
      {input.channels.map((channel) => (
        <button
          key={channel.id}
          type="button"
          onClick={() => input.onSelectChannel(channel.id)}
          className={`w-full rounded-xl border bg-slate-950/35 p-3 text-left ${
            input.selectedChannelId === channel.id ? 'border-primary/50 ring-1 ring-primary/40' : 'border-white/10'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/10 text-slate-100">{channel.agentId}</Badge>
            <Badge className="bg-primary/20 text-primary">{channel.mode === 'group' ? '群聊' : '私聊'}</Badge>
            <Badge className="bg-white/10 text-slate-300">{channel.ownerName}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-400">External Chat: {channel.externalChatId}</p>
          <p className="mt-1 text-xs text-slate-400">Channel ID: {channel.id}</p>
          <p className="mt-1 text-xs text-slate-400">OA Room: {channel.oaRoomId}</p>
          <p className="mt-1 text-xs text-slate-500">{formatTime(channel.updatedAt)}</p>
        </button>
      ))}
      {input.channels.length === 0 ? <p className="text-sm text-slate-400">暂无映射，请先一键创建。</p> : null}
    </CardContent>
  </Card>
)

const LogCard = ({
  title,
  items,
  render,
}: {
  title: string
  items: Array<OaImBridgeMessageLog | OaImBridgeFileLog>
  render: (item: OaImBridgeMessageLog | OaImBridgeFileLog) => ReactNode
}) => (
  <Card className={panelClassName}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
      {items.map((item) => render(item))}
      {items.length === 0 ? <p className="text-sm text-slate-400">暂无记录</p> : null}
    </CardContent>
  </Card>
)

const MessageRow = (item: OaImBridgeMessageLog) => (
  <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
    <p className="text-xs text-slate-300">
      {item.senderName} · {item.resolvedAgentId} · {item.mode === 'group' ? '群聊' : '私聊'}
    </p>
    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.content || '(空消息)'}</p>
    <p className="mt-1 text-[11px] text-slate-500">
      {item.direction === 'inbound' ? '入站' : '出站'} · {item.status === 'success' ? '成功' : '失败'} · {item.channelId}
    </p>
    <p className="mt-1 text-[11px] text-slate-500">{formatTime(item.createdAt)}</p>
  </div>
)

const FileRow = (item: OaImBridgeFileLog) => (
  <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/35 p-2.5">
    <p className="text-xs text-slate-300">{item.fileName}</p>
    <p className="mt-1 text-[11px] text-slate-400">
      {item.senderName} · {item.mode === 'group' ? '群聊' : '私聊'} · {Math.round((item.fileSize || 0) / 1024)} KB
    </p>
    <p className="mt-1 text-[11px] text-slate-500">
      {item.status === 'success' ? '成功' : '失败'} · {item.channelId}
    </p>
    <p className="mt-1 text-[11px] text-slate-500">{formatTime(item.createdAt)}</p>
  </div>
)

export default function OaImBridgePage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )
  const view = useImBridgeViewModel(actor, token)

  return (
    <DashboardLayout>
      <AccessGuard permission="manage_access_control" title="当前账号无权访问 IM 桥接管理">
        <div className="space-y-4">
          <BridgeStatusCard view={view} />
          <BridgeConfigCard view={view} />
          <HistoryFilterCard view={view} />
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <ChannelListCard
              channels={view.channels}
              selectedChannelId={view.historyChannelId}
              onSelectChannel={(channelId) => view.setHistoryChannelId(channelId)}
            />
            <div className="space-y-4">
              <LogCard title={`消息审计（${view.messages.length}）`} items={view.messages} render={(item) => MessageRow(item as OaImBridgeMessageLog)} />
              <LogCard title={`文件审计（${view.files.length}）`} items={view.files} render={(item) => FileRow(item as OaImBridgeFileLog)} />
            </div>
          </div>
          {view.error ? <Card className="border-red-400/25 bg-red-500/10 text-red-100"><CardContent className="p-4 text-sm">{view.error}</CardContent></Card> : null}
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
