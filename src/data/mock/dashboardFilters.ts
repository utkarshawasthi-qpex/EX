import { mockEmployees } from '@/data/mock/employees'
import {
  buildCompanyOverallBaseline,
  CATEGORY_BASELINES,
  CATEGORY_KEYS,
  computeWeightedCategoryAggregate,
  HEATMAP_DEPARTMENTS,
  meanFromSentimentPercentages,
  sampleCategorySentiment,
  sentimentBucketScore,
  type CategoryKey,
  type CategorySentiment,
  type ScorecardMarker,
} from '@/data/mock/categorySentimentData'
import type { ActiveFilter, FilterField } from '@/types'

export const DASHBOARD_FILTER_FIELDS: FilterField[] = [
  {
    id: 'department',
    label: 'Department',
    values: ['Engineering', 'HR', 'Sales', 'Marketing', 'Product', 'Finance', 'Operations'],
  },
  {
    id: 'location',
    label: 'Location',
    values: ['Mumbai', 'Bangalore', 'Delhi', 'Remote', 'US'],
  },
  {
    id: 'level',
    label: 'Level',
    values: ['IC', 'Manager', 'Senior Manager', 'Director', 'VP', 'C-Suite'],
  },
  {
    id: 'tenure',
    label: 'Tenure',
    values: ['<1 year', '1–3 years', '3–5 years', '>5 years'],
  },
]

const LOCATION_MAP: Record<string, string> = {
  'San Francisco': 'US',
  Austin: 'US',
  'New York': 'US',
  Remote: 'Remote',
  London: 'US',
  Mumbai: 'Mumbai',
  Bangalore: 'Bangalore',
  Delhi: 'Delhi',
}

const DEPARTMENT_MAP: Record<string, string> = {
  Engineering: 'Engineering',
  Product: 'Product',
  Sales: 'Sales',
  HR: 'HR',
  Operations: 'Operations',
  Marketing: 'Marketing',
  Finance: 'Finance',
}

function deriveLevel(jobTitle: string): string {
  const title = jobTitle.toLowerCase()
  if (title.includes('chief') || title.includes('c-suite')) return 'C-Suite'
  if (title.includes('vp')) return 'VP'
  if (title.includes('director')) return 'Director'
  if (title.includes('senior manager')) return 'Senior Manager'
  if (title.includes('manager') || title.includes('lead')) return 'Manager'
  return 'IC'
}

