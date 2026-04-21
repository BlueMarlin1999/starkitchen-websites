// ── OPR Type Definitions ────────────────────────────────────
// Objectives-Paths-Results framework for Star Kitchen AI C-Suite

export type OPRStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'not_started';
export type OPRCategory = 'financial' | 'operational' | 'growth' | 'people' | 'technology' | 'legal' | 'brand';
export type OPRTrend = 'up' | 'down' | 'flat';

export interface OPRObjective {
  id: string;
  agentId: string;       // e.g. "cfo_buffett"
  agentRole: string;     // e.g. "CFO"
  agentName: string;     // e.g. "巴菲特"
  agentEmoji: string;    // e.g. "💰"
  title: string;         // "全年食材成本率控制在33%以下"
  description: string;
  category: OPRCategory;
  year: number;          // 2026
  overallProgress: number; // 0-100
  status: OPRStatus;
  paths: OPRPath[];
  results: OPRResult[];
}

export interface OPRPath {
  id: string;
  title: string;         // "建立供应商价格浮动预警机制"
  description: string;
  milestone: string;     // "Q2 2026"
  progress: number;      // 0-100
  status: OPRStatus;
}

export interface OPRResult {
  id: string;
  metric: string;        // "食材成本率"
  target: string;        // "≤33%"
  current: string;       // "30.8%"
  progress: number;      // 0-100
  trend: OPRTrend;
  unit: string;          // "%"
}

export interface OPRMonthly {
  month: number;         // 1-12
  monthLabel: string;    // "1月", "2月"
  progress: number;      // 0-100
  status: OPRStatus;
  highlights: string[];  // key achievements that month
}

export interface OPRDaily {
  date: string;          // "2026-04-09"
  dayLabel: string;      // "4月9日"
  progress: number;      // 0-100
  note: string;          // daily achievement note
}

export interface AgentOPRData {
  agentId: string;
  agentRole: string;
  agentName: string;
  agentNameEn: string;
  agentEmoji: string;
  agentColor: string;    // Tailwind color token
  objectives: OPRObjective[];
  monthly: OPRMonthly[];
  daily: OPRDaily[];
}
