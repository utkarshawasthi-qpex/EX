/**
 * RECONCILE (current → target) — this file:
 * - CURRENT: DriverMetric has kind + parentId; resolveItemsAtLevel / buildMetricTree walk parents;
 *   pearsonR, getDriverImpact, getMetricFavorability exist and are used by the widget.
 * - CURRENT: No question-set intersection helpers; exclusion is id-equality only.
 * - TARGET: Add descendantQuestionsOf / questionSetsIntersect / overlapsOutcome BELOW tree helpers.
 * - DO NOT TOUCH: pearsonR, getDriverImpact, normalizeToFavorability, getMetricFavorability,
 *   DriverMetric type, DRIVER_METRICS, MetricTreeNode, buildMetricTree, resolveItemsAtLevel.
 */
import {
  CATEGORY_BASELINES,
  CATEGORY_KEYS,
  type CategoryKey,
  type CategorySentiment,
} from '@/data/mock/categorySentimentData'
import {
  filterRespondents,
  type DashboardRespondent,
} from '@/data/mock/dashboardFilters'
import type { ActiveFilter } from '@/types'

export type DriverMetricKind = 'marker' | 'buildingBlock' | 'question'

/** Question types eligible for driver analysis (normalized to 0–100). */
export type DriverQuestionType = 'likert' | 'rating' | 'enps' | 'nps' | 'matrix'

/** Types that cannot be used as outcome or driver. */
export const DRIVER_EXCLUDED_QUESTION_TYPES = [
  'multiple_choice',
  'open_text',
  'yes_no',
  'presentation',
  'multi_select',
] as const

/** Minimum selected drivers / plotted dots required to create or draw the chart. */
export const MIN_DRIVER_PLOT_POINTS = 4

export type DriverMetric = {
  id: string
  label: string
  kind: DriverMetricKind
  categoryKey: CategoryKey
  parentId?: string
  questionType: DriverQuestionType
  /** When true, metric cannot be selected in driver analysis. */
  excluded?: boolean
  excludeReason?: string
}

/**
 * Workplace Culture driver hierarchy used by the Driver Analysis widget.
 * Markers map 1:1 to CATEGORY_KEYS. Building blocks and questions are
 * synthetic children for the prototype (LifecycleSurvey has no BB layer).
 */
export const DRIVER_METRICS: DriverMetric[] = [
  ...CATEGORY_KEYS.map(
    (key): DriverMetric => ({
      id: `marker_${key}`,
      label: CATEGORY_BASELINES[key].label,
      kind: 'marker',
      categoryKey: key,
      questionType: 'likert',
    }),
  ),
  {
    id: 'bb_tech_tools',
    label: 'Work tools',
    kind: 'buildingBlock',
    categoryKey: 'technologies',
    parentId: 'marker_technologies',
    questionType: 'likert',
  },
  {
    id: 'bb_tech_systems',
    label: 'Systems access',
    kind: 'buildingBlock',
    categoryKey: 'technologies',
    parentId: 'marker_technologies',
    questionType: 'likert',
  },
  {
    id: 'bb_trans_updates',
    label: 'Decision updates',
    kind: 'buildingBlock',
    categoryKey: 'transparency',
    parentId: 'marker_transparency',
    questionType: 'likert',
  },
  {
    id: 'bb_trans_direction',
    label: 'Company direction',
    kind: 'buildingBlock',
    categoryKey: 'transparency',
    parentId: 'marker_transparency',
    questionType: 'likert',
  },
  {
    id: 'bb_growth_career',
    label: 'Career pathing',
    kind: 'buildingBlock',
    categoryKey: 'growth',
    parentId: 'marker_growth',
    questionType: 'likert',
  },
  {
    id: 'bb_incl_belonging',
    label: 'Belonging',
    kind: 'buildingBlock',
    categoryKey: 'inclusion',
    parentId: 'marker_inclusion',
    questionType: 'likert',
  },
  {
    id: 'q_tech_slow',
    label: 'Tools slow me down',
    kind: 'question',
    categoryKey: 'technologies',
    parentId: 'bb_tech_tools',
    questionType: 'likert',
  },
  {
    id: 'q_trans_decisions',
    label: 'I hear decisions that affect me',
    kind: 'question',
    categoryKey: 'transparency',
    parentId: 'bb_trans_updates',
    questionType: 'likert',
  },
  {
    id: 'q_growth_1on1',
    label: 'Career talks in 1:1s',
    kind: 'question',
    categoryKey: 'growth',
    parentId: 'bb_growth_career',
    questionType: 'likert',
  },
  {
    id: 'q_incl_voice',
    label: 'My voice is heard',
    kind: 'question',
    categoryKey: 'inclusion',
    parentId: 'bb_incl_belonging',
    questionType: 'likert',
  },
  // Example excluded metric (open text) — shown disabled in the creation modal
  {
    id: 'q_open_comments',
    label: 'Additional comments',
    kind: 'question',
    categoryKey: 'inclusion',
    questionType: 'likert',
    excluded: true,
    excludeReason: 'This metric type cannot be used in driver analysis',
  },
]

