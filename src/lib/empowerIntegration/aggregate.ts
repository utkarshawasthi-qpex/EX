import type {
  AggregateResult,
  ExCategoryAggregate,
  ExSurveyDataset,
  SurveyLinkFocus,
  SurveyLinkScope,
} from '@/types/empowerIntegration'
import { getSurveyDataStore } from '@/lib/empowerIntegration/storage'

export const EX_THRESHOLD = 5

function resolveCategories(
  dataset: ExSurveyDataset,
  scope: SurveyLinkScope,
): { categories: ExCategoryAggregate[]; respondentCount: number } | null {
  if (scope.kind === 'org') {
    return { categories: dataset.categories, respondentCount: dataset.orgRespondentCount }
  }

  if (scope.kind === 'team' && scope.managerId) {
    const team = dataset.teamScopes[scope.managerId]
    if (!team) return null
    return { categories: team.categories, respondentCount: team.respondentCount }
  }

  if (scope.kind === 'filter' && scope.filters) {
    const managerId = Object.values(scope.filters).length ? 'emp_002' : undefined
    const filterKey = scope.filters.department ?? Object.values(scope.filters)[0]
    if (managerId && filterKey) {
      const team = dataset.teamScopes[managerId]
      const filtered = team?.filterScopes?.[filterKey]
      if (filtered) {
        return { categories: filtered.categories, respondentCount: filtered.respondentCount }
      }
    }
    return { categories: dataset.categories, respondentCount: dataset.orgRespondentCount }
  }

  return null
}

export function aggregate(
  surveyId: string,
  focus: SurveyLinkFocus,
  scope: SurveyLinkScope,
  options?: { includeHidden?: boolean },
): AggregateResult {
  const store = getSurveyDataStore()
  const dataset = store.ex[surveyId]
  if (!dataset || (dataset.hidden && !options?.includeHidden)) {
    return { respondentCount: 0, meetsThreshold: false }
  }

  const resolved = resolveCategories(dataset, scope)
  if (!resolved) return { respondentCount: 0, meetsThreshold: false }

  let favorability: number | undefined
  let respondentCount = resolved.respondentCount

  if (focus.kind === 'category') {
    const cat = resolved.categories.find((item) => item.id === focus.id)
    if (!cat) return { respondentCount: 0, meetsThreshold: false }
    favorability = cat.favorability
    respondentCount = cat.respondentCount
  } else {
    for (const cat of resolved.categories) {
      const question = cat.questions?.find((item) => item.id === focus.id)
      if (question) {
        favorability = question.favorability
        respondentCount = question.respondentCount
        break
      }
    }
    if (favorability === undefined) return { respondentCount: 0, meetsThreshold: false }
  }

  const meetsThreshold = respondentCount >= EX_THRESHOLD
  return {
    favorability: meetsThreshold ? favorability : undefined,
    respondentCount,
    meetsThreshold,
  }
}

export function formatScopeLabel(scope: SurveyLinkScope): string {
  if (scope.kind === 'org') return 'Organization'
  if (scope.kind === 'team') return 'My Team'
  const parts = Object.entries(scope.filters).map(([k, v]) => `${k}: ${v}`)
  return parts.join(', ') || 'Custom filter'
}

export function getExCategoriesForScope(
  surveyId: string,
  scope: SurveyLinkScope,
): ExCategoryAggregate[] {
  const store = getSurveyDataStore()
  const dataset = store.ex[surveyId]
  if (!dataset) return []
  return resolveCategories(dataset, scope)?.categories ?? []
}

export function listAccessibleExSurveys(includeLive = true): ExSurveyDataset[] {
  return Object.values(getSurveyDataStore().ex).filter((survey) => {
    if (survey.hidden) return false
    if (!includeLive && survey.status === 'live') return false
    return true
  })
}

export function getSurveyDataset(surveyId: string): ExSurveyDataset | undefined {
  return getSurveyDataStore().ex[surveyId]
}
