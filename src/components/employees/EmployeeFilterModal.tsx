'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { preventModalDismiss } from '@/lib/modalProps'
import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import {
  APPLY_NEW_PRESET_ID,
  JOIN_OPTIONS,
  TEXT_OPERATOR_OPTIONS,
  cloneFilterGroups,
  createDefaultFilterGroups,
  createFilterCondition,
  createFilterGroup,
  getEmployeeFilterFields,
  getEmployeeFilterPresets,
  type EmployeeFilterCondition,
  type EmployeeFilterField,
  type EmployeeFilterGroup,
  type EmployeeFilterPreset,
  type FilterJoin,
  type FilterSelectOption,
} from '@/data/mock-employee-filters'
import { getEmployeeDisplayName, type DirectoryEmployee } from '@/data/mock-employee-directory'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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

type EmployeeFilterBuilderProps = {
  employees: DirectoryEmployee[]
  customFields: DirectoryCustomField[]
  languageOptions: FilterSelectOption[]
  savedFilters?: EmployeeFilterPreset[]
  appliedGroups: EmployeeFilterGroup[]
  onApply?: (groups: EmployeeFilterGroup[]) => void
  mode?: 'apply' | 'save'
  filterName?: string
  onSaveFilter?: (name: string, groups: EmployeeFilterGroup[]) => void
  onCancel?: () => void
  applyLabel?: string
  cancelLabel?: string
  embedded?: boolean
  showPresets?: boolean
  eyebrow?: string
  inline?: boolean
  onGroupsChange?: (groups: EmployeeFilterGroup[]) => void
}

type EmployeeFilterModalProps = EmployeeFilterBuilderProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function optionFrom(options: FilterSelectOption[], value: string) {
  return options.find((option) => option.value === value) ?? options[0] ?? null
}

function CompactSelect({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: FilterSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const selected = optionFrom(options, value)
  return (
    <div className={className}>
      <WuSelect
        data={options}
        accessorKey={{ value: 'value', label: 'label' }}
        value={selected}
        onSelect={(selectedOption) => {
          const option = (Array.isArray(selectedOption) ? selectedOption[0] : selectedOption) as
            | FilterSelectOption
            | null
          if (option) onChange(option.value)
        }}
        variant="outlined"
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  )
}

function CircleIconButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
      aria-label={label}
    >
      <span className={`${icon} text-base leading-none`} aria-hidden />
    </button>
  )
}

