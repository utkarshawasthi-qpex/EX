'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import {
  DRIVER_METRICS,
  getCorrelation,
  getDriverMetricById,
  getMetricFavorability,
  type DriverMetricKind,
} from '@/lib/dashboardFilters'
import type { ActiveFilter, DashboardWidget } from '@/types'

type DriverDot = {
  name: string
  kind: DriverMetricKind
  x: number
  y: number
}

const KIND_COLORS: Record<DriverMetricKind, string> = {
  marker: '#2a78d6',
  buildingBlock: '#1baf7a',
  question: '#eb6834',
}

const DEFAULT_OUTCOME_ID = DRIVER_METRICS.find((m) => m.kind === 'marker')?.id ?? 'marker_technologies'

function getQuadrant(x: number, y: number) {
  if (x >= 0 && y < 65) return { label: 'Priority focus', bg: '#fef3f2', color: '#9a3412' }
  if (x >= 0 && y >= 65) return { label: 'Celebrate', bg: '#f0fdf4', color: '#166534' }
  if (x < 0 && y >= 65) return { label: 'Maintain', bg: '#eff6ff', color: '#1e40af' }
  return { label: 'Monitor', bg: '#f9fafb', color: '#6b7280' }
}

function impactLabel(x: number): string {
  if (x > 0.33) return 'High'
  if (x > 0) return 'Medium'
  return 'Low'
}

function DriverTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DriverDot }[]
}) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  const q = getQuadrant(d.x, d.y)
  return (
    <div className="min-w-[180px] rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-[#1B2E4A]">{d.name}</p>
      <div className="mb-0.5 flex justify-between gap-4 text-[#6B7280]">
        <span>Favorability</span>
        <span className="font-medium text-[#374151]">{d.y.toFixed(0)}%</span>
      </div>
      <div className="mb-1.5 flex justify-between gap-4 text-[#6B7280]">
        <span>Impact</span>
        <span className="font-medium text-[#374151]">
          {impactLabel(d.x)} ({d.x.toFixed(2)})
        </span>
      </div>
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: q.bg, color: q.color }}
      >
        {q.label}
      </span>
    </div>
  )
}

function DotWithLabel(props: {
  cx?: number
  cy?: number
  payload?: DriverDot
  fill?: string
}) {
  const { cx = 0, cy = 0, payload, fill = '#2a78d6' } = props
  if (!payload) return null
  const label =
    payload.name.length > 16 ? `${payload.name.slice(0, 15)}…` : payload.name
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={fill}
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - 11}
        textAnchor="middle"
        fontSize={10}
        fill="#6B7280"
        fontFamily="inherit"
      >
        {label}
      </text>
    </g>
  )
}

function resolveOutcome(widget?: DashboardWidget): { id: string; label: string } {
  const config = widget?.config ?? {}
  const id =
    (typeof config.outcomeMetricId === 'string' && config.outcomeMetricId) ||
    (typeof config.primaryOutcome === 'string' && config.primaryOutcome) ||
    DEFAULT_OUTCOME_ID

  const fromConfig =
    typeof config.outcomeMetricLabel === 'string' ? config.outcomeMetricLabel : undefined
  const metric = getDriverMetricById(id)
  // Map legacy survey marker ids (e.g. mark_annual_leadership) → first driver marker
  if (!metric) {
    const fallback = getDriverMetricById(DEFAULT_OUTCOME_ID)!
    return { id: fallback.id, label: fromConfig ?? fallback.label }
  }
  return { id: metric.id, label: fromConfig ?? metric.label }
}

