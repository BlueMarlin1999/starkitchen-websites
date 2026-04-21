import { NextRequest } from 'next/server'
import { appendOaAuditEvent } from '@/lib/server/oa/storage'
import { OaAuditAction, OaAuditGeo } from '@/lib/server/oa/types'
import { resolveAuditActor } from '@/lib/server/llm-auth'

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const decodeHeaderValue = (value: unknown, fallback = '', max = 200) => {
  const normalized = clip(value, '', max)
  if (!normalized) return fallback

  // Frontend may URL-encode non-ASCII header values to avoid browser header validation errors.
  try {
    return clip(decodeURIComponent(normalized), fallback, max)
  } catch {
    return clip(normalized, fallback, max)
  }
}

export const resolveOaActorId = (request: NextRequest) => {
  const explicit =
    decodeHeaderValue(request.headers.get('x-employee-id'), '', 80) ||
    decodeHeaderValue(request.headers.get('x-user-id'), '', 80) ||
    decodeHeaderValue(request.headers.get('x-actor-id'), '', 80)
  if (explicit) return explicit
  return resolveAuditActor(request)
}

export const resolveOaActorName = (request: NextRequest) =>
  decodeHeaderValue(request.headers.get('x-actor-name'), '', 80) ||
  decodeHeaderValue(request.headers.get('x-user-name'), '', 80) ||
  resolveOaActorId(request)

export const resolveRequestIp = (request: NextRequest) => {
  const xff = request.headers.get('x-forwarded-for') || ''
  const first = xff
    .split(',')
    .map((segment) => segment.trim())
    .find(Boolean)
  if (first) return first
  return (
    clip(request.headers.get('x-real-ip'), '', 120) ||
    clip(request.headers.get('x-vercel-forwarded-for'), '', 120) ||
    '0.0.0.0'
  )
}

export const resolveGeoByHeaders = (request: NextRequest): OaAuditGeo => {
  const country =
    clip(request.headers.get('x-vercel-ip-country'), '', 80) ||
    clip(request.headers.get('cf-ipcountry'), '', 80) ||
    '未知'
  const region =
    clip(request.headers.get('x-vercel-ip-country-region'), '', 80) ||
    clip(request.headers.get('x-vercel-ip-region'), '', 80) ||
    '未知'
  const city = clip(request.headers.get('x-vercel-ip-city'), '', 80) || '未知'
  return {
    country,
    region,
    city,
  }
}

export const appendOaAuditByRequest = async (
  request: NextRequest,
  payload: {
    action: OaAuditAction
    success: boolean
    entityId?: string
    message: string
  }
) =>
  appendOaAuditEvent({
    action: payload.action,
    actorId: resolveOaActorId(request),
    actorName: resolveOaActorName(request),
    ipAddress: resolveRequestIp(request),
    geo: resolveGeoByHeaders(request),
    userAgent: clip(request.headers.get('user-agent'), 'unknown', 260),
    path: request.nextUrl.pathname,
    entityId: clip(payload.entityId, '', 80),
    success: payload.success,
    message: payload.message,
  })
