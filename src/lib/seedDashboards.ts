import type { Dashboard, DashboardWidget } from '@/types'
import { buildSummaryContent, normalizeActionsFromApi } from '@/lib/summaryContent'
import {
  DEMO_WIDGET_IDS,
  ENGAGEMENT_SURVEY_ID,
  WELLBEING_SURVEY_ID,
} from '@/data/mock/empowerIntegrationSeed'

const multiSurveyDemoSummary = buildSummaryContent(
  'Engagement 2026 shows Growth & Development at 58% organization-wide (52% for your team), while Manager Relationship leads at 82%. Wellbeing Pulse Q3 is still collecting; Sales-filtered heatmap data flags localized wellbeing risk at 61% favorability.',
  normalizeActionsFromApi([
    {
      action: 'Schedule monthly growth-focused 1:1s with each direct report.',
      timeframe: '30 days',
      owner: 'Manager',
      context: 'Growth & Development (58%)',
    },
    {
      action: 'Align wellbeing support with Sales team feedback from pulse survey.',
      timeframe: '60 days',
      owner: 'HR',
      context: 'Cross-survey synthesis: Engagement scorecard + Wellbeing heatmap (Sales)',
    },
    {
      action: 'Publish a communication cadence for manager relationship improvements.',
      timeframe: '60 days',
      owner: 'Leadership',
      context: 'Manager Relationship (82%)',
    },
    {
      action: 'Re-measure Growth & Development after action plans are in place.',
      timeframe: '90 days',
      owner: 'Manager',
      context: 'Validates improvement impact',
    },
  ]),
  'emp_001',
  'SCORECARD: Growth & Development 58%, Manager Relationship 82%. HEATMAP: Wellbeing Sales 61%.',
)
multiSurveyDemoSummary.summaryVersions[0].generatedAt = '2026-05-20T10:30:00.000Z'
multiSurveyDemoSummary.publishedVersionId = multiSurveyDemoSummary.summaryVersions[0].versionId
for (const priority of [1, 2, 3, 4] as const) {
  if (multiSurveyDemoSummary.actionVersions[priority][0]) {
    multiSurveyDemoSummary.actionVersions[priority][0].generatedAt = '2026-05-20T10:30:00.000Z'
  }
}

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
