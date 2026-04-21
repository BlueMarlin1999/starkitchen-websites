import { URLSearchParams } from 'node:url'

export type ImPlatform = 'wecom' | 'feishu'
export type ImChannelMode = 'group' | 'direct'

export interface ImReplyDeliveryInput {
  platform: ImPlatform
  mode: ImChannelMode
  externalChatId: string
  senderEmployeeId: string
  reply: string
}

export interface ImReplyDeliveryResult {
  delivered: boolean
  channel: 'wecom-official' | 'feishu-official' | 'platform-webhook' | 'chat-webhook' | 'none'
  detail: string
}

const clip = (value: unknown, fallback = '', max = 500) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const readJson = async (response: Response) => {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

const postJson = async (url: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })

const resolvePlatformWebhook = (platform: ImPlatform) =>
  platform === 'wecom'
    ? clip(process.env.WECOM_OUTBOUND_WEBHOOK_URL, '', 500)
    : clip(process.env.FEISHU_OUTBOUND_WEBHOOK_URL, '', 500)

const buildWebhookPayload = (platform: ImPlatform, reply: string) => {
  if (platform === 'wecom') {
    return {
      msgtype: 'markdown',
      markdown: { content: reply },
    }
  }
  return {
    msg_type: 'text',
    content: { text: reply },
  }
}

const sendViaWebhook = async (input: {
  platform: ImPlatform
  endpoint: string
  reply: string
  channel: 'platform-webhook' | 'chat-webhook'
}): Promise<ImReplyDeliveryResult> => {
  try {
    const response = await postJson(input.endpoint, buildWebhookPayload(input.platform, input.reply))
    if (!response.ok) {
      return { delivered: false, channel: input.channel, detail: `HTTP_${response.status}` }
    }
    return { delivered: true, channel: input.channel, detail: 'OK' }
  } catch (error) {
    return {
      delivered: false,
      channel: input.channel,
      detail: error instanceof Error ? error.message : 'WEBHOOK_PUSH_FAILED',
    }
  }
}

