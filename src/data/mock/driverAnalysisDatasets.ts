/**
 * RECONCILE — comparison datasets:
 * - CONFIRMED: per-respondent scores live in scoreForRespondent + getRespondentMetricScores
 *   in driverAnalysis.ts. Widgets never touch a stored matrix; they call
 *   getMetricFavorability / getDriverImpact, which call getRespondentMetricScores.
 * - TARGET: getRespondentMetricScores routes through generateScores(datasetId, ...)
 *   so swapping the selected DatasetId changes all Driver Analysis variants at once.
 */
import type { DriverQuestionType } from '@/data/mock/driverAnalysis'

export type DatasetId =
  | 'typical'
  | 'weak_only'
  | 'strong_only'
  | 'bimodal_impact'
  | 'all_high_performance'
  | 'all_low_performance'
  | 'sparse'
  | 'dense'
  | 'single_outlier'
  | 'question_outcome_attenuation'
  | 'block_outcome_rollup'
  | 'reverse_worded'
  | 'mixed_scales'
  | 'deep_hierarchy'

export type MetricTarget = {
  targetImpact: number
  targetPerformance: number
}

export type DatasetProfile = {
  id: DatasetId
  label: string
  description: string
  metricTargets: Record<string, MetricTarget>
  respondentCount?: number
  outcomeOverride?: string
  driverSubset?: string[]
}

export const DEFAULT_DATASET_ID: DatasetId = 'typical'

export const DATASET_STORAGE_KEY = 'pp_current_dataset_id'

const CORE_IDS = [
  'marker_transparency',
  'marker_technologies',
  'marker_solutions',
  'marker_innovation',
  'marker_inclusion',
  'marker_growth',
  'bb_tech_tools',
  'bb_tech_systems',
  'bb_trans_updates',
  'bb_trans_direction',
  'bb_growth_career',
  'bb_incl_belonging',
  'q_tech_slow',
  'q_trans_decisions',
  'q_growth_1on1',
  'q_incl_voice',
] as const

const TYPICAL_DRIVERS = CORE_IDS.filter((id) => id !== 'marker_inclusion')

const EXTRA_TECH_IDS = [
  'bb_tech_h3',
  'bb_tech_h4',
  'q_tech_tools_2',
  'q_tech_tools_3',
  'q_tech_systems_1',
  'q_tech_systems_2',
  'q_tech_systems_3',
  'q_tech_h3_1',
  'q_tech_h3_2',
  'q_tech_h3_3',
  'q_tech_h4_1',
  'q_tech_h4_2',
  'q_tech_h4_3',
] as const

const ENPS_IDS = ['q_enps_company', 'q_enps_team'] as const

const DENSE_DRIVERS = [...TYPICAL_DRIVERS, ...EXTRA_TECH_IDS, ...ENPS_IDS]

const DEEP_HIERARCHY_DRIVERS = [
  'marker_technologies',
  'bb_tech_tools',
  'bb_tech_systems',
  'bb_tech_h3',
  'bb_tech_h4',
  'q_tech_slow',
  'q_tech_tools_2',
  'q_tech_tools_3',
  'q_tech_systems_1',
  'q_tech_systems_2',
  'q_tech_systems_3',
  'q_tech_h3_1',
  'q_tech_h3_2',
  'q_tech_h3_3',
  'q_tech_h4_1',
  'q_tech_h4_2',
  'q_tech_h4_3',
]

const SPARSE_DRIVERS = [
  'marker_growth',
  'marker_transparency',
  'marker_technologies',
  'bb_tech_tools',
  'q_tech_slow',
]

const MIXED_SCALE_DRIVERS = [
  'marker_growth',
  'marker_transparency',
  'marker_technologies',
  'marker_solutions',
  'bb_tech_tools',
  'q_tech_slow',
  'q_incl_voice',
  'q_enps_company',
  'q_enps_team',
]

function spreadTargets(
  ids: readonly string[],
  impactMin: number,
  impactMax: number,
  perfMin: number,
  perfMax: number,
): Record<string, MetricTarget> {
  const targets: Record<string, MetricTarget> = {}
  ids.forEach((id, index) => {
    const t = ids.length <= 1 ? 0.5 : index / (ids.length - 1)
    targets[id] = {
      targetImpact: Number((impactMin + t * (impactMax - impactMin)).toFixed(3)),
      targetPerformance: Number((perfMin + t * (perfMax - perfMin)).toFixed(1)),
    }
  })
  return targets
}

function bimodalTargets(ids: readonly string[]): Record<string, MetricTarget> {
  const mid = Math.ceil(ids.length / 2)
  return {
    ...spreadTargets(ids.slice(0, mid), 0.05, 0.15, 42, 58),
    ...spreadTargets(ids.slice(mid), 0.35, 0.55, 48, 68),
  }
}

