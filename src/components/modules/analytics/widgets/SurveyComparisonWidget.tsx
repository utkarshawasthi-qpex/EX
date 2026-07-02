'use client'

import { mockSurveyComparisonData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { cn } from '@/lib/utils'

export function SurveyComparisonWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveys, scores } = mockSurveyComparisonData

  return (
    <WidgetCardShell title="Survey comparison" flushContent onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <div className="overflow-auto flex-1 min-h-0">
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
    </WidgetCardShell>
  )
}
