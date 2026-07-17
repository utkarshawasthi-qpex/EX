import type { Dashboard, DashboardWidget, WidgetType } from '@/types'
import { buildSummaryContent, normalizeActionsFromApi } from '@/lib/summaryContent'

const pptDemoSummary = buildSummaryContent(
  'Technologies is the weakest area in Workplace Culture, with only 39% of employees responding favorably — nearly as many (38%) responded unfavorably. Transparency is close behind at 44% favorable, which suggests people do not feel they get clear updates on company direction or decisions that affect their work. By contrast, Inclusion is a real strength at 74% favorable, and Solutions (66%) and Innovation (61%) are solid. Growth sits in the middle at 52%, so career development is not failing outright but is not a bright spot either. eNPS is −66, meaning far more employees would discourage someone they respect from joining than would recommend the company. Together, the scores point to a practical problem: tools and day-to-day clarity are hurting experience more than culture or belonging. Fixing the lowest two markers first — and showing employees that feedback led to concrete changes — is the most direct path to rebuilding trust over the next quarter.',
  normalizeActionsFromApi([
    {
      action: 'List the top three tools employees struggle with, cut or replace the worst ones, and assign an owner for each fix.',
      timeframe: '30 days',
      owner: 'HR',
      context: 'Targets Technologies (39%)',
    },
    {
      action: 'Start a monthly all-hands with open Q&A and publish key decisions within two business days.',
      timeframe: '30 days',
      owner: 'Leadership',
      context: 'Targets Transparency (44%)',
    },
    {
      action: 'Add a career-path conversation to every manager 1:1 this quarter and share a simple role-growth guide.',
      timeframe: '60 days',
      owner: 'Manager',
      context: 'Targets Growth (52%)',
    },
    {
      action: 'Re-survey Technologies and Transparency after the first fixes ship, and share the before/after scores with the company.',
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
