'use client'

import { Fragment, useCallback, useMemo, useState, type CSSProperties } from 'react'
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
  buildMetricTree,
  computeAxisConfig,
  getDriverImpact,
  getDriverMetricById,
  getEligibleDriverMetrics,
  getMetricFavorability,
  resolveItemsAtLevel,
  type AxisConfig,
  type DriverMetricKind,
  type DriverQuestionType,
  type MetricTreeNode,
} from '@/lib/dashboardFilters'

type MetricLevel = 'marker' | 'buildingBlock' | 'question'

type DotPoint = {
  id: string
  name: string
  kind: DriverMetricKind
  questionType: DriverQuestionType
  /** Performance % — X axis dataKey */
  x: number
  /** Impact |r| — Y axis dataKey */
  y: number
  /** Stable copies — recharts may overwrite top-level x/y with pixels */
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

const DOT_RADIUS: Record<MetricLevel, number> = {
  marker: 8,
  buildingBlock: 7,
  question: 5,
}

const LEVEL_LABEL: Record<MetricLevel, string> = {
  marker: 'Markers',
  buildingBlock: 'Building blocks',
  question: 'Questions',
}

const LEVEL_SINGULAR: Record<MetricLevel, string> = {
  marker: 'Marker',
  buildingBlock: 'Building block',
  question: 'Question',
}

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
      <p
        style={{
          fontSize: 10,
          color: '#9CA3AF',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {LEVEL_SINGULAR[d.kind as MetricLevel] ?? d.kind}
      </p>
      <p style={{ fontWeight: 600, color: '#1B2E4A', marginBottom: 8 }}>{d.name}</p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
          color: '#6B7280',
        }}
      >
        <span>Performance</span>
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
        <span>Impact</span>
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

function makeQuadrantDot(
  xThreshold: number,
  yThreshold: number,
  level: MetricLevel,
  hoveredMetricId: string | null,
) {
  const radius = DOT_RADIUS[level]
  const ringRadius = radius + 5

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
    const isHovered = hoveredMetricId != null && hoveredMetricId === payload.id
    const drawRadius = isHovered ? radius + 3 : radius

    return (
      <g>
        {isPriority && (
          <circle
            cx={cx}
            cy={cy}
            r={ringRadius + (isHovered ? 3 : 0)}
            fill="none"
            stroke="#EF4444"
            strokeWidth={1.5}
            opacity={0.65}
          />
        )}
        {isHovered && !isPriority && (
          <circle
            cx={cx}
            cy={cy}
            r={drawRadius + 3}
            fill="none"
            stroke={QP_BLUE}
            strokeWidth={1.5}
            opacity={0.45}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={drawRadius}
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

function getDotsForLevel(
  level: MetricLevel,
  driverMetricIds: string[],
  outcomeMetricId: string,
  activeFilters: ActiveFilter[],
): DotPoint[] {
  const items = resolveItemsAtLevel(level, driverMetricIds)

  return items
    .filter((item) => item.id !== outcomeMetricId)
    .map((item) => {
      const performance = getMetricFavorability(item.id, item.kind, activeFilters)
      const impact = getDriverImpact(item.id, outcomeMetricId, activeFilters)
      return {
        id: item.id,
        name: item.label,
        kind: level,
        questionType: item.questionType,
        x: performance,
        y: impact,
        performance,
        impact,
      } satisfies DotPoint
    })
    .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y))
}

function sortMetricTreeNodes(
  nodes: MetricTreeNode[],
  xThreshold: number,
  yThreshold: number,
): MetricTreeNode[] {
  return [...nodes]
    .map((node) => ({
      ...node,
      children: sortMetricTreeNodes(node.children, xThreshold, yThreshold),
    }))
    .sort((a, b) => {
      const qa = getQuadrant(a.performance, a.impact, xThreshold, yThreshold)
      const qb = getQuadrant(b.performance, b.impact, xThreshold, yThreshold)
      const orderDiff = QUADRANT_ORDER[qa.label] - QUADRANT_ORDER[qb.label]
      if (orderDiff !== 0) return orderDiff
      return a.performance - b.performance
    })
}

function collectExpandableIds(nodes: MetricTreeNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id)
      ids.push(...collectExpandableIds(node.children))
    }
  }
  return ids
}

