'use client';

import { useEffect, useState } from 'react';

interface MetricsData {
  totalRequests: number;
  avgConfidence: number;
  humanReviewRate: number;
  activeSessions: number;
  injectionBlocks: number;
}

const METRICS_PROXY_ENDPOINT = '/api/agents/metrics';

/**
 * Parse Prometheus text exposition format into a key-value map.
 * Lines like: sk_agent_requests_total{agent_id="cfo_buffett"} 42
 * become: { 'sk_agent_requests_total{agent_id="cfo_buffett"}': 42 }
 */
function parsePrometheus(text: string): Map<string, number> {
  const metrics = new Map<string, number>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace === -1) continue;
    const key = trimmed.slice(0, lastSpace);
    const val = parseFloat(trimmed.slice(lastSpace + 1));
    if (!isNaN(val)) metrics.set(key, val);
  }
  return metrics;
}

function extractMetrics(raw: Map<string, number>): MetricsData {
  let totalRequests = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  raw.forEach((val, key) => {
    // Sum all agent request counts
    if (key.startsWith('sk_agent_requests_total')) {
      totalRequests += val;
    }
    // Sum confidence tier counts for weighted average
    if (key.startsWith('sk_confidence_tier_total')) {
      confidenceCount += val;
      if (key.includes('tier="high"')) confidenceSum += val * 0.97;
      else if (key.includes('tier="medium"')) confidenceSum += val * 0.87;
      else if (key.includes('tier="low"')) confidenceSum += val * 0.70;
      else if (key.includes('tier="critical"')) confidenceSum += val * 0.40;
    }
  });

  const humanReviewCount = raw.get('sk_human_review_required_total') ?? 0;
  const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
  const humanReviewRate = totalRequests > 0 ? humanReviewCount / totalRequests : 0;
  const activeSessions = raw.get('sk_session_active_count') ?? 0;
  const injectionBlocks = raw.get('sk_injection_detected_total') ?? 0;

  return { totalRequests, avgConfidence, humanReviewRate, activeSessions, injectionBlocks };
}

export function AgentMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      try {
        const resp = await fetch(METRICS_PROXY_ENDPOINT, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const parsed = parsePrometheus(text);
        if (!cancelled) {
          setMetrics(extractMetrics(parsed));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#0d1117] p-6 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-[#0d1117] p-6">
        <p className="text-red-400 text-sm">Metrics unavailable: {error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  const confidencePct = Math.round(metrics.avgConfidence * 100);
  const reviewPct = Math.round(metrics.humanReviewRate * 100);

  const cards: { label: string; value: string | number; sub?: string; color: string }[] = [
    {
      label: 'Total Requests',
      value: metrics.totalRequests.toLocaleString(),
      sub: 'today',
      color: 'text-blue-400',
    },
    {
      label: 'Avg Confidence',
      value: `${confidencePct}%`,
      sub: confidencePct >= 95 ? 'high' : confidencePct >= 80 ? 'medium' : 'low',
      color: confidencePct >= 95
        ? 'text-emerald-400'
        : confidencePct >= 80
          ? 'text-amber-400'
          : 'text-red-400',
    },
    {
      label: 'Human Review Rate',
      value: `${reviewPct}%`,
      color: reviewPct < 10 ? 'text-emerald-400' : reviewPct < 30 ? 'text-amber-400' : 'text-red-400',
    },
    {
      label: 'Active Sessions',
      value: metrics.activeSessions,
      color: 'text-cyan-400',
    },
    {
      label: 'Injection Blocks',
      value: metrics.injectionBlocks,
      color: metrics.injectionBlocks > 0 ? 'text-red-400' : 'text-emerald-400',
    },
  ];

  return (
    <div className="rounded-3xl border border-white/8 bg-[#0d1117] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          Agent Metrics
        </h3>
        <span className="text-white/20 text-[10px]">auto-refresh 30s</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white/5 border border-white/5 p-3 space-y-1"
          >
            <div className="text-white/40 text-[10px] uppercase tracking-wider">
              {card.label}
            </div>
            <div className={`text-2xl font-bold tabular-nums ${card.color}`}>
              {card.value}
            </div>
            {card.sub && (
              <div className="text-white/25 text-[10px]">{card.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Confidence progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>Confidence Level</span>
          <span>{confidencePct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              confidencePct >= 95
                ? 'bg-emerald-500'
                : confidencePct >= 80
                  ? 'bg-amber-500'
                  : confidencePct >= 60
                    ? 'bg-orange-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
