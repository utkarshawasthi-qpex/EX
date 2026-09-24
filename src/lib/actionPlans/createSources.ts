import { ENGAGEMENT_SURVEY_ID } from '@/data/mock/empowerIntegrationSeed'
import { getDashboardById, getDashboardTabs, getVisibleDashboards } from '@/lib/mockDb'
import type { AppUser } from '@/lib/userContext'

export type DashboardActionSource = {
  dashboardId: string
  label: string
  subtitle: string
  href: string
  isHome?: boolean
}

/** Map widget survey ids to EX store ids for category fallback. */
export function mapWidgetSurveyToExSurveyId(widgetSurveyId: string | undefined): string | null {
  if (!widgetSurveyId) return null
  if (widgetSurveyId.startsWith('surv_engagement')) return widgetSurveyId
  if (widgetSurveyId.includes('engagement')) return ENGAGEMENT_SURVEY_ID
  return widgetSurveyId
}

export function listDashboardSourcesForUser(user: AppUser): DashboardActionSource[] {
  return getVisibleDashboards(user).map((dashboard) => ({
    dashboardId: dashboard.id,
    label: dashboard.name,
    subtitle: dashboard.isHome
      ? 'Home dashboard'
      : `By ${dashboard.authorEmail.split('@')[0]?.replace('.', ' ') ?? dashboard.authorEmail}`,
    href: `/lifecycle/analytics/${dashboard.id}`,
    isHome: dashboard.isHome,
  }))
}

export function resolvePrimarySurveyIdForDashboard(dashboardId: string): string | null {
  for (const tab of getDashboardTabs(dashboardId)) {
    for (const widget of tab.widgets ?? []) {
      const mapped = mapWidgetSurveyToExSurveyId(widget.surveyId)
      if (mapped) return mapped
    }
  }
  if (getDashboardById(dashboardId)) return ENGAGEMENT_SURVEY_ID
  return null
}