const linkButtonStyle: CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
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
  const [level, setLevel] = useState<MetricLevel>('marker')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null)

  const resolved = useMemo(() => resolveDriverConfig(widget?.config), [widget?.config])

  const dots = useMemo(() => {
    if (!resolved) return [] as DotPoint[]
    return getDotsForLevel(
      level,
      resolved.driverMetricIds,
      resolved.outcomeMetricId,
      activeFilters,
    )
  }, [activeFilters, level, resolved])

  const xConfig: AxisConfig = useMemo(
    () => computeAxisConfig(dots.map((d) => d.x)),
    [dots],
  )
  const yConfig: AxisConfig = useMemo(
    () => computeAxisConfig(dots.map((d) => d.y)),
    [dots],
  )

  const metricTree = useMemo(() => {
    if (!resolved) return [] as MetricTreeNode[]
    const tree = buildMetricTree(
      resolved.driverMetricIds,
      resolved.outcomeMetricId,
      activeFilters,
    )
    return sortMetricTreeNodes(tree, xConfig.threshold, yConfig.threshold)
  }, [activeFilters, resolved, xConfig.threshold, yConfig.threshold])

  const QuadrantDot = useMemo(
    () => makeQuadrantDot(xConfig.threshold, yConfig.threshold, level, hoveredMetricId),
    [hoveredMetricId, level, xConfig.threshold, yConfig.threshold],
  )

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(collectExpandableIds(metricTree)))
  }, [metricTree])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const handleRowHover = useCallback(
    (node: MetricTreeNode | null) => {
      if (!node || node.level !== level) {
        setHoveredMetricId(null)
        return
      }
      setHoveredMetricId(node.id)
    },
    [level],
  )

  function MetricRow({ node, depth }: { node: MetricTreeNode; depth: number }) {
    const q = getQuadrant(
      node.performance,
      node.impact,
      xConfig.threshold,
      yConfig.threshold,
    )
    const isPriority = q.label === 'Priority focus'
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)

    return (
      <Fragment>
        <div
          onClick={hasChildren ? () => toggleNode(node.id) : undefined}
          onMouseEnter={() => handleRowHover(node)}
          onMouseLeave={() => handleRowHover(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 4 + depth * 18,
            paddingTop: 4,
            paddingBottom: 4,
            borderLeft: isPriority ? '3px solid #EF4444' : '3px solid transparent',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
        >
          {hasChildren ? (
            <i
              className={isExpanded ? 'wc-chevron-down' : 'wc-chevron-right'}
              style={{ fontSize: 9, color: '#9CA3AF', width: 10 }}
              aria-hidden
            />
          ) : (
            <span style={{ width: 10 }} />
          )}
          <span
            style={{
              fontSize: 12,
              color: depth === 0 ? '#1B2E4A' : '#374151',
              fontWeight: depth === 0 ? 500 : 400,
            }}
          >
            {node.label}
          </span>
        </div>

        <span style={{ fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
          {node.performance.toFixed(0)}%
        </span>

        <span style={{ fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
          {node.impact.toFixed(3)}
        </span>

        <span
          style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 10,
            background: q.bg,
            color: q.color,
            whiteSpace: 'nowrap',
          }}
        >
          {q.label}
        </span>

        {isExpanded &&
          node.children.map((child) => (
            <MetricRow key={child.id} node={child} depth={depth + 1} />
          ))}
      </Fragment>
    )
  }

  const levelToggle = (
    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
      {(['marker', 'buildingBlock', 'question'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLevel(l)}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid',
            cursor: 'pointer',
            borderColor: level === l ? '#1B87E6' : '#E5E7EB',
            background: level === l ? '#EFF6FF' : '#FFFFFF',
            color: level === l ? '#1B87E6' : '#6B7280',
            fontWeight: level === l ? 500 : 400,
          }}
        >
          {LEVEL_LABEL[l]}
        </button>
      ))}
    </div>
  )

  return (
    <WidgetCardShell
      title={title}
      subtitle={
        resolved ? (
          <span>
            Impact on{' '}
            <span className="font-medium text-gray-600">{resolved.outcomeLabel}</span>
            {' · Thresholds set to median of your data'}
          </span>
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
            {levelToggle}

            <div style={{ position: 'relative', marginTop: 8 }}>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 24, right: 24, bottom: 52, left: 60 }}>
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
                      value="Performance"
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
                      value="Impact"
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setShowMetricList((v) => !v)}
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
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
                <>
                  <button type="button" onClick={expandAll} style={linkButtonStyle}>
                    Expand all
                  </button>
                  <button type="button" onClick={collapseAll} style={linkButtonStyle}>
                    Collapse all
                  </button>
                </>
              )}
            </div>

            {showMetricList && (
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '0 12px',
                    paddingBottom: 6,
                    borderBottom: '1px solid var(--wu-border, #E5E7EB)',
                    fontSize: 10,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span style={{ paddingLeft: 7 }}>Metric</span>
                  <span style={{ textAlign: 'right' }}>Performance</span>
                  <span style={{ textAlign: 'right' }}>Impact</span>
                  <span>Quadrant</span>
                </div>
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '0 12px',
                    alignItems: 'center',
                  }}
                >
                  {metricTree.map((node) => (
                    <MetricRow key={node.id} node={node} depth={0} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
