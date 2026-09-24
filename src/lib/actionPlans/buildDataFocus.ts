import type { DashboardActionSource } from '@/lib/actionPlans/createSources'
import type { SurveyFocusOption } from '@/lib/actionPlans/surveyFocusAreas'
import type { TakeActionFocus } from '@/lib/actionPlans/takeAction'
import type { ActionPlanDataFocus, SurveyLink } from '@/types/empowerIntegration'

export function dataFocusFromTakeAction(
  focus: TakeActionFocus,
  source: ActionPlanDataFocus['source'] = 'dashboard',
): ActionPlanDataFocus {
  return {
    label: focus.label,
    surveyName: focus.surveyName,
    cycleLabel: focus.cycleLabel,
    favorability: focus.favorability,
    capturedAt: new Date().toISOString(),
    source,
    dashboardId: focus.dashboardId,
    dashboardName: focus.dashboardName,
  }
}

export function dataFocusFromDashboardFocus(
  option: SurveyFocusOption,
  dashboard: DashboardActionSource,
): ActionPlanDataFocus {
  return {
    label: option.label,
    surveyName: option.surveyName,
    cycleLabel: option.cycleLabel,
    favorability: option.favorability,
    capturedAt: new Date().toISOString(),
    source: 'dashboard',
    dashboardId: dashboard.dashboardId,
    dashboardName: dashboard.label,
  }
}

/** @deprecated Use dataFocusFromDashboardFocus for wizard flow. */
export function dataFocusFromSurveyOption(option: SurveyFocusOption): ActionPlanDataFocus {
  return {
    label: option.label,
    surveyName: option.surveyName,
    cycleLabel: option.cycleLabel,
    favorability: option.favorability,
    capturedAt: new Date().toISOString(),
    source: 'survey',
  }
}

export function dataFocusFromSurveyLink(
  link: SurveyLink,
  source: ActionPlanDataFocus['source'] = 'summary',
): ActionPlanDataFocus {
  return {
    label: link.focus.label,
    surveyName: link.surveyName,
    cycleLabel: link.cycleLabel,
    favorability: link.baseline.favorability,
    capturedAt: new Date().toISOString(),
    source,
  }
}
