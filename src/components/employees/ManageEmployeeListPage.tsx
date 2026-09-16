'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal'
import { EditCustomFieldModal } from '@/components/employees/EditCustomFieldModal'
import { EmployeeFilterModal } from '@/components/employees/EmployeeFilterModal'
import { CustomFieldsPage } from '@/components/employees/CustomFieldsPage'
import { EmployeeFiltersPage } from '@/components/employees/EmployeeFiltersPage'
import { EmployeeImportPage } from '@/components/employees/EmployeeImportPage'
import { EmployeeSetupPage } from '@/components/employees/EmployeeSetupPage'
import { PortalContentPage } from '@/components/employees/PortalContentPage'
import { PortalPermissionsPage } from '@/components/employees/PortalPermissionsPage'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { getVisibleCustomFields, type DirectoryCustomField } from '@/data/mock-custom-fields'
import { useRosterStore } from '@/lib/rosterStore'
import {
  employeeMatchesFilterGroups,
  type EmployeeFilterGroup,
} from '@/data/mock-employee-filters'
import { getDefaultPortalHref } from '@/lib/portalAccess'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PORTAL_SUBDOMAIN,
  DIRECTORY_LANGUAGES,
  EMPLOYEE_LIST_PAGE_SIZE,
  buildEmployeeTree,
  buildPortalUrl,
  getEmployeeDisplayName,
  getEmployeeFieldValue,
  parsePortalSubdomain,
  setEmployeeFieldValue,
  type DirectoryEmployee,
  type DirectoryTreeNode,
} from '@/data/mock-employee-directory'

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
)
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

function openAnalyticsPortal() {
  window.open(getDefaultPortalHref(), '_blank', 'noopener,noreferrer')
}

const PRIMARY_TABS = ['Employees', 'Integrations', 'Portal', 'Admin'] as const
const SECONDARY_TABS = [
  { id: 'list', label: 'List', icon: 'wm-format-list-bulleted' },
  { id: 'import', label: 'Import', icon: 'wm-file-upload' },
  { id: 'setup', label: 'Setup', icon: 'wm-settings' },
  { id: 'custom-fields', label: 'Custom Fields', icon: 'wm-view-column' },
  { id: 'filters', label: 'Employee Filters', icon: 'wm-filter-list' },
] as const

const PORTAL_SECONDARY_TABS = [
  { id: 'content', label: 'Content', icon: 'wm-description' },
  { id: 'permissions', label: 'Permissions', icon: 'wm-lock' },
  { id: 'languages', label: 'Languages', icon: 'wm-translate' },
  { id: 'logs', label: 'Logs', icon: 'wm-history' },
  { id: 'setup', label: 'Setup', icon: 'wm-settings' },
] as const

type SelectOption = {
  value: string
  label: string
}

type PrimaryTab = (typeof PRIMARY_TABS)[number]
type SecondaryTab = (typeof SECONDARY_TABS)[number]['id']
type PortalSecondaryTab = (typeof PORTAL_SECONDARY_TABS)[number]['id']
type DirectoryView = 'list' | 'tree'

const STATUS_LABELS: Record<DirectoryEmployee['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
  terminated: 'Terminated',
}

const NONE_OPTION: SelectOption = { value: '', label: '—' }

function InlineSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const selected = options.find((option) => option.value === value) ?? options[0] ?? NONE_OPTION

  return (
    <div className={className ?? 'min-w-[128px]'}>
      <WuSelect
        data={options}
        accessorKey={{ value: 'value', label: 'label' }}
        value={selected}
        onSelect={(selectedOption) => {
          const option = (Array.isArray(selectedOption) ? selectedOption[0] : selectedOption) as
            | SelectOption
            | null
          if (option) onChange(option.value)
        }}
        variant="outlined"
        className="w-full"
      />
    </div>
  )
}