export function getDriverMetricById(id: string): DriverMetric | undefined {
  return DRIVER_METRICS.find((metric) => metric.id === id)
}

export function getEligibleDriverMetrics(): DriverMetric[] {
  return DRIVER_METRICS.filter((metric) => !metric.excluded)
}

export function getDriverOutcomeOptions(): {
  markers: DriverMetric[]
  buildingBlocks: DriverMetric[]
} {
  const eligible = getEligibleDriverMetrics()
  return {
    markers: eligible.filter((m) => m.kind === 'marker'),
    buildingBlocks: eligible.filter((m) => m.kind === 'buildingBlock'),
  }
}

/**
 * Resolve metrics at a hierarchy level that belong to the selected driver set
 * (directly selected, descendants of selected ancestors, or ancestors of
 * selected descendants). Falls back to all eligible items at that level.
 */
export function resolveItemsAtLevel(
  level: DriverMetricKind,
  driverMetricIds: string[],
): DriverMetric[] {
  const eligible = getEligibleDriverMetrics()
  const byId = new Map(eligible.map((m) => [m.id, m]))
  const selected = new Set(driverMetricIds.filter((id) => byId.has(id)))

  function isDescendantOf(metric: DriverMetric, ancestorId: string): boolean {
    let current: DriverMetric | undefined = metric
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true
      current = byId.get(current.parentId)
    }
    return false
  }

  function isAncestorOfSelected(metric: DriverMetric): boolean {
    for (const id of selected) {
      const sel = byId.get(id)
      if (!sel) continue
      if (sel.id === metric.id || isDescendantOf(sel, metric.id)) return true
    }
    return false
  }

  const atLevel = eligible.filter((m) => m.kind === level)
  if (selected.size === 0) return atLevel

  const resolved = atLevel.filter((m) => {
    if (selected.has(m.id)) return true
    for (const id of selected) {
      if (isDescendantOf(m, id)) return true
    }
    if (isAncestorOfSelected(m)) return true
    return false
  })

  return resolved.length > 0 ? resolved : atLevel
}

export type MetricTreeNode = {
  id: string
  label: string
  level: DriverMetricKind
  performance: number
  impact: number
  children: MetricTreeNode[]
}

/**
 * Hierarchical Marker → Building block → Question tree for the metric list.
 * Only includes branches that contain selected drivers (selected nodes,
 * their ancestors, and descendants of selected ancestors). Values use the
 * same getMetricFavorability / getDriverImpact path as chart dots.
 */
export function buildMetricTree(
  driverMetricIds: string[],
  outcomeMetricId: string,
  activeFilters: ActiveFilter[],
  _respondents?: DashboardRespondent[],
): MetricTreeNode[] {
  void _respondents
  const eligible = getEligibleDriverMetrics().filter((m) => m.id !== outcomeMetricId)
  const byId = new Map(eligible.map((m) => [m.id, m]))
  const selected = new Set(driverMetricIds.filter((id) => byId.has(id) && id !== outcomeMetricId))

  function isDescendantOf(metric: DriverMetric, ancestorId: string): boolean {
    let current: DriverMetric | undefined = metric
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true
      current = byId.get(current.parentId)
    }
    return false
  }

  function isAncestorOfSelected(metric: DriverMetric): boolean {
    for (const id of selected) {
      const sel = byId.get(id)
      if (!sel) continue
      if (sel.id === metric.id || isDescendantOf(sel, metric.id)) return true
    }
    return false
  }

  function isIncluded(metric: DriverMetric): boolean {
    if (selected.size === 0) {
      // Match resolveItemsAtLevel fallback: all eligible at each level
      return true
    }
    if (selected.has(metric.id)) return true
    for (const id of selected) {
      if (isDescendantOf(metric, id)) return true
    }
    if (isAncestorOfSelected(metric)) return true
    return false
  }

  function toNode(metric: DriverMetric, childKind: DriverMetricKind | null): MetricTreeNode {
    const performance = getMetricFavorability(metric.id, metric.kind, activeFilters)
    const impact = getDriverImpact(metric.id, outcomeMetricId, activeFilters)
    const children =
      childKind == null
        ? []
        : eligible
            .filter(
              (m) =>
                m.kind === childKind &&
                m.parentId === metric.id &&
                isIncluded(m),
            )
            .map((m) =>
              toNode(
                m,
                childKind === 'buildingBlock' ? 'question' : null,
              ),
            )

    return {
      id: metric.id,
      label: metric.label,
      level: metric.kind,
      performance,
      impact,
      children,
    }
  }

  const markers = eligible.filter((m) => m.kind === 'marker' && isIncluded(m))
  return markers.map((m) => toNode(m, 'buildingBlock'))
}

