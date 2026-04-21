import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parseJsonWithSchema } from '@/lib/server/input-validation'
import { readPersistentJsonState, writePersistentJsonState } from '@/lib/server/persistent-json-store'

export const runtime = 'nodejs'

const feedbackSchema = z.object({
  session_id: z.string().uuid(),
  agent_id: z.string().trim().min(1).max(64),
  rating: z.number().int().min(-1).max(1),
  comment: z.string().trim().max(1000).nullable().optional(),
  feedback_type: z.enum(['rating', 'correction', 'suggestion', 'report_issue']).optional().default('rating'),
  confidence_score: z.number().min(0).max(1).optional(),
  decision_level: z.number().int().min(1).max(4).optional(),
})

type AgentFeedbackRecord = z.infer<typeof feedbackSchema> & {
  id: string
  created_at: string
}

const FEEDBACK_NAMESPACE = 'agents/feedback'

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const parsedPayload = await parseJsonWithSchema(request, feedbackSchema, '反馈参数不合法。')
  if (!parsedPayload.ok) return parsedPayload.response

  const feedback: AgentFeedbackRecord = {
    ...parsedPayload.data,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  }

  try {
    const existing =
      (await readPersistentJsonState<{ items?: AgentFeedbackRecord[] }>(FEEDBACK_NAMESPACE)) || {}
    const nextItems = [feedback, ...(Array.isArray(existing.items) ? existing.items : [])].slice(0, 3000)
    await writePersistentJsonState(FEEDBACK_NAMESPACE, { items: nextItems })
  } catch {
    // Feedback persistence failure should not block user interaction.
  }

  return NextResponse.json({
    success: true,
    message: '反馈已记录',
    feedback_id: feedback.id,
  })
}

