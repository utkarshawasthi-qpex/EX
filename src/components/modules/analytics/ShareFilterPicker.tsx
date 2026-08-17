'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setConditions(activeFiltersToConditions(selected))
  }, [selected])

  function handleChange(next: FilterCondition[]) {
    setConditions(next)
    onChange(conditionsToActiveFilters(next))
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
