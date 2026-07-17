import {
  buildHeatmapScores,
  buildScorecardMarkers,
  HEATMAP_DEPARTMENTS,
} from '@/data/mock/categorySentimentData'
import { mockDashboardRespondents } from '@/data/mock/dashboardFilters'
import type { OrgContext } from '@/types'

function buildHeatmapColumns() {
  return [
    { name: 'Company overall', respondents: mockDashboardRespondents.length },
    ...HEATMAP_DEPARTMENTS.map((name) => ({
      name,
      respondents: mockDashboardRespondents.filter((respondent) => respondent.department === name)
        .length,
    })),
  ]
}

export const mockOrgContext: OrgContext = {
  files: [
    {
      id: 'file_1',
      name: 'HR_Onboarding_Policy_2024.pdf',
      sizeLabel: '1.2 MB',
      extension: 'PDF',
      category: 'policy',
      uploadedAt: '2026-06-10T10:00:00.000Z',
    },
    {
      id: 'file_2',
      name: 'Engagement OKR Framework.docx',
      sizeLabel: '284 KB',
      extension: 'DOCX',
      category: 'initiative',
      uploadedAt: '2026-06-12T14:30:00.000Z',
    },
  ],
  notes: [
    {
      id: 'note_1',
      text: 'All new hires must complete the data privacy module within their first 5 days.',
      category: 'policy',
      addedAt: '2026-06-14T09:00:00.000Z',
    },
    {
      id: 'note_2',
      text: 'Do not recommend layoffs or headcount reductions as engagement interventions.',
      category: 'not_to_do',
      addedAt: '2026-06-15T11:20:00.000Z',
    },
    {
      id: 'note_3',
      text: 'eNPS: currently -12, target +20 by Q4 2026',
      category: 'kpi',
      addedAt: '2026-06-16T09:00:00.000Z',
    },
  ],
}

export const mockScorecardData = {
  surveyName: 'Workplace Culture',
  markers: buildScorecardMarkers(mockDashboardRespondents.length),
}

export const mockENPSData = {
  question:
    'How likely are you to recommend someone you respect to [COMPANY NAME] for employment?',
  score: -66,
  companyOverall: -49,
  companyDelta: -17,
  respondents: 38,
  detractors: 71,
  passives: 24,
  promoters: 5,
}

export const mockHeatmapData = {
  surveyName: 'Workplace Culture',
  metrics: [
    'Transparency',
    'Technologies',
    'Solutions',
    'Innovation',
    'Inclusion',
    'Growth',
    'Collaboration',
    'Agility',
  ],
  columns: buildHeatmapColumns(),
  scores: buildHeatmapScores(),
}

export const mockResponseRateData = {
  surveyName: 'Workplace Culture',
  overview: { sent: 500, completed: 500, pending: 0, rate: 100 },
  byLevel: [
    { level: 'IC', sent: 250, completed: 205, pending: 45, rate: 82 },
    { level: 'Manager', sent: 120, completed: 109, pending: 11, rate: 91 },
    { level: 'Senior Manager', sent: 60, completed: 54, pending: 6, rate: 90 },
    { level: 'Director', sent: 45, completed: 43, pending: 2, rate: 96 },
    { level: 'VP', sent: 18, completed: 16, pending: 2, rate: 89 },
    { level: 'C-Suite', sent: 7, completed: 7, pending: 0, rate: 100 },
  ],
}

export const mockTimeTrendData = {
  xLabel: 'Deployment',
  yLabel: 'Mean Score',
  series: [
    {
      name: 'Overall',
      color: '#3b82f6',
      points: [
        { x: 'Jan 2026', y: 3.15 },
        { x: 'Feb 2026', y: 3.1 },
        { x: 'Mar 2026', y: 3.05 },
        { x: 'Apr 2026', y: 3.0 },
        { x: 'May 12, 2026', y: 2.95 },
      ],
    },
    {
      name: 'Inclusion',
      color: '#ef4444',
      points: [
        { x: 'Jan 2026', y: 3.05 },
        { x: 'Feb 2026', y: 3.0 },
        { x: 'Mar 2026', y: 2.95 },
        { x: 'Apr 2026', y: 2.9 },
        { x: 'May 12, 2026', y: 2.82 },
      ],
    },
    {
      name: 'Agility',
      color: '#22c55e',
      points: [
        { x: 'Jan 2026', y: 3.25 },
        { x: 'Feb 2026', y: 3.2 },
        { x: 'Mar 2026', y: 3.18 },
        { x: 'Apr 2026', y: 3.14 },
        { x: 'May 12, 2026', y: 3.1 },
      ],
    },
  ],
}

