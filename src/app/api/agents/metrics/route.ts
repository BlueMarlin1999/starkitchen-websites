import { NextResponse } from 'next/server'
import { isStrictLiveMode } from '@/lib/live-mode'
import { buildAgentLocalMetrics } from '@/lib/server/agents-history-store'

export const runtime = 'nodejs'

const DEFAULT_AGENTS_API_URL = 'https://api.starkitchen.works/api/v1'
const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const resolveMetricsUrl = () => {
  const configured = normalizeBaseUrl(
    process.env.AGENTS_API_URL ||
      process.env.NEXT_PUBLIC_AGENTS_API_URL ||
      DEFAULT_AGENTS_API_URL
  )

  if (configured.includes('/api/agents/v1')) {
    return `${configured.replace('/api/agents/v1', '')}/api/agents/metrics/`
  }

  if (configured.includes('/api/v1')) {
    return `${configured.replace('/api/v1', '')}/metrics`
  }

  return `${configured}/metrics`
}

export async function GET() {
  const strictLiveMode = isStrictLiveMode()
  const targetUrl = resolveMetricsUrl()

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'text/plain,application/openmetrics-text;q=0.9,*/*;q=0.1' },
    })

    if (upstream.ok) {
      const body = await upstream.text()
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
  } catch {
    if (strictLiveMode) {
      return NextResponse.json(
        {
          message: '上游 Agents Metrics 不可用，严格真实模式下已禁用本地估算指标。',
          code: 'METRICS_UPSTREAM_UNAVAILABLE',
        },
        { status: 502 }
      )
    }
    // fallback to local metrics below
  }

  if (strictLiveMode) {
    return NextResponse.json(
      {
        message: '上游 Agents Metrics 返回异常，严格真实模式下已禁用本地估算指标。',
        code: 'METRICS_UPSTREAM_INVALID',
      },
      { status: 502 }
    )
  }

  try {
    const localMetrics = await buildAgentLocalMetrics()
    const lines = [
      '# TYPE sk_agent_requests_total counter',
      `sk_agent_requests_total ${localMetrics.totalRequests}`,
      '# TYPE sk_human_review_required_total counter',
      `sk_human_review_required_total ${Math.round(
        localMetrics.totalRequests * localMetrics.humanReviewRate
      )}`,
      '# TYPE sk_session_active_count gauge',
      `sk_session_active_count ${localMetrics.activeSessions}`,
      '# TYPE sk_injection_detected_total counter',
      `sk_injection_detected_total ${localMetrics.injectionBlocks}`,
      '# TYPE sk_confidence_tier_total counter',
      `sk_confidence_tier_total{tier="high"} ${Math.round(
        localMetrics.avgConfidence >= 0.9 ? localMetrics.totalRequests : 0
      )}`,
      `sk_confidence_tier_total{tier="medium"} ${Math.round(
        localMetrics.avgConfidence >= 0.75 && localMetrics.avgConfidence < 0.9
          ? localMetrics.totalRequests
          : 0
      )}`,
      `sk_confidence_tier_total{tier="low"} ${Math.round(
        localMetrics.avgConfidence >= 0.6 && localMetrics.avgConfidence < 0.75
          ? localMetrics.totalRequests
          : 0
      )}`,
      `sk_confidence_tier_total{tier="critical"} ${Math.round(
        localMetrics.avgConfidence < 0.6 ? localMetrics.totalRequests : 0
      )}`,
      '',
    ]

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Metrics request failed',
        code: 'METRICS_UNAVAILABLE',
      },
      { status: 502 }
    )
  }
}
