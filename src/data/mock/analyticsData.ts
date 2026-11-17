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

export { mockDriverAnalysisData } from '@/data/mock/driverAnalysis'

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

export type TextAnalysisSentimentMix = {
  negative: number
  neutral: number
  positive: number
}

export type TextAnalysisSubTopic = {
  id: string
  name: string
  mentions: number
  sentiment: TextAnalysisSentimentMix
}

export type TextAnalysisTopic = {
  id: string
  name: string
  mentions: number
  sentiment: TextAnalysisSentimentMix
  subTopics?: TextAnalysisSubTopic[]
}

export const mockTextAnalysisData: { topics: TextAnalysisTopic[] } = {
  topics: [
    {
      id: 'topic_leadership',
      name: 'Leadership Communication',
      mentions: 42,
      sentiment: { negative: 20, neutral: 9, positive: 13 },
      subTopics: [
        {
          id: 'sub_unclear_direction',
          name: 'Unclear direction',
          mentions: 18,
          sentiment: { negative: 12, neutral: 4, positive: 2 },
        },
        {
          id: 'sub_delayed_decisions',
          name: 'Delayed decisions',
          mentions: 14,
          sentiment: { negative: 8, neutral: 3, positive: 3 },
        },
        {
          id: 'sub_town_halls',
          name: 'Town halls',
          mentions: 10,
          sentiment: { negative: 0, neutral: 2, positive: 8 },
        },
      ],
    },
    {
      id: 'topic_work_life',
      name: 'Work-Life Balance',
      mentions: 38,
      sentiment: { negative: 8, neutral: 9, positive: 21 },
      subTopics: [
        {
          id: 'sub_flexible_hours',
          name: 'Flexible hours',
          mentions: 16,
          sentiment: { negative: 2, neutral: 3, positive: 11 },
        },
        {
          id: 'sub_meeting_load',
          name: 'Meeting load',
          mentions: 12,
          sentiment: { negative: 5, neutral: 4, positive: 3 },
        },
        {
          id: 'sub_time_off',
          name: 'Time off',
          mentions: 10,
          sentiment: { negative: 1, neutral: 2, positive: 7 },
        },
      ],
    },
    {
      id: 'topic_career',
      name: 'Career Growth',
      mentions: 31,
      sentiment: { negative: 10, neutral: 13, positive: 8 },
      subTopics: [
        {
          id: 'sub_promotion_path',
          name: 'Promotion path',
          mentions: 12,
          sentiment: { negative: 5, neutral: 5, positive: 2 },
        },
        {
          id: 'sub_mentorship',
          name: 'Mentorship',
          mentions: 11,
          sentiment: { negative: 3, neutral: 5, positive: 3 },
        },
        {
          id: 'sub_learning_budget',
          name: 'Learning budget',
          mentions: 8,
          sentiment: { negative: 2, neutral: 3, positive: 3 },
        },
      ],
    },
    {
      id: 'topic_collaboration',
      name: 'Team Collaboration',
      mentions: 28,
      sentiment: { negative: 5, neutral: 5, positive: 18 },
      subTopics: [
        {
          id: 'sub_handoffs',
          name: 'Cross-team handoffs',
          mentions: 15,
          sentiment: { negative: 4, neutral: 3, positive: 8 },
        },
        {
          id: 'sub_peer_support',
          name: 'Peer support',
          mentions: 13,
          sentiment: { negative: 1, neutral: 2, positive: 10 },
        },
      ],
    },
    {
      id: 'topic_compensation',
      name: 'Compensation',
      mentions: 24,
      sentiment: { negative: 15, neutral: 6, positive: 3 },
      subTopics: [
        {
          id: 'sub_base_pay',
          name: 'Base pay',
          mentions: 14,
          sentiment: { negative: 9, neutral: 3, positive: 2 },
        },
        {
          id: 'sub_bonus_clarity',
          name: 'Bonus clarity',
          mentions: 10,
          sentiment: { negative: 6, neutral: 3, positive: 1 },
        },
      ],
    },
    {
      id: 'topic_remote',
      name: 'Remote Work',
      mentions: 19,
      sentiment: { negative: 4, neutral: 4, positive: 11 },
      subTopics: [
        {
          id: 'sub_stipend',
          name: 'Home office stipend',
          mentions: 8,
          sentiment: { negative: 1, neutral: 2, positive: 5 },
        },
        {
          id: 'sub_timezone',
          name: 'Timezone overlap',
          mentions: 11,
          sentiment: { negative: 3, neutral: 2, positive: 6 },
        },
      ],
    },
    {
      id: 'topic_recognition',
      name: 'Recognition',
      mentions: 16,
      sentiment: { negative: 4, neutral: 5, positive: 7 },
      subTopics: [
        {
          id: 'sub_shout_outs',
          name: 'Peer shout-outs',
          mentions: 9,
          sentiment: { negative: 1, neutral: 3, positive: 5 },
        },
        {
          id: 'sub_manager_feedback',
          name: 'Manager feedback',
          mentions: 7,
          sentiment: { negative: 3, neutral: 2, positive: 2 },
        },
      ],
    },
    {
      id: 'topic_tools',
      name: 'Tools and Technology',
      mentions: 14,
      sentiment: { negative: 10, neutral: 2, positive: 2 },
      subTopics: [
        {
          id: 'sub_slow_tools',
          name: 'Slow internal tools',
          mentions: 9,
          sentiment: { negative: 7, neutral: 1, positive: 1 },
        },
        {
          id: 'sub_license_access',
          name: 'License access',
          mentions: 5,
          sentiment: { negative: 3, neutral: 1, positive: 1 },
        },
      ],
    },
    {
      id: 'topic_onboarding',
      name: 'Onboarding Experience for New Hires in High-Growth Product Teams Across Regional Offices',
      mentions: 11,
      sentiment: { negative: 3, neutral: 4, positive: 4 },
      subTopics: [
        {
          id: 'sub_first_week_buddy',
          name: 'First-week buddy',
          mentions: 6,
          sentiment: { negative: 1, neutral: 2, positive: 3 },
        },
        {
          id: 'sub_manager_checkins',
          name: 'Manager check-ins',
          mentions: 5,
          sentiment: { negative: 2, neutral: 2, positive: 1 },
        },
      ],
    },
    {
      id: 'topic_benefits',
      name: 'Benefits',
      mentions: 8,
      sentiment: { negative: 1, neutral: 2, positive: 5 },
    },
  ],
}

