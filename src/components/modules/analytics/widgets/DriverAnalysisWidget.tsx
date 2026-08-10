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
  computeAxisConfig,
  getDriverImpact,
  getDriverMetricById,
  getEligibleDriverMetrics,
  getMetricFavorability,
  type AxisConfig,
  type DriverMetricKind,
  type DriverQuestionType,
} from '@/lib/dashboardFilters'

type DotPoint = {
  name: string
  kind: DriverMetricKind
  questionType: DriverQuestionType
  /** Performance (favorability %) — X axis dataKey */
  x: number
  /** Impact |r| — Y axis dataKey */
  y: number
  /** Stable copies — recharts may overwrite top-level x/y with pixels on shape props */
  performance: number
  impact: number
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

const QP_BLUE = '#1B87E6'

/** Priority focus → Celebrate → Monitor → Maintain */
const QUADRANT_ORDER: Record<QuadrantInfo['label'], number> = {
  'Priority focus': 0,
  Celebrate: 1,
  Monitor: 2,
  Maintain: 3,
}

const cornerStyle: CSSProperties = {
  position: 'absolute',
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 4,
  pointerEvents: 'none',
}

function getQuadrant(
  x: number,
  y: number,
  xThreshold: number,
  yThreshold: number,
): QuadrantInfo {
  const highPerf = x >= xThreshold
  const highImpact = y >= yThreshold
  if (!highPerf && highImpact) {
    return { label: 'Priority focus', bg: '#FEE2E2', color: '#991B1B' }
  }
  if (highPerf && highImpact) {
    return { label: 'Celebrate', bg: '#DCFCE7', color: '#166534' }
  }
  if (!highPerf && !highImpact) {
    return { label: 'Monitor', bg: '#F3F4F6', color: '#374151' }
  }
  return { label: 'Maintain', bg: '#DBEAFE', color: '#1E40AF' }
}

function DriverTooltip({
  active,
  payload,
  xThreshold,
  yThreshold,
}: {
  active?: boolean
  payload?: Array<{ payload?: DotPoint }>
  xThreshold: number
  yThreshold: number
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const perf = d.performance ?? d.x
  const impact = d.impact ?? d.y
  const q = getQuadrant(perf, impact, xThreshold, yThreshold)
  const isEnps = d.questionType === 'enps' || d.questionType === 'nps'

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        minWidth: 210,
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
        <span>{isEnps ? 'eNPS (normalized)' : 'Favorability'}</span>
        <span style={{ color: '#1B2E4A', fontWeight: 500 }}>{perf.toFixed(1)}%</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          color: '#6B7280',
        }}
      >
        <span>Impact (|r|)</span>
        <span style={{ color: '#1B2E4A', fontWeight: 500 }}>{impact.toFixed(3)}</span>
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

function makeQuadrantDot(xThreshold: number, yThreshold: number) {
  return function QuadrantDot(props: {
    cx?: number
    cy?: number
    payload?: DotPoint
  }) {
    const { cx, cy, payload } = props
    if (cx == null || cy == null || !payload) return null
    const perf = payload.performance ?? payload.x
    const impact = payload.impact ?? payload.y
    const isPriority = perf < xThreshold && impact >= yThreshold

    return (
      <g>
        {isPriority && (
          <circle
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            stroke="#EF4444"
            strokeWidth={1.5}
            opacity={0.65}
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
      (id) =>
        id !== outcome.id &&
        Boolean(getDriverMetricById(id)) &&
        !getDriverMetricById(id)?.excluded,
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
        const performance = getMetricFavorability(id, metric.kind, activeFilters)
        const impact = getDriverImpact(id, resolved.outcomeMetricId, activeFilters)
        return {
          name: metric.label,
          kind: metric.kind,
          questionType: metric.questionType,
          // X = Performance (favorability %), Y = Impact (|r|)
          x: performance,
          y: impact,
          performance,
          impact,
        } satisfies DotPoint
      })
      .filter((d): d is DotPoint => d !== null)
  }, [activeFilters, resolved])

  const xConfig: AxisConfig = useMemo(
    () => computeAxisConfig(dots.map((d) => d.x)),
    [dots],
  )
  const yConfig: AxisConfig = useMemo(
    () => computeAxisConfig(dots.map((d) => d.y)),
    [dots],
  )

  const QuadrantDot = useMemo(
    () => makeQuadrantDot(xConfig.threshold, yConfig.threshold),
    [xConfig.threshold, yConfig.threshold],
  )

  const dotsSortedByPriority = useMemo(
    () =>
      [...dots].sort((a, b) => {
        const qa = getQuadrant(a.x, a.y, xConfig.threshold, yConfig.threshold)
        const qb = getQuadrant(b.x, b.y, xConfig.threshold, yConfig.threshold)
        const orderDiff = QUADRANT_ORDER[qa.label] - QUADRANT_ORDER[qb.label]
        if (orderDiff !== 0) return orderDiff
        // Within group: lowest favorability (x) first
        return a.x - b.x
      }),
    [dots, xConfig.threshold, yConfig.threshold],
  )

  return (
    <WidgetCardShell
      title={title}
      subtitle={
        resolved ? (
          <>
            Impact on{' '}
            <span className="font-medium text-gray-600">{resolved.outcomeLabel}</span>
            {' · Thresholds set to median of your data'}
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
                <ScatterChart margin={{ top: 24, right: 24, bottom: 52, left: 60 }}>
                  {/* ReferenceAreas FIRST */}
                  <ReferenceArea
                    x1={xConfig.min}
                    x2={xConfig.threshold}
                    y1={yConfig.threshold}
                    y2={yConfig.max}
                    fill="#FEE2E2"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={xConfig.threshold}
                    x2={xConfig.max}
                    y1={yConfig.threshold}
                    y2={yConfig.max}
                    fill="#DCFCE7"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={xConfig.min}
                    x2={xConfig.threshold}
                    y1={yConfig.min}
                    y2={yConfig.threshold}
                    fill="#F3F4F6"
                    fillOpacity={0.45}
                  />
                  <ReferenceArea
                    x1={xConfig.threshold}
                    x2={xConfig.max}
                    y1={yConfig.min}
                    y2={yConfig.threshold}
                    fill="#DBEAFE"
                    fillOpacity={0.45}
                  />

                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[xConfig.min, xConfig.max]}
                    tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    allowDataOverflow
                  >
                    <Label
                      value="Performance (favorability)"
                      position="insideBottom"
                      offset={-20}
                      style={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                  </XAxis>

                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[yConfig.min, yConfig.max]}
                    tickFormatter={(v: number) => v.toFixed(2)}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    width={45}
                    allowDataOverflow
                  >
                    <Label
                      value="Impact (|r|)"
                      angle={-90}
                      position="insideLeft"
                      offset={15}
                      style={{ fontSize: 11, fill: '#9CA3AF' }}
                    />
                  </YAxis>

                  <ReferenceLine
                    x={xConfig.threshold}
                    stroke="#94A3B8"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine
                    y={yConfig.threshold}
                    stroke="#94A3B8"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                  />

                  <Tooltip
                    content={
                      <DriverTooltip
                        xThreshold={xConfig.threshold}
                        yThreshold={yConfig.threshold}
                      />
                    }
                    cursor={{ strokeDasharray: '3 3' }}
                  />

                  <Scatter data={dots} shape={<QuadrantDot />} name="Metrics" />
                </ScatterChart>
              </ResponsiveContainer>

              {/* Top-left: Priority focus */}
              <div
                style={{
                  ...cornerStyle,
                  top: 28,
                  left: 70,
                  background: '#FEE2E2',
                  color: '#991B1B',
                }}
              >
                ★ Priority focus
              </div>
              {/* Top-right: Celebrate */}
              <div
                style={{
                  ...cornerStyle,
                  top: 28,
                  right: 24,
                  background: '#DCFCE7',
                  color: '#166534',
                }}
              >
                Celebrate
              </div>
              {/* Bottom-left: Monitor */}
              <div
                style={{
                  ...cornerStyle,
                  bottom: 58,
                  left: 70,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                Monitor
              </div>
              {/* Bottom-right: Maintain */}
              <div
                style={{
                  ...cornerStyle,
                  bottom: 58,
                  right: 24,
                  background: '#DBEAFE',
                  color: '#1E40AF',
                }}
              >
                Maintain
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
                    const q = getQuadrant(d.x, d.y, xConfig.threshold, yConfig.threshold)
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
                          {d.x.toFixed(0)}%
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
