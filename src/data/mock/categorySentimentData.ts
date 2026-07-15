export type CategoryKey =
  | 'transparency'
  | 'technologies'
  | 'solutions'
  | 'innovation'
  | 'inclusion'
  | 'growth'

export type CategorySentiment = 'favorable' | 'neutral' | 'unfavorable'

export type ScorecardMarker = {
  name: string
  respondents: number
  unfavorable: number
  neutral: number
  favorable: number
  mean: number
  comparison: number | null
  trend?: 'up' | 'down'
}

export const CATEGORY_KEYS: CategoryKey[] = [
  'transparency',
  'technologies',
  'solutions',
  'innovation',
  'inclusion',
  'growth',
]

export type CategoryBaseline = {
  label: string
  favorable: number
  neutral: number
  unfavorable: number
  mean: number
  respondents: number
}

export const CATEGORY_BASELINES: Record<CategoryKey, CategoryBaseline> = {
  transparency: {
    label: 'Transparency',
    favorable: 44,
    neutral: 24,
    unfavorable: 32,
    mean: 2.9,
    respondents: 486,
  },
  technologies: {
    label: 'Technologies',
    favorable: 39,
    neutral: 23,
    unfavorable: 38,
    mean: 2.7,
    respondents: 471,
  },
  solutions: {
    label: 'Solutions',
    favorable: 66,
    neutral: 20,
    unfavorable: 14,
    mean: 3.7,
    respondents: 493,
  },
  innovation: {
    label: 'Innovation',
    favorable: 61,
    neutral: 21,
    unfavorable: 18,
    mean: 3.6,
    respondents: 480,
  },
  inclusion: {
    label: 'Inclusion',
    favorable: 74,
    neutral: 16,
    unfavorable: 10,
    mean: 4.0,
    respondents: 500,
  },
  growth: {
    label: 'Growth',
    favorable: 52,
    neutral: 25,
    unfavorable: 23,
    mean: 3.1,
    respondents: 468,
  },
}

export const DEPARTMENT_MODIFIERS: Record<
  string,
  Partial<Record<CategoryKey, number>>
> = {
  Engineering: { technologies: +10, transparency: -8, innovation: +6 },
  Sales: { growth: -10, transparency: +5, inclusion: -4 },
  HR: { inclusion: +12, transparency: +6 },
  Marketing: { innovation: +8, growth: +4 },
  Product: { innovation: +10, technologies: +5 },
  Finance: { transparency: -5, growth: -6 },
  Operations: { technologies: -8, growth: -5 },
}

export const HEATMAP_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'HR',
  'Marketing',
  'Product',
  'Finance',
  'Operations',
] as const