function EmployeeTree({
  nodes,
  selectedIds,
  expandedIds,
  depth = 0,
  onToggleExpanded,
  onToggleSelected,
  onOpenEmployee,
  onLogin,
  onRemove,
}: {
  nodes: DirectoryTreeNode[]
  selectedIds: Set<string>
  expandedIds: Set<string>
  depth?: number
  onToggleExpanded: (id: string) => void
  onToggleSelected: (id: string, checked: boolean) => void
  onOpenEmployee: (employee: DirectoryEmployee) => void
  onLogin: (employee: DirectoryEmployee) => void
  onRemove: (employee: DirectoryEmployee) => void
}) {
  return (
    <ul className="min-w-[720px]">
      {nodes.map((node) => {
        const { employee, children } = node
        const hasChildren = children.length > 0
        const expanded = expandedIds.has(employee.id)

        return (
          <li key={employee.id}>
            <div
              className="flex min-w-0 items-center gap-2 border-b border-gray-100 py-2 pr-3"
              style={{ paddingLeft: 12 + depth * 24 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="flex size-6 shrink-0 items-center justify-center text-gray-500 hover:text-blue-700"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                  onClick={() => onToggleExpanded(employee.id)}
                >
                  <span
                    className={expanded ? 'wm-keyboard-arrow-down' : 'wm-keyboard-arrow-right'}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className="size-6 shrink-0" />
              )}
              <WuCheckbox
                checked={selectedIds.has(employee.id)}
                onChange={(checked) => onToggleSelected(employee.id, checked)}
              />
              <button
                type="button"
                className="truncate text-blue-700 hover:underline"
                onClick={() => onOpenEmployee(employee)}
              >
                {getEmployeeDisplayName(employee)}
              </button>
              <button
                type="button"
                className="truncate text-sm text-blue-700 hover:underline"
                onClick={() => onOpenEmployee(employee)}
              >
                {employee.email}
              </button>
              <span className="shrink-0 text-sm text-gray-500">{employee.department}</span>
              <span className="shrink-0 tabular-nums text-sm text-gray-500">
                {employee.survey360Count}
              </span>
              <EmployeeRowMenu
                employee={employee}
                onLogin={onLogin}
                onRemove={onRemove}
              />
            </div>
            {hasChildren && expanded ? (
              <EmployeeTree
                nodes={children}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                depth={depth + 1}
                onToggleExpanded={onToggleExpanded}
                onToggleSelected={onToggleSelected}
                onOpenEmployee={onOpenEmployee}
                onLogin={onLogin}
                onRemove={onRemove}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function EmployeeListPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex shrink-0 items-center gap-1 text-sm text-gray-600">
      <span className="whitespace-nowrap">
        {start} - {end} of {total}
      </span>
      <span className="wm-arrow-drop-down text-base text-gray-400" aria-hidden />
      <button
        type="button"
        className="flex size-7 items-center justify-center text-gray-600 hover:text-blue-700 disabled:text-gray-300"
        disabled={page <= 1}
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
      >
        <span className="wm-keyboard-arrow-left text-lg" aria-hidden />
      </button>
      <button
        type="button"
        className="flex size-7 items-center justify-center text-gray-600 hover:text-blue-700 disabled:text-gray-300"
        disabled={page >= totalPages}
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
      >
        <span className="wm-keyboard-arrow-right text-lg" aria-hidden />
      </button>
    </div>
  )
}

function TableCountOrPagination({
  page,
  pageSize,
  total,
  showPagination,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  showPagination: boolean
  onPageChange: (page: number) => void
}) {
  return (
    <div className="mb-2 flex justify-end">
      {showPagination ? (
        <EmployeeListPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      ) : (
        <WuText size="sm" className="text-gray-500">
          {total} Members
        </WuText>
      )}
    </div>
  )
}

function CustomFieldColumnHeader({
  title,
  onEdit,
}: {
  title: string
  onEdit: () => void
}) {
  return (
    <button
      type="button"
      className="group inline-flex max-w-full items-center gap-1 text-left text-blue-700 hover:underline"
      title={`Edit ${title}`}
      onClick={(event) => {
        event.stopPropagation()
        onEdit()
      }}
    >
      <span className="truncate font-medium">{title}</span>
      <span className="wm-edit text-sm leading-none opacity-80 group-hover:opacity-100" aria-hidden />
    </button>
  )
}

function fieldOptions(field: DirectoryCustomField, employees: DirectoryEmployee[]): SelectOption[] {
  return toFieldOptions(
    field.options,
    employees.map((employee) => getEmployeeFieldValue(employee, field.key)),
  )
}

function toFieldOptions(configured: string[], usedValues: string[]): SelectOption[] {
  const seen = new Set<string>()
  const values: string[] = []
  ;[...configured, ...usedValues].forEach((value) => {
    if (!value || seen.has(value)) return
    seen.add(value)
    values.push(value)
  })
  return values.map((value) => ({ value, label: value }))
}

function EmployeeRowMenu({
  employee,
  onLogin,
  onRemove,
}: {
  employee: DirectoryEmployee
  onLogin: (employee: DirectoryEmployee) => void
  onRemove: (employee: DirectoryEmployee) => void
}) {
  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label={`Actions for ${getEmployeeDisplayName(employee)}`}
        >
          <span className="wm-more-vert text-base leading-none" aria-hidden />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => onLogin(employee)}>Login</WuMenuItem>
      <WuMenuItem onSelect={() => onRemove(employee)}>Remove</WuMenuItem>
    </WuMenu>
  )
}

function defaultExpandedIds(employees: DirectoryEmployee[]) {
  const ids = new Set<string>()
  function walk(nodes: DirectoryTreeNode[], depth: number) {
    nodes.forEach((node) => {
      if (node.children.length > 0 && depth < 2) {
        ids.add(node.employee.id)
        walk(node.children, depth + 1)
      }
    })
  }
  walk(buildEmployeeTree(employees), 0)
  return ids
}

export function ManageEmployeeListPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const roster = useRosterStore()
  const { employees, customFields, savedFilters } = roster
  const visibleCustomFields = useMemo(() => getVisibleCustomFields(customFields), [customFields])
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('Employees')
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>('list')
  const [portalTab, setPortalTab] = useState<PortalSecondaryTab>('content')
  const [view, setView] = useState<DirectoryView>('list')
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [portalSubdomain, setPortalSubdomain] = useState(DEFAULT_PORTAL_SUBDOMAIN)
  const [editingPortal, setEditingPortal] = useState(false)
  const [draftSubdomain, setDraftSubdomain] = useState(DEFAULT_PORTAL_SUBDOMAIN)
  const [page, setPage] = useState(1)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [removeSelectedOpen, setRemoveSelectedOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<DirectoryEmployee | null>(null)
  const [employeeToRemove, setEmployeeToRemove] = useState<DirectoryEmployee | null>(null)
  const [appliedFilterGroups, setAppliedFilterGroups] = useState<EmployeeFilterGroup[]>([])
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [editingCustomField, setEditingCustomField] = useState<DirectoryCustomField | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => defaultExpandedIds(employees))

  const portalUrl = buildPortalUrl(portalSubdomain)

  const filteredEmployees = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase()
    return employees.filter((employee) => {
      if (query) {
        const name = getEmployeeDisplayName(employee).toLowerCase()
        if (!name.includes(query) && !employee.email.toLowerCase().includes(query)) return false
      }
      return employeeMatchesFilterGroups(employee, appliedFilterGroups)
    })
  }, [appliedFilterGroups, appliedSearch, employees])

  const showPagination = filteredEmployees.length > EMPLOYEE_LIST_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / EMPLOYEE_LIST_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedEmployees = useMemo(() => {
    if (!showPagination) return filteredEmployees
    const start = (currentPage - 1) * EMPLOYEE_LIST_PAGE_SIZE
    return filteredEmployees.slice(start, start + EMPLOYEE_LIST_PAGE_SIZE)
  }, [currentPage, filteredEmployees, showPagination])

  const treeNodes = useMemo(
    () => buildEmployeeTree(filteredEmployees),
    [filteredEmployees],
  )

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => selectedIds.has(employee.id))
  const someSelected = selectedIds.size > 0

  function updateEmployee(id: string, patch: Partial<DirectoryEmployee>) {
    roster.patchEmployee(id, patch)
  }

  function updateEmployeeField(employee: DirectoryEmployee, key: string, value: string) {
    roster.replaceEmployee(setEmployeeFieldValue(employee, key, value))
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(filteredEmployees.map((employee) => employee.id)) : new Set())
  }

  function handleSecondaryTab(tab: SecondaryTab) {
    setSecondaryTab(tab)
  }

  function applySearch() {
    setAppliedSearch(searchInput)
    setPage(1)
  }

  function applyFilter() {
    setFilterModalOpen(true)
  }

  function resetFilter() {
    setSearchInput('')
    setAppliedSearch('')
    setAppliedFilterGroups([])
    setPage(1)
    showToast({ message: 'Filter reset', variant: 'success' })
  }

  function savePortalSubdomain() {
    const value = draftSubdomain.trim()
    const next = value.includes('.')
      ? parsePortalSubdomain(value.startsWith('http') ? value : `https://${value}`)
      : value || DEFAULT_PORTAL_SUBDOMAIN
    setPortalSubdomain(next)
    setDraftSubdomain(next)
    setEditingPortal(false)
    showToast({ message: 'Portal link updated', variant: 'success' })
  }

  function inviteSelected() {
    showToast({
      message: `Portal invite sent to ${selectedIds.size} employees`,
      variant: 'success',
    })
  }

  function loginAsEmployee(employee: DirectoryEmployee) {
    window.localStorage.setItem(
      'pp_impersonating',
      JSON.stringify({
        id: employee.id,
        name: getEmployeeDisplayName(employee),
        email: employee.email,
        role: 'employee',
      }),
    )
    showToast({
      message: `Logged in as ${getEmployeeDisplayName(employee)}`,
      variant: 'success',
    })
    router.push(getDefaultPortalHref())
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rowIndexOffset = showPagination ? (currentPage - 1) * EMPLOYEE_LIST_PAGE_SIZE : 0

  const columns: IWuTableColumnDef<DirectoryEmployee>[] = [
    {
      accessorKey: 'id',
      id: 'select',
      header: () => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <WuCheckbox
            checked={allFilteredSelected}
            partial={someSelected && !allFilteredSelected}
            onChange={toggleAll}
          />
          {someSelected ? (
            <>
              <span className="text-sm text-gray-700">{selectedIds.size} Selected</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-red-600"
                onClick={() => setRemoveSelectedOpen(true)}
              >
                <span className="wm-delete text-base" aria-hidden />
                Remove
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-700"
                onClick={inviteSelected}
              >
                <span className="wm-send text-base" aria-hidden />
                Send Portal Invite
              </button>
            </>
          ) : null}
        </div>
      ),
      size: someSelected ? 420 : 44,
      minSize: someSelected ? 420 : 44,
      maxSize: someSelected ? 460 : 44,
      enableSorting: false,
      cell: ({ row }) => (
        <WuCheckbox
          checked={selectedIds.has(row.original.id)}
          onChange={(checked) => toggleSelected(row.original.id, checked)}
        />
      ),
    },
    {
      accessorKey: 'id',
      id: 'index',
      header: '#',
      size: 48,
      minSize: 48,
      maxSize: 56,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-500">{rowIndexOffset + row.index + 1}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email address',
      size: 240,
      minSize: 200,
      cell: ({ row }) => (
        <button
          type="button"
          className="block max-w-full truncate text-left text-blue-700 hover:underline"
          title={row.original.email}
          onClick={() => setEditingEmployee(row.original)}
        >
          {row.original.email}
        </button>
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      size: 180,
      minSize: 140,
      cell: ({ row }) => (
        <button
          type="button"
          className="block max-w-full truncate text-left text-blue-700 hover:underline"
          title={getEmployeeDisplayName(row.original)}
          onClick={() => setEditingEmployee(row.original)}
        >
          {getEmployeeDisplayName(row.original)}
        </button>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      minSize: 130,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-gray-700">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'managerId',
      header: 'Manager',
      size: 200,
      minSize: 180,
      enableSorting: false,
      cell: ({ row }) => {
        const managerId =
          row.original.managerId && row.original.managerId !== row.original.id
            ? row.original.managerId
            : ''
        const options = [
          NONE_OPTION,
          ...employees
            .filter((employee) => employee.id !== row.original.id)
            .map((employee) => ({
              value: employee.id,
              label: getEmployeeDisplayName(employee),
            })),
        ]
        return (
          <InlineSelect
            options={options}
            value={managerId}
            onChange={(value) =>
              updateEmployee(row.original.id, { managerId: value || undefined })
            }
            className="min-w-[168px]"
          />
        )
      },
    },
    {
      accessorKey: 'hireDate',
      header: 'Start date',
      size: 120,
      minSize: 110,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-gray-700">
          {format(new Date(row.original.hireDate), 'MMM dd yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Employee status',
      size: 130,
      minSize: 120,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-gray-700">{STATUS_LABELS[row.original.status]}</span>
      ),
    },
    {
      accessorKey: 'terminationDate',
      header: 'End date',
      size: 120,
      minSize: 110,
      cell: ({ row }) =>
        row.original.terminationDate ? (
          <span className="whitespace-nowrap text-gray-700">
            {format(new Date(row.original.terminationDate), 'MMM dd yyyy')}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      accessorKey: 'language',
      header: 'Language',
      size: 150,
      minSize: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <InlineSelect
          options={DIRECTORY_LANGUAGES}
          value={row.original.language}
          onChange={(language) => updateEmployee(row.original.id, { language })}
          className="w-[128px]"
        />
      ),
    },
    ...visibleCustomFields.map((field) => ({
      accessorKey: field.key === 'department' || field.key === 'location' ? field.key : 'id',
      id: `custom_${field.key}`,
      header: () => (
        <CustomFieldColumnHeader title={field.title} onEdit={() => setEditingCustomField(field)} />
      ),
      size: 150,
      minSize: 140,
      enableSorting: false,
      cell: ({ row }: { row: { original: DirectoryEmployee } }) => (
        <InlineSelect
          options={fieldOptions(field, employees)}
          value={getEmployeeFieldValue(row.original, field.key)}
          onChange={(value) => updateEmployeeField(row.original, field.key, value)}
          className="min-w-[128px]"
        />
      ),
    })),
    {
      accessorKey: 'survey360Count',
      header: '360 Surveys',
      size: 120,
      minSize: 110,
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) =>
        row.original.survey360Count > 0 ? (
          <Link
            href="/360/surveys"
            className="tabular-nums text-blue-700 hover:underline"
          >
            {row.original.survey360Count}
          </Link>
        ) : (
          <span className="tabular-nums text-gray-700">{row.original.survey360Count}</span>
        ),
    },
    {
      accessorKey: 'id',
      id: 'row-actions',
      header: ' ',
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <EmployeeRowMenu
          employee={row.original}
          onLogin={loginAsEmployee}
          onRemove={setEmployeeToRemove}
        />
      ),
    },
  ]

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {PRIMARY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'border-b-2 py-3 text-sm',
                primaryTab === tab
                  ? 'border-blue-600 font-medium text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900',
              )}
              onClick={() => setPrimaryTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {primaryTab === 'Integrations' || primaryTab === 'Admin' ? (
        <EmptyState
          icon="wm-construction"
          title={`${primaryTab} is coming soon`}
          description="This section is part of the Employee Experience prototype."
          action={
            <WuButton variant="secondary" onClick={() => setPrimaryTab('Employees')}>
              Back to Employees
            </WuButton>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-2">
            <div className="flex flex-wrap items-center gap-1">
              {(primaryTab === 'Portal' ? PORTAL_SECONDARY_TABS : SECONDARY_TABS).map((tab) => {
                const selected = primaryTab === 'Portal' ? portalTab === tab.id : secondaryTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm',
                      selected
                        ? 'bg-blue-50 font-medium text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                    onClick={() => {
                      if (primaryTab === 'Portal') setPortalTab(tab.id as PortalSecondaryTab)
                      else handleSecondaryTab(tab.id as SecondaryTab)
                    }}
                  >
                    <span className={`${tab.icon} text-base`} aria-hidden />
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-[240px] items-center rounded border border-gray-300 bg-white px-2">
                {editingPortal ? (
                  <input
                    autoFocus
                    value={draftSubdomain}
                    onChange={(event) => setDraftSubdomain(event.target.value)}
                    onBlur={savePortalSubdomain}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') savePortalSubdomain()
                      if (event.key === 'Escape') {
                        setDraftSubdomain(portalUrl)
                        setEditingPortal(false)
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-sm font-normal text-gray-700 outline-none"
                    aria-label="Portal link"
                  />
                ) : (
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left text-sm font-normal text-gray-700"
                    title={portalUrl}
                    onClick={openAnalyticsPortal}
                  >
                    {portalUrl}
                  </button>
                )}
                <button
                  type="button"
                  className="ml-1 shrink-0 text-gray-500 hover:text-blue-700"
                  aria-label="Edit portal link"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDraftSubdomain(portalUrl)
                    setEditingPortal(true)
                  }}
                >
                  <span className="wm-edit text-base" aria-hidden />
                </button>
              </div>
              <WuButton onClick={openAnalyticsPortal}>
                Access portal
              </WuButton>
            </div>
          </div>

          {primaryTab === 'Portal' ? (
            portalTab === 'content' ? (
              <PortalContentPage />
            ) : portalTab === 'permissions' ? (
              <PortalPermissionsPage
                onGoToEmployeeFilters={() => {
                  setPrimaryTab('Employees')
                  setSecondaryTab('filters')
                }}
              />
            ) : (
              <EmptyState
                icon="wm-construction"
                title={`${PORTAL_SECONDARY_TABS.find((tab) => tab.id === portalTab)?.label ?? 'This page'} is coming soon`}
                description="We'll build this Portal page next from a screenshot of the original product."
              />
            )
          ) : secondaryTab === 'import' ? (
            <EmployeeImportPage
              employees={employees}
              customFields={visibleCustomFields}
              onAddEmployees={(imported) => {
                roster.addEmployees(imported)
              }}
            />
          ) : secondaryTab === 'setup' ? (
            <EmployeeSetupPage />
          ) : secondaryTab === 'custom-fields' ? (
            <CustomFieldsPage />
          ) : secondaryTab === 'filters' ? (
            <EmployeeFiltersPage
              onGoToFilterAccessRules={() => {
                setPrimaryTab('Portal')
                setPortalTab('permissions')
              }}
            />
          ) : (
            <div className="flex min-w-0 flex-1 flex-col px-6 py-4">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex overflow-hidden rounded border border-gray-200">
                    <button
                      type="button"
                      className={cn(
                        'px-2 py-1 text-gray-600',
                        view === 'list' && 'bg-blue-50 text-blue-700',
                      )}
                      aria-label="List view"
                      onClick={() => setView('list')}
                    >
                      <span className="wm-format-list-bulleted" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'border-l border-gray-200 px-2 py-1 text-gray-600',
                        view === 'tree' && 'bg-blue-50 text-blue-700',
                      )}
                      aria-label="Tree view"
                      title="Tree view"
                      onClick={() => setView('tree')}
                    >
                      <span className="wm-account-tree" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-blue-700"
                    aria-label="Help"
                    onClick={() => showToast({ message: 'Employee list help opened', variant: 'info' })}
                  >
                    <span className="wm-help text-lg" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="text-sm text-blue-700 hover:underline"
                    onClick={() => showToast({ message: 'Employee list downloaded', variant: 'success' })}
                  >
                    Download list
                  </button>
                  <WuMenu
                    Trigger={
                      <button type="button" className="text-sm text-gray-600 hover:text-blue-700">
                        Admin tools
                      </button>
                    }
                  >
                    <WuMenuItem
                      onSelect={() =>
                        showToast({ message: 'Sanitize Panel Member opened', variant: 'success' })
                      }
                    >
                      Sanitize Panel Member - UserID
                    </WuMenuItem>
                    <WuMenuItem
                      onSelect={() =>
                        showToast({
                          message: 'Sanitize Member Custom Field Choices opened',
                          variant: 'success',
                        })
                      }
                    >
                      Sanitize Member Custom Field Choices
                    </WuMenuItem>
                    <WuMenuItem
                      onSelect={() =>
                        showToast({ message: 'Unsubscribed Members opened', variant: 'success' })
                      }
                    >
                      Unsubscribed Members
                    </WuMenuItem>
                    <WuMenuItem onSelect={() => setDeleteAllOpen(true)}>
                      Delete All Employees
                    </WuMenuItem>
                  </WuMenu>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-nowrap items-center gap-2">
                    <div className="w-[180px] shrink-0">
                      <WuInput
                        type="search"
                        variant="outlined"
                        placeholder="Search Employee"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') applySearch()
                        }}
                      />
                    </div>
                    <WuButton onClick={applyFilter}>Apply filter</WuButton>
                    <WuButton variant="secondary" onClick={resetFilter}>
                      <span className="wm-refresh" /> Reset filter
                    </WuButton>
                  </div>
                </div>
              </div>

              {filteredEmployees.length === 0 ? (
                <EmptyState
                  icon="wm-search-off"
                  title="No employees found"
                  description="Try a different search or reset the filter."
                  action={
                    <WuButton variant="secondary" onClick={resetFilter}>
                      Reset filter
                    </WuButton>
                  }
                />
              ) : view === 'tree' ? (
                <div className="flex min-h-0 flex-col">
                  <TableCountOrPagination
                    page={currentPage}
                    pageSize={EMPLOYEE_LIST_PAGE_SIZE}
                    total={filteredEmployees.length}
                    showPagination={showPagination}
                    onPageChange={setPage}
                  />
                  <div className="max-h-[calc(100vh-280px)] overflow-auto rounded border border-gray-200">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2">
                      <WuCheckbox
                        checked={allFilteredSelected}
                        partial={someSelected && !allFilteredSelected}
                        onChange={toggleAll}
                      />
                      {someSelected ? (
                        <>
                          <span className="text-sm text-gray-700">{selectedIds.size} Selected</span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-red-600"
                            onClick={() => setRemoveSelectedOpen(true)}
                          >
                            <span className="wm-delete text-base" aria-hidden />
                            Remove
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-700"
                            onClick={inviteSelected}
                          >
                            <span className="wm-send text-base" aria-hidden />
                            Send Portal Invite
                          </button>
                        </>
                      ) : null}
                    </div>
                    <EmployeeTree
                      nodes={treeNodes}
                      selectedIds={selectedIds}
                      expandedIds={expandedIds}
                      onToggleExpanded={toggleExpanded}
                      onToggleSelected={toggleSelected}
                      onOpenEmployee={setEditingEmployee}
                      onLogin={loginAsEmployee}
                      onRemove={setEmployeeToRemove}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col">
                  <TableCountOrPagination
                    page={currentPage}
                    pageSize={EMPLOYEE_LIST_PAGE_SIZE}
                    total={filteredEmployees.length}
                    showPagination={showPagination}
                    onPageChange={setPage}
                  />
                  <div className="min-w-0 overflow-x-auto [&_td]:align-middle [&_td]:px-3 [&_th]:px-3 [&_thead_th:first-child]:overflow-visible">
                    <WuTable
                      data={pagedEmployees as unknown[]}
                      columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                      variant="striped"
                      size="compact"
                      tableLayout="fixed"
                      stickyHeader
                      maxHeight="calc(100vh - 320px)"
                      sort={{ enabled: true }}
                      className="min-w-[1880px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title="Delete All Employees?"
        description="All employees in this list will be removed. This cannot be undone in the prototype."
        confirmLabel="Delete all"
        variant="critical"
        onConfirm={() => {
          roster.setEmployees([])
          setSelectedIds(new Set())
          showToast({ message: 'All employees deleted', variant: 'success' })
        }}
      />
      <ConfirmModal
        open={removeSelectedOpen}
        onOpenChange={setRemoveSelectedOpen}
        title="Remove selected employees?"
        description={`${selectedIds.size} employees will be removed from this list.`}
        confirmLabel="Remove"
        variant="critical"
        onConfirm={() => {
          roster.removeEmployees([...selectedIds])
          setSelectedIds(new Set())
          showToast({ message: 'Selected employees removed', variant: 'success' })
        }}
      />
      <ConfirmModal
        open={Boolean(employeeToRemove)}
        onOpenChange={(open) => {
          if (!open) setEmployeeToRemove(null)
        }}
        title="Remove employee?"
        description={
          employeeToRemove
            ? `${getEmployeeDisplayName(employeeToRemove)} will be removed from this list.`
            : 'This employee will be removed from this list.'
        }
        confirmLabel="Remove"
        variant="critical"
        onConfirm={() => {
          if (!employeeToRemove) return
          roster.removeEmployees([employeeToRemove.id])
          setSelectedIds((current) => {
            const next = new Set(current)
            next.delete(employeeToRemove.id)
            return next
          })
          setEmployeeToRemove(null)
          showToast({ message: 'Employee removed', variant: 'success' })
        }}
      />
      <EditEmployeeModal
        employee={editingEmployee}
        employees={employees}
        customFields={visibleCustomFields}
        onOpenChange={(open) => {
          if (!open) setEditingEmployee(null)
        }}
        onSave={(updated) => {
          roster.replaceEmployee(updated)
        }}
      />
      <EditCustomFieldModal
        field={editingCustomField}
        onOpenChange={(open) => {
          if (!open) setEditingCustomField(null)
        }}
        onSave={(updated) => {
          roster.saveCustomField(updated)
        }}
      />
      <EmployeeFilterModal
        open={filterModalOpen}
        employees={employees}
        customFields={visibleCustomFields}
        languageOptions={DIRECTORY_LANGUAGES}
        savedFilters={savedFilters}
        appliedGroups={appliedFilterGroups}
        onOpenChange={setFilterModalOpen}
        onApply={(groups) => {
          setAppliedSearch(searchInput)
          setAppliedFilterGroups(groups)
          setPage(1)
          showToast({ message: 'Filter applied', variant: 'success' })
        }}
      />
    </div>
  )
}
