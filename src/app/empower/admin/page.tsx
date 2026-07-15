'use client'

import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { getFunnelSeed } from '@/lib/empowerIntegration/storage'
import { isAdminContext } from '@/lib/userContext'

const WuText = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })), { ssr: false })
const WuDataTable = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDataTable })), { ssr: false })

export default function EmpowerAdminPage() {
  if (!isAdminContext()) redirect('/empower/initiatives')
  const funnel = getFunnelSeed()
  const total = funnel.totalManagers
  const bars = [
    { stage: 'Viewed results', count: funnel.viewed, pct: Math.round((funnel.viewed / total) * 100) },
    { stage: 'Created ≥1 initiative', count: funnel.created, pct: Math.round((funnel.created / total) * 100) },
    { stage: 'Updated status ≥1 time', count: funnel.updated, pct: Math.round((funnel.updated / total) * 100) },
    { stage: 'Completed ≥1', count: funnel.completed, pct: Math.round((funnel.completed / total) * 100) },
  ]

  return (
    <PageShell>
      <PageHeader title="Empower Adoption Funnel" description="Manager adoption from EX analytics to Empower action" />
      <PageContent>
        <div className="mb-8 space-y-4">
          {bars.map((bar) => (
            <div key={bar.stage}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{bar.stage}</span>
                <span className="text-gray-500">{bar.count} managers · {bar.pct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${bar.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <WuText size="sm" as="div" className="mb-3 font-semibold">Manager activity</WuText>
        <WuDataTable
          data={funnel.managers as unknown[]}
          columns={[
            { accessorKey: 'managerName', header: 'Manager' },
            { accessorKey: 'team', header: 'Team' },
            { accessorKey: 'stage', header: 'Stage reached' },
            { accessorKey: 'lastActivity', header: 'Last activity' },
          ] as unknown as never[]}
        />
      </PageContent>
    </PageShell>
  )
}
