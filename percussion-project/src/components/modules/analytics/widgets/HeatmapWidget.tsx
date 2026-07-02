'use client'

import { useState } from 'react'
import { mockHeatmapData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { cn } from '@/lib/utils'

function getCellColor(score: number) {
  if (score >= 4) return 'bg-green-200 text-green-900'
  if (score === 3) return 'bg-yellow-200 text-yellow-900'
  return 'bg-red-200 text-red-900'
}

export function HeatmapWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveyName, metrics, columns, scores } = mockHeatmapData
  const [mode, setMode] = useState<'mean' | 'delta'>('mean')

  return (
    <WidgetCardShell
      title="Heatmap"
      subtitle={surveyName}
      flushContent
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      headerExtra={
        <div className="flex rounded-md border border-gray-200 text-xs">
          <button
            type="button"
            className={cn(
              'px-2 py-1',
              mode === 'mean' ? 'bg-blue-600 text-white' : 'text-gray-600',
            )}
            onClick={() => setMode('mean')}
          >
            Mean
          </button>
          <button
            type="button"
            className={cn(
              'px-2 py-1',
              mode === 'delta' ? 'bg-blue-600 text-white' : 'text-gray-600',
            )}
            onClick={() => setMode('delta')}
          >
            Δ Delta
          </button>
        </div>
      }
    >
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 pr-3 text-xs font-medium text-gray-600">Metric</th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="max-w-[120px] px-2 pb-2 text-xs font-medium leading-tight text-gray-600"
                >
                  {col.name}
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">
              <td className="py-2 pr-3">Respondents</td>
              {columns.map((col) => (
                <td key={col.name} className="px-2 py-2 text-center">
                  {col.respondents}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, rowIndex) => (
              <tr key={metric} className="border-b border-gray-100">
                <td className="py-2 pr-3 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">&gt;</span>
                    {metric}
                  </span>
                </td>
                {scores[rowIndex]?.map((score, colIndex) => (
                  <td
                    key={`${metric}-${colIndex}`}
                    className={cn(
                      'px-2 py-2 text-center text-sm font-medium',
                      getCellColor(score),
                    )}
                  >
                    {score}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetCardShell>
  )
}
