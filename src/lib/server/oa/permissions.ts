import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, normalizeRole, UserRole } from '@/lib/access'
import { verifyEmbeddedSessionToken } from '@/lib/server/auth-session'

const OA_DIRECTORY_ADMIN_ROLES: UserRole[] = ['ceo', 'coo', 'vp', 'director']
const OA_AUDIT_READ_ROLES: UserRole[] = ['ceo', 'coo', 'vp', 'director']

const readBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched?.[1]?.trim() || ''
}

export const resolveOaRequestRole = (request: NextRequest): UserRole => {
  const token = readBearerToken(request)
  const claims = verifyEmbeddedSessionToken(token)
  if (claims?.role) return normalizeRole(claims.role)
  const roleByHeader = request.headers.get('x-user-role')?.trim()
  return normalizeRole(roleByHeader)
}

export const canReadOaDirectory = (role: UserRole) => hasPermission(role, 'view_dashboard')

export const canManageOaDirectory = (role: UserRole) =>
  OA_DIRECTORY_ADMIN_ROLES.includes(role) ||
  hasPermission(role, 'manage_users') ||
  hasPermission(role, 'manage_access_control')

export const canReadOaAudit = (role: UserRole, actorId: string) => {
  const normalizedActorId = actorId.trim().toLowerCase()
  if (normalizedActorId === 'local-admin' || normalizedActorId.startsWith('admin-')) return true
  return OA_AUDIT_READ_ROLES.includes(role)
}

export const buildPermissionDeniedResponse = (message: string) =>
  NextResponse.json(
    {
      message,
      code: 'OA_PERMISSION_DENIED',
    },
    { status: 403 }
  )
