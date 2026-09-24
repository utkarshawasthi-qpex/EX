'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { HubCreateInitiativeModal } from '@/components/modules/actionPlans/HubCreateInitiativeModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import {
  computeActionPlanProgress,
  formatDueDate,
  getGoalTitle,
} from '@/lib/actionPlans'
import { actionPlanDetailPath, ACTION_PLANS_OVERVIEW } from '@/lib/actionPlans/paths'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'
import { deleteInitiative, getEmployeeName } from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDataTable })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
)

export default function ActionPlansListPage() {
  const user = getCurrentUser()
  const { showToast } = useWuShowToast()
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmpowerInitiativeRecord | null>(null)

  const initiatives = useMemo(() => {
    void refreshKey
    return getVisibleInitiatives(user).filter((i) =>
      i.title.toLowerCase().includes(search.toLowerCase()),
    )
  }, [user, search, refreshKey])

  function sourceLabel(row: EmpowerInitiativeRecord): string {
    const df = row.dataFocus
    const legacy = row.surveyLink
    const label = df?.label ?? legacy?.focus.label
    if (!label) return '—'
    const fav = df?.favorability ?? legacy?.baseline.favorability
    const favPart = fav != null ? ` · ${fav}%` : ''
    if (df?.dashboardName) {
      return `${df.dashboardName} · ${label}${favPart}`
    }
    return fav != null ? `${label}${favPart}` : label
  }

  function canDelete(row: EmpowerInitiativeRecord): boolean {
    return row.ownerId === user.id || row.createdBy === user.id
  }

  const columns: IWuTableColumnDef<EmpowerInitiativeRecord>[] = [
    {
      accessorKey: 'title',
      header: 'Initiative',
      cell: ({ row }) => (
        <a
          href={actionPlanDetailPath(row.original.id)}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.title}
        </a>
      ),
    },
    {
      accessorKey: 'dataFocus',
      header: 'Source',
      cell: ({ row }) => {
        const text = sourceLabel(row.original)
        if (text === '—') return <span className="text-gray-400">—</span>
        return <span className="text-xs text-gray-700">{text}</span>
      },
    },
    { accessorKey: 'goalId', header: 'Goal', cell: ({ row }) => getGoalTitle(row.original.goalId) },
    {
      accessorKey: 'ownerId',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{getEmployeeName(row.original.ownerId)}</span>
      ),
    },
    {
      accessorKey: 'tasks',
      header: 'Tasks',
      cell: ({ row }) => {
        const p = computeActionPlanProgress(row.original)
        return (
          <span className="text-sm text-gray-700">
            {p.completed}/{p.total}
            {p.overdueCount > 0 ? (
              <span className="ml-1 text-red-600">({p.overdueCount} overdue)</span>
            ) : null}
          </span>
        )
      },
    },
    { accessorKey: 'dueDate', header: 'Due', cell: ({ row }) => formatDueDate(row.original.dueDate) },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ row }) =>
        canDelete(row.original) ? (
          <WuButton variant="link" size="sm" onClick={() => setDeleteTarget(row.original)}>
            Delete
          </WuButton>
        ) : (
          <span />
        ),
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title="All initiatives"
        description="Every initiative you can access—owned, shared, or org-visible."
        className="bg-white"
      />
      <PageContent>
        <Link
          href={ACTION_PLANS_OVERVIEW}
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← {t.moduleHome}
        </Link>
        <div className="mb-4">
          <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
            + {t.newInitiative}
          </WuButton>
        </div>
        <WuInput
          variant="outlined"
          placeholder="Search initiatives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-72"
        />
        <WuDataTable
          data={initiatives as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        />
        <HubCreateInitiativeModal
          open={createOpen}
          onClose={() => {
            setCreateOpen(false)
            setRefreshKey((k) => k + 1)
          }}
        />
        <ConfirmModal
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete initiative?"
          description={
            deleteTarget
              ? `“${deleteTarget.title}” will be removed. Tasks on this initiative are deleted too.`
              : ''
          }
          confirmLabel="Delete"
          variant="critical"
          onConfirm={() => {
            if (deleteTarget) {
              deleteInitiative(deleteTarget.id)
              showToast({ variant: 'success', message: 'Initiative deleted' })
              setRefreshKey((k) => k + 1)
            }
            setDeleteTarget(null)
          }}
        />
      </PageContent>
    </PageShell>
  )
}
