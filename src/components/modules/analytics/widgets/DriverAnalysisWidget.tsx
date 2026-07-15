'use client'

import {
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { mockDriverAnalysisData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { averageFavorability } from '@/lib/dashboardFilters'
import type { ActiveFilter } from '@/types'

type DriverPoint = {
  name: string
  favorability: number
  impact: number
  fill: string
}

function getQuadrantColor(favorability: number, impact: number) {
  if (favorability >= 50 && impact >= 0.5) return '#22c55e'
  if (favorability < 50 && impact >= 0.5) return '#ef4444'
  if (favorability >= 50 && impact < 0.5) return '#3b82f6'
  return '#9ca3af'
}

function DriverTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DriverPoint }[]
}) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-md">
      <div className="font-medium">{point.name}</div>
      <div>Favorability: {point.favorability}%</div>
      <div>Impact: {point.impact.toFixed(2)}</div>
    </div>
  )
}

export function DriverAnalysisWidget({
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
  const { surveyName, drivers } = mockDriverAnalysisData
  const favorabilityShift =
    activeFilters.length > 0 ? averageFavorability(activeFilters) - 40 : 0

  const points: DriverPoint[] = drivers.map((driver) => ({
    name: driver.name,
    favorability: Math.max(0, Math.min(100, driver.favorability + favorabilityShift)),
    impact: driver.impact,
    fill: getQuadrantColor(
      Math.max(0, Math.min(100, driver.favorability + favorabilityShift)),
      driver.impact,
    ),
  }))

  return (
    <WidgetCardShell title="Driver analysis" subtitle={surveyName} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
      <div className="relative h-full min-h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey="favorability" domain={[0, 100]} name="Favorability">
              <Label value="Favorability Score" offset={-8} position="insideBottom" />
            </XAxis>
            <YAxis type="number" dataKey="impact" domain={[0, 1]} name="Impact">
              <Label value="Impact on Engagement" angle={-90} position="insideLeft" />
            </YAxis>
            <ZAxis range={[120, 120]} />
            <ReferenceLine x={50} stroke="#94a3b8" strokeDasharray="4 4" />
            <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="4 4" />
            <Tooltip content={<DriverTooltip />} />
            <Scatter data={points}>
              {points.map((point) => (
                <Cell key={point.name} fill={point.fill} />
              ))}
              <LabelList dataKey="name" position="top" offset={8} fontSize={10} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 text-xs font-medium">
          <span className="flex items-start justify-start p-2 text-red-600">Opportunities</span>
          <span className="flex items-start justify-end p-2 text-green-600">Strengths</span>
          <span className="flex items-end justify-start p-2 text-gray-500">Monitor</span>
          <span className="flex items-end justify-end p-2 text-blue-600">Maintain</span>
        </div>
      </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
