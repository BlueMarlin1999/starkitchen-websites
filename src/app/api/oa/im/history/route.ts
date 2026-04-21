import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  listImBridgeFileLogs,
  listImBridgeMessageLogs,
} from '@/lib/server/im-bridge-store'
import { appendOaAuditByRequest } from '@/lib/server/oa/context'

export const runtime = 'nodejs'

const querySchema = z.object({
  platform: z.enum(['wecom', 'feishu']).optional(),
  mode: z.enum(['group', 'direct']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  agentId: z.string().trim().max(64).optional(),
  senderEmployeeId: z.string().trim().max(80).optional(),
  channelId: z.string().trim().max(120).optional(),
  externalChatId: z.string().trim().max(180).optional(),
  status: z.enum(['success', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(120),
})

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedQuery = parseQueryWithSchema(request, querySchema, 'IM 历史查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }

  const filter = parsedQuery.data
  const [messages, files] = await Promise.all([
    listImBridgeMessageLogs(filter),
    listImBridgeFileLogs(filter),
  ])

  await appendOaAuditByRequest(request, {
    action: 'im.history.read',
    success: true,
    message: `读取 IM 历史：消息 ${messages.length} 条，文件 ${files.length} 条`,
  })

  return NextResponse.json({
    messages,
    files,
    total: {
      messages: messages.length,
      files: files.length,
    },
  })
}
