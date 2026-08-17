'use client'

import { DASHBOARD_FILTER_FIELDS } from '@/lib/dashboardFilters'
import type { ActiveFilter, FilterField } from '@/types'

type ShareFilterPickerProps = {
  label: string
  description?: string
  selected: ActiveFilter[]
  onChange: (next: ActiveFilter[]) => void
}

function isSelected(selected: ActiveFilter[], fieldId: string, value: string): boolean {
  return selected.some((filter) => filter.fieldId === fieldId && filter.value === value)
}

export function ShareFilterPicker({
  label,
  description,
  selected,
  onChange,
}: ShareFilterPickerProps) {
  function toggle(field: FilterField, value: string) {
    const exists = isSelected(selected, field.id, value)
    if (exists) {
      onChange(
        selected.filter((filter) => !(filter.fieldId === field.id && filter.value === value)),
      )
      return
    }
    onChange([
      ...selected,
      { fieldId: field.id, fieldLabel: field.label, value },
    ])
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <div className="max-h-48 space-y-3 overflow-y-auto rounded-md border border-gray-200 p-3">
        {DASHBOARD_FILTER_FIELDS.map((field) => (
          <div key={field.id}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {field.label}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {field.values.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(selected, field.id, value)}
                    onChange={() => toggle(field, value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-500">{selected.length} filter value(s) selected</p>
      )}
    </div>
  )
}
