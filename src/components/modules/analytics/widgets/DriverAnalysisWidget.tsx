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
  x: number
  y: number
}

type DriverAnalysisWidgetProps = {
  widget?: DashboardWidget
  activeFilters?: ActiveFilter[]
}

const FAVORABILITY_THRESHOLD = 65
const IMPACT_DOMAIN: [number, number] = [-0.7, 0.7]
const FAVORABILITY_DOMAIN: [number, number] = [20, 100]
const STORAGE_PREFIX = 'pp_driver_active_outcome_'
const QP_BLUE = '#1B87E6'

function getQuadrant(x: number, y: number) {
  if (x >= 0 && y < FAVORABILITY_THRESHOLD) {
    return { label: 'Priority focus', bg: '#fef3f2', color: '#9a3412', rank: 0 }
  }
  if (x >= 0 && y >= FAVORABILITY_THRESHOLD) {
    return { label: 'Celebrate', bg: '#f0fdf4', color: '#166534', rank: 1 }
  }
  if (x < 0 && y >= FAVORABILITY_THRESHOLD) {
    return { label: 'Maintain', bg: '#eff6ff', color: '#1e40af', rank: 2 }
  }
  return { label: 'Monitor', bg: '#f9fafb', color: '#6b7280', rank: 3 }
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
  const q = getQuadrant(d.x, d.y)
  const impactLabel = d.x > 0.33 ? 'High' : d.x > 0 ? 'Medium' : 'Low'

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
        <span style={{ color: 'var(--wu-text-body)', fontWeight: 500 }}>{d.y.toFixed(0)}%</span>
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
          {impactLabel} ({d.x.toFixed(2)})
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

/** All dots QP blue; Priority Focus gets a red ring + slightly larger radius. No always-on labels. */
function DotWithLabel(props: {
  cx?: number
  cy?: number
  payload?: DotPoint
}) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  const isPriority = payload.x >= 0 && payload.y < FAVORABILITY_THRESHOLD

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

  // Legacy / missing columns: default to Workplace Culture markers.
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

function sortDotsByPriority(dots: DotPoint[]): DotPoint[] {
  return [...dots].sort((a, b) => {
    const rankA = getQuadrant(a.x, a.y).rank
    const rankB = getQuadrant(b.x, b.y).rank
    if (rankA !== rankB) return rankA - rankB
    return a.y - b.y
  })
}

export function DriverAnalysisWidget({
  widget,
  activeFilters = [],
}: DriverAnalysisWidgetProps) {
  const widgetId = widget?.id ?? 'driver_analysis'
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
      x: DRIVER_CORRELATION_MATRIX[col.id]?.[activeOutcome.id] ?? 0,
      y: getMetricFavorability(col.id, col.kind, activeFilters),
    }))
  }, [activeFilters, activeOutcome, activeOutcomeIndex, columns])

  const dotsSortedByPriority = useMemo(() => sortDotsByPriority(dots), [dots])

  const outcomeOptions = columns.map((col, i) => ({
    value: String(i),
    label: col.label,
  }))

  const selectedOutcomeOption =
    outcomeOptions.find((option) => option.value === String(activeOutcomeIndex)) ??
    outcomeOptions[0]

  const handleOutcomeSelect = (value: unknown) => {
    const option = value as { value?: string } | null
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

  if (!activeOutcome || columns.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-[var(--wu-text-muted)]">
        Select columns in widget settings to plot driver analysis.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--wu-text-muted)' }}>Outcome variable</span>
        <div className="min-w-[180px]">
          <WuSelect
            data={outcomeOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedOutcomeOption}
            onSelect={handleOutcomeSelect}
            variant="outlined"
          />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 24, right: 24, bottom: 48, left: 52 }}>
            <ReferenceArea
              x1={0}
              x2={0.7}
              y1={0}
              y2={FAVORABILITY_THRESHOLD}
              fill="#fef2f2"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={0}
              x2={0.7}
              y1={FAVORABILITY_THRESHOLD}
              y2={100}
              fill="#f0fdf4"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={-0.7}
              x2={0}
              y1={FAVORABILITY_THRESHOLD}
              y2={100}
              fill="#eff6ff"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={-0.7}
              x2={0}
              y1={0}
              y2={FAVORABILITY_THRESHOLD}
              fill="#f9fafb"
              fillOpacity={0.4}
            />

            <CartesianGrid strokeDasharray="3 3" stroke="var(--wu-border)" />

            <XAxis
              type="number"
              dataKey="x"
              domain={IMPACT_DOMAIN}
              tickCount={5}
              tickFormatter={(v: number) => v.toFixed(1)}
              tick={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
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
              dataKey="y"
              domain={FAVORABILITY_DOMAIN}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: 'var(--wu-text-muted)' }}
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
              y={FAVORABILITY_THRESHOLD}
              stroke="#94A3B8"
              strokeDasharray="5 4"
              strokeWidth={1}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter data={dots} shape={<DotWithLabel />} name="Metrics" />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Corner labels per acceptance checklist */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 55,
            fontSize: 11,
            fontWeight: 500,
            color: '#9a3412',
            background: '#fef3f2',
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          ★ Priority focus
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
            bottom: 52,
            right: 24,
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
            const q = getQuadrant(d.x, d.y)
            const isPriority = d.x >= 0 && d.y < FAVORABILITY_THRESHOLD
            return (
              <Fragment key={d.name}>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--wu-text-body)',
                    paddingLeft: 4,
                    paddingTop: 2,
                    paddingBottom: 2,
                    borderLeft: isPriority ? '2px solid #ef4444' : '2px solid transparent',
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
                  {d.y.toFixed(0)}%
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
  )
}
