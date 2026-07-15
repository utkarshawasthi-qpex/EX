'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { CreateInitiativeModal } from '@/components/modules/empower/CreateInitiativeModal'
import { formatDueDate, formatLatestChip, getGoalTitle, progressLabel } from '@/lib/empowerIntegration/helpers'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser, isAdminContext, isEmployeeContext } from '@/lib/userContext'
import { redirect } from 'next/navigation'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuDataTable = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDataTable })), { ssr: false })
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false })
const WuChip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })), { ssr: false })

export default function EmpowerInitiativesPage() {
  if (isEmployeeContext()) redirect('/lifecycle/analytics')
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
    return getVisibleInitiatives(user).filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
  }, [user, search, refreshKey])

  const columns: IWuTableColumnDef<EmpowerInitiativeRecord>[] = [
    {
      accessorKey: 'title',
      header: 'Initiative',
      cell: ({ row }) => (
        <a href={`/empower/initiatives/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
          {row.original.title}
        </a>
      ),
    },
    {
      accessorKey: 'surveyLink',
      header: 'Survey link',
      cell: ({ row }) => {
        const link = row.original.surveyLink
        if (!link) return <span className="text-gray-400">—</span>
        const chip = formatLatestChip(link)
        const [text, color] = chip.split('|')
        const colorClass = color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-600' : 'text-gray-600'
        return <span className={`text-xs ${colorClass}`}>{text}</span>
      },
    },
    { accessorKey: 'goalId', header: 'Goal', cell: ({ row }) => getGoalTitle(row.original.goalId) },
    { accessorKey: 'progress', header: 'Progress', cell: ({ row }) => progressLabel(row.original.progress) },
    { accessorKey: 'dueDate', header: 'Due', cell: ({ row }) => formatDueDate(row.original.dueDate) },
  ]

  return (
    <PageShell>
      <PageHeader title="Initiatives" description="Action programs linked to survey insights" actions={isAdmin ? <WuButton variant="primary" onClick={() => setCreateOpen(true)}>+ New initiative</WuButton> : undefined} />
      <PageContent>
        <WuInput variant="outlined" placeholder="Search initiatives..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 w-72" />
        <WuDataTable data={initiatives as unknown[]} columns={columns as unknown as IWuTableColumnDef<unknown>[]} />
        <CreateInitiativeModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setRefreshKey((k) => k + 1); showToast({ variant: 'success', message: 'Initiative created' }) }} />
      </PageContent>
    </PageShell>
  )
}
