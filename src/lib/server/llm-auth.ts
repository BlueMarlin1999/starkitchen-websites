import { NextRequest, NextResponse } from 'next/server'
import { verifyEmbeddedSessionToken } from '@/lib/server/auth-session'

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return null
}

const localAdminTokenEnabledByEnv = parseBooleanFlag(process.env.ALLOW_LOCAL_ADMIN_TOKEN)
const allowAnyBearerTokenByEnv = parseBooleanFlag(process.env.ALLOW_ANY_BEARER_TOKEN)
const LOCAL_ADMIN_TOKEN = (process.env.LOCAL_ADMIN_TOKEN || '').trim()
const LOCAL_ADMIN_TOKEN_ENABLED =
  localAdminTokenEnabledByEnv ?? Boolean(LOCAL_ADMIN_TOKEN)
const ALLOW_ANY_BEARER_TOKEN = allowAnyBearerTokenByEnv ?? false

const readBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

const isLocalAdminToken = (token: string) =>
  Boolean(LOCAL_ADMIN_TOKEN_ENABLED && LOCAL_ADMIN_TOKEN && token === LOCAL_ADMIN_TOKEN)

const isAllowedByEnv = (token: string) => {
  if (!token) return false
  if (process.env.LLM_ADMIN_TOKEN && token === process.env.LLM_ADMIN_TOKEN.trim()) {
    return true
  }

  const tokenList = (process.env.LLM_ADMIN_TOKENS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return tokenList.includes(token)
}

const resolveEmbeddedClaims = (token: string) => {
  if (!token) return null
  return verifyEmbeddedSessionToken(token)
}

const hasManagerRole = (role: string) => {
  const normalized = role.trim().toLowerCase()
  return ['ceo', 'coo', 'vp', 'director', 'admin', 'superadmin'].includes(normalized)
}

const isAuthenticatedToken = (token: string) => {
  if (!token) return false
  if (isLocalAdminToken(token)) return true
  if (isAllowedByEnv(token)) return true
  if (resolveEmbeddedClaims(token)) return true
  return ALLOW_ANY_BEARER_TOKEN
}

const maskToken = (token: string) => {
  if (!token) return 'anonymous'
  if (token.length <= 10) return `${token.slice(0, 3)}***`
  return `${token.slice(0, 4)}***${token.slice(-3)}`
}

export const resolveAuditActor = (request: NextRequest) => {
  const explicitActorId =
    request.headers.get('x-actor-id')?.trim() ||
    request.headers.get('x-user-id')?.trim() ||
    request.headers.get('x-employee-id')?.trim() ||
    ''
  if (explicitActorId) return explicitActorId

  const token = readBearerToken(request)
  if (isLocalAdminToken(token)) return 'local-admin'

  const sessionClaims = resolveEmbeddedClaims(token)
  if (sessionClaims?.employeeId) return sessionClaims.employeeId
  if (sessionClaims?.sub) return sessionClaims.sub

  return maskToken(token)
}

export const canManageLlmControlPlane = (request: NextRequest) => {
  const token = readBearerToken(request)
  if (!token) return false
  if (isLocalAdminToken(token) || isAllowedByEnv(token)) return true

  const sessionClaims = resolveEmbeddedClaims(token)
  if (!sessionClaims) return false
  return hasManagerRole(sessionClaims.role)
}

export const requireAuthenticated = (request: NextRequest) => {
  const token = readBearerToken(request)
  if (isAuthenticatedToken(token)) return null
  return NextResponse.json(
    {
      message: token ? '认证凭证无效或已过期。请重新登录。' : '需要登录后访问。请先完成认证。',
      code: 'AUTH_REQUIRED',
    },
    { status: 401 }
  )
}

export const requireLlmManager = (request: NextRequest) => {
  if (canManageLlmControlPlane(request)) return null
  return NextResponse.json(
    {
      message: '需要管理权限。请使用具备模型管理权限的账号。',
      code: 'LLM_MANAGER_REQUIRED',
    },
    { status: 401 }
  )
}