function outlierTargets(ids: readonly string[]): Record<string, MetricTarget> {
  const [outlier, ...rest] = ids
  return {
    ...(outlier
      ? { [outlier]: { targetImpact: 0.65, targetPerformance: 44 } }
      : {}),
    ...spreadTargets(rest, 0.08, 0.12, 48, 62),
  }
}

export const DATASETS: DatasetProfile[] = [
  {
    id: 'typical',
    label: 'Typical EX',
    description: '15 drivers, impact 0.08-0.32, favorability 40-75%. Baseline case.',
    metricTargets: spreadTargets(TYPICAL_DRIVERS, 0.08, 0.32, 40, 75),
  },
  {
    id: 'weak_only',
    label: 'Weak drivers only',
    description:
      'All impacts 0.03-0.12. V1 misleadingly shows Priority Focus; V2/V3 correctly show none.',
    metricTargets: spreadTargets(TYPICAL_DRIVERS, 0.03, 0.12, 42, 68),
  },
  {
    id: 'strong_only',
    label: 'Strong drivers only',
    description: 'All impacts 0.35-0.70. V2/V3 fill the top half; V1 splits at the median.',
    metricTargets: spreadTargets(TYPICAL_DRIVERS, 0.35, 0.7, 38, 72),
  },
  {
    id: 'bimodal_impact',
    label: 'Bimodal impact distribution',
    description:
      'Half of drivers 0.05-0.15, half 0.35-0.55. Tests threshold placement in the empty middle.',
    metricTargets: bimodalTargets(TYPICAL_DRIVERS),
  },
  {
    id: 'all_high_performance',
    label: 'All high favorability',
    description:
      'All favorability above 65%. V1 splits at median performance (~72%); V2/V3 show Priority Focus empty (correct).',
    metricTargets: spreadTargets(TYPICAL_DRIVERS, 0.1, 0.4, 66, 88),
  },
  {
    id: 'all_low_performance',
    label: 'All low favorability',
    description:
      'All favorability below 50%. Everything left of both static and dynamic vertical dividers.',
    metricTargets: spreadTargets(TYPICAL_DRIVERS, 0.1, 0.4, 22, 48),
  },
  {
    id: 'sparse',
    label: 'Sparse (5 drivers)',
    description: 'Near MIN_DOTS_TO_PLOT. Median unstable with 5 dots; static thresholds unaffected.',
    metricTargets: spreadTargets(SPARSE_DRIVERS, 0.08, 0.4, 38, 70),
    driverSubset: [...SPARSE_DRIVERS],
  },
  {
    id: 'dense',
    label: 'Dense (30 drivers)',
    description: 'Tests visual density. V3 fixed axis compresses; V2 adaptive spreads.',
    metricTargets: spreadTargets(DENSE_DRIVERS, 0.06, 0.48, 36, 78),
    driverSubset: [...DENSE_DRIVERS],
  },
  {
    id: 'single_outlier',
    label: 'Single high-impact outlier',
    description: '14 drivers around 0.10 impact, one at 0.65. Tests axis stretch behavior.',
    metricTargets: outlierTargets(TYPICAL_DRIVERS),
  },
  {
    id: 'question_outcome_attenuation',
    label: 'Question outcome (attenuated)',
    description:
      'Outcome is a single question. All impacts systematically reduced by measurement error.',
    metricTargets: spreadTargets(
      TYPICAL_DRIVERS.filter((id) => id !== 'q_incl_voice'),
      0.04,
      0.16,
      40,
      70,
    ),
    outcomeOverride: 'q_incl_voice',
  },
  {
    id: 'block_outcome_rollup',
    label: 'Block outcome (roll-up trap)',
    description:
      'Outcome is a building block. Drivers include sibling block. Markers view drops the outcome parent.',
    metricTargets: spreadTargets(
      [
        'marker_growth',
        'marker_transparency',
        'marker_solutions',
        'marker_innovation',
        'bb_tech_systems',
        'bb_trans_updates',
        'bb_growth_career',
        'q_trans_decisions',
        'q_growth_1on1',
        'q_incl_voice',
      ],
      0.1,
      0.36,
      40,
      72,
    ),
    outcomeOverride: 'bb_tech_tools',
    driverSubset: [
      'marker_technologies',
      'marker_growth',
      'marker_transparency',
      'marker_solutions',
      'marker_innovation',
      'bb_tech_systems',
      'bb_trans_updates',
      'bb_growth_career',
      'q_trans_decisions',
      'q_growth_1on1',
      'q_incl_voice',
    ],
  },
  {
    id: 'reverse_worded',
    label: 'Reverse-worded item',
    description:
      'One driver has genuine negative correlation. Tests |r| absolute-value treatment.',
    metricTargets: {
      ...spreadTargets(
        TYPICAL_DRIVERS.filter((id) => id !== 'q_tech_slow'),
        0.1,
        0.32,
        42,
        70,
      ),
      q_tech_slow: { targetImpact: -0.35, targetPerformance: 38 },
    },
  },
  {
    id: 'mixed_scales',
    label: 'Mixed question scales',
    description: 'Drivers span Likert (1-5) and eNPS (0-10). Tests normalization pipeline.',
    metricTargets: spreadTargets(MIXED_SCALE_DRIVERS, 0.1, 0.4, 40, 74),
    driverSubset: [...MIXED_SCALE_DRIVERS],
  },
  {
    id: 'deep_hierarchy',
    label: 'Deep hierarchy under one marker',
    description:
      'One marker with 4 blocks × 3 questions = 12 questions. Tests roll-up and drill-down at scale.',
    metricTargets: spreadTargets(DEEP_HIERARCHY_DRIVERS, 0.08, 0.4, 36, 74),
    driverSubset: [...DEEP_HIERARCHY_DRIVERS],
  },
]