const getWecomAccessToken = async () => {
  const corpId = clip(process.env.WECOM_CORP_ID, '', 120)
  const corpSecret = clip(process.env.WECOM_CORP_SECRET, '', 220)
  if (!corpId || !corpSecret) return ''

  const params = new URLSearchParams({ corpid: corpId, corpsecret: corpSecret })
  const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?${params.toString()}`)
  if (!response.ok) return ''
  const payload = await readJson(response)
  if (Number(payload.errcode || 0) !== 0) return ''
  return clip(payload.access_token, '', 300)
}

const buildWecomMessagePayload = (input: {
  mode: ImChannelMode
  externalChatId: string
  senderEmployeeId: string
  agentId: string
  reply: string
}) => {
  const normalizedText = clip(input.reply, '（空回复）', 3800)
  if (input.mode === 'group') {
    return {
      endpoint: 'https://qyapi.weixin.qq.com/cgi-bin/appchat/send',
      body: {
        chatid: input.externalChatId,
        msgtype: 'markdown',
        markdown: { content: normalizedText },
      },
    }
  }
  const agentId = Number.parseInt(input.agentId || '0', 10) || 1000002
  return {
    endpoint: 'https://qyapi.weixin.qq.com/cgi-bin/message/send',
    body: {
      touser: input.externalChatId || input.senderEmployeeId,
      msgtype: 'text',
      agentid: agentId,
      text: { content: normalizedText },
      safe: 0,
    },
  }
}

const sendViaWecomOfficial = async (
  input: ImReplyDeliveryInput
): Promise<ImReplyDeliveryResult> => {
  const token = await getWecomAccessToken()
  if (!token) return { delivered: false, channel: 'wecom-official', detail: 'TOKEN_UNAVAILABLE' }
  const payload = buildWecomMessagePayload({
    mode: input.mode,
    externalChatId: clip(input.externalChatId, '', 180),
    senderEmployeeId: clip(input.senderEmployeeId, '', 80),
    agentId: clip(process.env.WECOM_AGENT_ID, '1000002', 20),
    reply: input.reply,
  })

  const params = new URLSearchParams({ access_token: token })
  const response = await postJson(`${payload.endpoint}?${params.toString()}`, payload.body)
  if (!response.ok) return { delivered: false, channel: 'wecom-official', detail: `HTTP_${response.status}` }
  const result = await readJson(response)
  if (Number(result.errcode || 0) !== 0) {
    return {
      delivered: false,
      channel: 'wecom-official',
      detail: `ERR_${clip(result.errmsg, String(result.errcode || 'UNKNOWN'), 120)}`,
    }
  }
  return { delivered: true, channel: 'wecom-official', detail: 'OK' }
}

interface FeishuReceiveTarget {
  receiveIdType: 'chat_id' | 'open_id' | 'user_id'
  receiveId: string
}

const resolveFeishuTarget = (input: ImReplyDeliveryInput): FeishuReceiveTarget => {
  if (input.mode === 'group') {
    return { receiveIdType: 'chat_id', receiveId: clip(input.externalChatId, '', 180) }
  }
  const raw = clip(input.externalChatId, '', 180)
  if (raw.startsWith('open_id:')) {
    return { receiveIdType: 'open_id', receiveId: raw.slice('open_id:'.length) }
  }
  if (raw.startsWith('user_id:')) {
    return { receiveIdType: 'user_id', receiveId: raw.slice('user_id:'.length) }
  }
  return { receiveIdType: 'user_id', receiveId: raw || clip(input.senderEmployeeId, '', 80) }
}

const getFeishuTenantToken = async () => {
  const appId = clip(process.env.FEISHU_APP_ID, '', 120)
  const appSecret = clip(process.env.FEISHU_APP_SECRET, '', 220)
  if (!appId || !appSecret) return ''

  const response = await postJson(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    { app_id: appId, app_secret: appSecret }
  )
  if (!response.ok) return ''
  const payload = await readJson(response)
  if (Number(payload.code || 1) !== 0) return ''
  return clip(payload.tenant_access_token, '', 300)
}

const sendViaFeishuOfficial = async (
  input: ImReplyDeliveryInput
): Promise<ImReplyDeliveryResult> => {
  const token = await getFeishuTenantToken()
  if (!token) return { delivered: false, channel: 'feishu-official', detail: 'TOKEN_UNAVAILABLE' }
  const target = resolveFeishuTarget(input)
  if (!target.receiveId) {
    return { delivered: false, channel: 'feishu-official', detail: 'RECEIVE_ID_MISSING' }
  }

  const endpoint = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${target.receiveIdType}`
  const response = await postJson(
    endpoint,
    {
      receive_id: target.receiveId,
      msg_type: 'text',
      content: JSON.stringify({ text: clip(input.reply, '（空回复）', 3800) }),
    },
    { Authorization: `Bearer ${token}` }
  )

  if (!response.ok) return { delivered: false, channel: 'feishu-official', detail: `HTTP_${response.status}` }
  const result = await readJson(response)
  if (Number(result.code || 1) !== 0) {
    return {
      delivered: false,
      channel: 'feishu-official',
      detail: `ERR_${clip(result.msg, String(result.code || 'UNKNOWN'), 120)}`,
    }
  }
  return { delivered: true, channel: 'feishu-official', detail: 'OK' }
}

const sendViaOfficialApi = async (input: ImReplyDeliveryInput) => {
  if (input.platform === 'wecom') return sendViaWecomOfficial(input)
  return sendViaFeishuOfficial(input)
}

export const sendImReplyToPlatform = async (
  input: ImReplyDeliveryInput
): Promise<ImReplyDeliveryResult> => {
  const externalChatId = clip(input.externalChatId, '', 300)
  if (isHttpUrl(externalChatId)) {
    return sendViaWebhook({
      platform: input.platform,
      endpoint: externalChatId,
      reply: input.reply,
      channel: 'chat-webhook',
    })
  }

  const officialResult = await sendViaOfficialApi(input)
  if (officialResult.delivered) return officialResult

  const platformWebhook = resolvePlatformWebhook(input.platform)
  if (!platformWebhook) return officialResult

  const fallback = await sendViaWebhook({
    platform: input.platform,
    endpoint: platformWebhook,
    reply: input.reply,
    channel: 'platform-webhook',
  })

  if (fallback.delivered) return fallback
  return { delivered: false, channel: fallback.channel, detail: `${officialResult.detail};${fallback.detail}` }
}
