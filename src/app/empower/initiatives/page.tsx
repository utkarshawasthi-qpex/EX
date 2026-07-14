'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { CreateInitiativeModal } from '@/components/modules/empower/CreateInitiativeModal'
import { classBadgeLabel, formatDueDate, formatLatestChip, getGoalTitle, progressLabel } from '@/lib/empowerIntegration/helpers'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser, isAdminContext, isEmployeeContext } from '@/lib/userContext'
import { redirect } from 'next/navigation'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
  { ssr: false },
)

export default function EmpowerInitiativesPage() {
  if (isEmployeeContext()) {
    redirect('/lifecycle/analytics')
  }

  return <EmpowerInitiativesList />
}

function EmpowerInitiativesList() {
  const user = getCurrentUser()
  const isAdmin = isAdminContext()
  const { showToast } = useWuShowToast()
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const initiatives = useMemo(() => {
    void refreshKey
    return getVisibleInitiatives(user)
  }, [user, refreshKey])

  const filtered = initiatives.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: IWuTableColumnDef<EmpowerInitiativeRecord>[] = [
    {
      accessorKey: 'title',
      header: 'Initiative',
      cell: ({ row }) => (
        <Link
          href={`/empower/initiatives/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => (
        <WuChip size="sm" variant="secondary">
          {classBadgeLabel(row.original.class)}
        </WuChip>
      ),
    },
    {
      accessorKey: 'goalId',
      header: 'Goal',
      cell: ({ row }) => getGoalTitle(row.original.goalId),
    },
    {
      accessorKey: 'surveyLink',
      header: 'Survey link',
      cell: ({ row }) => {
        const link = row.original.surveyLink
        if (!link) return <span className="text-gray-400">Unlinked</span>
        const chip = formatLatestChip(link)
        const [text, colorHint] = chip.split('|')
        const colorClass =
          colorHint === 'green'
            ? 'text-green-700'
            : colorHint === 'red'
              ? 'text-red-600'
              : 'text-gray-600'
        return <span className={`text-xs ${colorClass}`}>{text}</span>
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => progressLabel(row.original.progress),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => formatDueDate(row.original.dueDate),
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Initiatives"
        description="Action programs linked to survey insights"
        actions={
          isAdmin ? (
            <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
              + New initiative
            </WuButton>
          ) : undefined
        }
      />
      <PageContent>
        <div className="mb-4 flex items-center gap-3">
          <WuInput
            variant="outlined"
            placeholder="Search initiatives..."
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-72"
          />
        </div>

        <WuDataTable
          data={filtered as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          NoDataContent={<p className="py-8 text-center text-sm text-gray-500">No initiatives found</p>}
        />

        <CreateInitiativeModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setRefreshKey((key) => key + 1)
            showToast({ variant: 'success', message: 'Initiative created' })
          }}
        />
      </PageContent>
    </PageShell>
  )
}
