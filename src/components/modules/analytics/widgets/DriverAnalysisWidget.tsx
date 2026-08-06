'use client'

import { useEffect, useMemo, useState } from 'react'
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
const IMPACT_DOMAIN: [number, number] = [-0.6, 0.6]
const STORAGE_PREFIX = 'pp_driver_active_outcome_'

const KIND_COLORS: Record<DriverMetricKind, string> = {
  marker: '#2a78d6',
  buildingBlock: '#1baf7a',
  question: '#eb6834',
}

function getQuadrant(x: number, y: number) {
  if (x >= 0 && y < FAVORABILITY_THRESHOLD) {
    return { label: 'Priority focus', bg: '#fef3f2', color: '#9a3412' }
  }
  if (x >= 0 && y >= FAVORABILITY_THRESHOLD) {
    return { label: 'Celebrate', bg: '#f0fdf4', color: '#166534' }
  }
  if (x < 0 && y >= FAVORABILITY_THRESHOLD) {
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

function DotWithLabel(props: {
  cx?: number
  cy?: number
  fill?: string
  payload?: DotPoint
}) {
  const { cx = 0, cy = 0, fill = '#2a78d6', payload } = props
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
        fill="var(--wu-text-muted)"
        fontFamily="inherit"
      >
        {label}
      </text>
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
  // If primaryOutcome matches a catalog id, put it first.
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

    // Other selected columns + remaining Workplace Culture metrics that are
    // not the active outcome (so the chart stays informative with only a few columns).
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
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
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

      <div style={{ position: 'relative', flex: 1, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 28, right: 24, bottom: 48, left: 48 }}>
            <ReferenceArea
              x1={0}
              x2={0.6}
              y1={0}
              y2={FAVORABILITY_THRESHOLD}
              fill="#fef2f2"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={0}
              x2={0.6}
              y1={FAVORABILITY_THRESHOLD}
              y2={100}
              fill="#f0fdf4"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={-0.6}
              x2={0}
              y1={FAVORABILITY_THRESHOLD}
              y2={100}
              fill="#eff6ff"
              fillOpacity={0.4}
            />
            <ReferenceArea
              x1={-0.6}
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
              domain={[0, 100]}
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

            <ReferenceLine x={0} stroke="#CBD5E1" strokeDasharray="4 4" />
            <ReferenceLine y={FAVORABILITY_THRESHOLD} stroke="#CBD5E1" strokeDasharray="4 4" />

            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            <Scatter
              name="Markers"
              data={dots.filter((d) => d.kind === 'marker')}
              fill={KIND_COLORS.marker}
              fillOpacity={0.8}
              shape={<DotWithLabel fill={KIND_COLORS.marker} />}
            />
            <Scatter
              name="Building blocks"
              data={dots.filter((d) => d.kind === 'buildingBlock')}
              fill={KIND_COLORS.buildingBlock}
              fillOpacity={0.8}
              shape={<DotWithLabel fill={KIND_COLORS.buildingBlock} />}
            />
            <Scatter
              name="Questions"
              data={dots.filter((d) => d.kind === 'question')}
              fill={KIND_COLORS.question}
              fillOpacity={0.8}
              shape={<DotWithLabel fill={KIND_COLORS.question} />}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Labels match ReferenceArea tints (x≥0 = high impact on the right):
            top-left Maintain, top-right Celebrate,
            bottom-left Monitor, bottom-right Priority focus. */}
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
            background: '#fef3f2',
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          ★ Priority focus
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 4,
          fontSize: 12,
          color: 'var(--wu-text-muted)',
          paddingLeft: 40,
        }}
      >
        {(
          [
            { color: KIND_COLORS.marker, label: 'Markers' },
            { color: KIND_COLORS.buildingBlock, label: 'Building blocks' },
            { color: KIND_COLORS.question, label: 'Questions' },
          ] as const
        ).map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