function deriveTenure(hireDate: string): string {
  const years = (Date.now() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  if (years < 1) return '<1 year'
  if (years < 3) return '1–3 years'
  if (years < 5) return '3–5 years'
  return '>5 years'
}

export type { CategorySentiment, ScorecardMarker } from '@/data/mock/categorySentimentData'

export type DashboardRespondent = {
  id: string
  department: string
  location: string
  level: string
  tenure: string
  favorability: number
  categorySentiment: Record<CategoryKey, CategorySentiment>
}

function buildCategorySentiment(
  id: string,
  department: string,
): Record<CategoryKey, CategorySentiment> {
  return CATEGORY_KEYS.reduce<Record<CategoryKey, CategorySentiment>>((acc, key) => {
    acc[key] = sampleCategorySentiment(id, key, department)
    return acc
  }, {} as Record<CategoryKey, CategorySentiment>)
}

function deriveFavorability(categorySentiment: Record<CategoryKey, CategorySentiment>): number {
  const total = CATEGORY_KEYS.reduce(
    (sum, key) => sum + sentimentBucketScore(categorySentiment[key]),
    0,
  )
  return Math.round(total / CATEGORY_KEYS.length)
}

function createRespondent(input: {
  id: string
  department: string
  location: string
  level: string
  tenure: string
}): DashboardRespondent {
  const categorySentiment = buildCategorySentiment(input.id, input.department)
  return {
    ...input,
    categorySentiment,
    favorability: deriveFavorability(categorySentiment),
  }
}

export const mockDashboardRespondents: DashboardRespondent[] = mockEmployees
  .filter((employee) => employee.status === 'active' || employee.status === 'on_leave')
  .map((employee) =>
    createRespondent({
      id: employee.id,
      department: DEPARTMENT_MAP[employee.department] ?? employee.department,
      location: LOCATION_MAP[employee.location] ?? 'Remote',
      level: deriveLevel(employee.jobTitle),
      tenure: deriveTenure(employee.hireDate),
    }),
  )

/** Expand seed set so filtered combinations can meet anonymity threshold. */
for (let i = 0; i < 80; i += 1) {
  const field = DASHBOARD_FILTER_FIELDS[i % DASHBOARD_FILTER_FIELDS.length]
  const value = field.values[i % field.values.length]
  mockDashboardRespondents.push(
    createRespondent({
      id: `resp_synth_${i}`,
      department: field.id === 'department' ? value : 'Engineering',
      location: field.id === 'location' ? value : 'Remote',
      level: field.id === 'level' ? value : 'IC',
      tenure: field.id === 'tenure' ? value : '1–3 years',
    }),
  )
}

export const ANONYMITY_THRESHOLD = 5

export function activeFiltersToLabels(activeFilters: ActiveFilter[]): string[] {
  return activeFilters.map((filter) => `${filter.fieldLabel}: ${filter.value}`)
}

export function filterRespondents(activeFilters: ActiveFilter[]): DashboardRespondent[] {
  if (activeFilters.length === 0) return mockDashboardRespondents

  const byField = activeFilters.reduce<Record<string, string[]>>((acc, filter) => {
    acc[filter.fieldId] = acc[filter.fieldId] ?? []
    acc[filter.fieldId].push(filter.value)
    return acc
  }, {})

  return mockDashboardRespondents.filter((respondent) =>
    Object.entries(byField).every(([fieldId, values]) => {
      const fieldValue = respondent[fieldId as keyof DashboardRespondent]
      return values.includes(String(fieldValue))
    }),
  )
}

export function meetsAnonymityThreshold(activeFilters: ActiveFilter[]): boolean {
  if (activeFilters.length === 0) return true
  return filterRespondents(activeFilters).length >= ANONYMITY_THRESHOLD
}

export function averageFavorability(activeFilters: ActiveFilter[]): number {
  const respondents = filterRespondents(activeFilters)
  if (respondents.length === 0) return 0
  return Math.round(
    respondents.reduce((sum, respondent) => sum + respondent.favorability, 0) /
      respondents.length,
  )
}

export function respondentCount(activeFilters: ActiveFilter[]): number {
  return filterRespondents(activeFilters).length
}

function aggregateSentimentBuckets(respondents: DashboardRespondent[]) {
  let favorable = 0
  let neutral = 0
  let unfavorable = 0
  let total = 0

  for (const respondent of respondents) {
    for (const key of CATEGORY_KEYS) {
      total += 1
      const bucket = respondent.categorySentiment[key]
      if (bucket === 'favorable') favorable += 1
      else if (bucket === 'neutral') neutral += 1
      else unfavorable += 1
    }
  }

  if (total === 0) {
    return { favorable: 0, neutral: 0, unfavorable: 0 }
  }

  return {
    favorable: Math.round((favorable / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    unfavorable: Math.round((unfavorable / total) * 100),
  }
}

export function getFilteredCategorySentiment(
  activeFilters: ActiveFilter[],
  categoryKey: CategoryKey,
): { favorable: number; neutral: number; unfavorable: number; count: number } {
  const respondents = filterRespondents(activeFilters)
  const count = respondents.length

  if (count === 0) {
    return { favorable: 0, neutral: 0, unfavorable: 0, count: 0 }
  }

  let favorable = 0
  let neutral = 0
  let unfavorable = 0

  for (const respondent of respondents) {
    const bucket = respondent.categorySentiment[categoryKey]
    if (bucket === 'favorable') favorable += 1
    else if (bucket === 'neutral') neutral += 1
    else unfavorable += 1
  }

  return {
    favorable: Math.round((favorable / count) * 100),
    neutral: Math.round((neutral / count) * 100),
    unfavorable: Math.round((unfavorable / count) * 100),
    count,
  }
}

export function getDepartmentCategorySentiment(
  activeFilters: ActiveFilter[],
  department: string,
  categoryKey: CategoryKey,
): { favorable: number; neutral: number; unfavorable: number; count: number } {
  const withoutDepartment = activeFilters.filter((filter) => filter.fieldId !== 'department')
  const combinedFilters: ActiveFilter[] = [
    ...withoutDepartment,
    { fieldId: 'department', fieldLabel: 'Department', value: department },
  ]
  return getFilteredCategorySentiment(combinedFilters, categoryKey)
}

export function findWeakestDepartmentCategoryCell(activeFilters: ActiveFilter[]): {
  category: string
  department: string
  favorable: number
} | null {
  const departmentFilter = activeFilters.find((filter) => filter.fieldId === 'department')
  const departments = departmentFilter ? [departmentFilter.value] : [...HEATMAP_DEPARTMENTS]

  let weakest: { category: string; department: string; favorable: number } | null = null

  for (const categoryKey of CATEGORY_KEYS) {
    const categoryOverall =
      activeFilters.length > 0
        ? getFilteredCategorySentiment(activeFilters, categoryKey).favorable
        : CATEGORY_BASELINES[categoryKey].favorable

    for (const department of departments) {
      const sentiment = getDepartmentCategorySentiment(activeFilters, department, categoryKey)
      if (sentiment.count < ANONYMITY_THRESHOLD) continue
      if (sentiment.favorable > categoryOverall) continue

      if (!weakest || sentiment.favorable < weakest.favorable) {
        weakest = {
          category: CATEGORY_BASELINES[categoryKey].label,
          department,
          favorable: sentiment.favorable,
        }
      }
    }
  }

  return weakest
}

export function getFilteredSentiment(activeFilters: ActiveFilter[]) {
  const respondents = filterRespondents(activeFilters)
  const count = respondents.length

  if (count === 0) {
    return { favorable: 0, neutral: 0, unfavorable: 0, count: 0 }
  }

  if (activeFilters.length === 0) {
    const overall = buildCompanyOverallBaseline()
    return {
      favorable: overall.favorable,
      neutral: overall.neutral,
      unfavorable: overall.unfavorable,
      count,
    }
  }

  return { ...aggregateSentimentBuckets(respondents), count }
}

export function getFilteredENPS(activeFilters: ActiveFilter[]) {
  const { favorable, count } = getFilteredSentiment(activeFilters)
  const promoters = Math.max(0, Math.round(favorable * 0.15))
  const detractors = Math.max(0, Math.round((100 - favorable) * 0.7))
  const passives = Math.max(0, 100 - promoters - detractors)
  return {
    score: promoters - detractors,
    promoters,
    passives,
    detractors,
    respondents: count,
  }
}

export function getFilteredResponseRate(activeFilters: ActiveFilter[]) {
  const count = respondentCount(activeFilters)
  return {
    sent: count,
    completed: count,
    pending: 0,
    rate: count > 0 ? 100 : 0,
  }
}

export function buildFilteredScorecardMarkers(
  activeFilters: ActiveFilter[],
  baseMarkers: ScorecardMarker[],
): ScorecardMarker[] {
  const categoryMarkers = CATEGORY_KEYS.map((key) => {
    const sentiment = getFilteredCategorySentiment(activeFilters, key)
    const base = baseMarkers.find((marker) => marker.name === CATEGORY_BASELINES[key].label)!
    return {
      ...base,
      respondents: sentiment.count,
      favorable: sentiment.favorable,
      neutral: sentiment.neutral,
      unfavorable: sentiment.unfavorable,
      mean: meanFromSentimentPercentages(
        sentiment.favorable,
        sentiment.neutral,
        sentiment.unfavorable,
      ),
    }
  })

  const overall = computeWeightedCategoryAggregate(
    categoryMarkers.map((marker, index) => ({
      favorable: marker.favorable,
      neutral: marker.neutral,
      unfavorable: marker.unfavorable,
      mean: marker.mean,
      respondents: CATEGORY_BASELINES[CATEGORY_KEYS[index]].respondents,
    })),
  )

  const baseOverall = baseMarkers.find((marker) => marker.name === 'Company Overall')!
  const cohortCount = respondentCount(activeFilters)

  return [
    {
      ...baseOverall,
      respondents: cohortCount,
      favorable: overall.favorable,
      neutral: overall.neutral,
      unfavorable: overall.unfavorable,
      mean: overall.mean,
    },
    ...categoryMarkers,
  ]
}
