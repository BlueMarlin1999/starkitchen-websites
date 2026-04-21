'use client';

import type { ConfidenceInfo } from './types';

interface Props {
  confidence: ConfidenceInfo;
  showScore?: boolean;
}

const TIER_STYLES: Record<string, string> = {
  high:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
  low:      'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20    text-red-400    border-red-500/30',
};

const TIER_ICONS: Record<string, string> = {
  high:     '✓',
  medium:   '⚠',
  low:      '⚠',
  critical: '⛔',
};

export function ConfidenceBadge({ confidence, showScore = true }: Props) {
  const style = TIER_STYLES[confidence.tier] ?? TIER_STYLES.medium;
  const icon  = TIER_ICONS[confidence.tier] ?? '?';
  const pct   = Math.round(confidence.score * 100);

  if (confidence.tier === 'high' && !confidence.requires_human_review) {
    return null; // high confidence — no badge needed
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                  border font-medium ${style}`}
      title={confidence.label_zh}
    >
      <span>{icon}</span>
      <span>{confidence.label_zh}</span>
      {showScore && <span className="opacity-70">({pct}%)</span>}
    </span>
  );
}
