'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmployeeFilterModal } from '@/components/employees/EmployeeFilterModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PageCard } from '@/components/shared/PageCard'
import { DIRECTORY_LANGUAGES } from '@/data/mock-employee-directory'
import { getVisibleCustomFields } from '@/data/mock-custom-fields'
import {
  createDefaultFilterGroups,
  getEmployeeFilterFields,
  summarizeFilterGroups,
  type EmployeeFilterGroup,
  type EmployeeFilterPreset,
} from '@/data/mock-employee-filters'
import { getFilterAccessRulesUsingSavedFilter } from '@/lib/portalAccess'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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

export function EmployeeFiltersPage({
  onGoToFilterAccessRules,
}: {
  onGoToFilterAccessRules?: () => void
}) {
  const { showToast } = useWuShowToast()
  const { employees, customFields, savedFilters, saveFilter, deleteFilter } = useRosterStore()
  const visibleCustomFields = useMemo(
    () => getVisibleCustomFields(customFields),
    [customFields],
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFilter, setEditingFilter] = useState<EmployeeFilterPreset | null>(null)
  const [filterToDelete, setFilterToDelete] = useState<EmployeeFilterPreset | null>(null)

  const fields = useMemo(
    () =>
      getEmployeeFilterFields({
        customFields: visibleCustomFields,
        languageOptions: DIRECTORY_LANGUAGES,
        managerOptions: employees.map((employee) => ({
          value: employee.id,
          label: `${employee.firstName} ${employee.lastName}`,
        })),
      }),
    [customFields, employees, visibleCustomFields],
  )

  function openCreate() {
    setEditingFilter(null)
    setModalOpen(true)
  }

  function openEdit(filter: EmployeeFilterPreset) {
    setEditingFilter(filter)
    setModalOpen(true)
  }

  const blockingRules = filterToDelete
    ? getFilterAccessRulesUsingSavedFilter(filterToDelete.id)
    : []
  const isDeleteBlocked = blockingRules.length > 0

  function deleteBlockedDescription(name: string) {
    const ruleNames = blockingRules.map((rule) => rule.name).join(', ')
    if (blockingRules.length === 1) {
      return `${name} is used in 1 filter access rule: ${ruleNames}. Remove it from the rule first.`
    }
    return `${name} is used in ${blockingRules.length} filter access rules: ${ruleNames}. Remove it from those rules first.`
  }

  const columns: IWuTableColumnDef<EmployeeFilterPreset>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left text-blue-700 hover:underline"
          onClick={() => openEdit(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'id',
      id: 'criteria',
      header: 'Criteria',
      cell: ({ row }) => (
        <span className="text-gray-700">{summarizeFilterGroups(row.original.groups, fields)}</span>
      ),
    },
    {
      accessorKey: 'id',
      id: 'actions',
      header: ' ',
      enableSorting: false,
      cellAlign: 'right',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="text-sm text-blue-700 hover:underline"
            onClick={() => openEdit(row.original)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-red-600"
            onClick={() => setFilterToDelete(row.original)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 bg-gray-50 px-6 py-6">
      <div className="flex items-center justify-between">
        <WuText size="sm" className="text-gray-500">
          Saved filters appear in the employee list and in Portal filter access rules.
        </WuText>
        <WuButton onClick={openCreate}>+ Add filter</WuButton>
      </div>

      {savedFilters.length === 0 ? (
        <EmptyState
          icon="wm-filter-list"
          title="No employee filters"
          description="Save a named filter to apply it from the employee list."
          action={<WuButton onClick={openCreate}>+ Add filter</WuButton>}
        />
      ) : (
        <PageCard className="p-0">
          <WuTable
            data={savedFilters as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="compact"
          />
        </PageCard>
      )}

      <EmployeeFilterModal
        open={modalOpen}
        mode="save"
        employees={employees}
        customFields={visibleCustomFields}
        languageOptions={DIRECTORY_LANGUAGES}
        savedFilters={savedFilters}
        appliedGroups={editingFilter?.groups ?? createDefaultFilterGroups()}
        filterName={editingFilter?.name ?? ''}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingFilter(null)
        }}
        onSaveFilter={(name, groups: EmployeeFilterGroup[]) => {
          saveFilter({
            id: editingFilter?.id ?? `filter_${Date.now()}`,
            name,
            groups,
          })
          showToast({
            message: editingFilter ? 'Filter updated' : 'Filter saved',
            variant: 'success',
          })
        }}
      />
      <ConfirmModal
        open={Boolean(filterToDelete)}
        onOpenChange={(open) => {
          if (!open) setFilterToDelete(null)
        }}
        title={isDeleteBlocked ? "Can't delete employee group" : 'Delete filter?'}
        description={
          filterToDelete
            ? isDeleteBlocked
              ? deleteBlockedDescription(filterToDelete.name)
              : `${filterToDelete.name} will be removed from the Apply New dropdown.`
            : 'This filter will be removed.'
        }
        confirmLabel={isDeleteBlocked ? 'Go to Filter access rules' : 'Delete'}
        variant={isDeleteBlocked ? 'action' : 'critical'}
        onConfirm={() => {
          if (!filterToDelete) return
          if (isDeleteBlocked) {
            setFilterToDelete(null)
            onGoToFilterAccessRules?.()
            return
          }
          deleteFilter(filterToDelete.id)
          setFilterToDelete(null)
          showToast({ message: 'Filter deleted', variant: 'success' })
        }}
      />
    </div>
  )
}
