import { createHmac, timingSafeEqual } from 'node:crypto'

export interface EmbeddedSessionClaims {
  sub: string
  employeeId: string
  name: string
  role: string
  scopePath: string[]
  iat: number
  exp: number
}

const isProductionRuntime = process.env.NODE_ENV === 'production'

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

const parsePositiveInt = (value: string | undefined, fallback: number, min: number, max: number) => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const allowDevFallbackSecretByEnv = parseBooleanFlag(process.env.ALLOW_DEV_FALLBACK_AUTH_SECRET)
const TOKEN_TTL_SECONDS = parsePositiveInt(process.env.EMBEDDED_AUTH_TOKEN_TTL_SECONDS, 8 * 60 * 60, 5 * 60, 7 * 24 * 60 * 60)
const SIGNING_SECRET = (process.env.EMBEDDED_AUTH_SIGNING_SECRET || '').trim()
const DEV_FALLBACK_SIGNING_MATERIAL = ['starkitchen', 'embedded', 'auth', 'dev', 'material'].join('-')
const ALLOW_DEV_FALLBACK_SECRET = !isProductionRuntime && (allowDevFallbackSecretByEnv ?? true)

const resolveSigningSecret = () => {
  if (SIGNING_SECRET) return SIGNING_SECRET
  if (ALLOW_DEV_FALLBACK_SECRET) return DEV_FALLBACK_SIGNING_MATERIAL
  return ''
}

const b64urlEncode = (input: string) => Buffer.from(input, 'utf8').toString('base64url')
const b64urlDecode = (input: string) => Buffer.from(input, 'base64url').toString('utf8')

const sign = (payloadSegment: string, secret: string) =>
  createHmac('sha256', secret).update(payloadSegment).digest('base64url')

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

const normalizeScopePath = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim().slice(0, 120) : ''))
        .filter(Boolean)
        .slice(0, 16)
    : []

const normalizeClaims = (value: unknown): EmbeddedSessionClaims | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<EmbeddedSessionClaims>

  const sub = typeof record.sub === 'string' ? record.sub.trim().slice(0, 120) : ''
  const employeeId = typeof record.employeeId === 'string' ? record.employeeId.trim().slice(0, 120) : ''
  const name = typeof record.name === 'string' ? record.name.trim().slice(0, 120) : ''
  const role = typeof record.role === 'string' ? record.role.trim().slice(0, 60) : ''
  const scopePath = normalizeScopePath(record.scopePath)
  const iat = typeof record.iat === 'number' ? Math.floor(record.iat) : 0
  const exp = typeof record.exp === 'number' ? Math.floor(record.exp) : 0

  if (!sub || !employeeId || !name || !iat || !exp || exp <= iat) return null
  return {
    sub,
    employeeId,
    name,
    role,
    scopePath: scopePath.length > 0 ? scopePath : ['global'],
    iat,
    exp,
  }
}

export const createEmbeddedSessionToken = (input: {
  sub: string
  employeeId: string
  name: string
  role: string
  scopePath?: string[]
  nowMs?: number
}) => {
  const secret = resolveSigningSecret()
  if (!secret) return ''

  const now = Math.floor((input.nowMs ?? Date.now()) / 1000)
  const scopePath = normalizeScopePath(input.scopePath)
  const claims: EmbeddedSessionClaims = {
    sub: input.sub.trim().slice(0, 120),
    employeeId: input.employeeId.trim().slice(0, 120),
    name: input.name.trim().slice(0, 120),
    role: input.role.trim().slice(0, 60),
    scopePath: scopePath.length > 0 ? scopePath : ['global'],
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }

  if (!claims.sub || !claims.employeeId || !claims.name) return ''

  const payload = b64urlEncode(JSON.stringify(claims))
  const signature = sign(payload, secret)
  return `v1.${payload}.${signature}`
}

export const verifyEmbeddedSessionToken = (token: string, nowMs = Date.now()) => {
  const normalized = token.trim()
  if (!normalized) return null
  const secret = resolveSigningSecret()
  if (!secret) return null

  const parts = normalized.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return null
  const payloadSegment = parts[1]
  const signatureSegment = parts[2]

  const expectedSignature = sign(payloadSegment, secret)
  if (!safeEqual(signatureSegment, expectedSignature)) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(b64urlDecode(payloadSegment))
  } catch {
    return null
  }

  const claims = normalizeClaims(parsed)
  if (!claims) return null

  const nowSeconds = Math.floor(nowMs / 1000)
  if (claims.exp <= nowSeconds) return null
  if (claims.iat > nowSeconds + 60) return null

  return claims
}
