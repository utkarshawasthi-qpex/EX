import type {
  EmpowerGoal,
  EmpowerInitiativeRecord,
  FunnelSeed,
  OrgSettings,
  SurveyDataStore,
} from '@/types/empowerIntegration'

export const EMPOWER_GOALS: EmpowerGoal[] = [
  { id: 'goal_engagement', title: 'Improve Engagement' },
  { id: 'goal_retention', title: 'Retention' },
  { id: 'goal_manager', title: 'Manager Effectiveness' },
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

export const SEED_INITIATIVES: EmpowerInitiativeRecord[] = [
  {
    id: 'init_linked_awaiting',
    title: 'Launch quarterly growth conversations',
    description: 'Structured manager check-ins for Growth & Development.',
    goalId: 'goal_engagement',
    status: 'active',
    progress: 'on_track',
    createdBy: 'emp_002',
    ownerId: 'emp_002',
    contributors: ['emp_003'],
    dueDate: '2026-09-30',
    createdAt: '2026-05-01T10:00:00.000Z',
    tasks: [{ id: 'task_1', text: 'Draft conversation guide', done: true, source: 'manual' }],
    provenance: null,
    surveyLink: {
      surveyId: ENGAGEMENT_SURVEY_ID,
      surveyName: 'Engagement 2026',
      cycleLabel: '2026 Annual',
      scope: { kind: 'team', managerId: 'emp_002' },
      focus: { kind: 'category', id: 'cat_growth_dev', label: 'Growth & Development' },
      baseline: { favorability: 52, respondentCount: 14, capturedAt: '2026-04-15T00:00:00.000Z', surveyStatus: 'closed' },
      latest: null,
    },
    history: [{ at: '2026-05-01T10:00:00.000Z', event: 'Initiative created' }],
  },
  {
    id: 'init_linked_delta',
    title: 'Improve manager communication cadence',
    description: 'Weekly async updates and monthly Q&A.',
    goalId: 'goal_manager',
    status: 'active',
    progress: 'on_track',
    createdBy: 'emp_001',
    ownerId: 'emp_002',
    contributors: [],
    dueDate: '2026-08-15',
    createdAt: '2026-04-20T14:00:00.000Z',
    tasks: [],
    provenance: null,
    surveyLink: {
      surveyId: ENGAGEMENT_SURVEY_ID,
      surveyName: 'Engagement 2026',
      cycleLabel: '2026 Annual',
      scope: { kind: 'org' },
      focus: { kind: 'category', id: 'cat_communication', label: 'Communication' },
      baseline: { favorability: 64, respondentCount: 248, capturedAt: '2026-04-15T00:00:00.000Z', surveyStatus: 'closed' },
      latest: {
        favorability: 69,
        respondentCount: 256,
        sourceSurveyId: ENGAGEMENT_2027_ID,
        computedAt: '2026-06-01T09:00:00.000Z',
      },
    },
    history: [{ at: '2026-04-20T14:00:00.000Z', event: 'Initiative created' }],
  },
  {
    id: 'init_unlinked',
    title: 'Team recognition framework',
    description: 'Peer recognition program without survey link.',
    goalId: 'goal_retention',
    status: 'active',
    progress: 'stuck',
    createdBy: 'emp_002',
    ownerId: 'emp_002',
    contributors: [],
    dueDate: '2026-10-01',
    createdAt: '2026-05-15T09:00:00.000Z',
    tasks: [{ id: 'task_2', text: 'Define recognition criteria', done: false, source: 'manual' }],
    provenance: null,
    surveyLink: null,
    history: [{ at: '2026-05-15T09:00:00.000Z', event: 'Initiative created' }],
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
