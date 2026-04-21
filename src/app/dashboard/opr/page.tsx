// Star Kitchen AI C-Suite — OPR Dashboard
// Route: /dashboard/opr

import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const OPROverview = dynamic(
  () =>
    import('@/components/OPR/OPROverview').then((module) => ({
      default: module.OPROverview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse p-8 text-center text-slate-400">加载 OPR 看板...</div>
    ),
  }
)

export const metadata: Metadata = {
  title: 'OPR 总控仪表盘 · Star Kitchen',
  description: '12位CxO AI智能体的年度目标-路径-结果总览',
  openGraph: {
    title: 'OPR Dashboard — Star Kitchen AI C-Suite',
    description: 'Objectives · Paths · Results — 全年度OPR追踪系统',
  },
}

export default function OPRPage() {
  return <OPROverview />
}
