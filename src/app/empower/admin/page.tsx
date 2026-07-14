'use client'

import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { useMemo } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { getFunnelSeed } from '@/lib/empowerIntegration/storage'
import { isAdminContext } from '@/lib/userContext'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)

type FunnelRow = {
  stage: string
  count: number
  percent: number
}

export default function EmpowerAdminPage() {
  if (!isAdminContext()) {
    redirect('/empower/initiatives')
  }

  const funnel = getFunnelSeed()
  const total = funnel.totalManagers

  const bars: FunnelRow[] = [
    { stage: 'Viewed results', count: funnel.viewed, percent: Math.round((funnel.viewed / total) * 100) },
    { stage: 'Created ≥1 initiative', count: funnel.created, percent: Math.round((funnel.created / total) * 100) },
    { stage: 'Updated status ≥1 time', count: funnel.updated, percent: Math.round((funnel.updated / total) * 100) },
    { stage: 'Completed ≥1', count: funnel.completed, percent: Math.round((funnel.completed / total) * 100) },
  ]

  const columns: IWuTableColumnDef<(typeof funnel.managers)[0]>[] = [
    { accessorKey: 'managerName', header: 'Manager' },
    { accessorKey: 'team', header: 'Team' },
    { accessorKey: 'stage', header: 'Stage reached' },
    { accessorKey: 'lastActivity', header: 'Last activity' },
  ]

  const tableData = useMemo(() => funnel.managers, [funnel.managers])

  return (
    <PageShell>
      <PageHeader
        title="Empower Adoption Funnel"
        description="Manager adoption across EX analytics → Empower (development initiatives excluded)"
      />
      <PageContent>
        <div className="mb-8 space-y-4">
          {bars.map((bar) => (
            <div key={bar.stage}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{bar.stage}</span>
                <span className="text-gray-500">
                  {bar.count} managers · {bar.percent}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${bar.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
          Manager activity
        </WuText>
        <WuDataTable
          data={tableData as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        />
      </PageContent>
    </PageShell>
  )
}
