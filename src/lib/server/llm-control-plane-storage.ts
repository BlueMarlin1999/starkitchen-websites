import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  LlmControlPlaneSnapshot,
  normalizeSnapshot,
} from '@/lib/server/llm-control-plane-types'

const CONTROL_PLANE_COOKIE_NAME = 'sk_llm_cp_v1'
const CONTROL_PLANE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16

const getEncryptionSecret = () => {
  const configuredSecret = process.env.LLM_CONFIG_SECRET || process.env.AUTH_SECRET
  if (configuredSecret?.trim()) {
    return configuredSecret.trim()
  }

  const fallbackSeed = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_ID,
    process.cwd(),
    'starkitchen-llm-control-plane-fallback',
  ]
    .filter((item) => Boolean(item && item.trim()))
    .join('|')

  return createHash('sha256').update(fallbackSeed).digest('hex')
}

const deriveAesKey = (secret: string) => createHash('sha256').update(secret).digest()

const encryptPayload = (value: unknown) => {
  const iv = randomBytes(IV_BYTES)
  const key = deriveAesKey(getEncryptionSecret())
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
}

const decryptPayload = (value: string): unknown => {
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length <= IV_BYTES + AUTH_TAG_BYTES) {
    throw new Error('Invalid cookie payload')
  }

  const iv = decoded.subarray(0, IV_BYTES)
  const authTag = decoded.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES)
  const encrypted = decoded.subarray(IV_BYTES + AUTH_TAG_BYTES)
  const key = deriveAesKey(getEncryptionSecret())

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  return JSON.parse(decrypted)
}

export const readControlPlaneSnapshot = (request: NextRequest): LlmControlPlaneSnapshot => {
  const encrypted = request.cookies.get(CONTROL_PLANE_COOKIE_NAME)?.value
  if (!encrypted) {
    return normalizeSnapshot(null)
  }

  try {
    return normalizeSnapshot(decryptPayload(encrypted))
  } catch (error) {
    console.warn('Failed to parse LLM control plane cookie, fallback to defaults.', error)
    return normalizeSnapshot(null)
  }
}

export const writeControlPlaneSnapshot = (
  response: NextResponse,
  snapshot: LlmControlPlaneSnapshot
) => {
  const encrypted = encryptPayload(snapshot)
  response.cookies.set({
    name: CONTROL_PLANE_COOKIE_NAME,
    value: encrypted,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CONTROL_PLANE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

export const jsonWithControlPlaneSnapshot = <T extends object>(
  payload: T,
  snapshotToPersist?: LlmControlPlaneSnapshot,
  init?: ResponseInit
) => {
  const response = NextResponse.json(payload, init)
  if (snapshotToPersist) {
    writeControlPlaneSnapshot(response, snapshotToPersist)
  }
  return response
}
