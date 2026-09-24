import type { DriverMetricKind } from '@/lib/dashboardFilters'
import type { SurveyLinkFocus } from '@/types/empowerIntegration'

export type TakeActionFocus = {
  label: string
  focus: SurveyLinkFocus
  favorability?: number
  surveyName?: string
  cycleLabel?: string
  dashboardId?: string
  dashboardName?: string
}

export function takeActionFocusFromDriver(
  metricId: string,
  label: string,
  kind: DriverMetricKind,
  favorability: number,
  surveyName?: string,
): TakeActionFocus {
  const focusKind =
    kind === 'buildingBlock' ? 'block' : kind === 'marker' ? 'marker' : 'question'
  return {
    label,
    favorability,
    surveyName,
    focus: { kind: focusKind, id: metricId, label },
  }
}
