'use client'

import { Fragment, useMemo, useState, type CSSProperties } from 'react'
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
  getDriverImpact,
  getDriverMetricById,
  getEligibleDriverMetrics,
  getMetricFavorability,
  getYAxisDisclosureLabel,
  type DriverMetricKind,
  type DriverQuestionType,
} from '@/lib/dashboardFilters'

type DotPoint = {
  name: string
  kind: DriverMetricKind
  questionType: DriverQuestionType
  /** Pearson r — stored as impact (recharts overwrites top-level x/y with pixels). */
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

const FAVORABILITY_THRESHOLD = 50
const QP_BLUE = '#1B87E6'

const QUADRANT_ORDER: Record<QuadrantInfo['label'], number> = {
  'Priority focus': 0,
  Celebrate: 1,
  Maintain: 2,
  Monitor: 3,
}

const cornerStyle: CSSProperties = {
  position: 'absolute',
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 4,
  pointerEvents: 'none',
}

function getQuadrant(x: number, y: number): QuadrantInfo {
  const highImpact = x > 0
  const highFav = y >= FAVORABILITY_THRESHOLD
  if (highImpact && !highFav) {
    return { label: 'Priority focus', bg: '#FEE2E2', color: '#991B1B' }
  }
  if (highImpact && highFav) {
    return { label: 'Celebrate', bg: '#DCFCE7', color: '#166534' }
  }
  if (!highImpact && highFav) {
    return { label: 'Maintain', bg: '#DBEAFE', color: '#1E40AF' }
  }
  return { label: 'Monitor', bg: '#F3F4F6', color: '#374151' }
}

function DriverTooltip({
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
  const yLabel = getYAxisDisclosureLabel(d.questionType)

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        minWidth: 200,
        fontSize: 13,
      }}
    >
      <p style={{ fontWeight: 600, color: '#1B2E4A', marginBottom: 8 }}>{d.name}</p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          color: '#6B7280',
        }}
      >
        <span>{yLabel}</span>
        <span style={{ color: '#1B2E4A', fontWeight: 500 }}>{d.favorability.toFixed(1)}%</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          color: '#6B7280',
        }}
      >
        <span>Impact (r)</span>
        <span style={{ color: '#1B2E4A', fontWeight: 500 }}>
          {d.impact > 0 ? '+' : ''}
          {d.impact.toFixed(3)}
        </span>
      </div>
      <span
        style={{
          fontSize: 11,
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

function QuadrantDot(props: {
  cx?: number
  cy?: number
  payload?: DotPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  const isPriority = payload.impact > 0 && payload.favorability < FAVORABILITY_THRESHOLD

  return (
    <g>
      {isPriority && (
        <circle
          cx={cx}
          cy={cy}
          r={12}
          fill="none"
          stroke="#EF4444"
          strokeWidth={1.5}
          opacity={0.7}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isPriority ? 8 : 6}
        fill={QP_BLUE}
        fillOpacity={0.85}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
    </g>
  )
}

type ResolvedConfig = {
  outcomeMetricId: string
  outcomeLabel: string
  driverMetricIds: string[]
}

function resolveDriverConfig(config?: Record<string, unknown>): ResolvedConfig | null {
  const eligible = getEligibleDriverMetrics()
  if (eligible.length === 0) return null

  const outcomeMetricId =
    typeof config?.outcomeMetricId === 'string'
      ? config.outcomeMetricId
      : typeof config?.primaryOutcome === 'string'
        ? config.primaryOutcome
        : Array.isArray(config?.columns) &&
            config.columns[0] &&
            typeof (config.columns[0] as { id?: string }).id === 'string'
          ? (config.columns[0] as { id: string }).id
          : eligible[0]!.id

  const outcome =
    getDriverMetricById(outcomeMetricId) ??
    eligible.find((m) => m.id === outcomeMetricId) ??
    eligible[0]!

  const rawDrivers = config?.driverMetricIds
  let driverMetricIds: string[] = []
  if (Array.isArray(rawDrivers) && rawDrivers.every((id) => typeof id === 'string')) {
    driverMetricIds = (rawDrivers as string[]).filter(
      (id) => id !== outcome.id && Boolean(getDriverMetricById(id)) && !getDriverMetricById(id)?.excluded,
    )
  } else if (Array.isArray(config?.columns)) {
    driverMetricIds = config.columns
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const id = (item as { id?: string }).id
        return typeof id === 'string' ? id : null
      })
      .filter((id): id is string => Boolean(id) && id !== outcome.id)
  }

  if (driverMetricIds.length === 0) {
    driverMetricIds = eligible
      .filter((m) => m.id !== outcome.id)
      .slice(0, 6)
      .map((m) => m.id)
  }

  const outcomeLabel =
    typeof config?.outcomeLabel === 'string' && config.outcomeLabel.trim()
      ? config.outcomeLabel
      : outcome.label

  return {
    outcomeMetricId: outcome.id,
    outcomeLabel,
    driverMetricIds,
  }
}

export function DriverAnalysisWidget({
  widget,
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: DriverAnalysisWidgetProps) {
  const title = widget?.title?.trim() || 'Driver analysis'
  const [showMetricList, setShowMetricList] = useState(false)

  const resolved = useMemo(() => resolveDriverConfig(widget?.config), [widget?.config])

  const dots = useMemo(() => {
    if (!resolved) return [] as DotPoint[]

    return resolved.driverMetricIds
      .map((id) => {
        const metric = getDriverMetricById(id)
        if (!metric || metric.excluded) return null
        return {
          name: metric.label,
          kind: metric.kind,
          questionType: metric.questionType,
          impact: getDriverImpact(id, resolved.outcomeMetricId, activeFilters),
          favorability: getMetricFavorability(id, metric.kind, activeFilters),
        } satisfies DotPoint
      })
      .filter((d): d is DotPoint => d !== null)
  }, [activeFilters, resolved])

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

  const outcomeMetric = resolved
    ? getDriverMetricById(resolved.outcomeMetricId)
    : undefined

  return (
    <WidgetCardShell
      title={title}
      subtitle={
        resolved ? (
          <>
            Impact on <span className="font-medium text-gray-700">{resolved.outcomeLabel}</span>
          </>
        ) : undefined
      }
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <FilteredWidgetGuard activeFilters={activeFilters}>
        {!resolved ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
            Select an outcome and drivers in widget settings.
          </div>
        ) : (
          <div className="flex flex-col">
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 55, left: 65 }}>
                  <ReferenceArea
                    x1={0}
                    x2={1}
                    y1={0}
                    y2={50}
                    fill="#FEE2E2"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={0}
                    x2={1}
                    y1={50}
                    y2={100}
                    fill="#DCFCE7"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={-1}
                    x2={0}
                    y1={50}
                    y2={100}
                    fill="#DBEAFE"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={-1}
                    x2={0}
                    y1={0}
                    y2={50}
                    fill="#F3F4F6"
                    fillOpacity={0.45}
                  />

                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                  <XAxis
                    type="number"
                    dataKey="impact"
                    domain={[-1, 1]}
                    ticks={[-1, -0.5, 0, 0.5, 1]}
                    tickFormatter={(v: number) => v.toFixed(1)}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  >
                    <Label
                      value="Impact (Pearson r)"
                      position="insideBottom"
                      offset={-20}
                      style={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                  </XAxis>

                  <YAxis
                    type="number"
                    dataKey="favorability"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    width={45}
                  >
                    <Label
                      value={
                        outcomeMetric
                          ? getYAxisDisclosureLabel(outcomeMetric.questionType)
                          : 'Favorability'
                      }
                      angle={-90}
                      position="insideLeft"
                      offset={15}
                      style={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                  </YAxis>

                  <ReferenceLine
                    x={0}
                    stroke="#94A3B8"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#94A3B8"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                  />

                  <Tooltip content={<DriverTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                  <Scatter data={dots} shape={<QuadrantDot />} name="Metrics" />
                </ScatterChart>
              </ResponsiveContainer>

              <div
                style={{
                  ...cornerStyle,
                  top: 28,
                  left: 72,
                  background: '#DBEAFE',
                  color: '#1E40AF',
                }}
              >
                Maintain
              </div>
              <div
                style={{
                  ...cornerStyle,
                  top: 28,
                  right: 28,
                  background: '#DCFCE7',
                  color: '#166534',
                }}
              >
                Celebrate
              </div>
              <div
                style={{
                  ...cornerStyle,
                  bottom: 62,
                  left: 72,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                Monitor
              </div>
              <div
                style={{
                  ...cornerStyle,
                  bottom: 62,
                  right: 28,
                  background: '#FEE2E2',
                  color: '#991B1B',
                }}
              >
                ★ Priority focus
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMetricList((v) => !v)}
              style={{
                fontSize: 12,
                color: '#6B7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i
                className={showMetricList ? 'wc-chevron-down' : 'wc-chevron-right'}
                style={{ fontSize: 10 }}
                aria-hidden
              />
              {showMetricList ? 'Hide' : 'Show'} all metrics
            </button>

            {showMetricList && (
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
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
                            color: '#1B2E4A',
                            paddingLeft: 4,
                            paddingTop: 2,
                            paddingBottom: 2,
                            borderLeft:
                              q.label === 'Priority focus'
                                ? '3px solid #EF4444'
                                : '3px solid transparent',
                          }}
                        >
                          {d.name}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#6B7280',
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
            )}
          </div>
        )}
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
