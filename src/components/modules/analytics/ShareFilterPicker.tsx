'use client'

import { useEffect, useRef, useState } from 'react'
import {
  activeFiltersToConditions,
  conditionsToActiveFilters,
  FilterConditionBuilder,
  type FilterCondition,
} from '@/components/modules/analytics/FilterConditionBuilder'
import type { ActiveFilter } from '@/types'

type ShareFilterPickerProps = {
  label: string
  description?: string
  selected: ActiveFilter[]
  onChange: (next: ActiveFilter[]) => void
}

function filtersSignature(filters: ActiveFilter[]): string {
  return filters
    .map((filter) => `${filter.fieldId}:${filter.value}`)
    .sort()
    .join('|')
}

/** Static filter editor — IF / AND condition rows (admin share config). */
export function ShareFilterPicker({
  label,
  description,
  selected,
  onChange,
}: ShareFilterPickerProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(() =>
    activeFiltersToConditions(selected),
  )
  const skipNextSelectedSync = useRef(false)
  const lastSelectedSignature = useRef(filtersSignature(selected))

  useEffect(() => {
    const signature = filtersSignature(selected)
    if (skipNextSelectedSync.current) {
      skipNextSelectedSync.current = false
      lastSelectedSignature.current = signature
      return
    }
    if (signature === lastSelectedSignature.current) return
    lastSelectedSignature.current = signature
    setConditions(activeFiltersToConditions(selected))
  }, [selected])

  function handleChange(next: FilterCondition[]) {
    // Keep empty/incomplete rows locally so "+" can add another IF/AND line
    // without the parent selected[] sync wiping them away.
    skipNextSelectedSync.current = true
    setConditions(next)
    const nextFilters = conditionsToActiveFilters(next)
    lastSelectedSignature.current = filtersSignature(nextFilters)
    onChange(nextFilters)
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <FilterConditionBuilder conditions={conditions} onChange={handleChange} />
      </div>
      {conditionsToActiveFilters(conditions).length > 0 && (
        <p className="text-xs text-gray-500">
          {conditionsToActiveFilters(conditions).length} filter value(s) selected
        </p>
      )}
    </div>
  )
}
