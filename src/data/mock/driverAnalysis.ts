import {
  CATEGORY_BASELINES,
  CATEGORY_KEYS,
  type CategoryKey,
} from '@/data/mock/categorySentimentData'
import { getFilteredCategorySentiment } from '@/data/mock/dashboardFilters'
import type { ActiveFilter } from '@/types'

export type DriverMetricKind = 'marker' | 'buildingBlock' | 'question'

export type DriverMetric = {
  id: string
  label: string
  kind: DriverMetricKind
  /** Parent category used for favorability lookup / approximation. */
  categoryKey: CategoryKey
  parentId?: string
}

/**
 * Workplace Culture driver hierarchy used by the Driver Analysis widget.
 * Markers map 1:1 to CATEGORY_KEYS. Building blocks and questions are
 * synthetic children for the prototype (LifecycleSurvey has no BB layer).
 */
export const DRIVER_METRICS: DriverMetric[] = [
  // Markers
  ...CATEGORY_KEYS.map(
    (key): DriverMetric => ({
      id: `marker_${key}`,
      label: CATEGORY_BASELINES[key].label,
      kind: 'marker',
      categoryKey: key,
    }),
  ),
  // Building blocks (2 per marker for the lowest / highest scoring markers —
  // enough variety for the scatter without overcrowding)
  {
    id: 'bb_tech_tools',
    label: 'Work tools',
    kind: 'buildingBlock',
    categoryKey: 'technologies',
    parentId: 'marker_technologies',
  },
  {
    id: 'bb_tech_systems',
    label: 'Systems access',
    kind: 'buildingBlock',
    categoryKey: 'technologies',
    parentId: 'marker_technologies',
  },
  {
    id: 'bb_trans_updates',
    label: 'Decision updates',
    kind: 'buildingBlock',
    categoryKey: 'transparency',
    parentId: 'marker_transparency',
  },
  {
    id: 'bb_trans_direction',
    label: 'Company direction',
    kind: 'buildingBlock',
    categoryKey: 'transparency',
    parentId: 'marker_transparency',
  },
  {
    id: 'bb_growth_career',
    label: 'Career pathing',
    kind: 'buildingBlock',
    categoryKey: 'growth',
    parentId: 'marker_growth',
  },
  {
    id: 'bb_incl_belonging',
    label: 'Belonging',
    kind: 'buildingBlock',
    categoryKey: 'inclusion',
    parentId: 'marker_inclusion',
  },
  // Questions (approximate favorability from parent marker)
  {
    id: 'q_tech_slow',
    label: 'Tools slow me down',
    kind: 'question',
    categoryKey: 'technologies',
    parentId: 'bb_tech_tools',
  },
  {
    id: 'q_trans_decisions',
    label: 'I hear decisions that affect me',
    kind: 'question',
    categoryKey: 'transparency',
    parentId: 'bb_trans_updates',
  },
  {
    id: 'q_growth_1on1',
    label: 'Career talks in 1:1s',
    kind: 'question',
    categoryKey: 'growth',
    parentId: 'bb_growth_career',
  },
  {
    id: 'q_incl_voice',
    label: 'My voice is heard',
    kind: 'question',
    categoryKey: 'inclusion',
    parentId: 'bb_incl_belonging',
  },
]

