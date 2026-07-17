import type { Dashboard, DashboardWidget } from '@/types'
import { buildSummaryContent, normalizeActionsFromApi } from '@/lib/summaryContent'
import {
  DEMO_WIDGET_IDS,
  ENGAGEMENT_SURVEY_ID,
  WELLBEING_SURVEY_ID,
} from '@/data/mock/empowerIntegrationSeed'

const multiSurveyDemoSummary = buildSummaryContent(
  'Engagement 2026 shows Growth & Development as the clearest gap at 58% favorable company-wide, and lower still for your team at 52%. That means about half of people do not feel they have a clear path to learn or advance. Manager Relationship is a genuine strength at 82%, so the issue is not day-to-day management trust — it is development and progression. Communication sits in between at 64%, and Wellbeing on the annual survey is 71%. Separately, Wellbeing Pulse Q3 is still collecting responses; the Sales-filtered heatmap already shows localized risk at 61% favorable, which is weaker than the company wellbeing picture. Put together, managers should double down on growth conversations with their teams, while HR watches Sales wellbeing closely as the pulse closes. Protecting the strong manager relationship scores while fixing growth and Sales wellbeing will give the clearest lift.',
  normalizeActionsFromApi([
    {
      action: 'Hold a dedicated growth 1:1 with each direct report this month and agree on one skill goal and one stretch task.',
      timeframe: '30 days',
      owner: 'Manager',
      context: 'Targets Growth & Development (58%)',
    },
    {
      action: 'Meet with Sales managers to review pulse wellbeing themes and offer two concrete support options within 60 days.',
      timeframe: '60 days',
      owner: 'HR',
      context: 'Targets Wellbeing · Sales (61%)',
    },
    {
      action: 'Publish a short monthly update from leadership covering decisions, priorities, and open questions from employees.',
      timeframe: '60 days',
      owner: 'Leadership',
      context: 'Targets Communication (64%)',
    },
    {
      action: 'After growth plans are underway, check Growth & Development scores again in the next pulse and share results with managers.',
      timeframe: '90 days',
      owner: 'Manager',
      context: 'Validates improvement impact',
    },
  ]),
  'emp_001',
)
multiSurveyDemoSummary.generatedAt = '2026-05-20T10:30:00.000Z'
multiSurveyDemoSummary.lastFullUpdateAt = '2026-05-20T10:30:00.000Z'

export const DEFAULT_DASHBOARD_ID = 'dash_default'
export const MULTI_SURVEY_DASHBOARD_ID = 'dash_multi_survey'
export const ACTIVE_DASHBOARD_STORAGE_KEY = 'pp_active_dashboard'
export const DASHBOARDS_STORAGE_KEY = 'pp_dashboards'

export function createDefaultSeedDashboard(): Dashboard {
  return {
    id: DEFAULT_DASHBOARD_ID,
    name: 'Demo Dashboard',
    access: 'global',
    authorEmail: 'sarah.johnson@questionpro.com',
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: 'tab_1',
        name: 'Overview',
        order: 1,
        widgets: [],
      },
    ],
  }
}

function createMultiSurveyDemoDashboard(): Dashboard {
  const widgets: DashboardWidget[] = [
    {
      id: DEMO_WIDGET_IDS.engagementScorecard,
      type: 'scorecard',
      title: 'Engagement Scorecard',
      width: 'full',
      order: 1,
      surveyId: ENGAGEMENT_SURVEY_ID,
      surveySource: {
        surveyId: ENGAGEMENT_SURVEY_ID,
        surveyName: 'Engagement 2026',
        surveyType: 'ex',
        surveyCycleYear: '2026',
      },
    },
    {
      id: DEMO_WIDGET_IDS.wellbeingHeatmap,
      type: 'heatmap',
      title: 'Wellbeing Heatmap — Sales',
      width: 'full',
      order: 2,
      surveyId: WELLBEING_SURVEY_ID,
      surveySource: {
        surveyId: WELLBEING_SURVEY_ID,
        surveyName: 'Wellbeing Pulse Q3',
        surveyType: 'ex',
        surveyCycleYear: '2026',
      },
      appliedFilters: { department: 'Sales' },
    },
    {
      id: DEMO_WIDGET_IDS.summary,
      type: 'summary',
      title: 'Summary & Recommendations',
      width: 'full',
      order: 3,
      surveyId: ENGAGEMENT_SURVEY_ID,
      summaryConfig: {
        visibility: 'everyone',
        allowEmployeeSummaries: true,
        createdBy: 'emp_001',
        isGenerating: false,
        companyContent: multiSurveyDemoSummary,
      },
    },
  ]

  return {
    id: MULTI_SURVEY_DASHBOARD_ID,
    name: 'Engagement Insights',
    access: 'global',
    isHome: true,
    authorEmail: 'sarah.johnson@questionpro.com',
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: 'tab_multi_demo',
        name: 'Multi-survey demo',
        order: 1,
        widgets,
      },
    ],
  }
}

/** Seed localStorage when no dashboards exist (fresh / incognito production load). */
export function seedDefaultDashboardsIfNeeded(): void {
  if (typeof window === 'undefined') return

  try {
    const existing = window.localStorage.getItem(DASHBOARDS_STORAGE_KEY)
    if (existing) {
      const parsed = JSON.parse(existing) as Dashboard[]
      if (Array.isArray(parsed) && parsed.length > 0) return
    }

    const multiSurvey = createMultiSurveyDemoDashboard()
    window.localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify([multiSurvey]))
    window.localStorage.setItem(ACTIVE_DASHBOARD_STORAGE_KEY, MULTI_SURVEY_DASHBOARD_ID)
  } catch (err) {
    console.error('Failed to seed default dashboards:', err)
  }
}
