// Star Kitchen AI Agent Legion — Layout wrapper
// Provides metadata and any route-specific wrapper for the agents dashboard page.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SK AI Agent Legion · Star Kitchen',
  description: '12位历史人物CxO智能体 — 运营、财务、法务、增长全覆盖',
  openGraph: {
    title: 'SK AI Agent Legion',
    description: 'Star Kitchen AI C-Suite — 企业级智能体决策系统',
  },
};

export default function AgentLegionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
