'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
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
import type { ActiveFilter, DashboardWidget } from '@/types'
import {
  DRIVER_CORRELATION_MATRIX,
  DRIVER_METRICS,
  getMetricFavorability,
  type DriverMetric,
  type DriverMetricKind,
} from '@/lib/dashboardFilters'

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type DriverColumn = {
  id: string
  label: string
  kind: DriverMetricKind
}

type DotPoint = {
  name: string
  kind: DriverMetricKind
  /** Correlation impact — intentionally not named x/y (recharts overwrites those with pixels). */
  impact: number
  favorability: number
}

type QuadrantInfo = {
  label: 'Priority focus' | 'Celebrate' | 'Maintain' | 'Monitor'
  bg: string
  color: string
}

type DriverAnalysisWidgetProps = {
  widget?: DashboardWidget
  activeFilters?: ActiveFilter[]
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

const FAVORABILITY_THRESHOLD = 65
const STORAGE_PREFIX = 'pp_driver_active_outcome_'
const QP_BLUE = '#1B87E6'

const QUADRANT_ORDER: Record<QuadrantInfo['label'], number> = {
  'Priority focus': 0,
  Celebrate: 1,
  Maintain: 2,
  Monitor: 3,
}

function getQuadrant(x: number, y: number): QuadrantInfo {
  const highImpact = x > 0
  const highFav = y >= FAVORABILITY_THRESHOLD
  if (highImpact && !highFav) {
    return { label: 'Priority focus', bg: '#fef2f2', color: '#9a3412' }
  }
  if (highImpact && highFav) {
    return { label: 'Celebrate', bg: '#f0fdf4', color: '#166534' }
  }
  if (!highImpact && highFav) {
    return { label: 'Maintain', bg: '#eff6ff', color: '#1e40af' }
  }
  return { label: 'Monitor', bg: '#f9fafb', color: '#6b7280' }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: DotPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const q = getQuadrant(d.impact, d.favorability)
  const impactLabel = d.impact > 0.33 ? 'High' : d.impact > 0 ? 'Medium' : 'Low'

  return (
    <div
      style={{
        background: 'var(--wu-card-bg, #fff)',
        border: '0.5px solid var(--wu-border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 180,
      }}
    >
      <p style={{ fontWeight: 500, color: 'var(--wu-navy)', marginBottom: 6 }}>{d.name}</p>
      <div
        style={{
          color: 'var(--wu-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 2,
        }}
      >
        <span>Favorability</span>
        <span style={{ color: 'var(--wu-text-body)', fontWeight: 500 }}>
          {d.favorability.toFixed(0)}%
        </span>
      </div>
      <div
        style={{
          color: 'var(--wu-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 6,
        }}
      >
        <span>Impact</span>
        <span style={{ color: 'var(--wu-text-body)', fontWeight: 500 }}>
          {impactLabel} ({d.impact.toFixed(2)})
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 10,
          background: q.bg,
          color: q.color,
          fontWeight: 500,
        }}
      >
        {q.label}
      </span>
    </div>
  )
}

/** All dots QP blue; Priority Focus gets a red ring. No always-on labels. */
function QuadrantDot(props: {
  cx?: number
  cy?: number
  payload?: DotPoint
}) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  // Must match getQuadrant(): high impact AND low favorability only
  const isPriority = payload.impact > 0 && payload.favorability < FAVORABILITY_THRESHOLD

  return (
    <g>
      {isPriority && (
        <circle
          cx={cx}
          cy={cy}
          r={11}
          fill="none"
          stroke="#ef4444"
          strokeWidth={1.5}
          opacity={0.6}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isPriority ? 9 : 7}
        fill={QP_BLUE}
        fillOpacity={isPriority ? 1 : 0.75}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    </g>
  )
}

