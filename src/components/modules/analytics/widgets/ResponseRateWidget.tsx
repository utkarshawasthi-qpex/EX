'use client'

import { mockResponseRateData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { getFilteredResponseRate } from '@/lib/dashboardFilters'
import { cn } from '@/lib/utils'
import type { ActiveFilter } from '@/types'

function DonutChart({ rate }: { rate: number }) {
  const r = 36
  const circumference = 2 * Math.PI * r
  const dash = (rate / 100) * circumference

  return (
    <div className="relative inline-flex size-24 items-center justify-center">
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        <circle
          cx={48}
          cy={48}
          r={r}
          fill="none"
          stroke="#2563eb"
          strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-bold text-gray-900">{rate}%</div>
        <div className="text-[10px] text-gray-500">Response rate</div>
      </div>
    </div>
  )
}

export function ResponseRateWidget({
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
  const { surveyName, overview: baseOverview, byLevel } = mockResponseRateData
  const overview =
    activeFilters.length > 0 ? getFilteredResponseRate(activeFilters) : baseOverview

  return (
    <WidgetCardShell title="Response rate" subtitle={surveyName} flushContent onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
      <div className="shrink-0 px-4 pb-4">
      <span className="mb-4 inline-flex flex-shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
        Location
      </span>

      <div className="mb-6 flex-shrink-0">
        <div className="mb-3 text-sm font-medium text-gray-700">Response rate overview</div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{overview.sent}</div>
            <div className="text-xs text-gray-500">→ Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{overview.completed}</div>
            <div className="text-xs text-gray-500">✓ Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{overview.pending}</div>
            <div className="text-xs text-gray-500">⏱ Pending</div>
          </div>
          <DonutChart rate={overview.rate} />
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="pb-2 font-medium">Level</th>
              <th className="pb-2 font-medium">Sent ↕</th>
              <th className="pb-2 font-medium">Completed ↕</th>
              <th className="pb-2 font-medium">Pending ↕</th>
              <th className="pb-2 font-medium">Response rate</th>
            </tr>
          </thead>
          <tbody>
            {byLevel.map((row) => (
              <tr
                key={row.level}
                className={cn(
                  'border-b border-gray-100',
                  row.level === 'Total sum' && 'bg-gray-50',
                )}
              >
                <td className="py-2">
                  <span className="flex items-center gap-1">
                    {row.level !== 'Total sum' && (
                      <span className="text-xs text-gray-400">&gt;</span>
                    )}
                    {row.level}
                  </span>
                </td>
                <td className="py-2">{row.sent}</td>
                <td className="py-2">{row.completed}</td>
                <td className="py-2">{row.pending}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-blue-600" style={{ width: `${row.rate}%` }} />
                    </div>
                    <span className="text-xs font-medium">{row.rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