// -----------------------------------------------------------------------------
// Question-set intersection helpers.
//
// The rule that governs both creation-time driver disable AND render-time
// per-level dot filtering is a single predicate:
//
//   "A node is valid iff its descendant-question set does not intersect the
//    outcome's descendant-question set."
//
// Same predicate at both times. Because a node's questions are exactly its
// leaf descendants, this correctly catches: the outcome itself, descendants
// (subset), ancestors (superset — including any resurrected by level roll-up),
// and disjoint siblings/cousins (kept).
// -----------------------------------------------------------------------------

const descendantQuestionsCache = new Map<string, ReadonlySet<string>>()

/** All question IDs at or below a metric. Cached; safe to call in hot paths. */
export function descendantQuestionsOf(metricId: string): ReadonlySet<string> {
  const cached = descendantQuestionsCache.get(metricId)
  if (cached) return cached

  const metric = DRIVER_METRICS.find((m) => m.id === metricId)
  const result = new Set<string>()
  if (!metric) {
    descendantQuestionsCache.set(metricId, result)
    return result
  }

  if (metric.kind === 'question') {
    result.add(metricId)
  } else {
    for (const child of DRIVER_METRICS) {
      if (child.parentId === metricId) {
        for (const q of descendantQuestionsOf(child.id)) result.add(q)
      }
    }
  }

  descendantQuestionsCache.set(metricId, result)
  return result
}

/** True iff the two sets share at least one question id. */
export function questionSetsIntersect(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const q of small) if (large.has(q)) return true
  return false
}

/**
 * True iff `candidateId` overlaps the outcome by any question — i.e. must be
 * excluded (self / descendant / ancestor / any node whose subtree contains
 * an outcome question).
 */
export function overlapsOutcome(
  candidateId: string,
  outcomeQuestions: ReadonlySet<string>,
): boolean {
  if (outcomeQuestions.size === 0) return false
  return questionSetsIntersect(descendantQuestionsOf(candidateId), outcomeQuestions)
}

/**
 * Pearson r (computational form):
 * r = [n·Σ(xy) - (Σx)(Σy)] / √{[n·Σx² - (Σx)²] · [n·Σy² - (Σy)²]}
 */
export function pearsonR(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((a, v, i) => a + v * (ys[i] ?? 0), 0)
  const sumX2 = xs.reduce((a, v) => a + v * v, 0)
  const sumY2 = ys.reduce((a, v) => a + v * v, 0)
  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
  return den === 0 ? 0 : num / den
}

/** @deprecated Prefer pearsonR */
export function pearsonCorrelation(driverScores: number[], outcomeScores: number[]): number {
  return pearsonR(driverScores, outcomeScores)
}

export type AxisConfig = {
  min: number
  max: number
  threshold: number
}

/** Dynamic domain + median threshold with 2σ outlier removal. */
export function computeAxisConfig(values: number[], padding = 0.15): AxisConfig {
  if (!values.length) return { min: 0, max: 1, threshold: 0.5 }

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length)
  const filtered =
    std > 0 ? values.filter((v) => Math.abs(v - mean) <= 2 * std) : values
  const usable = filtered.length > 0 ? filtered : values

  const dataMin = Math.min(...usable)
  const dataMax = Math.max(...usable)
  const range = dataMax - dataMin || 1
  const pad = range * padding

  const sorted = [...usable].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const threshold =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0.5)

  return { min: dataMin - pad, max: dataMax + pad, threshold }
}

/**
 * Normalize raw scores to a 0–100 favorability-style Y value.
 * Scale never changes — eNPS is mapped onto the same 0–100 range.
 */
export function normalizeToFavorability(
  scores: number[],
  questionType: DriverQuestionType,
): number {
  if (scores.length === 0) return 0

  switch (questionType) {
    case 'likert':
    case 'matrix':
    case 'rating': {
      const max = Math.max(...scores)
      const threshold = max * 0.6
      const favorable = scores.filter((s) => s > threshold).length
      return Math.round((favorable / scores.length) * 100)
    }
    case 'enps':
    case 'nps': {
      const n = scores.length
      const promoters = scores.filter((s) => s >= 9).length
      const detractors = scores.filter((s) => s <= 6).length
      const enps = ((promoters - detractors) / n) * 100
      return Math.round((enps + 100) / 2)
    }
    default:
      return 0
  }
}

