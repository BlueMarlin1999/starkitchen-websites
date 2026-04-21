import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const encoder = new TextEncoder()

const buildSseChunk = (event: string, data: unknown) =>
  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

const buildSseResponse = (
  chunks: Uint8Array[],
  status = 200
) =>
  new NextResponse(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk))
        controller.close()
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    }
  )

const readJsonSafe = async (response: Response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const proxyResponse = await fetch(new URL('/api/agents/v1/chat/', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('authorization') || '',
      'x-user-role': request.headers.get('x-user-role') || '',
    },
    body: rawBody || '{}',
  })

  const payload = await readJsonSafe(proxyResponse)
  if (!proxyResponse.ok) {
    return buildSseResponse([
      buildSseChunk('error', {
        message:
          (typeof (payload as { message?: unknown }).message === 'string' &&
            (payload as { message: string }).message) ||
          `请求失败 (${proxyResponse.status})`,
      }),
      buildSseChunk('done', { ok: false }),
    ])
  }

  const data = payload as {
    session_id?: string
    agent_id?: string
    content?: string
    confidence?: Record<string, unknown>
    decision_level?: number
    requires_human_review?: boolean
    request_id?: string
  }

  return buildSseResponse([
    buildSseChunk('metadata', {
      session_id: data.session_id || '',
      agent_id: data.agent_id || 'cos_zhuge_liang',
      decision_level: typeof data.decision_level === 'number' ? data.decision_level : 1,
      requires_human_review: data.requires_human_review === true,
      request_id: data.request_id || '',
    }),
    buildSseChunk('token', {
      content: typeof data.content === 'string' ? data.content : '',
    }),
    buildSseChunk('confidence', data.confidence || {}),
    buildSseChunk('done', { ok: true }),
  ])
}

