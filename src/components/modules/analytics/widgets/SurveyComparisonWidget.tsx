'use client'

import { mockSurveyComparisonData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { averageFavorability } from '@/lib/dashboardFilters'
import { cn } from '@/lib/utils'
import type { ActiveFilter } from '@/types'

export function SurveyComparisonWidget({
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: {
  activeFilters?: ActiveFilter[]
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveys, scores: baseScores } = mockSurveyComparisonData
  const shift = activeFilters.length > 0 ? averageFavorability(activeFilters) - 40 : 0
  const scores = baseScores.map((row) => ({
    ...row,
    scores: row.scores.map((score) => Math.max(0, Math.min(100, score + shift))),
  }))

  return (
    <WidgetCardShell title="Survey comparison" flushContent onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
      <div className="overflow-auto shrink-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="pb-2 font-medium">Metric</th>
              {surveys.map((survey) => (
                <th key={survey} className="pb-2 px-3 font-medium">
                  {survey}
                </th>
              ))}
              <th className="pb-2 font-medium">Delta</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row) => {
              const delta = row.deltas[1]
              return (
                <tr key={row.metric} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{row.metric}</td>
                  {row.scores.map((score, index) => (
                    <td key={`${row.metric}-${index}`} className="px-3 py-2">
                      {score}
                    </td>
                  ))}
                  <td className="py-2">
                    {delta === null ? (
                      '-'
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5',
                          delta >= 0 ? 'text-green-600' : 'text-red-600',
                        )}
                      >
                        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