export const mockSingleQuestionData = {
  surveyName: 'Workplace Culture',
  questionText:
    "I am at ease and comfortable when I'm around others at work - regardless of their title, position, or stature.",
  answers: [
    { label: 'Not at All', count: 10, percentage: 26 },
    { label: 'Rarely', count: 6, percentage: 16 },
    { label: 'Sometimes', count: 5, percentage: 13 },
    { label: 'Often', count: 10, percentage: 26 },
    { label: 'All the Time', count: 7, percentage: 19 },
    { label: 'Total', count: 38, percentage: 100, isTotal: true },
  ],
}

export const mockDriverAnalysisData = {
  surveyName: 'Workplace Culture',
  drivers: [
    { name: 'Transparency', impact: 0.82, favorability: 43 },
    { name: 'Technologies', impact: 0.61, favorability: 38 },
    { name: 'Solutions', impact: 0.74, favorability: 33 },
    { name: 'Innovation', impact: 0.55, favorability: 40 },
    { name: 'Inclusion', impact: 0.88, favorability: 41 },
    { name: 'Growth', impact: 0.45, favorability: 40 },
    { name: 'Collaboration', impact: 0.38, favorability: 40 },
    { name: 'Agility', impact: 0.67, favorability: 38 },
    { name: 'Engagement', impact: 0.71, favorability: 40 },
  ],
}

export const mockSurveyComparisonData = {
  surveys: ['Workplace Culture', 'Employee Experience'],
  metrics: ['Transparency', 'Technologies', 'Solutions', 'Innovation', 'Inclusion', 'Growth'],
  scores: [
    { metric: 'Transparency', scores: [43, 48], deltas: [null, 5] },
    { metric: 'Technologies', scores: [38, 42], deltas: [null, 4] },
    { metric: 'Solutions', scores: [33, 37], deltas: [null, 4] },
    { metric: 'Innovation', scores: [40, 38], deltas: [null, -2] },
    { metric: 'Inclusion', scores: [41, 45], deltas: [null, 4] },
    { metric: 'Growth', scores: [40, 43], deltas: [null, 3] },
  ],
}

export const mockTextAnalysisData = {
  themes: [
    { theme: 'Leadership Communication', count: 42, sentiment: 'negative' as const },
    { theme: 'Work-Life Balance', count: 38, sentiment: 'positive' as const },
    { theme: 'Career Growth', count: 31, sentiment: 'neutral' as const },
    { theme: 'Team Collaboration', count: 28, sentiment: 'positive' as const },
    { theme: 'Compensation', count: 24, sentiment: 'negative' as const },
    { theme: 'Remote Work', count: 19, sentiment: 'positive' as const },
  ],
}

export const mockTextReportData = {
  surveyName: 'Workplace Culture',
  responses: [
    {
      text: 'Leadership could communicate more transparently about company direction and changes.',
      attribution: 'Anonymous Employee · Workplace Culture',
    },
    {
      text: 'I appreciate the flexibility to work remotely and the trust my manager gives me.',
      attribution: 'Anonymous Employee · Workplace Culture',
    },
    {
      text: 'Career growth paths are unclear — I would like more mentorship and development opportunities.',
      attribution: 'Anonymous Employee · Workplace Culture',
    },
  ],
}

export const mockSummaryRecommendationsData = {
  surveyName: 'Workplace Culture',
  summary:
    'Technologies is the weakest area in Workplace Culture, with only 39% of employees responding favorably — nearly as many (38%) responded unfavorably. Transparency is close behind at 44% favorable, which suggests people do not feel they get clear updates on company direction or decisions that affect their work. By contrast, Inclusion is a real strength at 74% favorable, and Solutions (66%) and Innovation (61%) are solid. Growth sits in the middle at 52%, so career development is not failing outright but is not a bright spot either. eNPS is −66, meaning far more employees would discourage someone they respect from joining than would recommend the company. Together, the scores point to a practical problem: tools and day-to-day clarity are hurting experience more than culture or belonging. Fixing the lowest two markers first — and showing employees that feedback led to concrete changes — is the most direct path to rebuilding trust over the next quarter.',
  recommendations: [
    {
      title: 'Fix the worst workplace tools',
      detail:
        'List the top three tools employees struggle with, cut or replace the worst ones, and assign an owner for each fix within 30 days.',
      priority: 'high' as const,
    },
    {
      title: 'Make decisions visible',
      detail:
        'Start a monthly all-hands with open Q&A and publish key decisions within two business days to lift Transparency.',
      priority: 'high' as const,
    },
    {
      title: 'Make career growth concrete',
      detail:
        'Add a career-path conversation to every manager 1:1 this quarter and share a simple role-growth guide.',
      priority: 'medium' as const,
    },
  ],
}