export function DriverAnalysisWidget({
  widget,
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: {
  widget?: DashboardWidget
  activeFilters?: ActiveFilter[]
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const outcome = resolveOutcome(widget)

  const dots = useMemo<DriverDot[]>(() => {
    return DRIVER_METRICS.filter((metric) => metric.id !== outcome.id).map((metric) => ({
      name: metric.label,
      kind: metric.kind,
      x: getCorrelation(metric.id, outcome.id),
      y: getMetricFavorability(metric.id, metric.kind, activeFilters),
    }))
  }, [activeFilters, outcome.id])

  const markers = dots.filter((d) => d.kind === 'marker')
  const buildingBlocks = dots.filter((d) => d.kind === 'buildingBlock')
  const questions = dots.filter((d) => d.kind === 'question')

  return (
    <WidgetCardShell
      title="Driver analysis"
      subtitle={
        <span>
          Outcome: <strong className="font-medium text-[#374151]">{outcome.label}</strong>
        </span>
      }
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <FilteredWidgetGuard activeFilters={activeFilters}>
        <div className="relative w-full" style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 28, right: 24, bottom: 36, left: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

              <ReferenceArea x1={0} x2={0.6} y1={0} y2={65} fill="#fef2f2" fillOpacity={0.4} />
              <ReferenceArea x1={0} x2={0.6} y1={65} y2={100} fill="#f0fdf4" fillOpacity={0.4} />
              <ReferenceArea x1={-0.6} x2={0} y1={65} y2={100} fill="#eff6ff" fillOpacity={0.4} />
              <ReferenceArea x1={-0.6} x2={0} y1={0} y2={65} fill="#f9fafb" fillOpacity={0.4} />

              <XAxis
                type="number"
                dataKey="x"
                domain={[-0.6, 0.6]}
                tickCount={5}
                tickFormatter={(v: number) => v.toFixed(1)}
              >
                <Label
                  value={`Impact on ${outcome.label}`}
                  position="insideBottom"
                  offset={-10}
                  style={{ fontSize: 11, fill: '#6B7280' }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              >
                <Label
                  value="Current favorability"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  style={{ fontSize: 11, fill: '#6B7280' }}
                />
              </YAxis>

              <ReferenceLine x={0} stroke="#CBD5E1" strokeDasharray="4 4" />
              <ReferenceLine y={65} stroke="#CBD5E1" strokeDasharray="4 4" />

              <Tooltip content={<DriverTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              <Scatter
                name="Markers"
                data={markers}
                fill={KIND_COLORS.marker}
                shape={(props) => <DotWithLabel {...props} fill={KIND_COLORS.marker} />}
              />
              <Scatter
                name="Building blocks"
                data={buildingBlocks}
                fill={KIND_COLORS.buildingBlock}
                shape={(props) => <DotWithLabel {...props} fill={KIND_COLORS.buildingBlock} />}
              />
              <Scatter
                name="Questions"
                data={questions}
                fill={KIND_COLORS.question}
                shape={(props) => <DotWithLabel {...props} fill={KIND_COLORS.question} />}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Corner labels match ReferenceArea zones (Culture Amp layout) */}
          <div className="pointer-events-none absolute left-14 top-7 rounded bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-medium text-[#1e40af]">
            Maintain
          </div>
          <div className="pointer-events-none absolute right-6 top-7 rounded bg-[#f0fdf4] px-1.5 py-0.5 text-[11px] font-medium text-[#166534]">
            Celebrate
          </div>
          <div className="pointer-events-none absolute bottom-14 left-14 rounded bg-[#f9fafb] px-1.5 py-0.5 text-[11px] font-medium text-[#6b7280] ring-1 ring-[#e5e7eb]">
            Monitor
          </div>
          <div className="pointer-events-none absolute bottom-14 right-6 rounded bg-[#fef3f2] px-1.5 py-0.5 text-[11px] font-medium text-[#9a3412]">
            ★ Priority focus
          </div>
        </div>

        <div className="mt-3 flex gap-4 pl-10 text-xs text-[#6B7280]">
          {(
            [
              { color: KIND_COLORS.marker, label: 'Markers' },
              { color: KIND_COLORS.buildingBlock, label: 'Building blocks' },
              { color: KIND_COLORS.question, label: 'Questions' },
            ] as const
          ).map(({ color, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