export const MARKER_NAME_TO_CATEGORY_KEY: Record<string, CategoryKey | null> = {
  'Company Overall': null,
  Transparency: 'transparency',
  Technologies: 'technologies',
  Solutions: 'solutions',
  Innovation: 'innovation',
  Inclusion: 'inclusion',
  Growth: 'growth',
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function seededUnitRandom(seed: string): number {
  return (hashString(seed) % 10000) / 10000
}

export function adjustedCategoryProbabilities(
  categoryKey: CategoryKey,
  department: string,
): { favorable: number; neutral: number; unfavorable: number } {
  const baseline = CATEGORY_BASELINES[categoryKey]
  const modifier = DEPARTMENT_MODIFIERS[department]?.[categoryKey] ?? 0

  let favorable = baseline.favorable + modifier
  let unfavorable = baseline.unfavorable - modifier
  let neutral = baseline.neutral

  favorable = Math.max(5, Math.min(90, favorable))
  unfavorable = Math.max(5, Math.min(90, unfavorable))
  neutral = Math.max(5, neutral)

  const total = favorable + neutral + unfavorable
  return {
    favorable: (favorable / total) * 100,
    neutral: (neutral / total) * 100,
    unfavorable: (unfavorable / total) * 100,
  }
}

export function sampleCategorySentiment(
  respondentId: string,
  categoryKey: CategoryKey,
  department: string,
): CategorySentiment {
  const probabilities = adjustedCategoryProbabilities(categoryKey, department)
  const roll = seededUnitRandom(`${respondentId}:${categoryKey}`) * 100

  if (roll < probabilities.favorable) return 'favorable'
  if (roll < probabilities.favorable + probabilities.neutral) return 'neutral'
  return 'unfavorable'
}

export function sentimentBucketScore(bucket: CategorySentiment): number {
  if (bucket === 'favorable') return 100
  if (bucket === 'neutral') return 50
  return 0
}

export function meanFromSentimentPercentages(
  favorable: number,
  neutral: number,
  unfavorable: number,
): number {
  const raw = (favorable * 4.5 + neutral * 3 + unfavorable * 1.5) / 100
  return Math.round(Math.min(5, Math.max(1, raw)) * 10) / 10
}

export function computeWeightedCategoryAggregate(
  rows: Array<{
    favorable: number
    neutral: number
    unfavorable: number
    mean: number
    respondents: number
  }>,
): { favorable: number; neutral: number; unfavorable: number; mean: number; respondents: number } {
  const totalWeight = rows.reduce((sum, row) => sum + row.respondents, 0)
  if (totalWeight === 0) {
    return { favorable: 0, neutral: 0, unfavorable: 0, mean: 0, respondents: 0 }
  }

  const favorable = Math.round(
    rows.reduce((sum, row) => sum + row.favorable * row.respondents, 0) / totalWeight,
  )
  const neutral = Math.round(
    rows.reduce((sum, row) => sum + row.neutral * row.respondents, 0) / totalWeight,
  )
  const unfavorable = Math.round(
    rows.reduce((sum, row) => sum + row.unfavorable * row.respondents, 0) / totalWeight,
  )
  const mean =
    Math.round(
      (rows.reduce((sum, row) => sum + row.mean * row.respondents, 0) / totalWeight) * 10,
    ) / 10

  return { favorable, neutral, unfavorable, mean, respondents: totalWeight }
}

export function buildCompanyOverallBaseline() {
  const rows = CATEGORY_KEYS.map((key) => {
    const baseline = CATEGORY_BASELINES[key]
    return {
      favorable: baseline.favorable,
      neutral: baseline.neutral,
      unfavorable: baseline.unfavorable,
      mean: baseline.mean,
      respondents: baseline.respondents,
    }
  })
  return computeWeightedCategoryAggregate(rows)
}

export function heatmapCellScore(categoryKey: CategoryKey, department: string | null): number {
  const baseline = CATEGORY_BASELINES[categoryKey]
  const modifier = department ? (DEPARTMENT_MODIFIERS[department]?.[categoryKey] ?? 0) : 0
  const score = baseline.mean + modifier * 0.03
  return Math.round(Math.min(4.8, Math.max(1.5, score)) * 10) / 10
}

function proxyCategoryKey(metric: string): CategoryKey {
  if (metric === 'Collaboration') return 'inclusion'
  if (metric === 'Agility') return 'innovation'
  const key = MARKER_NAME_TO_CATEGORY_KEY[metric]
  if (key) return key
  return 'transparency'
}

export function buildHeatmapScores(): number[][] {
  const metrics = [
    'Transparency',
    'Technologies',
    'Solutions',
    'Innovation',
    'Inclusion',
    'Growth',
    'Collaboration',
    'Agility',
  ]

  return metrics.map((metric) => {
    const categoryKey = proxyCategoryKey(metric)
    const companyScore = heatmapCellScore(categoryKey, null)
    const departmentScores = HEATMAP_DEPARTMENTS.map((department) =>
      heatmapCellScore(categoryKey, department),
    )
    return [companyScore, ...departmentScores]
  })
}

export function buildScorecardMarkers(totalRespondents?: number): ScorecardMarker[] {
  const categoryMarkers = CATEGORY_KEYS.map((key) => {
    const baseline = CATEGORY_BASELINES[key]
    return {
      name: baseline.label,
      respondents: baseline.respondents,
      unfavorable: baseline.unfavorable,
      neutral: baseline.neutral,
      favorable: baseline.favorable,
      mean: baseline.mean,
      comparison: 0,
      trend: 'up' as const,
    }
  })

  const overall = buildCompanyOverallBaseline()

  return [
    {
      name: 'Company Overall',
      respondents: totalRespondents ?? overall.respondents,
      unfavorable: overall.unfavorable,
      neutral: overall.neutral,
      favorable: overall.favorable,
      mean: overall.mean,
      comparison: null,
    },
    ...categoryMarkers,
  ]
}
