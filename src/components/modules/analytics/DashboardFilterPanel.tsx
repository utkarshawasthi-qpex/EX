'use client'

import { useEffect, useState } from 'react'
import { ExpandableSection } from '@/components/ui/ExpandableSection'
import type { ActiveFilter, FilterField } from '@/types'

type DashboardFilterPanelProps = {
  open: boolean
  title?: string
  visibleFields: FilterField[]
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
  visibleFields,
  activeFilters,
  onToggleFilter,
  onClearAll,
  onClose,
  panelClassName,
}: DashboardFilterPanelProps) {
  const [expandedFieldIds, setExpandedFieldIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    const withActive = new Set(
      visibleFields
        .filter((field) => activeFilters.some((filter) => filter.fieldId === field.id))
        .map((field) => field.id),
    )
    setExpandedFieldIds(withActive)
  }, [open, visibleFields, activeFilters])

  function setFieldExpanded(fieldId: string, expanded: boolean) {
    setExpandedFieldIds((current) => {
      const next = new Set(current)
      if (expanded) next.add(fieldId)
      else next.delete(fieldId)
      return next
    })
  }

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

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {visibleFields.length === 0 ? (
            <p className="px-1 py-4 text-sm text-gray-500">
              This dashboard does not expose any filters.
            </p>
          ) : (
            visibleFields.map((field) => {
              const activeCount = activeFilters.filter((filter) => filter.fieldId === field.id).length
              const isExpanded = expandedFieldIds.has(field.id)
              return (
                <ExpandableSection
                  key={field.id}
                  title={field.label}
                  description={
                    activeCount > 0
                      ? `${activeCount} selected`
                      : isExpanded
                        ? 'Select values to filter results'
                        : undefined
                  }
                  badge={activeCount > 0 && !isExpanded ? String(activeCount) : undefined}
                  expanded={isExpanded}
                  onExpandedChange={(next) => setFieldExpanded(field.id, next)}
                  className="border-gray-100 shadow-sm"
                >
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
                </ExpandableSection>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
