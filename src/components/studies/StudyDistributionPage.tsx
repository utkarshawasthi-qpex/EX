'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageCard } from '@/components/shared/PageCard'
import { getEmployeeDisplayName, type DirectoryEmployee } from '@/data/mock-employee-directory'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export function StudyDistributionPage() {
  const searchParams = useSearchParams()
  const { showToast } = useWuShowToast()
  const { employees } = useRosterStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const studyName = searchParams.get('study')?.trim() || 'this study'
  const allSelected = employees.length > 0 && selectedIds.size === employees.length

  function toggle(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(employees.map((employee) => employee.id)) : new Set())
  }

  function sendInvites() {
    if (selectedIds.size === 0) {
      showToast({ message: 'Select at least one employee', variant: 'error' })
      return
    }
    showToast({
      message: `Survey sent to ${selectedIds.size} employees`,
      variant: 'success',
    })
    setSelectedIds(new Set())
  }

  const columns = useMemo<IWuTableColumnDef<DirectoryEmployee>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => (
          <WuCheckbox checked={allSelected} partial={selectedIds.size > 0 && !allSelected} onChange={toggleAll} />
        ),
        size: 44,
        enableSorting: false,
        cell: ({ row }) => (
          <WuCheckbox
            checked={selectedIds.has(row.original.id)}
            onChange={(checked) => toggle(row.original.id, checked)}
          />
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'Name',
        cell: ({ row }) => getEmployeeDisplayName(row.original),
      },
      {
        accessorKey: 'email',
        header: 'Email address',
      },
      {
        accessorKey: 'department',
        header: 'Department',
      },
      {
        accessorKey: 'location',
        header: 'Location',
      },
    ],
    [allSelected, selectedIds],
  )

  return (
    <div className="flex min-h-full flex-col bg-white px-6 py-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <WuHeading size="sm" className="text-gray-800">
            Distribute {studyName}
          </WuHeading>
          <WuText size="sm" className="text-gray-500">
            Select employees from the roster and send the survey.
          </WuText>
        </div>
        <WuButton onClick={sendInvites} disabled={selectedIds.size === 0}>
          Send to {selectedIds.size || 'selected'}
        </WuButton>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon="wm-person"
          title="No employees in the list"
          description="Import employees before distributing a study."
        />
      ) : (
        <PageCard className="p-0">
          <WuTable
            data={employees as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="compact"
            stickyHeader
            maxHeight="calc(100vh - 220px)"
          />
        </PageCard>
      )}
    </div>
  )
}
