'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import { getEmployeeDisplayName, type DirectoryEmployee } from '@/data/mock-employee-directory'
import { cloneFilterGroups } from '@/data/mock-employee-filters'
import {
  PORTAL_FILTER_ACCESS_FIELDS,
  createFilterAudience,
  type FilterAudience,
  type PortalAccessRule,
  type PortalFilterAccessRule,
} from '@/data/mock-portal-settings'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
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
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

function IconTipButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <WuTooltip content={label} position="top" showArrow>
      <button
        type="button"
        className={`rounded p-1 text-gray-500 hover:bg-gray-100 ${
          danger ? 'hover:text-red-600' : 'hover:text-blue-700'
        }`}
        aria-label={label}
        onClick={onClick}
      >
        <span className={`${icon} text-base leading-none`} aria-hidden />
      </button>
    </WuTooltip>
  )
}

function EmployeePicker({
  label,
  employees,
  selectedIds,
  onChange,
}: {
  label: string
  employees: DirectoryEmployee[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const selected = new Set(selectedIds)
  const filtered = employees.filter((employee) => {
    const haystack = `${getEmployeeDisplayName(employee)} ${employee.email} ${employee.department}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onChange([...next])
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <WuInput
        type="search"
        variant="outlined"
        placeholder="Search employees"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-40 overflow-auto rounded border border-gray-200 p-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-sm text-gray-500">No employees match.</p>
        ) : (
          filtered.slice(0, 40).map((employee) => (
            <label key={employee.id} className="flex items-center gap-2 py-1 text-sm text-gray-700">
              <WuCheckbox
                checked={selected.has(employee.id)}
                onChange={(checked) => toggle(employee.id, checked)}
              />
              <span className="truncate">
                {getEmployeeDisplayName(employee)}
                <span className="ml-1 text-gray-400">{employee.department}</span>
              </span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-gray-500">{selectedIds.length} selected</p>
    </div>
  )
}

function FilterPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const options = PORTAL_FILTER_ACCESS_FIELDS.map((field) => ({
    value: field.id,
    label: field.label,
  }))
  const selected = options.filter((option) => selectedIds.includes(option.value))

  return (
    <WuFormGroup
      Label="Allowed filters"
      Input={
        <WuSelect
          data={options}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selected}
          onSelect={(value: unknown) => {
            const next = (Array.isArray(value) ? value : value ? [value] : []) as SelectOption[]
            onChange(next.map((option) => option.value))
          }}
          multiple
          variant="outlined"
          placeholder="Select filters"
        />
      }
    />
  )
}

type AccessRuleModalProps =
  | {
      mode: 'data'
      rule: PortalAccessRule | null
      employees: DirectoryEmployee[]
      onOpenChange: (open: boolean) => void
      onSave: (rule: PortalAccessRule) => void
    }
  | {
      mode: 'filter'
      rule: PortalFilterAccessRule | null
      employees: DirectoryEmployee[]
      onOpenChange: (open: boolean) => void
      onSave: (rule: PortalFilterAccessRule) => void
      onGoToEmployeeFilters?: () => void
    }

export function AccessRuleModal(props: AccessRuleModalProps) {
  const { mode, rule, employees, onOpenChange } = props
  const { showToast } = useWuShowToast()
  const { savedFilters } = useRosterStore()
  const isNew = Boolean(rule && rule.id.includes('_new_'))
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [userIds, setUserIds] = useState<string[]>([])
  const [allowedEmployeeIds, setAllowedEmployeeIds] = useState<string[]>([])
  const [audiences, setAudiences] = useState<FilterAudience[]>([createFilterAudience()])

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'active' || employee.status === 'on_leave'),
    [employees],
  )
  const savedFilterOptions = useMemo<SelectOption[]>(
    () => savedFilters.map((filter) => ({ value: filter.id, label: filter.name })),
    [savedFilters],
  )
  const showFilterEmpty = mode === 'filter' && savedFilters.length === 0

  useEffect(() => {
    if (!rule) return
    setName(rule.name)
    setDescription(rule.description)
    if (mode === 'data') {
      setUserIds([...rule.userIds])
      setAllowedEmployeeIds([...rule.allowedEmployeeIds])
      return
    }
    setAudiences(
      rule.audiences.length > 0
        ? rule.audiences.map((audience) => ({
            ...audience,
            source: 'saved',
            peopleGroups: cloneFilterGroups(audience.peopleGroups),
            allowedFilterIds: [...audience.allowedFilterIds],
          }))
        : [createFilterAudience()],
    )
  }, [mode, rule])

  function updateAudience(audienceId: string, patch: Partial<FilterAudience>) {
    setAudiences((current) =>
      current.map((audience) => (audience.id === audienceId ? { ...audience, ...patch } : audience)),
    )
  }

  function applySavedFilter(audienceId: string, filterId: string) {
    const preset = savedFilters.find((filter) => filter.id === filterId)
    if (!preset) return
    updateAudience(audienceId, {
      source: 'saved',
      savedFilterId: filterId,
      peopleGroups: cloneFilterGroups(preset.groups),
    })
  }

  function goToEmployeeFilters() {
    onOpenChange(false)
    if (mode === 'filter') props.onGoToEmployeeFilters?.()
  }

  function handleSave() {
    if (!rule) return
    const nextName = name.trim()
    if (!nextName) {
      showToast({ message: 'Rule name is required', variant: 'error' })
      return
    }
    if (mode === 'data') {
      if (userIds.length === 0) {
        showToast({ message: 'Select at least one user', variant: 'error' })
        return
      }
      if (allowedEmployeeIds.length === 0) {
        showToast({ message: 'Select at least one allowed employee', variant: 'error' })
        return
      }
      props.onSave({
        ...rule,
        name: nextName,
        description: description.trim(),
        userIds,
        allowedEmployeeIds,
      })
      showToast({
        message: isNew ? 'Data access rule added' : 'Data access rule updated',
        variant: 'success',
      })
      onOpenChange(false)
      return
    }

    if (audiences.length === 0) {
      showToast({ message: 'Add at least one filter group', variant: 'error' })
      return
    }
    if (audiences.some((audience) => !audience.savedFilterId)) {
      showToast({ message: 'Each filter group needs a saved filter', variant: 'error' })
      return
    }
    if (audiences.some((audience) => audience.allowedFilterIds.length === 0)) {
      showToast({ message: 'Each filter group needs at least one allowed filter', variant: 'error' })
      return
    }

    props.onSave({
      ...rule,
      name: nextName,
      description: description.trim(),
      audiences: audiences.map((audience) => ({ ...audience, source: 'saved' })),
    })
    showToast({
      message: isNew ? 'Filter access rule added' : 'Filter access rule updated',
      variant: 'success',
    })
    onOpenChange(false)
  }

  return (
    <WuModal
      open={Boolean(rule)}
      onOpenChange={onOpenChange}
      size={mode === 'filter' && !showFilterEmpty ? 'lg' : 'md'}
      maxWidth={mode === 'filter' && !showFilterEmpty ? '880px' : undefined}
      {...preventModalDismiss}
    >
      <WuModalHeader>{isNew ? 'Add rule' : 'Edit rule'}</WuModalHeader>
      <WuModalContent>
        {showFilterEmpty ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="wm-filter-list text-5xl text-gray-300" aria-hidden />
            <p className="text-base font-medium text-gray-700">No employee groups</p>
            <p className="max-w-sm text-sm text-gray-500">
              To add an access rule for dashboard filters, create an employee group first.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <WuFormGroup
              Label="Rule name"
              Input={<WuInput value={name} onChange={(event) => setName(event.target.value)} />}
            />
            {mode === 'data' ? (
              <WuFormGroup
                Label="Description"
                Input={
                  <WuTextarea
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                }
              />
            ) : null}
            {mode === 'data' ? (
              <>
                <EmployeePicker
                  label="Users"
                  employees={activeEmployees}
                  selectedIds={userIds}
                  onChange={setUserIds}
                />
                <EmployeePicker
                  label="Allowed employees"
                  employees={activeEmployees}
                  selectedIds={allowedEmployeeIds}
                  onChange={setAllowedEmployeeIds}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Filter groups</p>
                  <button
                    type="button"
                    className="text-sm text-blue-700 hover:underline"
                    onClick={() => setAudiences((current) => [...current, createFilterAudience()])}
                  >
                    + Add filter group
                  </button>
                </div>
                {audiences.map((audience, index) => {
                  const selectedSaved =
                    savedFilterOptions.find((option) => option.value === audience.savedFilterId) ?? null
                  return (
                    <div key={audience.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">Filter group {index + 1}</p>
                        {audiences.length > 1 ? (
                          <IconTipButton
                            label="Remove filter group"
                            icon="wm-delete"
                            danger
                            onClick={() =>
                              setAudiences((current) => current.filter((item) => item.id !== audience.id))
                            }
                          />
                        ) : null}
                      </div>
                      <WuFormGroup
                        Label="Saved filter"
                        Input={
                          <WuSelect
                            data={savedFilterOptions}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={selectedSaved}
                            placeholder="Select a saved filter"
                            onSelect={(value: unknown) => {
                              const next = value as SelectOption | null
                              if (next?.value) applySavedFilter(audience.id, next.value)
                            }}
                            variant="outlined"
                          />
                        }
                      />
                      {audience.savedFilterId ? (
                        <FilterPicker
                          selectedIds={audience.allowedFilterIds}
                          onChange={(ids) => updateAudience(audience.id, { allowedFilterIds: ids })}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        {showFilterEmpty ? (
          <WuButton onClick={goToEmployeeFilters}>Go to Employee Filters</WuButton>
        ) : (
          <WuButton onClick={handleSave}>Save</WuButton>
        )}
      </WuModalFooter>
    </WuModal>
  )
}
