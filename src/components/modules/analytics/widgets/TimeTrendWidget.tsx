'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mockTimeTrendData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import type { ActiveFilter } from '@/types'

function buildChartData() {
  const { series } = mockTimeTrendData
  const labels = series[0]?.points.map((point) => point.x) ?? []

  return labels.map((label, index) => {
    const row: Record<string, string | number> = { label }
    series.forEach((s) => {
      row[s.name] = s.points[index]?.y ?? 0
    })
    return row
  })
}

export function TimeTrendWidget({
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
  const { yLabel, series } = mockTimeTrendData
  const chartData = buildChartData()

  return (
    <WidgetCardShell title="Time trend" subtitle={yLabel} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
      <div className="h-full min-h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[2.7, 3.3]} tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
