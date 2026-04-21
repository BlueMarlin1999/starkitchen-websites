import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createEmbeddedSessionToken } from '@/lib/server/auth-session'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import {
  hasAuthAccountRegistryEnabled,
  looksLikeMobileCredential,
  resolveLoginAccountByCredential,
  verifyLoginPassword,
} from '@/lib/server/auth-accounts'
import { appendAuthLoginAuditByRequest } from '@/lib/server/auth-login-audit'

export const runtime = 'nodejs'

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

const clip = (value: unknown, max = 120) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const localAuthEnabledByEnv = parseBooleanFlag(process.env.ENABLE_EMBEDDED_AUTH)
const LOCAL_AUTH_ENABLED = localAuthEnabledByEnv ?? true

const loginPayloadSchema = z.object({
  employeeId: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
})

const appendAudit = (
  request: NextRequest,
  payload: {
    identifier: string
    status: 'success' | 'failed' | 'blocked'
    securityFlag: string
    reason: string
    employeeId?: string
    fullName?: string
    role?: string
    mobileMasked?: string
  }
) =>
  appendAuthLoginAuditByRequest(request, {
    identifier: payload.identifier,
    credentialType: looksLikeMobileCredential(payload.identifier) ? 'mobile' : 'employee_id',
    employeeId: payload.employeeId,
    fullName: payload.fullName,
    role: payload.role,
    mobileMasked: payload.mobileMasked,
    status: payload.status,
    securityFlag: payload.securityFlag,
    reason: payload.reason,
  })

const buildUnavailableResponse = () =>
  NextResponse.json(
    {
      message: '当前环境未配置可用登录账户，请配置 EMBEDDED_AUTH_USERS_JSON（含手机号）后重试。',
    },
    { status: 503 }
  )

export async function POST(request: NextRequest) {
  if (!LOCAL_AUTH_ENABLED) {
    await appendAudit(request, {
      identifier: 'anonymous',
      status: 'blocked',
      securityFlag: '认证服务未启用',
      reason: 'ENABLE_EMBEDDED_AUTH=false',
    })
    return NextResponse.json(
      {
        message: '当前环境未启用内置认证，请配置后端认证服务。',
      },
      { status: 503 }
    )
  }

  if (!(await hasAuthAccountRegistryEnabled())) {
    await appendAudit(request, {
      identifier: 'anonymous',
      status: 'failed',
      securityFlag: '账号库未配置',
      reason: 'AUTH_REGISTRY_EMPTY',
    })
    return buildUnavailableResponse()
  }

  const parsedPayload = await parseJsonWithSchema(request, loginPayloadSchema, '登录参数不合法。')
  if (!parsedPayload.ok) {
    await appendAudit(request, {
      identifier: 'unknown',
      status: 'failed',
      securityFlag: '登录参数非法',
      reason: 'PAYLOAD_INVALID',
    })
    return parsedPayload.response
  }

  const identifier = clip(parsedPayload.data.employeeId, 80)
  const password = clip(parsedPayload.data.password, 200)
  if (!identifier || !password) {
    await appendAudit(request, {
      identifier: identifier || 'unknown',
      status: 'failed',
      securityFlag: '凭证为空',
      reason: 'IDENTIFIER_OR_PASSWORD_EMPTY',
    })
    return NextResponse.json(
      {
        message: '用户名/手机号和密码不能为空。',
      },
      { status: 400 }
    )
  }

  const account = await resolveLoginAccountByCredential(identifier)
  if (!account) {
    await appendAudit(request, {
      identifier,
      status: 'failed',
      securityFlag: '账号不存在',
      reason: 'ACCOUNT_NOT_FOUND',
    })
    return NextResponse.json(
      {
        message: '用户名/手机号或密码错误。',
      },
      { status: 401 }
    )
  }

  if (account.status === 'disabled') {
    await appendAudit(request, {
      identifier,
      employeeId: account.employeeId,
      fullName: account.name,
      role: account.role,
      mobileMasked: account.mobile,
      status: 'blocked',
      securityFlag: '账号已禁用',
      reason: 'ACCOUNT_DISABLED',
    })
    return NextResponse.json(
      {
        message: '该账号已禁用，请联系管理员。',
      },
      { status: 403 }
    )
  }

  if (!verifyLoginPassword(account, password)) {
    await appendAudit(request, {
      identifier,
      employeeId: account.employeeId,
      fullName: account.name,
      role: account.role,
      mobileMasked: account.mobile,
      status: 'failed',
      securityFlag: '密码错误',
      reason: 'PASSWORD_MISMATCH',
    })
    return NextResponse.json(
      {
        message: '用户名/手机号或密码错误。',
      },
      { status: 401 }
    )
  }

  const userId = `embedded-${account.employeeId.toLowerCase()}`
  const token = createEmbeddedSessionToken({
    sub: userId,
    employeeId: account.employeeId,
    name: account.name,
    role: account.role,
    scopePath: account.scopePath,
  })

  if (!token) {
    await appendAudit(request, {
      identifier,
      employeeId: account.employeeId,
      fullName: account.name,
      role: account.role,
      mobileMasked: account.mobile,
      status: 'failed',
      securityFlag: '会话签名失败',
      reason: 'EMBEDDED_AUTH_SIGNING_SECRET_MISSING',
    })
    return NextResponse.json(
      {
        message: '当前环境缺少会话签名密钥，请设置 EMBEDDED_AUTH_SIGNING_SECRET。',
      },
      { status: 503 }
    )
  }

  await appendAudit(request, {
    identifier,
    employeeId: account.employeeId,
    fullName: account.name,
    role: account.role,
    mobileMasked: account.mobile,
    status: 'success',
    securityFlag: '登录成功',
    reason: 'AUTH_OK',
  })

  return NextResponse.json({
    ok: true,
    token,
    user: {
      id: userId,
      name: account.name,
      nickname: account.name,
      employeeId: account.employeeId,
      role: account.role,
      scopePath: account.scopePath,
    },
  })
}