export function getYAxisDisclosureLabel(questionType: DriverQuestionType): string {
  return questionType === 'enps' || questionType === 'nps' ? 'eNPS (normalized)' : 'Favorability'
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Map categorical sentiment → 1–5 Likert score (deterministic per respondent). */
function sentimentToLikert(
  respondentId: string,
  categoryKey: CategoryKey,
  sentiment: CategorySentiment,
): number {
  const h = hashString(`${respondentId}:${categoryKey}`)
  if (sentiment === 'favorable') return h % 2 === 0 ? 5 : 4
  if (sentiment === 'neutral') return 3
  return h % 2 === 0 ? 2 : 1
}

/** Small deterministic offsets so BB/question series aren't identical to the parent marker. */
const METRIC_SCORE_OFFSETS: Record<string, number> = {
  bb_tech_tools: -0.4,
  bb_tech_systems: 0.3,
  bb_trans_updates: -0.3,
  bb_trans_direction: 0.2,
  bb_growth_career: -0.2,
  bb_incl_belonging: 0.15,
  q_tech_slow: -0.6,
  q_trans_decisions: -0.4,
  q_growth_1on1: 0.25,
  q_incl_voice: 0.35,
}

function clampScore(value: number, questionType: DriverQuestionType): number {
  if (questionType === 'enps' || questionType === 'nps') {
    return Math.max(0, Math.min(10, Math.round(value)))
  }
  return Math.max(1, Math.min(5, Math.round(value)))
}

function scoreForRespondent(respondent: DashboardRespondent, metric: DriverMetric): number {
  const sentiment = respondent.categorySentiment[metric.categoryKey]
  const base = sentimentToLikert(respondent.id, metric.categoryKey, sentiment)

  if (metric.questionType === 'enps' || metric.questionType === 'nps') {
    // Map 1–5 likert-ish base onto 0–10 NPS scale with noise
    const h = hashString(`${respondent.id}:nps:${metric.id}`)
    const mapped = ((base - 1) / 4) * 10
    return clampScore(mapped + ((h % 5) - 2) * 0.5, metric.questionType)
  }

  const offset = METRIC_SCORE_OFFSETS[metric.id] ?? 0
  return clampScore(base + offset, metric.questionType)
}

/** Respondent-level raw scores for a metric (respects dashboard filters). */
export function getRespondentMetricScores(
  metricId: string,
  activeFilters: ActiveFilter[] = [],
): number[] {
  const metric = getDriverMetricById(metricId)
  if (!metric || metric.excluded) return []

  const respondents = filterRespondents(activeFilters)
  return respondents.map((respondent) => scoreForRespondent(respondent, metric))
}

/**
 * Favorability (0–100) for a driver metric via normalizeToFavorability on
 * respondent-level scores. Respects activeFilters.
 */
export function getMetricFavorability(
  metricKey: string,
  _metricKind: DriverMetricKind,
  activeFilters: ActiveFilter[],
): number {
  const metric = getDriverMetricById(metricKey)
  if (!metric || metric.excluded) return 0
  const scores = getRespondentMetricScores(metricKey, activeFilters)
  return normalizeToFavorability(scores, metric.questionType)
}

/**
 * Impact on the outcome = |Pearson r| (always ≥ 0).
 * Y axis of the driver analysis chart uses this absolute value.
 */
export function getDriverImpact(
  driverId: string,
  outcomeId: string,
  activeFilters: ActiveFilter[] = [],
): number {
  if (driverId === outcomeId) return 1
  return Math.abs(
    pearsonR(
      getRespondentMetricScores(driverId, activeFilters),
      getRespondentMetricScores(outcomeId, activeFilters),
    ),
  )
}

/** @deprecated Prefer getDriverImpact — kept for any leftover imports. */
export function getCorrelation(driverId: string, outcomeId: string): number {
  return getDriverImpact(driverId, outcomeId, [])
}

/**
 * @deprecated Prefer live pearson via getDriverImpact.
 * Kept so older imports still resolve; values are computed once at module load.
 */
export const DRIVER_CORRELATION_MATRIX: Record<string, Record<string, number>> = (() => {
  const eligible = getEligibleDriverMetrics()
  const ids = eligible.map((m) => m.id)
  const matrix: Record<string, Record<string, number>> = {}
  for (const id of ids) {
    matrix[id] = {}
    for (const other of ids) {
      matrix[id][other] = getDriverImpact(id, other, [])
    }
  }
  return matrix
})()

/** @deprecated Prefer DRIVER_METRICS + getDriverImpact. */
export const mockDriverAnalysisData = {
  surveyName: 'Workplace Culture',
  drivers: CATEGORY_KEYS.map((key) => ({
    name: CATEGORY_BASELINES[key].label,
    impact: getDriverImpact(`marker_${key}`, 'marker_inclusion', []),
    favorability: getMetricFavorability(`marker_${key}`, 'marker', []),
  })),
}
