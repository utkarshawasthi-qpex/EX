'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DownloadJob, DownloadJobStatus } from '@/data/mock/adminDownloads'
import { cn } from '@/lib/utils'

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)

function formatJobCreated(value: string) {
  const date = new Date(value)
  const hour = date.getUTCHours()
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const suffix = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 || 12
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()} ${hour12}:${minute}${suffix} UTC`
}

function statusClass(status: DownloadJobStatus) {
  if (status === 'Completed') return 'text-gray-800'
  if (status === 'In progress') return 'text-blue-700'
  if (status === 'Failed') return 'text-red-700'
  return 'text-amber-700'
}

export function DownloadCenterTab({
  jobs,
  onChange,
}: {
  jobs: DownloadJob[]
  onChange: (jobs: DownloadJob[]) => void
}) {
  const { showToast } = useWuShowToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const selectedJobs = jobs.filter((job) => selectedIds.includes(job.id))
  const allSelected = jobs.length > 0 && selectedIds.length === jobs.length
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    )
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? jobs.map((job) => job.id) : [])
  }

  function confirmDelete() {
    const ids = new Set(deleteIds)
    onChange(jobs.filter((job) => !ids.has(job.id)))
    setSelectedIds((current) => current.filter((id) => !ids.has(id)))
    setDeleteIds([])
    showToast({
      variant: 'success',
      message: ids.size === 1 ? 'Job deleted' : `${ids.size} jobs deleted`,
    })
  }

  const columns = useMemo<IWuTableColumnDef<DownloadJob>[]>(() => {
    const bulkOpen = selectedJobs.length > 0
    return [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <WuCheckbox
              checked={allSelected}
              partial={someSelected}
              onChange={(checked) => toggleAll(Boolean(checked))}
            />
            {bulkOpen ? (
              <>
                <span className="text-sm text-gray-700">{selectedJobs.length} selected</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-red-600"
                  onClick={() => setDeleteIds(selectedJobs.map((job) => job.id))}
                >
                  <span className="wm-delete text-base" aria-hidden />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ),
        size: bulkOpen ? 220 : 48,
        minSize: bulkOpen ? 200 : 44,
        maxSize: bulkOpen ? 260 : 52,
        enableSorting: false,
        cell: ({ row }) => (
          <WuCheckbox
            checked={selectedIds.includes(row.original.id)}
            onChange={(checked) => toggleRow(row.original.id, Boolean(checked))}
          />
        ),
      },
      {
        accessorKey: 'id',
        header: 'Job ID',
        size: 100,
        minSize: 80,
        cell: ({ row }) => <span className="tabular-nums text-gray-800">{row.original.id}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        size: 200,
        minSize: 170,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-gray-700">{formatJobCreated(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 420,
        minSize: 240,
        cell: ({ row }) => (
          <button
            type="button"
            className="block w-full min-w-0 truncate text-left text-gray-800 hover:text-blue-700"
            title={row.original.name}
            onClick={() => {
              if (row.original.status === 'Completed') {
                showToast({ variant: 'success', message: `Downloading ${row.original.name}` })
                return
              }
              showToast({
                variant: 'error',
                message: `${row.original.name} is ${row.original.status.toLowerCase()}`,
              })
            }}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        minSize: 110,
        cell: ({ row }) => (
          <span className={cn('whitespace-nowrap', statusClass(row.original.status))}>
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'id',
        id: 'rowActions',
        header: ' ',
        size: 56,
        minSize: 48,
        maxSize: 64,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete job ${row.original.id}`}
            onClick={() => setDeleteIds([row.original.id])}
          >
            <span className="wm-delete text-base" aria-hidden />
          </button>
        ),
      },
    ]
  }, [allSelected, selectedIds, selectedJobs.length, showToast, someSelected])

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="wm-download"
        title="No downloads yet"
        description="Exports and generated files will appear here when they are ready."
      />
    )
  }

  return (
    <>
      <WuTable
        data={jobs as unknown[]}
        columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        variant="striped"
        size="default"
        tableLayout="fixed"
        sort={{ enabled: true }}
        className="w-full"
        NoDataContent={
          <EmptyState
            title="No downloads yet"
            description="Exports and generated files will appear here when they are ready."
          />
        }
      />
      <ConfirmModal
        open={deleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteIds([])
        }}
        title={deleteIds.length > 1 ? 'Delete jobs?' : 'Delete job?'}
        description={
          deleteIds.length > 1
            ? `${deleteIds.length} jobs will be removed from Download Center.`
            : 'This job will be removed from Download Center.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={confirmDelete}
      />
    </>
  )
}