export type TextAnalysisCommentSentiment = 'negative' | 'neutral' | 'positive'

export type TextAnalysisComment = {
  id: string
  topicId: string
  subTopicId?: string
  sentiment: TextAnalysisCommentSentiment
  text: string
  highlight: string
}

const TEXT_ANALYSIS_COMMENT_TEMPLATES: Record<
  TextAnalysisCommentSentiment,
  Array<(phrase: string) => string>
> = {
  negative: [
    (phrase) => `I'm tired of hearing about ${phrase} without any follow-through.`,
    (phrase) => `${phrase} is getting worse, and it is starting to affect delivery.`,
    (phrase) => `We keep raising ${phrase}, but nothing changes after the survey.`,
    (phrase) => `The biggest frustration this year has been ${phrase}.`,
    (phrase) => `It's hard to stay motivated when ${phrase} is still unresolved.`,
    (phrase) => `Managers acknowledge ${phrase} in meetings, then it disappears.`,
  ],
  neutral: [
    (phrase) => `People mention ${phrase} often, though opinions are mixed.`,
    (phrase) => `${phrase} comes up in almost every team discussion.`,
    (phrase) => `I don't have a strong view on ${phrase} either way.`,
    (phrase) => `Some teams handle ${phrase} well; others still struggle.`,
    (phrase) => `${phrase} feels average compared with other companies I've worked at.`,
    (phrase) => `We talk about ${phrase}, but I haven't seen a clear pattern yet.`,
  ],
  positive: [
    (phrase) => `I appreciate how we handle ${phrase} — it really helps day to day.`,
    (phrase) => `${phrase} is one of the things that keeps me here.`,
    (phrase) => `Leaders have improved ${phrase} over the last quarter.`,
    (phrase) => `The support around ${phrase} has been genuinely helpful.`,
    (phrase) => `I would call ${phrase} a strength of this organization.`,
    (phrase) => `Recent changes to ${phrase} have made my work easier.`,
  ],
}

function buildTextAnalysisComments(): TextAnalysisComment[] {
  const comments: TextAnalysisComment[] = []
  let index = 0

  function addComments(
    topicId: string,
    highlight: string,
    sentiment: TextAnalysisSentimentMix,
    subTopicId?: string,
  ) {
    ;(['negative', 'neutral', 'positive'] as const).forEach((key) => {
      const count = sentiment[key]
      const templates = TEXT_ANALYSIS_COMMENT_TEMPLATES[key]
      for (let i = 0; i < count; i += 1) {
        index += 1
        const text = templates[i % templates.length](highlight)
        comments.push({
          id: `txtc_${index}`,
          topicId,
          subTopicId,
          sentiment: key,
          text,
          highlight,
        })
      }
    })
  }

  mockTextAnalysisData.topics.forEach((topic) => {
    if (topic.subTopics && topic.subTopics.length > 0) {
      topic.subTopics.forEach((subTopic) => {
        addComments(topic.id, subTopic.name, subTopic.sentiment, subTopic.id)
      })
      return
    }
    addComments(topic.id, topic.name, topic.sentiment)
  })

  return comments
}

export const mockTextAnalysisComments = buildTextAnalysisComments()

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
