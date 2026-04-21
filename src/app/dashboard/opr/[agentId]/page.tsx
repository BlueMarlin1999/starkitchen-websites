// Star Kitchen AI C-Suite — OPR Detail for a specific CxO agent
// Route: /dashboard/opr/[agentId]

import type { Metadata } from 'next';
import { OPRDetail } from '@/components/OPR/OPRDetail';
import { ALL_OPR_DATA } from '@/components/OPR/opr-data';

interface PageProps {
  params: { agentId: string };
}

// Generate static params for all known agents (enables static export)
export function generateStaticParams() {
  return ALL_OPR_DATA.map(agent => ({
    agentId: agent.agentId,
  }));
}

// Dynamic metadata based on agent
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { agentId } = params;
  const agent = ALL_OPR_DATA.find(a => a.agentId === agentId);

  if (!agent) {
    return {
      title: 'OPR 详情 · Star Kitchen',
    };
  }

  return {
    title: `${agent.agentEmoji} ${agent.agentName} OPR · Star Kitchen`,
    description: `${agent.agentRole} ${agent.agentName}的年度OPR目标追踪`,
  };
}

export default function OPRDetailPage({ params }: PageProps) {
  const { agentId } = params;
  return <OPRDetail agentId={agentId} />;
}
