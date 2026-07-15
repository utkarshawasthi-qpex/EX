'use client'

import type { ReactNode } from 'react'
import { meetsAnonymityThreshold } from '@/lib/dashboardFilters'
import type { ActiveFilter } from '@/types'

type FilteredWidgetGuardProps = {
  activeFilters?: ActiveFilter[]
  children: ReactNode
}

export function FilteredWidgetGuard({ activeFilters = [], children }: FilteredWidgetGuardProps) {
  if (activeFilters.length > 0 && !meetsAnonymityThreshold(activeFilters)) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center px-6 py-8 text-center">
        <p className="max-w-sm text-sm text-gray-500">
          Not enough responses to display data for this filter combination. Minimum 5 responses
          required.
        </p>
      </div>
    )
  }

  return children
}
