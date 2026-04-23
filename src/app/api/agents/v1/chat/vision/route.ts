import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeRole } from '@/lib/access'
import { verifyEmbeddedSessionToken } from '@/lib/server/auth-session'
import { appendFileHistory } from '@/lib/server/agents-history-store'
import { getAgentsApiBaseUrl } from '@/lib/server/agents-endpoint'
import { requireAuthenticated } from '@/lib/server/llm-auth'

export const runtime = 'nodejs'

const readBearerToken = (request: NextRequest) => {
  const auth = request.headers.get('authorization') || ''
  const matched = auth.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const resolveActor = (request: NextRequest) => {
  const token = readBearerToken(request)
  const claims = verifyEmbeddedSessionToken(token)
  return {
    actorId: claims?.employeeId || claims?.sub || 'unknown',
    actorRole: normalizeRole(claims?.role),
  }
}

const visionSchema = z.object({
  message: z.string().trim().max(2000).optional(),
  session_id: z.string().trim().max(120).optional(),
})

const validateImageFile = (value: FormDataEntryValue | null): value is File =>
  value instanceof File && value.size > 0 && value.size <= 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actor = resolveActor(request)
  const formData = await request.formData()
  const image = formData.get('image')
  const normalizedSessionId = (formData.get('session_id') || '').toString().trim() || null
  if (!validateImageFile(image)) {
    try {
      await appendFileHistory({
        sessionId: normalizedSessionId,
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        fileName: 'invalid-file',
        mimeType: 'application/octet-stream',
        fileSize: 0,
        status: 'failed',
        reason: 'INVALID_IMAGE',
      })
    } catch {
      // Do not block request on history persistence failure.
    }

    return NextResponse.json(
      { message: '图片文件无效或超过大小限制（10MB）。', code: 'INVALID_IMAGE' },
      { status: 400 }
    )
  }

  const parsed = visionSchema.safeParse({
    message: formData.get('message') || undefined,
    session_id: normalizedSessionId || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { message: '图片分析参数无效。', code: 'INVALID_INPUT' },
      { status: 400 }
    )
  }

  const upstreamBody = new FormData()
  upstreamBody.append('image', image)
  upstreamBody.append('message', parsed.data.message || '请分析这张图片')
  if (parsed.data.session_id) {
    upstreamBody.append('session_id', parsed.data.session_id)
  }

  try {
    const upstream = await fetch(`${getAgentsApiBaseUrl()}/chat/vision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${readBearerToken(request)}` },
      body: upstreamBody,
    })

    const payload = await upstream
      .json()
      .catch(async () => ({ detail: await upstream.text().catch(() => '') }))

    try {
      await appendFileHistory({
        sessionId: parsed.data.session_id || null,
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        fileName: image.name,
        mimeType: image.type || 'application/octet-stream',
        fileSize: image.size,
        status: upstream.ok ? 'success' : 'failed',
        reason: upstream.ok ? null : 'VISION_UPSTREAM_ERROR',
      })
    } catch {
      // Do not block request on history persistence failure.
    }

    return NextResponse.json(payload, { status: upstream.status })
  } catch (error) {
    try {
      await appendFileHistory({
        sessionId: parsed.data.session_id || null,
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        fileName: image.name,
        mimeType: image.type || 'application/octet-stream',
        fileSize: image.size,
        status: 'failed',
        reason: 'VISION_UPSTREAM_UNAVAILABLE',
      })
    } catch {
      // Do not block request on history persistence failure.
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '图片分析服务不可用',
        code: 'VISION_UPSTREAM_UNAVAILABLE',
      },
      { status: 502 }
    )
  }
}
