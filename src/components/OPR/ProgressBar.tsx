'use client';

import { useEffect, useState } from 'react';
import type { OPRStatus } from './types';

// ── Status → color mapping ───────────────────────────────────
const STATUS_COLORS: Record<OPRStatus, string> = {
  on_track:    'bg-emerald-500',
  completed:   'bg-blue-500',
  at_risk:     'bg-amber-500',
  behind:      'bg-red-500',
  not_started: 'bg-zinc-600',
};

const STATUS_GLOW: Record<OPRStatus, string> = {
  on_track:    'shadow-emerald-500/30',
  completed:   'shadow-blue-500/30',
  at_risk:     'shadow-amber-500/30',
  behind:      'shadow-red-500/30',
  not_started: 'shadow-zinc-500/10',
};

// ── Status dot colors ────────────────────────────────────────
export const STATUS_DOT_COLORS: Record<OPRStatus, string> = {
  on_track:    'bg-emerald-400',
  completed:   'bg-blue-400',
  at_risk:     'bg-amber-400',
  behind:      'bg-red-400',
  not_started: 'bg-zinc-500',
};

export const STATUS_LABELS: Record<OPRStatus, string> = {
  on_track:    '进展顺利',
  completed:   '已完成',
  at_risk:     '有风险',
  behind:      '滞后',
  not_started: '未开始',
};

export const STATUS_TEXT_COLORS: Record<OPRStatus, string> = {
  on_track:    'text-emerald-400',
  completed:   'text-blue-400',
  at_risk:     'text-amber-400',
  behind:      'text-red-400',
  not_started: 'text-zinc-500',
};

// ── ProgressBar component ────────────────────────────────────

interface ProgressBarProps {
  progress: number;       // 0-100
  status: OPRStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function ProgressBar({
  progress,
  status,
  size = 'md',
  showLabel = true,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const [width, setWidth] = useState(animated ? 0 : progress);

  useEffect(() => {
    if (animated) {
      const timer = requestAnimationFrame(() => setWidth(progress));
      return () => cancelAnimationFrame(timer);
    }
    setWidth(progress);
  }, [progress, animated]);

  const barColor = STATUS_COLORS[status];
  const glow = STATUS_GLOW[status];
  const height = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex-1 ${height} rounded-full bg-white/[0.06] overflow-hidden`}>
        <div
          className={`${height} rounded-full ${barColor} shadow-sm ${glow} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-white/50 text-xs font-medium tabular-nums min-w-[2.5rem] text-right">
          {progress}%
        </span>
      )}
    </div>
  );
}

// ── Circular progress (for detail header) ────────────────────

interface CircularProgressProps {
  progress: number;
  status: OPRStatus;
  size?: number;
  strokeWidth?: number;
}

const CIRCULAR_COLORS: Record<OPRStatus, string> = {
  on_track:    'stroke-emerald-500',
  completed:   'stroke-blue-500',
  at_risk:     'stroke-amber-500',
  behind:      'stroke-red-500',
  not_started: 'stroke-zinc-600',
};

export function CircularProgress({
  progress,
  status,
  size = 80,
  strokeWidth = 6,
}: CircularProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = requestAnimationFrame(() => setAnimatedProgress(progress));
    return () => cancelAnimationFrame(timer);
  }, [progress]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.06]"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${CIRCULAR_COLORS[status]} transition-all duration-700 ease-out`}
        />
      </svg>
      <span className="absolute text-white font-semibold text-sm tabular-nums">
        {progress}%
      </span>
    </div>
  );
}
