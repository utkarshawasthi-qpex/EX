import type {
  AggregateResult,
  ExCategoryAggregate,
  ExSurveyDataset,
  Survey360Dataset,
  SurveyLinkFocus,
  SurveyLinkScope,
} from '@/types/empowerIntegration'
import { getSurveyDataStore } from '@/lib/empowerIntegration/storage'

const EX_THRESHOLD = 5
const RATER_GROUP_THRESHOLD = 3

function getExCategory(
  dataset: ExSurveyDataset,
  focus: SurveyLinkFocus,
  scope: SurveyLinkScope,
): { favorability: number; respondentCount: number } | null {
  const categories =
    scope.kind === 'team' && scope.managerId
      ? dataset.teamScopes[scope.managerId]?.categories
      : dataset.categories

  const respondentCount =
    scope.kind === 'team' && scope.managerId
      ? (dataset.teamScopes[scope.managerId]?.respondentCount ?? 0)
      : dataset.orgRespondentCount

  if (!categories) return null

  if (focus.kind === 'category') {
    const cat = categories.find((item) => item.id === focus.id)
    if (!cat) return null
    return { favorability: cat.favorability, respondentCount: cat.respondentCount }
  }

  if (focus.kind === 'question') {
    for (const cat of categories) {
      const question = cat.questions?.find((item) => item.id === focus.id)
      if (question) {
        return { favorability: question.favorability, respondentCount: question.respondentCount }
      }
    }
    return null
  }

  return null
}

function compute360OthersAvg(comp: Survey360Dataset['competencies'][0]): {
  othersAvg: number | null
  respondentCount: number
} {
  const groups: Array<'manager' | 'peers' | 'directReports'> = ['manager', 'peers', 'directReports']
  const validScores: number[] = []
  let totalRaters = 0

  for (const group of groups) {
    const count = comp.scores.respondentCounts[group] ?? 0
    const score = comp.scores[group]
    if (count >= RATER_GROUP_THRESHOLD && score !== undefined) {
      validScores.push(score)
      totalRaters += count
    }
  }

  if (validScores.length === 0) {
    return { othersAvg: null, respondentCount: comp.totalRaters }
  }

  return {
    othersAvg: Math.round((validScores.reduce((sum, value) => sum + value, 0) / validScores.length) * 10) / 10,
    respondentCount: totalRaters,
  }
}

export function aggregate(
  surveyId: string,
  focus: SurveyLinkFocus,
  scope: SurveyLinkScope,
): AggregateResult {
  const store = getSurveyDataStore()
  const exDataset = store.ex[surveyId]

  if (exDataset && !exDataset.hidden) {
    const result = getExCategory(exDataset, focus, scope)
    if (!result) {
      return {
        scores: { respondentCount: 0, capturedAt: new Date().toISOString(), surveyStatus: exDataset.status },
        respondentCount: 0,
        meetsThreshold: false,
      }
    }

    const meetsThreshold = result.respondentCount >= EX_THRESHOLD
    return {
      scores: {
        favorability: meetsThreshold ? result.favorability : undefined,
        respondentCount: result.respondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: exDataset.status,
      },
      respondentCount: result.respondentCount,
      meetsThreshold,
    }
  }

  const dataset360 = store.surveys360[surveyId]
  if (dataset360 && focus.kind === 'competency') {
    const comp = dataset360.competencies.find((item) => item.id === focus.id)
    if (!comp) {
      return {
        scores: { respondentCount: 0, capturedAt: new Date().toISOString(), surveyStatus: dataset360.status },
        respondentCount: 0,
        meetsThreshold: false,
      }
    }

    const { othersAvg, respondentCount } = compute360OthersAvg(comp)
    const selfScore = comp.scores.self
    const meetsThreshold = respondentCount >= RATER_GROUP_THRESHOLD && othersAvg !== null

    return {
      scores: {
        selfScore,
        othersAvg: meetsThreshold ? othersAvg ?? undefined : undefined,
        gap:
          meetsThreshold && selfScore !== undefined && othersAvg !== null
            ? Math.round((othersAvg - selfScore) * 10) / 10
            : undefined,
        respondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: dataset360.status,
      },
      respondentCount,
      meetsThreshold,
    }
  }

  return {
    scores: { respondentCount: 0, capturedAt: new Date().toISOString(), surveyStatus: 'closed' },
    respondentCount: 0,
    meetsThreshold: false,
  }
}

export function aggregateHiddenSurvey(
  surveyId: string,
  focus: SurveyLinkFocus,
  scope: SurveyLinkScope,
): AggregateResult {
  const store = getSurveyDataStore()
  const exDataset = store.ex[surveyId]
  if (!exDataset) {
    return aggregate(surveyId, focus, scope)
  }

  const result = getExCategory(exDataset, focus, scope)
  if (!result) {
    return {
      scores: { respondentCount: 0, capturedAt: new Date().toISOString(), surveyStatus: exDataset.status },
      respondentCount: 0,
      meetsThreshold: false,
    }
  }

  const meetsThreshold = result.respondentCount >= EX_THRESHOLD
  return {
    scores: {
      favorability: meetsThreshold ? result.favorability : undefined,
      respondentCount: result.respondentCount,
      capturedAt: new Date().toISOString(),
      surveyStatus: exDataset.status,
    },
    respondentCount: result.respondentCount,
    meetsThreshold,
  }
}

export function listAccessibleExSurveys(options: {
  includeHidden?: boolean
  includeLive?: boolean
}): ExSurveyDataset[] {
  const store = getSurveyDataStore()
  return Object.values(store.ex).filter((survey) => {
    if (survey.hidden && !options.includeHidden) return false
    if (survey.status === 'live' && options.includeLive === false) return false
    return true
  })
}

export function listAccessible360Surveys(subjectId?: string): Survey360Dataset[] {
  const store = getSurveyDataStore()
  return Object.values(store.surveys360).filter((survey) => {
    if (subjectId) return survey.subjectId === subjectId
    return true
  })
}

export function getExCategoriesForScope(
  surveyId: string,
  scope: SurveyLinkScope,
): ExCategoryAggregate[] {
  const store = getSurveyDataStore()
  const dataset = store.ex[surveyId]
  if (!dataset) return []

  if (scope.kind === 'team' && scope.managerId) {
    return dataset.teamScopes[scope.managerId]?.categories ?? []
  }

  return dataset.categories
}

export function formatScopeLabel(scope: SurveyLinkScope): string {
  if (scope.kind === 'org') return 'Organization'
  if (scope.kind === 'team') return 'My Team'
  if (scope.kind === 'filter') {
    const parts = Object.entries(scope.filters).map(([key, value]) => `${key}: ${value}`)
    return parts.join(', ') || 'Custom filter'
  }
  return 'Unknown scope'
}

export { EX_THRESHOLD, RATER_GROUP_THRESHOLD }
