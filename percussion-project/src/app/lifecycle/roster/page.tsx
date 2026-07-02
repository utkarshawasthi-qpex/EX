'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { AddEmployeeModal } from '@/components/modules/lifecycle/AddEmployeeModal'
import { ImportEmployeesModal } from '@/components/modules/lifecycle/ImportEmployeesModal'
import { PageCard } from '@/components/shared/PageCard'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { getEmployees } from '@/lib/mockDb'
import { isEmployeeContext } from '@/lib/userContext'
import type { Employee, EmployeeStatus } from '@/types'

type FilterOption = {
  value: string
  label: string
}

type ChipStyle = Partial<{
  variant: 'primary' | 'secondary'
  color: 'success' | 'warning' | 'danger'
}>

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
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
const WuLoader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuLoader })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuItem })),
  { ssr: false },
)
const WuPagination = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuPagination })),
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

const PAGE_SIZE = 10

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
]

function toFilterOptions(values: string[]) {
  return [{ value: 'all', label: 'All' }, ...values.map((value) => ({ value, label: value }))]
}

function getInitials(employee: Employee) {
  return `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase()
}

function StatusChip({ status }: { status: EmployeeStatus }) {
  const chipStyles = {
    active: { variant: 'primary', color: 'success' },
    inactive: { variant: 'secondary' },
    on_leave: { variant: 'primary', color: 'warning' },
    terminated: { variant: 'primary', color: 'danger' },
  } satisfies Record<EmployeeStatus, ChipStyle>

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
  } satisfies Record<EmployeeStatus, string>

  return (
    <WuChip size="sm" shape="rounded" {...chipStyles[status]}>
      {labels[status]}
    </WuChip>
  )
}

function EmployeeActions({ employee }: { employee: Employee }) {
  const router = useRouter()
  const { showToast } = useWuShowToast()

  function logAction(action: string) {
    console.log(`${action} employee`, employee.id)
  }

  function handleLoginAsEmployee() {
    const name = `${employee.firstName} ${employee.lastName}`
    window.localStorage.setItem(
      'pp_impersonating',
      JSON.stringify({
        id: employee.id,
        name,
        email: employee.email,
        role: 'employee',
      }),
    )
    showToast({
      variant: 'info',
      message: `Now viewing portal as ${name}`,
    })
    router.push('/lifecycle/analytics')
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          aria-label={`Actions for ${employee.firstName} ${employee.lastName}`}
        >
          ...
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => logAction('View Profile')}>View Profile</WuMenuItem>
      <WuMenuItem onSelect={handleLoginAsEmployee}>
        <span className="flex items-center gap-2">
          <span className="wm-person text-sm" aria-hidden />
          Login as Employee
        </span>
      </WuMenuItem>
      <WuMenuItem onSelect={() => logAction('Edit')}>Edit</WuMenuItem>
      <WuMenuItem onSelect={() => logAction('Deactivate')}>Deactivate</WuMenuItem>
      <WuMenuItem onSelect={() => logAction('Remove')}>
        <span className="text-red-600">Remove</span>
      </WuMenuItem>
    </WuMenu>
  )
}

export default function LifecycleRosterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees())
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<FilterOption>({ value: 'all', label: 'All' })
  const [statusFilter, setStatusFilter] = useState<FilterOption>(STATUS_OPTIONS[0])
  const [locationFilter, setLocationFilter] = useState<FilterOption>({ value: 'all', label: 'All' })
  const [page, setPage] = useState(1)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 300)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isEmployeeContext()) {
      router.replace('/lifecycle/analytics')
    }
  }, [router])

  const departments = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.department))).sort(),
    [employees],
  )
  const locations = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.location))).sort(),
    [employees],
  )

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        fullName.includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch)
      const matchesDepartment =
        departmentFilter.value === 'all' || employee.department === departmentFilter.value
      const matchesStatus = statusFilter.value === 'all' || employee.status === statusFilter.value
      const matchesLocation =
        locationFilter.value === 'all' || employee.location === locationFilter.value

      return matchesSearch && matchesDepartment && matchesStatus && matchesLocation
    })
  }, [departmentFilter.value, employees, locationFilter.value, search, statusFilter.value])

  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredEmployees.slice(start, start + PAGE_SIZE)
  }, [filteredEmployees, page])

  function handleFilterSelect(value: unknown, setter: (option: FilterOption) => void) {
    const selected = value as FilterOption | FilterOption[]
    setter((Array.isArray(selected) ? selected[0] : selected) ?? { value: 'all', label: 'All' })
    setPage(1)
  }

  function handleAddEmployee(employee: Employee) {
    setEmployees((currentEmployees) => [employee, ...currentEmployees])
    setPage(1)
  }

  const columns: IWuTableColumnDef<Employee>[] = [
    {
      id: 'select',
      accessorKey: 'id',
      header: '',
      cell: ({ row }) => (
        <WuCheckbox
          checked={selectedEmployeeIds.has(row.original.id)}
          onChange={(checked) =>
            setSelectedEmployeeIds((currentIds) => {
              const nextIds = new Set(currentIds)
              if (checked) nextIds.add(row.original.id)
              else nextIds.delete(row.original.id)
              return nextIds
            })
          }
        />
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Employee',
      cell: ({ row }) => {
        const employee = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
              {getInitials(employee)}
            </div>
            <div>
              <button
                type="button"
                className="font-medium text-blue-700 hover:underline"
                onClick={() => router.push(`/lifecycle/roster/${employee.id}`)}
              >
                {employee.firstName} {employee.lastName}
              </button>
              <WuText size="sm" as="div" className="text-gray-500">
                {employee.email}
              </WuText>
            </div>
          </div>
        )
      },
    },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'jobTitle', header: 'Job Title' },
    {
      accessorKey: 'hireDate',
      header: 'Hire Date',
      cell: ({ row }) => format(new Date(row.original.hireDate), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusChip status={row.original.status} />,
    },
    {
      id: 'actions',
      accessorKey: 'id',
      header: 'Actions',
      cellAlign: 'right',
      cell: ({ row }) => <EmployeeActions employee={row.original} />,
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Employee Roster"
        description="Manage your employee data and segments"
        actions={
          <div className="flex items-center gap-3">
            <WuButton variant="secondary" onClick={() => setIsImportOpen(true)}>
              Import Employees
            </WuButton>
            <WuButton variant="primary" onClick={() => setIsAddOpen(true)}>
              Add Employee
            </WuButton>
          </div>
        }
      />

      <PageContent>
        <AddEmployeeModal
          open={isAddOpen}
          employees={employees}
          departments={departments}
          locations={locations}
          onOpenChange={setIsAddOpen}
          onAddEmployee={handleAddEmployee}
        />
        <ImportEmployeesModal open={isImportOpen} onOpenChange={setIsImportOpen} />

        <PageCard className="grid gap-4 md:grid-cols-4">
          <WuInput
            type="search"
            variant="outlined"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          <WuSelect
            data={toFilterOptions(departments)}
            accessorKey={{ value: 'value', label: 'label' }}
            value={departmentFilter}
            onSelect={(value) => handleFilterSelect(value, setDepartmentFilter)}
            variant="outlined"
          />
          <WuSelect
            data={STATUS_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={statusFilter}
            onSelect={(value) => handleFilterSelect(value, setStatusFilter)}
            variant="outlined"
          />
          <WuSelect
            data={toFilterOptions(locations)}
            accessorKey={{ value: 'value', label: 'label' }}
            value={locationFilter}
            onSelect={(value) => handleFilterSelect(value, setLocationFilter)}
            variant="outlined"
          />
        </PageCard>

        <PageCard>
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <WuLoader size="lg" message="Loading employees..." />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
              <WuHeading size="md" className="text-gray-900">
                No employees found
              </WuHeading>
              <WuText size="sm" as="p" className="text-gray-500">
                Try clearing your search or changing the filters.
              </WuText>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <WuDataTable
                data={pagedEmployees as unknown[]}
                columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                variant="striped"
                tableLayout="auto"
              />
              <WuPagination
                totalRows={filteredEmployees.length}
                initialPage={page}
                initialPageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </PageCard>
      </PageContent>
    </PageShell>
  )
}
