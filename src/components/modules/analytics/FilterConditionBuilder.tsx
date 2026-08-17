'use client'

import dynamic from 'next/dynamic'
import { DASHBOARD_FILTER_FIELDS } from '@/lib/dashboardFilters'
import type { ActiveFilter } from '@/types'

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

export type FilterCondition = {
  id: string
  fieldId: string
  values: string[]
}

type FilterConditionBuilderProps = {
  conditions: FilterCondition[]
  onChange: (next: FilterCondition[]) => void
  /** Show blue vertical markers like the Tab filter modal */
  showConnectors?: boolean
  className?: string
}

const FIELD_OPTIONS: SelectOption[] = DASHBOARD_FILTER_FIELDS.map((field) => ({
  value: field.id,
  label: field.label,
}))

export function createEmptyCondition(): FilterCondition {
  return {
    id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fieldId: DASHBOARD_FILTER_FIELDS[0]?.id ?? '',
    values: [],
  }
}

export function activeFiltersToConditions(filters: ActiveFilter[]): FilterCondition[] {
  if (filters.length === 0) return [createEmptyCondition()]

  const byField = new Map<string, string[]>()
  for (const filter of filters) {
    const existing = byField.get(filter.fieldId) ?? []
    if (!existing.includes(filter.value)) existing.push(filter.value)
    byField.set(filter.fieldId, existing)
  }

  return [...byField.entries()].map(([fieldId, values]) => ({
    id: `cond_${fieldId}_${values.join('_')}`.slice(0, 48),
    fieldId,
    values,
  }))
}

export function conditionsToActiveFilters(conditions: FilterCondition[]): ActiveFilter[] {
  const result: ActiveFilter[] = []
  for (const condition of conditions) {
    const field = DASHBOARD_FILTER_FIELDS.find((item) => item.id === condition.fieldId)
    if (!field || condition.values.length === 0) continue
    for (const value of condition.values) {
      if (!field.values.includes(value)) continue
      result.push({ fieldId: field.id, fieldLabel: field.label, value })
    }
  }
  return result
}

function valueOptionsForField(fieldId: string): SelectOption[] {
  const field = DASHBOARD_FILTER_FIELDS.find((item) => item.id === fieldId)
  if (!field) return []
  return field.values.map((value) => ({ value, label: value }))
}

export function FilterConditionBuilder({
  conditions,
  onChange,
  showConnectors = false,
  className,
}: FilterConditionBuilderProps) {
  const rows = conditions.length > 0 ? conditions : [createEmptyCondition()]

  function updateRow(index: number, patch: Partial<FilterCondition>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  function addRow(afterIndex: number) {
    const next = [...rows]
    next.splice(afterIndex + 1, 0, createEmptyCondition())
    onChange(next)
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([createEmptyCondition()])
      return
    }
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      {rows.map((row, index) => {
        const fieldOption =
          FIELD_OPTIONS.find((option) => option.value === row.fieldId) ?? null
        const valueOpts = valueOptionsForField(row.fieldId)
        const selectedValues = valueOpts.filter((option) => row.values.includes(option.value))

        return (
          <div key={row.id} className="mb-3 flex items-center gap-2 last:mb-0">
            {showConnectors && (
              <span className="h-8 w-1 shrink-0 rounded-sm bg-blue-500" aria-hidden />
            )}
            <span className="w-10 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-700">
              {index === 0 ? 'IF' : 'AND'}
            </span>

            <div className="min-w-[140px] flex-1">
              <WuSelect
                data={FIELD_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={fieldOption}
                onSelect={(value: unknown) => {
                  const selected = value as SelectOption | SelectOption[] | null
                  const next = Array.isArray(selected) ? selected[0] : selected
                  if (!next) return
                  updateRow(index, { fieldId: next.value, values: [] })
                }}
                variant="outlined"
                placeholder="Field"
              />
            </div>

            <span className="shrink-0 text-sm text-gray-500">is</span>

            <div className="min-w-[180px] flex-[1.4]">
              <WuSelect
                data={valueOpts}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedValues}
                onSelect={(value: unknown) => {
                  const selected = (
                    Array.isArray(value) ? value : value ? [value] : []
                  ) as SelectOption[]
                  updateRow(
                    index,
                    { values: selected.map((option) => option.value) },
                  )
                }}
                multiple
                variant="outlined"
                placeholder="Select value(s)"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="flex size-7 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                  aria-label="Remove condition"
                >
                  <span className="wm-remove text-base leading-none" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => addRow(index)}
                className="flex size-7 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                aria-label="Add condition"
              >
                <span className="wm-add-circle text-base leading-none" aria-hidden />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
