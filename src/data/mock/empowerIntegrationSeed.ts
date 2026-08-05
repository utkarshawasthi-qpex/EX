import type {
  EmpowerGoal,
  EmpowerInitiativeRecord,
  FunnelSeed,
  OrgSettings,
  SurveyDataStore,
} from '@/types/empowerIntegration'

export const EMPOWER_GOALS: EmpowerGoal[] = [
  { id: 'goal_engagement', title: 'Improve Engagement', color: '#1B3380' },
  { id: 'goal_retention', title: 'Retention', color: '#1B87E6' },
  { id: 'goal_manager', title: 'Manager Effectiveness', color: '#7CB342' },
]

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  engagement2027Closed: false,
}

export const ENGAGEMENT_SURVEY_ID = 'surv_engagement_2026'
export const WELLBEING_SURVEY_ID = 'surv_wellbeing_pulse_q3'
export const ENGAGEMENT_2027_ID = 'surv_engagement_2027'

export const DEMO_WIDGET_IDS = {
  engagementScorecard: 'wid_demo_eng_scorecard',
  wellbeingHeatmap: 'wid_demo_wb_heatmap_sales',
  summary: 'wid_demo_summary',
} as const

export const SEED_SURVEY_DATA: SurveyDataStore = {
  ex: {
    [ENGAGEMENT_SURVEY_ID]: {
      id: ENGAGEMENT_SURVEY_ID,
      name: 'Engagement 2026',
      cycleLabel: '2026 Annual',
      status: 'closed',
      orgRespondentCount: 248,
      categories: [
        { id: 'cat_growth_dev', label: 'Growth & Development', favorability: 58, respondentCount: 248 },
        { id: 'cat_manager_rel', label: 'Manager Relationship', favorability: 82, respondentCount: 248 },
        { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 71, respondentCount: 248 },
        { id: 'cat_communication', label: 'Communication', favorability: 64, respondentCount: 248 },
      ],
      teamScopes: {
        emp_002: {
          managerId: 'emp_002',
          respondentCount: 14,
          categories: [
            { id: 'cat_growth_dev', label: 'Growth & Development', favorability: 52, respondentCount: 14 },
            { id: 'cat_manager_rel', label: 'Manager Relationship', favorability: 78, respondentCount: 14 },
            { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 69, respondentCount: 14 },
            { id: 'cat_communication', label: 'Communication', favorability: 60, respondentCount: 14 },
          ],
        },
      },
    },
    [WELLBEING_SURVEY_ID]: {
      id: WELLBEING_SURVEY_ID,
      name: 'Wellbeing Pulse Q3',
      cycleLabel: 'Q3 2026',
      status: 'live',
      flagged: true,
      orgRespondentCount: 89,
      categories: [
        { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 68, respondentCount: 89 },
      ],
      teamScopes: {
        emp_002: {
          managerId: 'emp_002',
          respondentCount: 6,
          categories: [
            { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 65, respondentCount: 6 },
          ],
          filterScopes: {
            Sales: {
              respondentCount: 8,
              categories: [
                { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 61, respondentCount: 8 },
              ],
            },
          },
        },
      },
    },
    [ENGAGEMENT_2027_ID]: {
      id: ENGAGEMENT_2027_ID,
      name: 'Engagement 2027',
      cycleLabel: '2027 Annual',
      status: 'closed',
      hidden: true,
      orgRespondentCount: 256,
      categories: [
        { id: 'cat_growth_dev', label: 'Growth & Development', favorability: 66, respondentCount: 256 },
        { id: 'cat_manager_rel', label: 'Manager Relationship', favorability: 84, respondentCount: 256 },
        { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 70, respondentCount: 256 },
        { id: 'cat_communication', label: 'Communication', favorability: 69, respondentCount: 256 },
      ],
      teamScopes: {
        emp_002: {
          managerId: 'emp_002',
          respondentCount: 15,
          categories: [
            { id: 'cat_growth_dev', label: 'Growth & Development', favorability: 60, respondentCount: 15 },
            { id: 'cat_manager_rel', label: 'Manager Relationship', favorability: 80, respondentCount: 15 },
            { id: 'cat_wellbeing', label: 'Wellbeing', favorability: 68, respondentCount: 15 },
            { id: 'cat_communication', label: 'Communication', favorability: 65, respondentCount: 15 },
          ],
        },
      },
    },
  },
}

const SEED_NOW = new Date()

function daysAgo(days: number): string {
  return new Date(SEED_NOW.getTime() - days * 86400000).toISOString().split('T')[0]
}

function daysFromNow(days: number): string {
  return new Date(SEED_NOW.getTime() + days * 86400000).toISOString().split('T')[0]
}

function timestampDaysAgo(days: number): string {
  return new Date(SEED_NOW.getTime() - days * 86400000).toISOString()
}

