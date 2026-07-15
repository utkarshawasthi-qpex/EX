import { mockEmployees } from '@/data/mock/employees'
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

export type DashboardRespondent = {
  id: string
  department: string
  location: string
  level: string
  tenure: string
  favorability: number
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const mockDashboardRespondents: DashboardRespondent[] = mockEmployees
  .filter((employee) => employee.status === 'active' || employee.status === 'on_leave')
  .map((employee, index) => ({
    id: employee.id,
    department: DEPARTMENT_MAP[employee.department] ?? employee.department,
    location: LOCATION_MAP[employee.location] ?? 'Remote',
    level: deriveLevel(employee.jobTitle),
    tenure: deriveTenure(employee.hireDate),
    favorability: 35 + (hashString(employee.id) % 45),
  }))

/** Expand seed set so filtered combinations can meet anonymity threshold. */
for (let i = 0; i < 80; i += 1) {
  const field = DASHBOARD_FILTER_FIELDS[i % DASHBOARD_FILTER_FIELDS.length]
  const value = field.values[i % field.values.length]
  mockDashboardRespondents.push({
    id: `resp_synth_${i}`,
    department: field.id === 'department' ? value : 'Engineering',
    location: field.id === 'location' ? value : 'Remote',
    level: field.id === 'level' ? value : 'IC',
    tenure: field.id === 'tenure' ? value : '1–3 years',
    favorability: 40 + (i % 35),
  })
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

export function getFilteredSentiment(activeFilters: ActiveFilter[]) {
  const count = respondentCount(activeFilters)
  if (activeFilters.length === 0) {
    return { favorable: 40, neutral: 20, unfavorable: 40, count: mockDashboardRespondents.length }
  }

  const avg = averageFavorability(activeFilters)
  const favorable = Math.max(0, Math.min(95, Math.round(avg)))
  const unfavorable = Math.max(0, Math.min(95, Math.round(100 - avg - 12)))
  const neutral = Math.max(0, 100 - favorable - unfavorable)
  return { favorable, neutral, unfavorable, count }
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
