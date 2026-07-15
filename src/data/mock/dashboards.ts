import type { Dashboard, DashboardWidget, WidgetType } from '@/types'
import { buildSummaryContent, normalizeActionsFromApi } from '@/lib/summaryContent'

const pptDemoSummary = buildSummaryContent(
  'Organization-wide favorability remains soft at 40%, with transparency and technology among the lowest-performing markers while eNPS continues to reflect a detractor-heavy profile compared to prior cycles. Employees appear to lack consistent visibility into organizational priorities, and survey commentary repeatedly points to friction in systems, process clarity, and follow-through after prior feedback cycles. Heatmap results show uneven performance across departments, with enablement and agility lagging collaboration improvements that emerged in the most recent quarter. Response rates remain healthy enough to treat these patterns as representative, but localized teams report sharper declines in manager communication cadence. Organization context suggests recent structural changes have outpaced leadership messaging rhythms, leaving managers without sufficient support to translate employee input into visible action plans that rebuild trust and demonstrate measurable progress.',
  normalizeActionsFromApi([
    {
      action: 'Launch a leadership communication cadence explaining priorities and progress.',
      timeframe: '30 days',
      owner: 'Leadership',
      context: 'Targets transparency (54)',
    },
    {
      action: 'Identify the top three technology blockers and assign owners for resolution.',
      timeframe: '60 days',
      owner: 'HR',
      context: 'Addresses enablement (58)',
    },
    {
      action: 'Publish a dashboard action tracker tied to the lowest-scoring markers.',
      timeframe: '60 days',
      owner: 'Manager',
      context: 'Tracks progress over time',
    },
    {
      action: 'Re-measure transparency and enablement after action plans have been communicated.',
      timeframe: '90 days',
      owner: 'Leadership',
      context: 'Validates improvement impact',
    },
  ]),
  'emp_001',
)
pptDemoSummary.generatedAt = '2026-05-20T10:30:00.000Z'
pptDemoSummary.lastFullUpdateAt = '2026-05-20T10:30:00.000Z'

function widget(
  id: string,
  type: WidgetType,
  title: string,
  width: 'full' | 'half',
  order: number,
): DashboardWidget {
  return {
    id,
    type,
    title,
    width,
    order,
    surveyId: 'surv_annual_engagement_2025',
  }
}

export const mockDashboards: Dashboard[] = [
  {
    id: 'dash_new_dashboard',
    name: 'Demo',
    access: 'custom',
    isHome: true,
    authorEmail: 'sarah.johnson@questionpro.com',
    createdAt: '2026-06-12T09:30:00Z',
    tabs: [
      {
        id: 'tab_new_dashboard_1',
        name: 'Tab 1',
        order: 1,
        widgets: [
          widget('wid_new_scorecard', 'scorecard', 'Scorecard', 'full', 1),
          widget('wid_new_response_rate', 'response_rate', 'Response Rate', 'half', 2),
          widget('wid_new_time_trend', 'time_trend', 'Time Trend', 'half', 3),
          widget('wid_new_enps', 'enps', 'eNPS', 'half', 4),
          widget('wid_new_heatmap', 'heatmap', 'Heatmap', 'half', 5),
          widget('wid_new_comparison', 'survey_comparison', 'Survey Comparison', 'half', 6),
          widget('wid_new_single_question', 'single_question', 'Single Question', 'half', 7),
          widget('wid_new_driver', 'driver_analysis', 'Driver Analysis', 'full', 8),
        ],
      },
    ],
  },
  {
    id: 'dash_new_test',
    name: 'New test',
    access: 'private',
    authorEmail: 'sarah.johnson@questionpro.com',
    createdAt: '2026-06-10T10:15:00Z',
    tabs: [
      {
        id: 'tab_new_test_1',
        name: 'Tab 1',
        order: 1,
        widgets: [],
      },
    ],
  },
  {
    id: 'dash_test',
    name: 'test',
    access: 'custom',
    authorEmail: 'mark.taylor@questionpro.com',
    createdAt: '2026-06-08T14:45:00Z',
    tabs: [
      {
        id: 'tab_test_1',
        name: 'Tab 1',
        order: 1,
        widgets: [widget('wid_test_scorecard', 'scorecard', 'Scorecard', 'full', 1)],
      },
    ],
  },
  {
    id: 'dash_ppt_export',
    name: 'PPT Export',
    access: 'global',
    authorEmail: 'nina.patel@questionpro.com',
    createdAt: '2026-06-01T08:00:00Z',
    tabs: [
      {
        id: 'tab_ppt_1',
        name: 'Tab 1',
        order: 1,
        widgets: [
          widget('wid_ppt_scorecard', 'scorecard', 'Scorecard', 'full', 1),
          widget('wid_ppt_response_rate', 'response_rate', 'Response Rate', 'half', 2),
          widget('wid_ppt_time_trend', 'time_trend', 'Time Trend', 'half', 3),
          widget('wid_ppt_enps', 'enps', 'eNPS', 'half', 4),
          widget('wid_ppt_heatmap', 'heatmap', 'Heatmap', 'half', 5),
          widget('wid_ppt_single_question', 'single_question', 'Single Question', 'half', 6),
          {
            id: 'wid_ppt_summary',
            type: 'summary',
            title: 'Summary & Recommendations',
            width: 'full',
            order: 99,
            surveyId: 'surv_annual_engagement_2025',
            summaryConfig: {
              visibility: 'everyone',
              allowEmployeeSummaries: true,
              createdBy: 'emp_001',
              isGenerating: false,
              companyContent: pptDemoSummary,
            },
          },
        ],
      },
    ],
  },
]