export const SEED_INITIATIVES: EmpowerInitiativeRecord[] = [
  {
    id: 'init_linked_awaiting',
    title: 'Launch quarterly growth conversations',
    description: 'Structured manager check-ins for Growth & Development.',
    goalId: 'goal_engagement',
    type: 'upstream',
    status: 'active',
    progress: 'on_track',
    createdBy: 'emp_002',
    ownerId: 'emp_002',
    contributors: ['emp_003'],
    dueDate: daysFromNow(60),
    createdAt: timestampDaysAgo(14),
    tasks: [
      {
        id: 'task_1',
        text: 'Draft conversation guide',
        ownerId: 'emp_002',
        contributorIds: ['emp_003'],
        dueDate: daysFromNow(7),
        status: 'completed',
        completedAt: timestampDaysAgo(3),
        source: 'manual',
      },
      {
        id: 'task_4',
        text: 'Run a pilot round of growth conversations with the Engineering leads',
        ownerId: 'emp_002',
        dueDate: daysFromNow(21),
        status: 'in_progress',
        source: 'manual',
      },
    ],
    provenance: null,
    surveyLink: {
      surveyId: ENGAGEMENT_SURVEY_ID,
      surveyName: 'Engagement 2026',
      cycleLabel: '2026 Annual',
      scope: { kind: 'team', managerId: 'emp_002' },
      focus: { kind: 'category', id: 'cat_growth_dev', label: 'Growth & Development' },
      baseline: { favorability: 52, respondentCount: 14, capturedAt: timestampDaysAgo(14), surveyStatus: 'closed' },
      latest: null,
    },
    history: [{ at: timestampDaysAgo(14), event: 'Initiative created' }],
  },
  {
    id: 'init_linked_delta',
    title: 'Improve manager communication cadence',
    description: 'Weekly async updates and monthly Q&A.',
    goalId: 'goal_manager',
    type: 'downstream',
    status: 'active',
    progress: 'on_track',
    createdBy: 'emp_001',
    ownerId: 'emp_002',
    contributors: ['emp_001'],
    dueDate: daysFromNow(45),
    createdAt: timestampDaysAgo(30),
    tasks: [
      {
        id: 'task_3',
        text: 'Publish the weekly async update template',
        ownerId: 'emp_001',
        contributorIds: ['emp_002'],
        dueDate: daysFromNow(3),
        status: 'in_progress',
        source: 'manual',
      },
      {
        id: 'task_5',
        text: 'Schedule the first monthly all-hands Q&A and circulate the agenda to every people manager',
        ownerId: 'emp_002',
        contributorIds: ['emp_001', 'emp_003'],
        dueDate: daysFromNow(12),
        status: 'pending',
        source: 'manual',
      },
      {
        id: 'task_6',
        text: 'Summarise manager feedback from the last cadence review',
        ownerId: 'emp_001',
        dueDate: daysAgo(4),
        status: 'completed',
        completedAt: timestampDaysAgo(4),
        source: 'manual',
      },
    ],
    provenance: null,
    surveyLink: {
      surveyId: ENGAGEMENT_SURVEY_ID,
      surveyName: 'Engagement 2026',
      cycleLabel: '2026 Annual',
      scope: { kind: 'org' },
      focus: { kind: 'category', id: 'cat_communication', label: 'Communication' },
      baseline: { favorability: 64, respondentCount: 248, capturedAt: timestampDaysAgo(30), surveyStatus: 'closed' },
      latest: {
        favorability: 69,
        respondentCount: 256,
        sourceSurveyId: ENGAGEMENT_2027_ID,
        computedAt: timestampDaysAgo(5),
      },
    },
    history: [{ at: timestampDaysAgo(30), event: 'Initiative created' }],
  },
  {
    id: 'init_unlinked',
    title: 'Team recognition framework',
    description: 'Peer recognition program without survey link.',
    goalId: 'goal_retention',
    type: 'none',
    status: 'active',
    progress: 'stuck',
    createdBy: 'emp_002',
    ownerId: 'emp_002',
    contributors: ['emp_001'],
    dueDate: daysFromNow(30),
    createdAt: timestampDaysAgo(8),
    tasks: [
      {
        id: 'task_2',
        text: 'Define recognition criteria',
        ownerId: 'emp_001',
        dueDate: daysAgo(2),
        status: 'pending',
        source: 'manual',
      },
      {
        id: 'task_7',
        text: 'Pick a rewards vendor',
        dueDate: daysFromNow(18),
        status: 'pending',
        source: 'manual',
      },
    ],
    provenance: null,
    surveyLink: null,
    history: [{ at: timestampDaysAgo(8), event: 'Initiative created' }],
  },
  {
    id: 'init_onboarding_ideas',
    title: 'Rethink the first 90 days of onboarding',
    description:
      'An idea captured from the Engagement 2026 verbatims: new joiners want a clearer ramp-up plan and an assigned buddy in week one.',
    goalId: 'goal_retention',
    type: 'none',
    status: 'new',
    progress: 'on_track',
    createdBy: 'emp_001',
    ownerId: 'emp_001',
    contributors: [],
    createdAt: timestampDaysAgo(2),
    tasks: [],
    provenance: null,
    surveyLink: null,
    history: [{ at: timestampDaysAgo(2), event: 'Initiative created' }],
  },
]

export const SEED_FUNNEL: FunnelSeed = {
  totalManagers: 12,
  viewed: 9,
  created: 5,
  updated: 3,
  completed: 1,
  managers: [
    { managerId: 'emp_002', managerName: 'Marcus Chen', team: 'Engineering', stage: 'updated', lastActivity: '2026-06-12' },
    { managerId: 'emp_008', managerName: 'Owen Kim', team: 'Product', stage: 'created', lastActivity: '2026-06-08' },
    { managerId: 'emp_014', managerName: 'Sophia Martinez', team: 'Sales', stage: 'viewed', lastActivity: '2026-06-05' },
    { managerId: 'emp_018', managerName: 'Benjamin Clark', team: 'HR', stage: 'completed', lastActivity: '2026-06-01' },
    { managerId: 'emp_022', managerName: 'Jack Mitchell', team: 'Operations', stage: 'created', lastActivity: '2026-05-28' },
  ],
}
