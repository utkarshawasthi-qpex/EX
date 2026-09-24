'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { DashboardShareModal } from '@/components/modules/analytics/DashboardShareModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
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
import {
  DashboardFilterScopeOptionalSection,
  defaultDashboardFilterScopeIds,
  isFullDashboardFilterScope,
} from '@/components/modules/analytics/DashboardFilterScopeCheckboxes'
import { canCreatePortalDashboard, normalizeDashboardFilterScope } from '@/lib/portalAccess'
import { usePortalSettings } from '@/lib/portalSettingsStore'
import { cn } from '@/lib/utils'
import type { Dashboard, DashboardAccess } from '@/types'

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
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
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

type SortKey = 'name' | 'author' | 'access' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const ACCESS_OPTIONS: AccessOption[] = [
  { value: 'private', label: 'Private' },
  { value: 'custom', label: 'Custom' },
  { value: 'global', label: 'Global' },
]

function getAccessOption(access: DashboardAccess) {
  return ACCESS_OPTIONS.find((option) => option.value === access) ?? ACCESS_OPTIONS[0]
}

function authorFirstName(email: string) {
  const local = email.split('@')[0] ?? email
  const first = local.split(/[._-]/)[0] ?? local
  if (!first) return email
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function compareDashboards(a: Dashboard, b: Dashboard, sortKey: SortKey, direction: SortDirection) {
  const modifier = direction === 'asc' ? 1 : -1
  if (sortKey === 'name') return a.name.localeCompare(b.name) * modifier
  if (sortKey === 'author') {
    return authorFirstName(a.authorEmail).localeCompare(authorFirstName(b.authorEmail)) * modifier
  }
  if (sortKey === 'access') {
    return getAccessOption(a.access).label.localeCompare(getAccessOption(b.access).label) * modifier
  }
  return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
  className,
}: {
  label: string
  column: SortKey
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (column: SortKey) => void
  className?: string
}) {
  const active = sortKey === column
  return (
    <button
      type="button"
      className={cn('inline-flex items-center gap-1 font-medium text-gray-600', className)}
      onClick={() => onSort(column)}
    >
      {label}
      <span className="inline-flex flex-col leading-none text-[10px] text-gray-400" aria-hidden>
        <span className={active && sortDirection === 'asc' ? 'text-gray-700' : ''}>▲</span>
        <span className={cn('-mt-0.5', active && sortDirection === 'desc' ? 'text-gray-700' : '')}>
          ▼
        </span>
      </span>
    </button>
  )
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
  const [isGlobal, setIsGlobal] = useState(false)
  const [filterScopeIds, setFilterScopeIds] = useState<string[]>(() =>
    defaultDashboardFilterScopeIds(),
  )
  const [filterScopeExpanded, setFilterScopeExpanded] = useState(false)
  const [error, setError] = useState('')
  const [filterScopeError, setFilterScopeError] = useState('')

  function resetAndClose() {
    setName('')
    setIsGlobal(false)
    setFilterScopeIds(defaultDashboardFilterScopeIds())
    setFilterScopeExpanded(false)
    setError('')
    setFilterScopeError('')
    onOpenChange(false)
  }

  function handleCreate() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Dashboard name is required.')
      return
    }
    if (filterScopeExpanded) {
      if (filterScopeIds.length === 0) {
        setFilterScopeError('Select at least one filter dimension.')
        return
      }
    }

    const id = `dash_${Date.now()}`
    const scope =
      filterScopeExpanded && !isFullDashboardFilterScope(filterScopeIds)
        ? normalizeDashboardFilterScope(filterScopeIds)
        : {}
    onCreate({
      id,
      name: trimmedName,
      access: isGlobal ? 'global' : 'private',
      authorEmail: getCurrentUser().email,
      createdAt: new Date().toISOString(),
      tabs: [{ id: `${id}_tab_1`, name: 'Tab 1', order: 1, widgets: [] }],
      ...scope,
    })
    resetAndClose()
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md" {...preventModalDismiss}>
      <WuModalHeader>Create dashboard</WuModalHeader>
      <WuModalContent>
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

          <WuToggle
            checked={isGlobal}
            onChange={setIsGlobal}
            Label="Global dashboard"
          />

          <DashboardFilterScopeOptionalSection
            selectedIds={filterScopeIds}
            expanded={filterScopeExpanded}
            onExpandedChange={setFilterScopeExpanded}
            onChange={(ids) => {
              setFilterScopeIds(ids)
              if (filterScopeError) setFilterScopeError('')
            }}
            error={filterScopeError}
          />
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