export const SPECIAL_DATASET_IDS: DatasetId[] = [
  'question_outcome_attenuation',
  'block_outcome_rollup',
  'reverse_worded',
  'mixed_scales',
  'deep_hierarchy',
]

export function isDatasetId(value: string | null | undefined): value is DatasetId {
  return DATASETS.some((dataset) => dataset.id === value)
}

export function getDatasetById(id: DatasetId | string): DatasetProfile {
  return DATASETS.find((dataset) => dataset.id === id) ?? DATASETS[0]!
}

function getTarget(dataset: DatasetProfile, metricId: string): MetricTarget {
  return dataset.metricTargets[metricId] ?? { targetImpact: 0.15, targetPerformance: 55 }
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function unit(seed: string): number {
  return hashString(seed) / 0x100000000
}

function gaussian(seed: string): number {
  const u1 = Math.max(unit(`${seed}:a`), 1e-9)
  const u2 = unit(`${seed}:b`)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function mapToScale(
  z: number[],
  targetPerformance: number,
  questionType: DriverQuestionType,
): number[] {
  const n = z.length
  if (n === 0) return []
  const order = z.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const favorableCount = Math.max(0, Math.min(n, Math.round((targetPerformance / 100) * n)))
  const isNps = questionType === 'enps' || questionType === 'nps'
  const scores = new Array<number>(n)

  for (let rank = 0; rank < n; rank += 1) {
    const { index } = order[rank]!
    const isFavorable = rank >= n - favorableCount
    if (isNps) {
      scores[index] = isFavorable ? (rank % 2 === 0 ? 9 : 10) : rank % 3 === 0 ? 6 : 4
    } else {
      scores[index] = isFavorable ? (rank % 2 === 0 ? 5 : 4) : rank % 3 === 0 ? 2 : 3
    }
  }
  return scores
}

const scoreCache = new Map<string, { outcomeScores: number[]; driverScores: number[] }>()

/**
 * Deterministic per-respondent scores calibrated to a dataset's target r and
 * favorability. Seeded from datasetId so visuals are stable across reloads.
 */
export function generateScores(
  datasetId: DatasetId,
  metricId: string,
  outcomeId: string,
  respondentIds: string[],
  metricType: DriverQuestionType,
  outcomeType: DriverQuestionType = 'likert',
): { outcomeScores: number[]; driverScores: number[] } {
  const respondentKey = `${respondentIds.length}:${hashString(respondentIds.join('|'))}`
  const cacheKey = `${datasetId}|${metricId}|${outcomeId}|${respondentKey}|${metricType}|${outcomeType}`
  const cached = scoreCache.get(cacheKey)
  if (cached) return cached

  const dataset = getDatasetById(datasetId)
  const driverTarget = getTarget(dataset, metricId)
  const outcomeTarget = getTarget(dataset, outcomeId)
  const latent = respondentIds.map((id) => gaussian(`${datasetId}:latent:${id}`))
  const outcomeNoise = respondentIds.map((id) => gaussian(`${datasetId}:${outcomeId}:noise:${id}`))
  const driverNoise = respondentIds.map((id) => gaussian(`${datasetId}:${metricId}:noise:${id}`))

  const rawR = metricId === outcomeId ? 1 : driverTarget.targetImpact
  const driverR = Math.max(-0.99, Math.min(0.99, rawR))
  const residual = Math.sqrt(Math.max(0, 1 - driverR * driverR))

  const outcomeZ = latent.map((value, index) => value + 0.05 * (outcomeNoise[index] ?? 0))
  const driverZ =
    metricId === outcomeId
      ? outcomeZ
      : latent.map((value, index) => driverR * value + residual * (driverNoise[index] ?? 0))

  const result = {
    outcomeScores: mapToScale(outcomeZ, outcomeTarget.targetPerformance, outcomeType),
    driverScores: mapToScale(driverZ, driverTarget.targetPerformance, metricType),
  }
  scoreCache.set(cacheKey, result)
  return result
}
