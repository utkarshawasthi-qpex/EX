import type { OrgContext } from '@/types'

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
  ],
}

export const mockScorecardData = {
  surveyName: 'Workplace Culture',
  markers: [
    {
      name: 'Company Overall',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: null,
    },
    {
      name: 'Transparency',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
    {
      name: 'Technologies',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
    {
      name: 'Solutions',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
    {
      name: 'Innovation',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
    {
      name: 'Inclusion',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
    {
      name: 'Growth',
      respondents: 500,
      unfavorable: 40,
      neutral: 20,
      favorable: 40,
      mean: 3,
      comparison: 0,
      trend: 'up' as const,
    },
  ],
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
  columns: [
    { name: 'Company overall', respondents: 500 },
    { name: 'C-Suite/Exec', respondents: 4 },
    { name: 'Senior Vice President/Vice President', respondents: 5 },
    { name: 'Associate Vice President/Senior Director', respondents: 4 },
  ],
  scores: [
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
    [3, 3, 3, 3],
  ],
}

export const mockResponseRateData = {
  surveyName: 'Workplace Culture',
  overview: { sent: 500, completed: 500, pending: 0, rate: 100 },
  byLevel: [
    { level: 'C-Suite/Exec', sent: 4, completed: 4, pending: 0, rate: 100 },
    { level: 'Total sum', sent: 4, completed: 4, pending: 0, rate: 100 },
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
    'Organization-wide favorability remains soft at 40%, with transparency and technology among the lowest-performing markers while eNPS continues to reflect a detractor-heavy profile compared to prior cycles. Employees appear to lack consistent visibility into organizational priorities, and survey commentary repeatedly points to friction in systems, process clarity, and follow-through after prior feedback cycles. Heatmap results show uneven performance across departments, with enablement and agility lagging collaboration improvements that emerged in the most recent quarter. Response rates remain healthy enough to treat these patterns as representative, but localized teams report sharper declines in manager communication cadence. Organization context suggests recent structural changes have outpaced leadership messaging rhythms, leaving managers without sufficient support to translate employee input into visible action plans that rebuild trust and demonstrate measurable progress.',
  recommendations: [
    {
      title: 'Strengthen leadership communication',
      detail: 'Address transparency gaps with regular all-hands updates and clearer change management.',
      priority: 'high' as const,
    },
    {
      title: 'Invest in agility practices',
      detail: 'Review decision-making workflows and remove bottlenecks identified in Solutions and Agility markers.',
      priority: 'high' as const,
    },
    {
      title: 'Expand career development programs',
      detail: 'Launch mentorship pairings and publish visible growth paths to improve Inclusion and Growth scores.',
      priority: 'medium' as const,
    },
  ],
}
