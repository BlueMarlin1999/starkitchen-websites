import { NextRequest, NextResponse } from 'next/server'
import { z, ZodTypeAny } from 'zod'

type ValidationResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

const buildIssueList = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))

const buildValidationResponse = (message: string, error: z.ZodError) =>
  NextResponse.json(
    {
      message,
      issues: buildIssueList(error),
      code: 'INVALID_INPUT',
    },
    { status: 400 }
  )

export const parseJsonWithSchema = async <T extends ZodTypeAny>(
  request: NextRequest,
  schema: T,
  message = '请求参数格式不正确。'
): Promise<ValidationResult<z.infer<T>>> => {
  try {
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        response: buildValidationResponse(message, parsed.error),
      }
    }
    return { ok: true, data: parsed.data }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message,
          code: 'INVALID_JSON',
        },
        { status: 400 }
      ),
    }
  }
}

export const parseQueryWithSchema = <T extends ZodTypeAny>(
  request: NextRequest,
  schema: T,
  message = '查询参数格式不正确。'
): ValidationResult<z.infer<T>> => {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: buildValidationResponse(message, parsed.error),
    }
  }
  return { ok: true, data: parsed.data }
}

export const parsePlainObjectWithSchema = <T extends ZodTypeAny>(
  raw: unknown,
  schema: T,
  message = '参数格式不正确。'
): ValidationResult<z.infer<T>> => {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: buildValidationResponse(message, parsed.error),
    }
  }
  return { ok: true, data: parsed.data }
}
