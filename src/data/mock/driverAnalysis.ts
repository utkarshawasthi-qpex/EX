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

/** Pearson r between paired respondent-level score arrays. Returns value in [-1, 1]. */
export function pearsonCorrelation(driverScores: number[], outcomeScores: number[]): number {
  const n = Math.min(driverScores.length, outcomeScores.length)
  if (n < 2) return 0

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i += 1) {
    const x = driverScores[i] ?? 0
    const y = outcomeScores[i] ?? 0
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
  }

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 1000) / 1000
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

/** Pearson r between a driver metric and an outcome metric (filtered respondents). */
export function getDriverImpact(
  driverId: string,
  outcomeId: string,
  activeFilters: ActiveFilter[] = [],
): number {
  if (driverId === outcomeId) return 1
  return pearsonCorrelation(
    getRespondentMetricScores(driverId, activeFilters),
    getRespondentMetricScores(outcomeId, activeFilters),
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
