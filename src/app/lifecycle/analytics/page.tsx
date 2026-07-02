'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  loadDashboards,
  saveCreatedDashboard,
  saveDashboards,
  saveDashboardTabs,
  saveDashboardWidgets,
} from '@/lib/mockDb'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import { PageCard } from '@/components/shared/PageCard'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import type { Dashboard, DashboardAccess } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type AccessOption = {
  value: DashboardAccess
  label: string
}

const ACCESS_OPTIONS: AccessOption[] = [
  { value: 'private', label: 'Private' },
  { value: 'custom', label: 'Custom' },
  { value: 'global', label: 'Global' },
]

function getAccessOption(access: DashboardAccess) {
  return ACCESS_OPTIONS.find((option) => option.value === access) ?? ACCESS_OPTIONS[0]
}

function CreateDashboardModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (dashboard: Dashboard) => void
}) {
  const [name, setName] = useState('')
  const [access, setAccess] = useState<AccessOption>(ACCESS_OPTIONS[1])
  const [error, setError] = useState('')

  function resetAndClose() {
    setName('')
    setAccess(ACCESS_OPTIONS[1])
    setError('')
    onOpenChange(false)
  }

  function handleCreate() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Dashboard name is required.')
      return
    }

    const id = `dash_${Date.now()}`
    onCreate({
      id,
      name: trimmedName,
      access: access.value,
      authorEmail: 'sarah.johnson@questionpro.com',
      createdAt: new Date().toISOString(),
      tabs: [{ id: `${id}_tab_1`, name: 'Tab 1', order: 1, widgets: [] }],
    })
    resetAndClose()
  }

  function handleAccessSelect(value: unknown) {
    const selected = value as AccessOption | AccessOption[]
    setAccess((Array.isArray(selected) ? selected[0] : selected) ?? ACCESS_OPTIONS[1])
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>Create dashboard</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <WuText size="sm" as="span" className="text-gray-700">
              Dashboard name
            </WuText>
            <WuInput
              value={name}
              invalid={Boolean(error)}
              placeholder="New dashboard"
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError('')
              }}
            />
            {error && (
              <WuText size="sm" as="span" className="text-red-600">
                {error}
              </WuText>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <WuText size="sm" as="span" className="text-gray-700">
              Access level
            </WuText>
            <WuSelect
              data={ACCESS_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={access}
              onSelect={handleAccessSelect}
              variant="outlined"
            />
          </label>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-3">
          <WuButton variant="secondary" onClick={resetAndClose}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleCreate}>
            Create
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}

export default function LifecycleAnalyticsPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const isAdmin = isAdminContext()
  const [allDashboards, setAllDashboards] = useState<Dashboard[]>(() => loadDashboards())
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<Set<string>>(new Set())
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const dashboards = useMemo(() => {
    const user = getCurrentUser()
    if (user.role === 'hr_admin' && !user.isImpersonating) {
      return allDashboards
    }
    return allDashboards.filter((dashboard) => dashboard.access === 'global')
  }, [allDashboards])

  useEffect(() => {
    if (typeof window === 'undefined') return

    seedDefaultDashboardsIfNeeded()
    setAllDashboards(loadDashboards())

    const dashboards = loadDashboards()
    const first = dashboards.find((dashboard) => dashboard.access === 'global') ?? dashboards[0]
    if (first) {
      router.replace(`/lifecycle/analytics/${first.id}`)
    }
  }, [router])

  function persistDashboards(next: Dashboard[]) {
    setAllDashboards(next)
    saveDashboards(next)
  }

  function handleDeleteDashboards(idsToDelete: Set<string>) {
    const next = allDashboards.filter((dashboard) => !idsToDelete.has(dashboard.id))
    persistDashboards(next)
    setSelectedDashboardIds(new Set())
  }

  const columns = useMemo<IWuTableColumnDef<Dashboard>[]>(
    () => [
      ...(isAdmin
        ? [
            {
              id: 'select',
              accessorKey: 'id',
              header: '',
              cell: ({ row }: { row: { original: Dashboard } }) => (
                <WuCheckbox
                  checked={selectedDashboardIds.has(row.original.id)}
                  onChange={(checked) =>
                    setSelectedDashboardIds((currentIds) => {
                      const nextIds = new Set(currentIds)
                      if (checked) nextIds.add(row.original.id)
                      else nextIds.delete(row.original.id)
                      return nextIds
                    })
                  }
                />
              ),
            } as IWuTableColumnDef<Dashboard>,
          ]
        : []),
      {
        accessorKey: 'name',
        header: 'Dashboards',
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-blue-700 hover:underline"
            onClick={() => router.push(`/lifecycle/analytics/${row.original.id}`)}
          >
            {row.original.name}
            {row.original.isHome && <span className="ml-2" aria-label="Home dashboard">🏠</span>}
          </button>
        ),
      },
      {
        accessorKey: 'authorEmail',
        header: 'Author',
      },
      {
        accessorKey: 'access',
        header: 'Access',
        cell: ({ row }) =>
          isAdmin ? (
            <div className="w-[120px]">
              <WuSelect
                data={ACCESS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={getAccessOption(row.original.access)}
                onSelect={(value: unknown) => {
                  const selected = value as AccessOption | AccessOption[]
                  const nextOption = Array.isArray(selected) ? selected[0] : selected
                  if (!nextOption) return
                  persistDashboards(
                    allDashboards.map((dashboard) =>
                      dashboard.id === row.original.id
                        ? { ...dashboard, access: nextOption.value }
                        : dashboard,
                    ),
                  )
                  showToast({
                    variant: 'success',
                    message: `Access updated to ${nextOption.label}`,
                  })
                }}
                variant="outlined"
              />
            </div>
          ) : (
            getAccessOption(row.original.access).label
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created On',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM, dd yyyy'),
      },
      ...(isAdmin
        ? [
            {
              id: 'delete',
              accessorKey: 'id',
              header: '',
              cellAlign: 'right' as const,
              cell: ({ row }: { row: { original: Dashboard } }) => (
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-600"
                  onClick={() => handleDeleteDashboards(new Set([row.original.id]))}
                >
                  🗑
                </button>
              ),
            } as IWuTableColumnDef<Dashboard>,
          ]
        : []),
    ],
    [allDashboards, isAdmin, router, selectedDashboardIds, showToast],
  )

  function handleCreateDashboard(dashboard: Dashboard) {
    saveCreatedDashboard(dashboard)
    saveDashboardTabs(dashboard.id, dashboard.tabs)
    saveDashboardWidgets(dashboard.id, { [dashboard.tabs[0].id]: [] })
    setAllDashboards(loadDashboards())
    router.push(`/lifecycle/analytics/${dashboard.id}`)
  }

  return (
    <PageShell>
      <PageHeader
        title="Dashboards"
        description="Create and manage analytics dashboards"
        actions={
          isAdmin ? (
            <WuButton variant="primary" onClick={() => setIsCreateOpen(true)}>
              + New dashboard
            </WuButton>
          ) : undefined
        }
      />

      <PageContent>
        <CreateDashboardModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={handleCreateDashboard}
        />

        {dashboards.length === 0 ? (
          <section className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-center">
            <WuHeading size="md">No dashboards yet</WuHeading>
            <WuText size="sm" as="p" className="mt-2 text-gray-500">
              {isAdmin
                ? 'Create your first dashboard to start visualizing data'
                : 'No dashboards have been shared with you yet'}
            </WuText>
            {isAdmin && (
              <WuButton variant="primary" className="mt-5" onClick={() => setIsCreateOpen(true)}>
                + New dashboard
              </WuButton>
            )}
          </section>
        ) : (
          <PageCard>
            {isAdmin && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  className={cn(
                    'text-sm',
                    selectedDashboardIds.size > 0 ? 'text-red-600' : 'text-gray-300',
                  )}
                  disabled={selectedDashboardIds.size === 0}
                  onClick={() => handleDeleteDashboards(selectedDashboardIds)}
                >
                  🗑 Delete selected
                </button>
              </div>
            )}
            <WuDataTable
              data={dashboards as unknown[]}
              columns={columns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              tableLayout="auto"
            />
          </PageCard>
        )}
      </PageContent>
    </PageShell>
  )
}