function resolveColumns(config?: Record<string, unknown>): DriverColumn[] {
  const raw = config?.columns
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const col = item as Record<string, unknown>
        const id = typeof col.id === 'string' ? col.id : null
        if (!id) return null
        const fromCatalog = DRIVER_METRICS.find((metric) => metric.id === id)
        const kind =
          col.kind === 'marker' || col.kind === 'buildingBlock' || col.kind === 'question'
            ? col.kind
            : fromCatalog?.kind ?? 'marker'
        const label =
          typeof col.label === 'string'
            ? col.label
            : fromCatalog?.label ?? id
        return { id, label, kind } satisfies DriverColumn
      })
      .filter((col): col is DriverColumn => col !== null)
  }

  const markers = DRIVER_METRICS.filter((metric) => metric.kind === 'marker')
  const primary =
    typeof config?.primaryOutcome === 'string'
      ? markers.find((metric) => metric.id === config.primaryOutcome)
      : typeof config?.outcomeMetricId === 'string'
        ? DRIVER_METRICS.find((metric) => metric.id === config.outcomeMetricId)
        : undefined
  const ordered = primary
    ? [primary, ...markers.filter((metric) => metric.id !== primary.id)]
    : markers
  return ordered.slice(0, 4).map((metric) => ({
    id: metric.id,
    label: metric.label,
    kind: metric.kind,
  }))
}

