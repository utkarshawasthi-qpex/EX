import { buildScorecardMarkers } from '@/data/mock/categorySentimentData'
import {
  mapWidgetSurveyToExSurveyId,
  resolvePrimarySurveyIdForDashboard,
} from '@/lib/actionPlans/createSources'
import {
  listFocusAreasForSurvey,
  type SurveyFocusOption,
} from '@/lib/actionPlans/surveyFocusAreas'
import { getDashboardTabs } from '@/lib/mockDb'
import {
  getDriverImpact,
  getMetricFavorability,
  MIN_DRIVER_PLOT_POINTS,
  resolveItemsAtLevel,
  STATIC_IMPACT_THRESHOLD,
  STATIC_PERFORMANCE_THRESHOLD,
} from '@/lib/dashboardFilters'

const WEAK_FAVORABLE_THRESHOLD = 75

function getQuadrantLabel(performance: number, impact: number): string {
  const highImpact = impact >= STATIC_IMPACT_THRESHOLD
  const highPerf = performance >= STATIC_PERFORMANCE_THRESHOLD
  if (!highPerf && highImpact) return 'Priority focus'
  return 'Other'
}

function focusFromScorecardWidgets(dashboardId: string, surveyId: string): SurveyFocusOption[] {
  const tabs = getDashboardTabs(dashboardId)
  const hasScorecard = tabs.some((tab) =>
    (tab.widgets ?? []).some((w) => w.type === 'scorecard'),
  )
  if (!hasScorecard) return []

  const survey = listFocusAreasForSurvey(surveyId, 1)[0]
  const surveyName = survey?.surveyName ?? 'Dashboard survey'
  const cycleLabel = survey?.cycleLabel ?? ''

  return buildScorecardMarkers()
    .filter(
      (marker) =>
        marker.name !== 'Company Overall' && marker.favorable < WEAK_FAVORABLE_THRESHOLD,
    )
    .map((marker) => ({
      id: `${dashboardId}:marker:${marker.name}`,
      surveyId,
      surveyName,
      cycleLabel,
      categoryId: marker.name,
      label: marker.name,
      favorability: marker.favorable,
    }))
}

function focusFromDriverWidgets(dashboardId: string, surveyId: string): SurveyFocusOption[] {
  const tabs = getDashboardTabs(dashboardId)
  const surveyMeta = listFocusAreasForSurvey(surveyId, 1)[0]
  const surveyName = surveyMeta?.surveyName ?? 'Dashboard survey'
  const cycleLabel = surveyMeta?.cycleLabel ?? ''
  const options: SurveyFocusOption[] = []

  for (const tab of tabs) {
    for (const widget of tab.widgets ?? []) {
      if (widget.type !== 'driver_analysis') continue
      const config = widget.config as
        | { outcomeMetricId?: string; driverMetricIds?: string[] }
        | undefined
      const outcomeId = config?.outcomeMetricId
      const driverIds = config?.driverMetricIds ?? []
      if (!outcomeId || driverIds.length < MIN_DRIVER_PLOT_POINTS) continue

      for (const level of ['marker', 'buildingBlock', 'question'] as const) {
        const items = resolveItemsAtLevel(level, driverIds)
        for (const item of items) {
          const performance = getMetricFavorability(item.id, item.kind, [])
          const impact = getDriverImpact(item.id, outcomeId, [])
          if (getQuadrantLabel(performance, impact) !== 'Priority focus') continue
          options.push({
            id: `${dashboardId}:driver:${item.id}`,
            surveyId,
            surveyName,
            cycleLabel,
            categoryId: item.id,
            label: item.label,
            favorability: Math.round(performance),
          })
        }
      }
    }
  }

  return options
}

/** Focus topics from dashboard widgets (weak scorecard + driver priority), then survey categories. */
export function listFocusAreasForDashboard(dashboardId: string, limit = 10): SurveyFocusOption[] {
  const surveyId = resolvePrimarySurveyIdForDashboard(dashboardId)
  if (!surveyId) return []

  const fromWidgets = [
    ...focusFromScorecardWidgets(dashboardId, surveyId),
    ...focusFromDriverWidgets(dashboardId, surveyId),
  ]

  const seen = new Set<string>()
  const merged: SurveyFocusOption[] = []
  for (const option of fromWidgets) {
    const key = option.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(option)
  }

  if (merged.length >= 3) {
    return merged.sort((a, b) => a.favorability - b.favorability).slice(0, limit)
  }

  for (const option of listFocusAreasForSurvey(surveyId, limit)) {
    const key = option.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push({
      ...option,
      id: `${dashboardId}:cat:${option.categoryId}`,
    })
  }

  return merged.sort((a, b) => a.favorability - b.favorability).slice(0, limit)
}