export function EmployeeFilterBuilder({
  employees,
  customFields,
  languageOptions,
  savedFilters = [],
  appliedGroups,
  onApply,
  mode = 'apply',
  filterName = '',
  onSaveFilter,
  onCancel,
  applyLabel,
  cancelLabel,
  embedded = false,
  showPresets = true,
  eyebrow,
  inline = false,
  onGroupsChange,
}: EmployeeFilterBuilderProps) {
  const presets = useMemo(() => getEmployeeFilterPresets(savedFilters), [savedFilters])
  const [presetId, setPresetId] = useState(APPLY_NEW_PRESET_ID)
  const [name, setName] = useState(filterName)
  const [groups, setGroups] = useState<EmployeeFilterGroup[]>(() =>
    appliedGroups.length > 0 ? cloneFilterGroups(appliedGroups) : createDefaultFilterGroups(),
  )

  const managerOptions = useMemo<FilterSelectOption[]>(() => {
    const seen = new Set<string>()
    const options: FilterSelectOption[] = []
    employees.forEach((employee) => {
      if (seen.has(employee.id)) return
      seen.add(employee.id)
      options.push({ value: employee.id, label: getEmployeeDisplayName(employee) })
    })
    return options
  }, [employees])

  const fields = useMemo(
    () =>
      getEmployeeFilterFields({
        customFields,
        languageOptions,
        managerOptions,
      }),
    [customFields, languageOptions, managerOptions],
  )

  const fieldOptions = useMemo(
    () => fields.map((field) => ({ value: field.id, label: field.label })),
    [fields],
  )

  useEffect(() => {
    if (inline) return
    setName(filterName)
    if (appliedGroups.length > 0) {
      setGroups(cloneFilterGroups(appliedGroups))
      setPresetId(APPLY_NEW_PRESET_ID)
      return
    }
    setGroups(createDefaultFilterGroups())
    setPresetId(APPLY_NEW_PRESET_ID)
  }, [appliedGroups, filterName, inline])

  const onGroupsChangeRef = useRef(onGroupsChange)
  onGroupsChangeRef.current = onGroupsChange
  useEffect(() => {
    if (!inline) return
    onGroupsChangeRef.current?.(groups)
  }, [groups, inline])

  function fieldDef(fieldId: string): EmployeeFilterField {
    return fields.find((field) => field.id === fieldId) ?? fields[0]
  }

  function updateGroup(groupId: string, patch: Partial<EmployeeFilterGroup>) {
    setGroups((current) =>
      current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    )
  }

  function updateCondition(
    groupId: string,
    conditionId: string,
    patch: Partial<EmployeeFilterCondition>,
  ) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group
        return {
          ...group,
          conditions: group.conditions.map((condition) =>
            condition.id === conditionId ? { ...condition, ...patch } : condition,
          ),
        }
      }),
    )
  }

  function changeField(groupId: string, conditionId: string, fieldId: string) {
    const field = fieldDef(fieldId)
    const nextValue =
      field.kind === 'select' && field.options?.[0] ? field.options[0].value : ''
    updateCondition(groupId, conditionId, {
      fieldId,
      operator: 'is',
      value: nextValue,
    })
  }

  function addCondition(groupId: string, afterIndex: number) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group
        const next = [...group.conditions]
        next.splice(afterIndex + 1, 0, createFilterCondition('status', 'is', 'active'))
        return { ...group, conditions: next }
      }),
    )
  }

  function removeCondition(groupId: string, conditionId: string) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId || group.conditions.length <= 1) return group
        return {
          ...group,
          conditions: group.conditions.filter((condition) => condition.id !== conditionId),
        }
      }),
    )
  }

  function addGroup() {
    setGroups((current) => [...current, createFilterGroup(undefined, 'AND')])
  }

  function removeGroup(groupId: string) {
    setGroups((current) => (current.length <= 1 ? current : current.filter((group) => group.id !== groupId)))
  }

  function handlePreset(nextId: string) {
    setPresetId(nextId)
    const preset = presets.find((item) => item.id === nextId)
    setGroups(cloneFilterGroups(preset?.groups ?? createDefaultFilterGroups()))
  }

  function handleApply() {
    if (mode === 'save') {
      const nextName = name.trim()
      if (!nextName) return
      onSaveFilter?.(nextName, groups)
      onCancel?.()
      return
    }
    onApply?.(groups)
    onCancel?.()
  }

  const resolvedApplyLabel = applyLabel ?? (mode === 'save' ? 'Save' : 'Filter')
  const resolvedCancelLabel = cancelLabel ?? 'Cancel'

  const body = (
    <>
      {!inline && mode === 'save' ? (
        <div className="mb-5 max-w-sm">
          <WuInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Filter name"
          />
        </div>
      ) : !inline && showPresets ? (
        <div className="mb-5 w-[200px]">
          <CompactSelect
            options={presets.map((preset) => ({ value: preset.id, label: preset.name }))}
            value={presetId}
            onChange={handlePreset}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {groups.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 ? (
              <div className="mb-3 flex items-center gap-2">
                <CompactSelect
                  options={JOIN_OPTIONS}
                  value={group.joinWithPrevious}
                  onChange={(value) =>
                    updateGroup(group.id, { joinWithPrevious: value as FilterJoin })
                  }
                  className="w-[108px]"
                />
                <button
                  type="button"
                  className="text-gray-500 hover:text-red-600"
                  aria-label={`Remove Group ${groupIndex + 1}`}
                  onClick={() => removeGroup(group.id)}
                >
                  <span className="wm-delete text-lg leading-none" aria-hidden />
                </button>
              </div>
            ) : null}

            {inline ? null : <p className="mb-2 text-sm font-medium text-gray-800">Group {groupIndex + 1}</p>}
            <div className="border-l-[3px] border-blue-600 pl-4">
              <div className="flex flex-col gap-3">
                {group.conditions.map((condition, conditionIndex) => {
                  const field = fieldDef(condition.fieldId)
                  const isText = field.kind === 'text'
                  return (
                    <div key={condition.id} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-700">
                        {conditionIndex === 0 ? 'IF' : 'AND'}
                      </span>
                      <CompactSelect
                        options={fieldOptions}
                        value={condition.fieldId}
                        onChange={(fieldId) => changeField(group.id, condition.id, fieldId)}
                        className="min-w-[180px] flex-1"
                      />
                      {isText ? (
                        <>
                          <CompactSelect
                            options={TEXT_OPERATOR_OPTIONS}
                            value={condition.operator}
                            onChange={(operator) =>
                              updateCondition(group.id, condition.id, { operator })
                            }
                            className="w-[140px] shrink-0"
                          />
                          <div className="min-w-[160px] flex-1">
                            <WuInput
                              value={condition.value}
                              onChange={(event) =>
                                updateCondition(group.id, condition.id, {
                                  value: event.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <CompactSelect
                          options={field.options ?? []}
                          value={condition.value}
                          onChange={(value) =>
                            updateCondition(group.id, condition.id, { value })
                          }
                          className="min-w-[160px] flex-1"
                        />
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        {conditionIndex > 0 ? (
                          <CircleIconButton
                            label="Remove condition"
                            icon="wm-remove"
                            onClick={() => removeCondition(group.id, condition.id)}
                          />
                        ) : null}
                        <CircleIconButton
                          label="Add condition"
                          icon="wm-add-circle"
                          onClick={() => addCondition(group.id, conditionIndex)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
        onClick={addGroup}
      >
        <span className="wm-add text-base leading-none" aria-hidden />
        Add Criteria Group
      </button>
    </>
  )

  if (inline) {
    return <div className="flex flex-col">{body}</div>
  }

  return (
    <>
      <WuModalContent>
        {eyebrow ? (
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500">{eyebrow}</p>
        ) : null}
        {body}
      </WuModalContent>
      <WuModalFooter>
        {embedded ? (
          <WuButton variant="secondary" onClick={onCancel}>
            {resolvedCancelLabel}
          </WuButton>
        ) : (
          <WuModalClose variant="secondary">{resolvedCancelLabel}</WuModalClose>
        )}
        <WuButton onClick={handleApply} disabled={mode === 'save' && !name.trim()}>
          {resolvedApplyLabel}
        </WuButton>
      </WuModalFooter>
    </>
  )
}

export function EmployeeFilterModal({
  open,
  onOpenChange,
  mode = 'apply',
  filterName = '',
  ...builderProps
}: EmployeeFilterModalProps) {
  return (
    <WuModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      maxWidth="880px"
      maxHeight="90vh"
      {...preventModalDismiss}
    >
      <WuModalHeader>{mode === 'save' ? (filterName ? 'Edit filter' : 'Save filter') : 'Apply filter'}</WuModalHeader>
      <EmployeeFilterBuilder
        {...builderProps}
        mode={mode}
        filterName={filterName}
        onCancel={() => onOpenChange(false)}
      />
    </WuModal>
  )
}
