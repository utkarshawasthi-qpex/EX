import {
  DEMO_WIDGET_IDS,
  ENGAGEMENT_SURVEY_ID,
  WELLBEING_SURVEY_ID,
} from '@/data/mock/empowerIntegrationSeed'
import { aggregate, formatScopeLabel } from '@/lib/empowerIntegration/aggregate'
import { getSurveyDataset } from '@/lib/empowerIntegration/aggregate'
import type {
  SurveyLink,
  SurveyLinkCandidate,
  SurveyLinkFocus,
  SurveyLinkScope,
} from '@/types/empowerIntegration'
import type { DashboardWidget, SummaryAction } from '@/types'

export function resolveDashboardScope(
  activeTab: 'company' | 'team',
  managerId: string,
): SurveyLinkScope {
  if (activeTab === 'company') return { kind: 'org' }
  return { kind: 'team', managerId }
}

export function scopeFromWidget(
  widget: DashboardWidget,
  tabScope: SurveyLinkScope,
): SurveyLinkScope {
  if (widget.appliedFilters && Object.keys(widget.appliedFilters).length > 0) {
    return { kind: 'filter', filters: widget.appliedFilters }
  }
  return tabScope
}

export function inferFocusFromAction(action: SummaryAction, surveyId: string): SurveyLinkFocus {
  const text = `${action.action} ${action.context}`.toLowerCase()
  const dataset = getSurveyDataset(surveyId)
  const categories = dataset?.categories ?? []

  if (text.includes('growth') || text.includes('development')) {
    const cat = categories.find((c) => c.id === 'cat_growth_dev') ?? categories[0]
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('manager') || text.includes('communication') || text.includes('cadence')) {
    const cat = categories.find((c) => c.id === 'cat_communication' || c.id === 'cat_manager_rel') ?? categories[0]
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('wellbeing') || text.includes('burnout')) {
    const cat = categories.find((c) => c.id === 'cat_wellbeing') ?? categories[0]
    return { kind: 'category', id: cat.id, label: cat.label }
  }
  if (text.includes('enablement') || text.includes('technology')) {
    const cat = categories.find((c) => c.id === 'cat_wellbeing') ?? categories[0]
    return { kind: 'category', id: cat.id, label: cat.label }
  }

  const cat = categories[0]
  return { kind: 'category', id: cat.id, label: cat.label }
}

export function buildSurveyLinkFromWidget(
  widget: DashboardWidget,
  tabScope: SurveyLinkScope,
  focus: SurveyLinkFocus,
): { link: SurveyLink | null; meetsThreshold: boolean } {
  const surveySource = widget.surveySource
  if (!surveySource) return { link: null, meetsThreshold: false }

  const scope = scopeFromWidget(widget, tabScope)
  const result = aggregate(surveySource.surveyId, focus, scope)
  const dataset = getSurveyDataset(surveySource.surveyId)

  if (!result.meetsThreshold || !dataset) {
    return { link: null, meetsThreshold: false }
  }

  return {
    meetsThreshold: true,
    link: {
      surveyId: surveySource.surveyId,
      surveyName: surveySource.surveyName,
      cycleLabel: dataset.cycleLabel,
      scope,
      focus,
      baseline: {
        favorability: result.favorability,
        respondentCount: result.respondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: dataset.status,
      },
      latest: null,
    },
  }
}

/** Demo mapping: which widget(s) each recommendation priority resolves from */
export function getSourceWidgetIdsForAction(
  action: SummaryAction,
  widgets: DashboardWidget[],
): string[] {
  const hasDemoWidgets = widgets.some((w) => w.id === DEMO_WIDGET_IDS.engagementScorecard)
  if (hasDemoWidgets && action.priority === 2) {
    return [DEMO_WIDGET_IDS.engagementScorecard, DEMO_WIDGET_IDS.wellbeingHeatmap]
  }
  if (hasDemoWidgets) {
    return [DEMO_WIDGET_IDS.engagementScorecard]
  }

  const scorecard = widgets.find((w) => w.type === 'scorecard' && w.surveySource)
  if (scorecard) return [scorecard.id]
  const heatmap = widgets.find((w) => w.type === 'heatmap' && w.surveySource)
  if (heatmap) return [heatmap.id]
  return []
}

export function resolveLinkCandidates(
  sourceWidgetIds: string[],
  widgets: DashboardWidget[],
  tabScope: SurveyLinkScope,
  action: SummaryAction,
): SurveyLinkCandidate[] {
  const widgetMap = new Map(widgets.map((w) => [w.id, w]))
  const uniqueSurveyIds = new Set<string>()

  return sourceWidgetIds
    .map((widgetId) => {
      const widget = widgetMap.get(widgetId)
      if (!widget?.surveySource) return null
      uniqueSurveyIds.add(widget.surveySource.surveyId)
      const focus = inferFocusFromAction(action, widget.surveySource.surveyId)
      const { link, meetsThreshold } = buildSurveyLinkFromWidget(widget, tabScope, focus)
      if (!link) return null
      return {
        widgetId,
        label: `${widget.surveySource.surveyName} · ${focus.label} · ${formatScopeLabel(link.scope)} · ${link.baseline.favorability}% (${link.baseline.respondentCount} responses)`,
        link,
        meetsThreshold,
      }
    })
    .filter((item): item is SurveyLinkCandidate => item !== null && item.meetsThreshold)
}

export function resolveSurveyLinkForAction(
  sourceWidgetIds: string[],
  widgets: DashboardWidget[],
  tabScope: SurveyLinkScope,
  action: SummaryAction,
): { type: 'auto'; link: SurveyLink } | { type: 'confirm'; candidates: SurveyLinkCandidate[] } | { type: 'none' } {
  if (sourceWidgetIds.length === 0) return { type: 'none' }

  const candidates = resolveLinkCandidates(sourceWidgetIds, widgets, tabScope, action)
  if (candidates.length === 0) return { type: 'none' }

  const surveyIds = new Set(candidates.map((c) => c.link.surveyId))
  if (surveyIds.size > 1 || sourceWidgetIds.length > 1) {
    return { type: 'confirm', candidates }
  }

  return { type: 'auto', link: candidates[0].link }
}

export function buildInheritedLinkBlock(link: SurveyLink): string {
  return `Linked to: ${link.surveyName} · ${link.focus.label} · ${formatScopeLabel(link.scope)} · Baseline ${link.baseline.favorability}% (${link.baseline.respondentCount} responses)`
}