export default function DashboardListPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const isAdmin = isAdminContext()
  const { portalAccess } = usePortalSettings()
  const canCreate = canCreatePortalDashboard(portalAccess)
  const [allDashboards, setAllDashboards] = useState<Dashboard[]>(() => loadDashboards())
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<Set<string>>(new Set())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [sharingDashboard, setSharingDashboard] = useState<Dashboard | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const visibleDashboards = useMemo(() => {
    const user = getCurrentUser()
    if (user.role === 'hr_admin' && !user.isImpersonating) {
      return allDashboards
    }
    return allDashboards.filter(
      (dashboard) => dashboard.access === 'global' || dashboard.authorEmail === user.email,
    )
  }, [allDashboards])

  const dashboards = useMemo(() => {
    const query = filterQuery.trim().toLowerCase()
    const filtered = query
      ? visibleDashboards.filter((dashboard) => dashboard.name.toLowerCase().includes(query))
      : visibleDashboards
    return [...filtered].sort((a, b) => {
      if (a.isHome && !b.isHome) return -1
      if (!a.isHome && b.isHome) return 1
      return compareDashboards(a, b, sortKey, sortDirection)
    })
  }, [filterQuery, sortDirection, sortKey, visibleDashboards])

  useEffect(() => {
    if (typeof window === 'undefined') return
    seedDefaultDashboardsIfNeeded()
    setAllDashboards(loadDashboards())
  }, [])

  function persistDashboards(next: Dashboard[]) {
    setAllDashboards(next)
    saveDashboards(next)
  }

  function handleDeleteDashboards(idsToDelete: Set<string>) {
    const next = allDashboards.filter((dashboard) => !idsToDelete.has(dashboard.id))
    persistDashboards(next)
    setSelectedDashboardIds(new Set())
    showToast({ variant: 'success', message: 'Dashboard deleted' })
  }

  function updateAccess(dashboardId: string, access: DashboardAccess) {
    persistDashboards(
      allDashboards.map((dashboard) =>
        dashboard.id === dashboardId ? { ...dashboard, access } : dashboard,
      ),
    )
    showToast({
      variant: 'success',
      message: `Access updated to ${getAccessOption(access).label}`,
    })
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedDashboardIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedDashboardIds(checked ? new Set(dashboards.map((dashboard) => dashboard.id)) : new Set())
  }

  function handleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(column)
    setSortDirection('asc')
  }

  function handleCreateDashboard(dashboard: Dashboard) {
    saveCreatedDashboard(dashboard)
    saveDashboardTabs(dashboard.id, dashboard.tabs)
    saveDashboardWidgets(dashboard.id, { [dashboard.tabs[0].id]: [] })
    setAllDashboards(loadDashboards())
    router.push(`/lifecycle/analytics/${dashboard.id}`)
  }

  const allSelected = dashboards.length > 0 && dashboards.every((dashboard) => selectedDashboardIds.has(dashboard.id))
  const someSelected = selectedDashboardIds.size > 0

  return (
    <div className="min-h-full bg-white px-8 py-6">
      <WuHeading size="xl" className="text-gray-900">
        Dashboards
      </WuHeading>

      {canCreate ? (
        <div className="mt-4">
          <WuButton variant="primary" onClick={() => setIsCreateOpen(true)}>
            + New dashboard
          </WuButton>
        </div>
      ) : null}

      <CreateDashboardModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateDashboard}
      />

      {visibleDashboards.length === 0 ? (
        <section className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-center">
          <WuHeading size="md">No dashboards yet</WuHeading>
          <WuText size="sm" as="p" className="mt-2 text-gray-500">
            {canCreate
              ? 'Create your first dashboard to start visualizing data'
              : 'No dashboards have been shared with you yet'}
          </WuText>
          {canCreate ? (
            <WuButton variant="primary" className="mt-5" onClick={() => setIsCreateOpen(true)}>
              + New dashboard
            </WuButton>
          ) : null}
        </section>
      ) : (
        <div className="relative mt-6">
          <div className="mb-2 flex min-h-8 items-center justify-end">
            {someSelected ? (
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => setDeleteOpen(true)}
              >
                Delete selected
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#F3F4F6] text-left">
                  <th className="w-12 px-4 py-3">
                    {isAdmin ? (
                      <WuCheckbox
                        checked={allSelected}
                        partial={someSelected && !allSelected}
                        onChange={toggleAll}
                      />
                    ) : null}
                  </th>
                  <th className="px-3 py-3">
                    <SortHeader
                      label="Dashboards"
                      column="name"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[160px] px-3 py-3">
                    <SortHeader
                      label="Author"
                      column="author"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[160px] px-3 py-3">
                    <SortHeader
                      label="Access"
                      column="access"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[140px] px-3 py-3">
                    <SortHeader
                      label="Created On"
                      column="createdAt"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="relative w-10 px-2 py-3 text-right">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex size-8 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-gray-800',
                        filterOpen && 'bg-gray-200 text-blue-700',
                      )}
                      aria-label="Filter dashboards"
                      onClick={() => setFilterOpen((open) => !open)}
                    >
                      <span className="wm-filter-alt text-lg" aria-hidden />
                    </button>
                    {filterOpen ? (
                      <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded border border-gray-200 bg-white p-3 text-left shadow-lg">
                        <WuInput
                          type="search"
                          variant="outlined"
                          placeholder="Filter by name"
                          value={filterQuery}
                          onChange={(event) => setFilterQuery(event.target.value)}
                        />
                      </div>
                    ) : null}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboards.map((dashboard) => (
                  <tr key={dashboard.id} className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <WuCheckbox
                          checked={selectedDashboardIds.has(dashboard.id)}
                          onChange={(checked) => toggleSelected(dashboard.id, checked)}
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {dashboard.isHome ? (
                          <span className="wm-home text-base text-[#1B87E6]" aria-label="Home dashboard" />
                        ) : (
                          <span className="w-4" aria-hidden />
                        )}
                        <button
                          type="button"
                          className="truncate text-left text-blue-700 hover:underline"
                          onClick={() => router.push(`/lifecycle/analytics/${dashboard.id}`)}
                        >
                          {dashboard.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{authorFirstName(dashboard.authorEmail)}</td>
                    <td className="px-3 py-3">
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={dashboard.access}
                            className="cursor-pointer border-0 border-b border-gray-400 bg-transparent py-0.5 pr-1 text-sm text-gray-700 outline-none"
                            aria-label={`Access for ${dashboard.name}`}
                            onChange={(event) =>
                              updateAccess(dashboard.id, event.target.value as DashboardAccess)
                            }
                          >
                            {ACCESS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {dashboard.access === 'custom' ? (
                            <button
                              type="button"
                              className="text-gray-500 hover:text-blue-700"
                              aria-label={`Edit custom access for ${dashboard.name}`}
                              onClick={() => setSharingDashboard(dashboard)}
                            >
                              <span className="wm-edit text-base" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-700">{getAccessOption(dashboard.access).label}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {format(new Date(dashboard.createdAt), 'MMM, dd yyyy')}
                    </td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dashboards.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No dashboards match this filter.</p>
          ) : null}
        </div>
      )}

      <DashboardShareModal
        open={Boolean(sharingDashboard)}
        onClose={() => setSharingDashboard(null)}
        dashboardId={sharingDashboard?.id ?? ''}
        dashboardName={sharingDashboard?.name ?? ''}
        tabs={sharingDashboard?.tabs ?? []}
      />
      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete selected dashboards?"
        description={`${selectedDashboardIds.size} dashboards will be removed.`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => handleDeleteDashboards(selectedDashboardIds)}
      />
    </div>
  )
}