/** Pair-wise correlation of drivers with each other (symmetric). Values in [-0.55, 0.55]. */
export const DRIVER_CORRELATION_MATRIX: Record<string, Record<string, number>> = (() => {
  const ids = DRIVER_METRICS.map((m) => m.id)
  const matrix: Record<string, Record<string, number>> = {}
  for (const id of ids) matrix[id] = {}

  const set = (a: string, b: string, value: number) => {
    if (!matrix[a] || !matrix[b]) return
    matrix[a][b] = value
    matrix[b][a] = value
  }

  // Marker ↔ marker correlations (impact of row on column when column is outcome)
  const markerImpact: Record<CategoryKey, number> = {
    technologies: 0.48,
    transparency: 0.42,
    growth: 0.28,
    solutions: 0.22,
    innovation: 0.18,
    inclusion: 0.12,
  }

  for (const key of CATEGORY_KEYS) {
    const markerId = `marker_${key}`
    // Engagement-like composite isn't a separate metric; correlations between markers
    for (const other of CATEGORY_KEYS) {
      if (key === other) {
        set(markerId, markerId, 1)
        continue
      }
      const avg = (markerImpact[key] + markerImpact[other]) / 2
      const sign = key === 'inclusion' && other === 'technologies' ? -0.08 : 1
      set(markerId, `marker_${other}`, Math.round(avg * sign * 100) / 100 - 0.15)
    }
  }

  // Building blocks → parent markers (strong positive)
  const bbLinks: [string, string, number][] = [
    ['bb_tech_tools', 'marker_technologies', 0.52],
    ['bb_tech_systems', 'marker_technologies', 0.41],
    ['bb_trans_updates', 'marker_transparency', 0.49],
    ['bb_trans_direction', 'marker_transparency', 0.38],
    ['bb_growth_career', 'marker_growth', 0.44],
    ['bb_incl_belonging', 'marker_inclusion', 0.46],
    // Cross-marker impacts
    ['bb_tech_tools', 'marker_transparency', 0.21],
    ['bb_tech_tools', 'marker_growth', 0.15],
    ['bb_trans_updates', 'marker_inclusion', 0.19],
    ['bb_growth_career', 'marker_inclusion', 0.24],
    ['bb_incl_belonging', 'marker_transparency', 0.11],
  ]
  for (const [a, b, v] of bbLinks) set(a, b, v)

  // Questions → parents
  const qLinks: [string, string, number][] = [
    ['q_tech_slow', 'marker_technologies', 0.51],
    ['q_tech_slow', 'bb_tech_tools', 0.55],
    ['q_trans_decisions', 'marker_transparency', 0.47],
    ['q_trans_decisions', 'bb_trans_updates', 0.53],
    ['q_growth_1on1', 'marker_growth', 0.43],
    ['q_growth_1on1', 'bb_growth_career', 0.5],
    ['q_incl_voice', 'marker_inclusion', 0.45],
    ['q_incl_voice', 'bb_incl_belonging', 0.52],
    ['q_tech_slow', 'marker_transparency', 0.18],
    ['q_growth_1on1', 'marker_inclusion', 0.16],
  ]
  for (const [a, b, v] of qLinks) set(a, b, v)

  // Fill missing pairs with small near-zero noise so lookups never return undefined
  for (const a of ids) {
    for (const b of ids) {
      if (matrix[a][b] === undefined) {
        matrix[a][b] = a === b ? 1 : 0.05
      }
    }
  }

  return matrix
})()

export function getDriverMetricById(id: string): DriverMetric | undefined {
  return DRIVER_METRICS.find((metric) => metric.id === id)
}

export function getDriverOutcomeOptions(): {
  markers: DriverMetric[]
  buildingBlocks: DriverMetric[]
} {
  return {
    markers: DRIVER_METRICS.filter((m) => m.kind === 'marker'),
    buildingBlocks: DRIVER_METRICS.filter((m) => m.kind === 'buildingBlock'),
  }
}

/**
 * Favorability (0–100) for a driver metric, respecting dashboard filters.
 * Markers use filtered category sentiment. Building blocks average a slight
 * offset from the parent marker. Questions approximate the parent marker
 * (no question-level respondent breakdown exists in mock data).
 */
export function getMetricFavorability(
  metricKey: string,
  metricKind: DriverMetricKind,
  activeFilters: ActiveFilter[],
): number {
  const metric = getDriverMetricById(metricKey)
  const categoryKey = metric?.categoryKey
  if (!categoryKey) return 0

  const base =
    activeFilters.length > 0
      ? getFilteredCategorySentiment(activeFilters, categoryKey).favorable
      : CATEGORY_BASELINES[categoryKey].favorable

  if (metricKind === 'marker') return base

  // Building blocks: small deterministic offsets so siblings aren't identical
  if (metricKind === 'buildingBlock') {
    const offsets: Record<string, number> = {
      bb_tech_tools: -4,
      bb_tech_systems: 3,
      bb_trans_updates: -3,
      bb_trans_direction: 2,
      bb_growth_career: -2,
      bb_incl_belonging: 1,
    }
    return Math.max(0, Math.min(100, base + (offsets[metricKey] ?? 0)))
  }

  // Questions: approximate parent marker (noted in deploy summary)
  const qOffsets: Record<string, number> = {
    q_tech_slow: -6,
    q_trans_decisions: -4,
    q_growth_1on1: 2,
    q_incl_voice: 3,
  }
  return Math.max(0, Math.min(100, base + (qOffsets[metricKey] ?? 0)))
}

export function getCorrelation(driverId: string, outcomeId: string): number {
  return DRIVER_CORRELATION_MATRIX[driverId]?.[outcomeId] ?? 0
}

/** @deprecated Prefer DRIVER_METRICS + correlation matrix. Kept for any leftover imports. */
export const mockDriverAnalysisData = {
  surveyName: 'Workplace Culture',
  drivers: CATEGORY_KEYS.map((key) => ({
    name: CATEGORY_BASELINES[key].label,
    impact: getCorrelation(`marker_${key}`, 'marker_inclusion'),
    favorability: CATEGORY_BASELINES[key].favorable,
  })),
}
