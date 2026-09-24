'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { getSimilarFocusClusters } from '@/lib/actionPlans/similarFocus'
import { getFunnelSeed } from '@/lib/empowerIntegration/storage'
import { isAdminContext } from '@/lib/userContext'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDataTable })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

export default function PortalAdminPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()

  useEffect(() => {
    if (!isAdminContext()) {
      router.replace('/lifecycle/analytics/list')
    }
  }, [router])

  if (!isAdminContext()) {
    return null
  }

  const funnel = getFunnelSeed()
  const focusClusters = getSimilarFocusClusters().filter((c) => c.managerCount >= 2).slice(0, 5)
  const total = funnel.totalManagers
  const bars = [
    { stage: 'Viewed results', count: funnel.viewed, pct: Math.round((funnel.viewed / total) * 100) },
    {
      stage: 'Created ≥1 action plan',
      count: funnel.created,
      pct: Math.round((funnel.created / total) * 100),
    },
    {
      stage: 'Updated status ≥1 time',
      count: funnel.updated,
      pct: Math.round((funnel.updated / total) * 100),
    },
    {
      stage: 'Completed ≥1 plan',
      count: funnel.completed,
      pct: Math.round((funnel.completed / total) * 100),
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Admin"
        description="Portal administration and manager adoption for action planning."
        className="bg-white"
        actions={
          <WuButton
            variant="secondary"
            onClick={() => showToast({ variant: 'success', message: 'Adoption report exported (mock CSV).' })}
          >
            Export adoption report
          </WuButton>
        }
      />
      <PageContent>
        <section className="mb-8">
          <WuText size="sm" as="div" className="mb-4 font-semibold text-gray-800">
            Action planning adoption funnel
          </WuText>
          <div className="space-y-4">
            {bars.map((bar) => (
              <div key={bar.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{bar.stage}</span>
                  <span className="text-gray-500">
                    {bar.count} managers · {bar.pct}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        {focusClusters.length > 0 ? (
          <section className="mb-8">
            <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-800">
              Managers on similar focus areas
            </WuText>
            <ul className="space-y-2 text-sm text-gray-700">
              {focusClusters.map((row) => (
                <li key={row.focusLabel} className="rounded border border-gray-200 px-3 py-2">
                  <span className="font-medium">{row.focusLabel}</span>
                  <span className="text-gray-500"> — {row.managerCount} managers · {row.planIds.length} plans</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-800">
          Manager activity
        </WuText>
        <WuDataTable
          data={funnel.managers as unknown[]}
          columns={
            [
              { accessorKey: 'managerName', header: 'Manager' },
              { accessorKey: 'team', header: 'Team' },
              { accessorKey: 'stage', header: 'Stage reached' },
              { accessorKey: 'lastActivity', header: 'Last activity' },
            ] as unknown as never[]
          }
        />
      </PageContent>
    </PageShell>
  )
}
