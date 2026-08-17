'use client'

import { DASHBOARD_FILTER_FIELDS } from '@/lib/dashboardFilters'
import type { ActiveFilter, FilterField } from '@/types'

type ShareTabFilterPopoverProps = {
  open: boolean
  activeFilters: ActiveFilter[]
  onToggleFilter: (field: FilterField, value: string) => void
  onClearAll: () => void
  onClose: () => void
}

export function ShareTabFilterPopover({
  open,
  activeFilters,
  onToggleFilter,
  onClearAll,
  onClose,
}: ShareTabFilterPopoverProps) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30"
        aria-label="Close tab filters"
        onClick={onClose}
      />
      <div className="absolute bottom-10 left-0 z-40 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Tab filters</span>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-3">
          {DASHBOARD_FILTER_FIELDS.map((field) => (
            <div key={field.id} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {field.label}
              </p>
              <div className="flex flex-col gap-1">
                {field.values.map((value) => {
                  const isActive = activeFilters.some(
                    (filter) => filter.fieldId === field.id && filter.value === value,
                  )
                  return (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleFilter(field, value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {value}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