function readStoredOutcomeIndex(widgetId: string, columnCount: number, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${widgetId}`)
    if (raw == null) return fallback
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= columnCount) return fallback
    return parsed
  } catch {
    return fallback
  }
}

function computeAxisDomain(dots: DotPoint[]): {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
} {
  if (dots.length === 0) {
    return { xMin: -0.15 * 1.15, xMax: 0.15 * 1.15, yMin: 40, yMax: 100 }
  }

  const xValues = dots.map((d) => d.impact).filter((v) => Number.isFinite(v))
  const yValues = dots.map((d) => d.favorability).filter((v) => Number.isFinite(v))

  if (xValues.length === 0 || yValues.length === 0) {
    return { xMin: -0.15 * 1.15, xMax: 0.15 * 1.15, yMin: 40, yMax: 100 }
  }

  // Remove outliers beyond 2 standard deviations before computing range
  const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length
  const xStd = Math.sqrt(
    xValues.reduce((a, b) => a + Math.pow(b - xMean, 2), 0) / xValues.length,
  )
  const xFiltered =
    xStd > 0
      ? xValues.filter((v) => Math.abs(v - xMean) <= 2 * xStd)
      : xValues
  const xForDomain = xFiltered.length > 0 ? xFiltered : xValues

  const xAbsMax = Math.max(
    Math.abs(Math.min(...xForDomain)),
    Math.abs(Math.max(...xForDomain)),
    0.15, // minimum half-width so the chart is never too narrow
  )

  // Always symmetric around zero so the divider line is centered
  const xMin = -(xAbsMax * 1.15)
  const xMax = xAbsMax * 1.15

  const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length
  const yStd = Math.sqrt(
    yValues.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) / yValues.length,
  )
  const yFiltered =
    yStd > 0
      ? yValues.filter((v) => Math.abs(v - yMean) <= 2 * yStd)
      : yValues
  const yForDomain = yFiltered.length > 0 ? yFiltered : yValues

  const yDataMin = Math.min(...yForDomain)
  const yDataMax = Math.max(...yForDomain)
  const yPad = Math.max((yDataMax - yDataMin) * 0.2, 8)
  let yMin = Math.max(yDataMin - yPad, 0)
  let yMax = Math.min(yDataMax + yPad, 100)

  // Keep the fixed y=65 threshold visible inside the domain
  if (yMin >= FAVORABILITY_THRESHOLD) yMin = 60
  if (yMax <= FAVORABILITY_THRESHOLD) yMax = Math.min(70, 100)

  return { xMin, xMax, yMin, yMax }
}

export function DriverAnalysisWidget({
  widget,
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: DriverAnalysisWidgetProps) {
  const widgetId = widget?.id ?? 'driver_analysis'
  const title = widget?.title?.trim() || 'Driver Analysis'
  const columns = useMemo(() => resolveColumns(widget?.config), [widget?.config])

  const configDefaultIndex = useMemo(() => {
    const raw = widget?.config?.activeOutcomeIndex
    if (typeof raw === 'number' && raw >= 0 && raw < columns.length) return raw
    return 0
  }, [widget?.config?.activeOutcomeIndex, columns.length])

  const [activeOutcomeIndex, setActiveOutcomeIndex] = useState(() =>
    readStoredOutcomeIndex(widgetId, Math.max(columns.length, 1), configDefaultIndex),
  )

  useEffect(() => {
    const stored = readStoredOutcomeIndex(widgetId, columns.length, configDefaultIndex)
    setActiveOutcomeIndex(stored)
  }, [widgetId, columns.length, configDefaultIndex])

  useEffect(() => {
    if (activeOutcomeIndex >= columns.length && columns.length > 0) {
      setActiveOutcomeIndex(0)
    }
  }, [activeOutcomeIndex, columns.length])

  const activeOutcome = columns[activeOutcomeIndex] ?? columns[0]

  const dots = useMemo(() => {
    if (!activeOutcome) return [] as DotPoint[]

    const selectedIds = new Set(columns.map((col) => col.id))
    const nonOutcomeColumns = columns.filter((_, i) => i !== activeOutcomeIndex)

    const extras: DriverColumn[] = DRIVER_METRICS.filter(
      (metric) => metric.id !== activeOutcome.id && !selectedIds.has(metric.id),
    ).map((metric: DriverMetric) => ({
      id: metric.id,
      label: metric.label,
      kind: metric.kind,
    }))

    const plotMetrics = [...nonOutcomeColumns, ...extras]

    return plotMetrics.map((col) => ({
      name: col.label,
      kind: col.kind,
      impact: DRIVER_CORRELATION_MATRIX[col.id]?.[activeOutcome.id] ?? 0,
      favorability: getMetricFavorability(col.id, col.kind, activeFilters),
    }))
  }, [activeFilters, activeOutcome, activeOutcomeIndex, columns])

  const { xMin, xMax, yMin, yMax } = useMemo(() => computeAxisDomain(dots), [dots])

  const dotsSortedByPriority = useMemo(
    () =>
      [...dots].sort((a, b) => {
        const qa = getQuadrant(a.impact, a.favorability)
        const qb = getQuadrant(b.impact, b.favorability)
        const orderDiff = QUADRANT_ORDER[qa.label] - QUADRANT_ORDER[qb.label]
        if (orderDiff !== 0) return orderDiff
        return a.favorability - b.favorability
      }),
    [dots],
  )

  const outcomeOptions = useMemo(
    () =>
      columns.map((col, i) => ({
        value: String(i),
        label: col.label,
      })),
    [columns],
  )

  const selectedOutcomeOption =
    outcomeOptions.find((option) => option.value === String(activeOutcomeIndex)) ??
    outcomeOptions[0] ??
    null

  const handleOutcomeSelect = (value: unknown) => {
    const option = (Array.isArray(value) ? value[0] : value) as { value?: string } | null
    if (!option?.value) return
    const next = Number(option.value)
    if (!Number.isFinite(next) || next < 0 || next >= columns.length) return
    setActiveOutcomeIndex(next)
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${widgetId}`, String(next))
    } catch {
      /* ignore quota / private mode */
    }
  }

  return (
    <WidgetCardShell
      title={title}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <FilteredWidgetGuard activeFilters={activeFilters}>
        {!activeOutcome || columns.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
            Select columns in widget settings to plot driver analysis.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div
              className="relative z-20 flex items-center gap-2"
              style={{ marginTop: 4 }}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <span style={{ fontSize: 11, color: 'var(--wu-text-muted)' }}>Outcome variable</span>
              <div className="min-w-[180px]">
                <WuSelect
                  data={outcomeOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedOutcomeOption}
                  onSelect={handleOutcomeSelect}
                  variant="outlined"
                  placeholder="Select outcome"
                />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart margin={{ top: 24, right: 24, bottom: 48, left: 52 }}>
                  {/* ReferenceAreas FIRST so Scatter renders on top */}
                  <ReferenceArea
                    x1={0}
                    x2={xMax}
                    y1={yMin}
                    y2={65}
                    fill="#fef2f2"
                    fillOpacity={0.5}
                  />
                  <ReferenceArea
                    x1={0}
                    x2={xMax}
                    y1={65}
                    y2={yMax}
                    fill="#f0fdf4"
                    fillOpacity={0.5}
                  />
                  <ReferenceArea
                    x1={xMin}
                    x2={0}
                    y1={65}
                    y2={yMax}
                    fill="#eff6ff"
                    fillOpacity={0.5}
                  />
                  <ReferenceArea
                    x1={xMin}
                    x2={0}
                    y1={yMin}
                    y2={65}
                    fill="#f9fafb"
                    fillOpacity={0.5}
                  />

                  <CartesianGrid strokeDasharray="3 3" stroke="var(--wu-border)" />

                  <XAxis
                    type="number"
                    dataKey="impact"
                    domain={[xMin, xMax]}
                    tickCount={5}
                    tickFormatter={(v: number) => v.toFixed(1)}
                    tick={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
                    allowDataOverflow
                  >
                    <Label
                      value={`Impact on ${activeOutcome.label}`}
                      position="insideBottom"
                      offset={-10}
                      style={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
                    />
                  </XAxis>

                  <YAxis
                    type="number"
                    dataKey="favorability"
                    domain={[yMin, yMax]}
                    ticks={[
                      Math.round(yMin),
                      65,
                      Math.round(yMax),
                    ].filter((v, i, arr) => arr.indexOf(v) === i)}
                    tickFormatter={(v: number) => `${Math.round(v)}%`}
                    tick={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
                    allowDataOverflow
                  >
                    <Label
                      value="Current favorability"
                      angle={-90}
                      position="insideLeft"
                      offset={10}
                      style={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
                    />
                  </YAxis>

                  <ReferenceLine
                    x={0}
                    stroke="#94A3B8"
                    strokeDasharray="5 4"
                    strokeWidth={1}
                  />
                  <ReferenceLine
                    y={65}
                    stroke="#94A3B8"
                    strokeDasharray="5 4"
                    strokeWidth={1}
                  />

                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                  <Scatter data={dots} shape={<QuadrantDot />} name="Metrics" />
                </ScatterChart>
              </ResponsiveContainer>

              {/* Corner labels match quadrant mapping */}
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  left: 55,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#1e40af',
                  background: '#eff6ff',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                Maintain
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  right: 24,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#166534',
                  background: '#f0fdf4',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                Celebrate
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 52,
                  left: 55,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#6b7280',
                  background: '#f9fafb',
                  border: '0.5px solid #e5e7eb',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                Monitor
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 52,
                  right: 24,
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#9a3412',
                  background: '#fef2f2',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                ★ Priority focus
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                borderTop: '0.5px solid var(--wu-border)',
                paddingTop: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--wu-text-muted)',
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                All metrics
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '2px 12px',
                  alignItems: 'center',
                }}
              >
                {dotsSortedByPriority.map((d) => {
                  const q = getQuadrant(d.impact, d.favorability)
                  return (
                    <Fragment key={d.name}>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--wu-text-body)',
                          paddingLeft: 4,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderLeft:
                            q.label === 'Priority focus'
                              ? '3px solid #ef4444'
                              : '3px solid transparent',
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--wu-text-muted)',
                          textAlign: 'right',
                        }}
                      >
                        {d.favorability.toFixed(0)}%
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '1px 7px',
                          borderRadius: 10,
                          background: q.bg,
                          color: q.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {q.label}
                      </span>
                    </Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
