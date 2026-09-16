'use client'

import { useMemo } from 'react'
import { getVisibleDashboardFilterFields } from '@/lib/portalAccess'
import { usePortalSettings } from '@/lib/portalSettingsStore'
import { getCurrentUser } from '@/lib/userContext'
import type { ActiveFilter, FilterField } from '@/types'

type DashboardFilterPanelProps = {
  open: boolean
  title?: string
  activeFilters: ActiveFilter[]
  onToggleFilter: (field: FilterField, value: string) => void
  onClearAll: () => void
  onClose: () => void
  /** Override panel positioning (default anchors below analytics header). */
  panelClassName?: string
}

export function DashboardFilterPanel({
  open,
  title = 'Filters',
  activeFilters,
  onToggleFilter,
  onClearAll,
  onClose,
  panelClassName,
}: DashboardFilterPanelProps) {
  const { filterAccessRules } = usePortalSettings()
  const visibleFields = useMemo(
    () => getVisibleDashboardFilterFields(getCurrentUser(), filterAccessRules),
    [filterAccessRules],
  )

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/10"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside
        className={
          panelClassName ??
          'fixed right-0 top-[120px] z-40 flex h-[calc(100vh-120px)] w-[280px] flex-col border-l border-gray-200 bg-white shadow-lg'
        }
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close filter panel"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleFields.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No filters are available for your access.</p>
          ) : (
            visibleFields.map((field) => (
            <div key={field.id} className="border-b border-gray-50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
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
            ))
          )}
        </div>
      </aside>
    </>
  )
}
