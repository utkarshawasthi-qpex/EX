import { ENGAGEMENT_SURVEY_SERIES_ID, SEED_SURVEY_DATA } from '@/data/mock/empowerIntegrationSeed'
import {
  build360InheritedLink,
  buildExInheritedLink,
} from '@/components/modules/analytics/CreateActionPlanModal'
import { aggregate, formatScopeLabel } from '@/lib/empowerIntegration/aggregate'
import type { SurveyLink, SurveyLinkFocus, SurveyLinkScope } from '@/types/empowerIntegration'
import type { SummaryAction } from '@/types'

function getEngagementSurvey() {
  return SEED_SURVEY_DATA.ex[ENGAGEMENT_SURVEY_SERIES_ID]
}

export function resolveDashboardScope(activeTab: 'company' | 'team', managerId: string): SurveyLinkScope {
  if (activeTab === 'company') return { kind: 'org' }
  return { kind: 'team', managerId }
}

export function inferFocusFromRecommendation(action: SummaryAction): SurveyLinkFocus {
  const text = `${action.action} ${action.context}`.toLowerCase()
  const survey = getEngagementSurvey()

  if (text.includes('growth') || text.includes('development') || text.includes('career')) {
    const cat = survey.categories.find((item) => item.id === 'cat_growth_dev')!
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('manager') || text.includes('1:1') || text.includes('feedback')) {
    const cat = survey.categories.find((item) => item.id === 'cat_manager_rel')!
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('wellbeing') || text.includes('burnout') || text.includes('balance')) {
    const cat = survey.categories.find((item) => item.id === 'cat_wellbeing')!
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('communicat') || text.includes('transparen')) {
    const cat = survey.categories.find((item) => item.id === 'cat_communication')!
    return { kind: 'category', id: cat.id, label: cat.label }
  }

  const cat = survey.categories[0]
  return { kind: 'category', id: cat.id, label: cat.label }
}

export function buildInheritedLinkForDashboard(
  activeTab: 'company' | 'team',
  managerId: string,
  action: SummaryAction,
): { link: SurveyLink; scopeLabel: string; meetsThreshold: boolean } {
  const scope = resolveDashboardScope(activeTab, managerId)
  const focus = inferFocusFromRecommendation(action)
  const survey = getEngagementSurvey()
  const result = aggregate(survey.id, focus, scope)

  const link = buildExInheritedLink(
    survey.id,
    survey.name,
    survey.cycleLabel,
    scope,
    focus,
    {
      favorability: result.scores.favorability,
      respondentCount: result.respondentCount,
      capturedAt: new Date().toISOString(),
      surveyStatus: survey.status,
    },
  )

  return {
    link,
    scopeLabel: formatScopeLabel(scope),
    meetsThreshold: result.meetsThreshold,
  }
}

export function build360LinkForCompetency(
  surveyId: string,
  competencyId: string,
): { link: SurveyLink; scopeLabel: string; meetsThreshold: boolean } | null {
  const survey = SEED_SURVEY_DATA.surveys360[surveyId]
  if (!survey) return null

  const focus: SurveyLinkFocus = {
    kind: 'competency',
    id: competencyId,
    label: survey.competencies.find((item) => item.id === competencyId)?.label ?? competencyId,
  }

  const result = aggregate(surveyId, focus, { kind: 'org' })
  const link = build360InheritedLink(survey.id, survey.name, survey.cycleLabel, focus, {
    selfScore: result.scores.selfScore,
    othersAvg: result.scores.othersAvg,
    gap: result.scores.gap,
    respondentCount: result.respondentCount,
    capturedAt: new Date().toISOString(),
    surveyStatus: survey.status,
  })

  return {
    link,
    scopeLabel: 'Individual (360)',
    meetsThreshold: result.meetsThreshold,
  }
}
