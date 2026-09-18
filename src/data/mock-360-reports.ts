export type Report360Relationship = 'self' | 'manager' | 'direct_report' | 'peer' | 'external'

export type Report360BlockType =
  | 'masterDesign'
  | 'cover'
  | 'introduction'
  | 'competencyDetail'
  | 'executiveSummary'
  | 'overallData'
  | 'spiderChart'
  | 'gapAnalysis'
  | 'performanceTrend'
  | 'rankingByRelationship'
  | 'priorityComments'
  | 'surveyRespondents'
  | 'nominatedRaters'
  | 'aiRecommendations'
  | 'actionPlan'

export const REPORT360_RELATIONSHIP_LABELS: Record<Report360Relationship, string> = {
  self: 'Self',
  manager: 'Manager',
  direct_report: 'Direct Report',
  peer: 'Peer',
  external: 'External',
}

export const REPORT360_RELATIONSHIP_COLORS: Record<Report360Relationship, string> = {
  self: '#1B87E6',
  manager: '#7C3AED',
  direct_report: '#16A34A',
  peer: '#EA580C',
  external: '#6B7280',
}

export const REPORT360_COMPETENCIES = [
  { id: 'comp_leadership', name: 'Leadership' },
  { id: 'comp_communication', name: 'Communication' },
  { id: 'comp_collaboration', name: 'Collaboration' },
  { id: 'comp_inclusion', name: 'Inclusive Leadership' },
  { id: 'comp_influence', name: 'Influence' },
] as const

export type Report360MasterDesign = {
  fontFamily: string
  fontColor: string
  headerText: string
  footerText: string
  logoName: string
  pageSize: 'Letter' | 'A4'
  pageNumbering: boolean
  showLogo: boolean
  globalWeightsEnabled: boolean
  relationshipWeights: Record<Report360Relationship, number>
}

export type Report360Block = {
  id: string
  type: Report360BlockType
  title: string
  enabled: boolean
  locked: boolean
  introduction: string
  closingText: string
  dataSource: string
  chartType: 'bar' | 'radar'
  meanColumn: boolean
  relationshipIcons: boolean
  tabularData: boolean
  priorityColumn: boolean
  qxBotInsights: boolean
  behavioursPerPage: number
  includeInOverallScore: boolean
  useBlockWeights: boolean
  relationshipWeights: Record<Report360Relationship, number>
  visibleToSubject: boolean
  visibleToManager: boolean
  visibleToAdmin: boolean
  spiderCompetencyIds: string[]
  spiderRelationships: Report360Relationship[]
  lineStyles: Record<Report360Relationship, 'solid' | 'dashed' | 'dotted'>
  rankingCount: number
  actionPlanPriorities: string[]
}

export type Report360Template = {
  masterDesign: Report360MasterDesign
  blocks: Report360Block[]
}

export type Report360BehaviorScore = {
  id: string
  competencyId: string
  competency: string
  text: string
  scores: Record<Report360Relationship, number | null>
  overall: number
  mean: number
}

export type Report360Gap = {
  competencyId: string
  competency: string
  selfScore: number
  othersAvg: number
  gap: number
}

export type Report360Comment = {
  relationship: string
  text: string
}

export type Report360Subject = {
  id: string
  surveyId: string
  name: string
  role: string
  overallScore: number
  category: string
  generatedDate: string | null
  evaluatorCounts: Record<Report360Relationship, number>
  behaviors: Report360BehaviorScore[]
  gaps: Report360Gap[]
  trend: {
    year: number
    overall: number
    leadership: number
    communication: number
    collaboration: number
    inclusion: number
    influence: number
  }[]
  strengths: string[]
  developmentAreas: string[]
  alignmentStatement: string
  qxBot: {
    sentimentPositive: number
    sentimentNeutral: number
    sentimentNegative: number
    cards: { title: string; steps: string[] }[]
    commentInsights: { strengths: string[]; improvements: string[] }
  }
  priorityComments: Record<'q1' | 'q2' | 'q3', Report360Comment[]>
  nominatedRaters: { name: string; relationship: string; status: string }[]
  rankingByRelationship: Record<Report360Relationship, { behavior: string; score: number }[]>
  actionPlanItems: { priority: string; behavior: string; action: string }[]
}

const DEFAULT_WEIGHTS: Record<Report360Relationship, number> = {
  self: 10,
  manager: 30,
  direct_report: 25,
  peer: 25,
  external: 10,
}

const DEFAULT_LINE_STYLES: Record<Report360Relationship, 'solid' | 'dashed' | 'dotted'> = {
  self: 'solid',
  manager: 'dashed',
  direct_report: 'solid',
  peer: 'dotted',
  external: 'dashed',
}

function createBlock(
  type: Report360BlockType,
  title: string,
  extras: Partial<Report360Block> = {},
): Report360Block {
  return {
    id: `block_${type}`,
    type,
    title,
    enabled: true,
    locked: type === 'masterDesign',
    introduction: '',
    closingText: '',
    dataSource: 'Inclusive Leadership',
    chartType: 'bar',
    meanColumn: true,
    relationshipIcons: true,
    tabularData: true,
    priorityColumn: false,
    qxBotInsights: type === 'competencyDetail' || type === 'aiRecommendations',
    behavioursPerPage: 5,
    includeInOverallScore: type !== 'cover' && type !== 'introduction' && type !== 'masterDesign',
    useBlockWeights: false,
    relationshipWeights: { ...DEFAULT_WEIGHTS },
    visibleToSubject: true,
    visibleToManager: true,
    visibleToAdmin: true,
    spiderCompetencyIds: REPORT360_COMPETENCIES.map((item) => item.id),
    spiderRelationships: ['self', 'manager', 'direct_report', 'peer'],
    lineStyles: { ...DEFAULT_LINE_STYLES },
    rankingCount: 5,
    actionPlanPriorities: ['#1', '#2', '#3'],
    ...extras,
  }
}

export function createDefaultReport360Template(): Report360Template {
  return {
    masterDesign: {
      fontFamily: 'Fira Sans',
      fontColor: '#111827',
      headerText: 'QuestionPro Employee Experience',
      footerText: 'Confidential — for development use only',
      logoName: 'qp.png',
      pageSize: 'Letter',
      pageNumbering: true,
      showLogo: true,
      globalWeightsEnabled: true,
      relationshipWeights: { ...DEFAULT_WEIGHTS },
    },
    blocks: [
      createBlock('masterDesign', 'Master Design Settings', { enabled: true, locked: true }),
      createBlock('cover', 'Cover Page', {
        introduction: '360° Development Report',
      }),
      createBlock('introduction', 'Introduction', {
        introduction:
          'This report summarizes multi-rater feedback for development planning. Scores are shown by relationship and should be read as patterns, not as a performance rating.',
      }),
      createBlock('competencyDetail', 'Competency Detail View', {
        dataSource: 'Inclusive Leadership',
        chartType: 'bar',
        meanColumn: true,
        relationshipIcons: true,
        tabularData: true,
        qxBotInsights: true,
      }),
      createBlock('executiveSummary', 'Executive Summary'),
      createBlock('overallData', 'Overall Data', { enabled: false }),
      createBlock('spiderChart', 'Spider Chart', {
        introduction: 'Competency scores by relationship. Higher spikes are strengths; dips are opportunities.',
      }),
      createBlock('gapAnalysis', 'Gap Analysis'),
      createBlock('performanceTrend', 'Performance Trend'),
      createBlock('rankingByRelationship', 'Ranking by Relationship', { enabled: false, rankingCount: 5 }),
      createBlock('priorityComments', 'Priority Comments'),
      createBlock('surveyRespondents', 'Survey Respondents', { enabled: false }),
      createBlock('nominatedRaters', 'Nominated Raters', { enabled: false }),
      createBlock('aiRecommendations', 'AI Action Recommendations', { qxBotInsights: true }),
      createBlock('actionPlan', 'Action Plan', { enabled: false, actionPlanPriorities: ['#1', '#2', '#3'] }),
    ],
  }
}

export function cloneReport360Template(template: Report360Template): Report360Template {
  return {
    masterDesign: {
      ...template.masterDesign,
      relationshipWeights: { ...template.masterDesign.relationshipWeights },
    },
    blocks: template.blocks.map((block) => ({
      ...block,
      relationshipWeights: { ...block.relationshipWeights },
      spiderCompetencyIds: [...block.spiderCompetencyIds],
      spiderRelationships: [...block.spiderRelationships],
      lineStyles: { ...block.lineStyles },
      actionPlanPriorities: [...block.actionPlanPriorities],
    })),
  }
}

export function scoreCategory(score: number): string {
  if (score >= 85) return 'Outstanding'
  if (score >= 75) return 'Excellent'
  if (score >= 65) return 'Strong'
  if (score >= 55) return 'Developing'
  return 'Needs attention'
}

const BEHAVIOR_BANK: { competencyId: string; competency: string; text: string }[] = [
  { competencyId: 'comp_leadership', competency: 'Leadership', text: 'Sets a clear direction for the team.' },
  { competencyId: 'comp_leadership', competency: 'Leadership', text: 'Makes timely decisions with incomplete information.' },
  { competencyId: 'comp_leadership', competency: 'Leadership', text: 'Develops people for the next role.' },
  { competencyId: 'comp_communication', competency: 'Communication', text: 'Pays focused attention when speaking with others.' },
  { competencyId: 'comp_communication', competency: 'Communication', text: 'Communicates a compelling vision.' },
  { competencyId: 'comp_collaboration', competency: 'Collaboration', text: 'Brings people together to make the best decisions.' },
  { competencyId: 'comp_inclusion', competency: 'Inclusive Leadership', text: 'Listens to and understands diverse viewpoints.' },
  { competencyId: 'comp_inclusion', competency: 'Inclusive Leadership', text: 'Fosters a team where each member feels included.' },
  { competencyId: 'comp_influence', competency: 'Influence', text: 'Has effective relationships with diverse stakeholders.' },
]

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function buildBehaviors(base: number): Report360BehaviorScore[] {
  return BEHAVIOR_BANK.map((item, index) => {
    const self = round1(Math.min(5, Math.max(2.2, base + (index % 3) * 0.15 - 0.2)))
    const manager = round1(Math.min(5, self + 0.3))
    const direct = round1(Math.min(5, self + 0.1))
    const peer = round1(Math.min(5, self - 0.05))
    const external = index % 4 === 0 ? null : round1(Math.min(5, self + 0.05))
    const present = [self, manager, direct, peer, external].filter((value): value is number => value != null)
    const mean = round1(present.reduce((sum, value) => sum + value, 0) / present.length)
    return {
      id: `beh_${index + 1}`,
      competencyId: item.competencyId,
      competency: item.competency,
      text: item.text,
      scores: {
        self,
        manager,
        direct_report: direct,
        peer,
        external,
      },
      overall: mean,
      mean,
    }
  })
}

function buildGaps(behaviors: Report360BehaviorScore[]): Report360Gap[] {
  const byComp = new Map<string, Report360BehaviorScore[]>()
  behaviors.forEach((behavior) => {
    const list = byComp.get(behavior.competencyId) ?? []
    list.push(behavior)
    byComp.set(behavior.competencyId, list)
  })
  return [...byComp.entries()].map(([competencyId, items]) => {
    const selfScore = round1(
      items.reduce((sum, item) => sum + (item.scores.self ?? 0), 0) / items.length,
    )
    const othersAvg = round1(
      items.reduce((sum, item) => {
        const others = [item.scores.manager, item.scores.direct_report, item.scores.peer, item.scores.external].filter(
          (value): value is number => value != null,
        )
        return sum + others.reduce((inner, value) => inner + value, 0) / others.length
      }, 0) / items.length,
    )
    return {
      competencyId,
      competency: items[0]?.competency ?? competencyId,
      selfScore,
      othersAvg,
      gap: round1(othersAvg - selfScore),
    }
  })
}

function buildTrend(overall: number) {
  const start = Math.max(58, overall - 8)
  return [2022, 2023, 2024, 2025].map((year, index) => {
    const bump = index * ((overall - start) / 3)
    return {
      year,
      overall: Math.round(start + bump),
      leadership: Math.round(start + bump + 1),
      communication: Math.round(start + bump - 1),
      collaboration: Math.round(start + bump),
      inclusion: Math.round(start + bump + 2),
      influence: Math.round(start + bump - 2),
    }
  })
}

function createSubject(params: {
  id: string
  surveyId: string
  name: string
  role: string
  overallScore: number
  generatedDate: string | null
  evaluatorCounts?: Partial<Record<Report360Relationship, number>>
  strengths: string[]
  developmentAreas: string[]
  alignmentStatement: string
}): Report360Subject {
  const behaviors = buildBehaviors(params.overallScore / 20)
  const counts: Record<Report360Relationship, number> = {
    self: 1,
    manager: 1,
    direct_report: 4,
    peer: 5,
    external: 1,
    ...params.evaluatorCounts,
  }
  return {
    id: params.id,
    surveyId: params.surveyId,
    name: params.name,
    role: params.role,
    overallScore: params.overallScore,
    category: scoreCategory(params.overallScore),
    generatedDate: params.generatedDate,
    evaluatorCounts: counts,
    behaviors,
    gaps: buildGaps(behaviors),
    trend: buildTrend(params.overallScore),
    strengths: params.strengths,
    developmentAreas: params.developmentAreas,
    alignmentStatement: params.alignmentStatement,
    qxBot: {
      sentimentPositive: Math.min(78, params.overallScore - 4),
      sentimentNeutral: 14,
      sentimentNegative: Math.max(8, 100 - params.overallScore - 10),
      cards: [
        {
          title: 'Coach in public, correct in private',
          steps: [
            'Schedule two skip-level conversations this month.',
            'Share one decision rationale in the next team meeting.',
            'Ask a direct report to lead a standup recap.',
          ],
        },
        {
          title: 'Close the self vs others gap',
          steps: [
            'Ask your manager which behavior they rated highest.',
            'Pick one inclusion behavior to practice for 30 days.',
            'Request a mid-cycle pulse from two peers.',
          ],
        },
        {
          title: 'Turn comments into a 90-day plan',
          steps: [
            'Choose the #1 priority comment and write a success metric.',
            'Pair with a peer coach for monthly check-ins.',
            'Review progress in your next 1:1.',
          ],
        },
      ],
      commentInsights: {
        strengths: [
          'Raters describe calm, inclusive facilitation in mixed-stakeholder meetings.',
          'Manager comments highlight reliable follow-through on commitments.',
        ],
        improvements: [
          'Peers want faster decisions when tradeoffs are clear.',
          'Direct reports asked for more visible career-path conversations.',
        ],
      },
    },
    priorityComments: {
      q1: [
        { relationship: 'Manager', text: 'Sets direction clearly when the quarter plan is already defined.' },
        { relationship: 'Peer', text: 'Brings people in, then waits too long to close the decision.' },
      ],
      q2: [
        { relationship: 'Direct Report', text: 'I always feel heard, but I am not always sure what we decided.' },
        { relationship: 'Peer', text: 'Strong partner across functions when the goal is shared.' },
      ],
      q3: [
        { relationship: 'Manager', text: 'Would benefit from naming one development focus per quarter.' },
        { relationship: 'External', text: 'Trusted advisor. Could share more of the “why” earlier.' },
      ],
    },
    nominatedRaters: [
      { name: 'Rajesh Kumar', relationship: 'Manager', status: 'Completed' },
      { name: 'Nina Patel', relationship: 'Direct Report', status: 'Completed' },
      { name: 'Omar Haddad', relationship: 'Direct Report', status: 'Completed' },
      { name: 'Grace Liu', relationship: 'Peer', status: 'Completed' },
      { name: 'Chris Vogel', relationship: 'Peer', status: 'Opened' },
      { name: 'Dana Ruiz', relationship: 'External', status: 'Invited' },
    ],
    rankingByRelationship: {
      self: behaviors.slice(0, 3).map((item) => ({ behavior: item.text, score: item.scores.self ?? 0 })),
      manager: behaviors.slice(0, 3).map((item) => ({ behavior: item.text, score: item.scores.manager ?? 0 })),
      direct_report: behaviors.slice(1, 4).map((item) => ({ behavior: item.text, score: item.scores.direct_report ?? 0 })),
      peer: behaviors.slice(2, 5).map((item) => ({ behavior: item.text, score: item.scores.peer ?? 0 })),
      external: behaviors.slice(0, 2).map((item) => ({ behavior: item.text, score: item.scores.external ?? item.mean })),
    },
    actionPlanItems: [
      { priority: '#1', behavior: 'Makes timely decisions with incomplete information.', action: 'Time-box two decisions per week and share the rationale in Slack.' },
      { priority: '#2', behavior: 'Develops people for the next role.', action: 'Run a career 1:1 with each direct report this month.' },
      { priority: '#3', behavior: 'Communicates a compelling vision.', action: 'Open the next all-hands with a 3-slide “where we are going” story.' },
    ],
  }
}

export const MOCK_360_REPORT_SUBJECTS: Report360Subject[] = [
  createSubject({
    id: 'sub_sarah_mehta',
    surveyId: 'surv360_leadership_2025',
    name: 'Sarah Mehta',
    role: 'Senior Manager',
    overallScore: 76,
    generatedDate: '2025-06-12T10:00:00.000Z',
    strengths: ['Inclusive facilitation', 'Stakeholder relationships', 'Follow-through'],
    developmentAreas: ['Decision speed', 'Visible career coaching', 'Closing the loop'],
    alignmentStatement: 'Others rate Sarah slightly higher than she rates herself — a constructive, modest self-view.',
  }),
  createSubject({
    id: 'sub_arun_sharma',
    surveyId: 'surv360_leadership_2025',
    name: 'Arun Sharma',
    role: 'Director',
    overallScore: 82,
    generatedDate: '2025-06-11T10:00:00.000Z',
    evaluatorCounts: { self: 1, manager: 1, direct_report: 5, peer: 6, external: 2 },
    strengths: ['Strategic framing', 'Cross-team influence', 'Calm under pressure'],
    developmentAreas: ['Delegating earlier', 'Written brevity'],
    alignmentStatement: 'Self and others are closely aligned at the high end of the scale.',
  }),
  createSubject({
    id: 'sub_priya_nair',
    surveyId: 'surv360_leadership_2025',
    name: 'Priya Nair',
    role: 'Team Lead',
    overallScore: 71,
    generatedDate: '2025-06-10T09:00:00.000Z',
    strengths: ['Peer collaboration', 'Listening'],
    developmentAreas: ['Setting direction', 'Holding the bar'],
    alignmentStatement: 'Priya rates herself above peers on direction-setting; others want more explicit priorities.',
  }),
  createSubject({
    id: 'sub_raj_patel',
    surveyId: 'surv360_leadership_2025',
    name: 'Raj Patel',
    role: 'Analyst',
    overallScore: 64,
    generatedDate: '2025-06-09T09:00:00.000Z',
    evaluatorCounts: { self: 1, manager: 1, direct_report: 0, peer: 4, external: 0 },
    strengths: ['Reliability', 'Peer support'],
    developmentAreas: ['Influence without authority', 'Executive presence'],
    alignmentStatement: 'Limited rater groups — treat Direct Report and External columns as not applicable.',
  }),
  createSubject({
    id: 'sub_alexandria',
    surveyId: 'surv360_leadership_2025',
    name: 'Alexandria-Catherine Montgomery-Whitaker',
    role: 'Principal Program Manager, Global Workforce Experience Operations',
    overallScore: 88,
    generatedDate: '2025-06-08T14:00:00.000Z',
    strengths: ['Inclusive leadership', 'Stakeholder orchestration', 'Coaching'],
    developmentAreas: ['Protecting focus time'],
    alignmentStatement: 'Consistently high scores across relationships with little self-other gap.',
  }),
  createSubject({
    id: 'sub_maya_okonkwo',
    surveyId: 'surv360_leadership_2025',
    name: 'Maya Okonkwo',
    role: 'Engineering Manager',
    overallScore: 69,
    generatedDate: null,
    strengths: ['Technical mentoring', 'Fair process'],
    developmentAreas: ['Upward communication', 'Celebrating wins'],
    alignmentStatement: 'Report is still collecting remaining peer evaluations.',
  }),
  createSubject({
    id: 'sub_james_whitfield',
    surveyId: 'surv360_leadership_2025',
    name: 'James Whitfield',
    role: 'Sales Manager',
    overallScore: 79,
    generatedDate: '2025-06-07T11:00:00.000Z',
    strengths: ['Energy in the room', 'Customer advocacy'],
    developmentAreas: ['Listening before pitching', 'Peer coordination'],
    alignmentStatement: 'Manager scores lead self scores — others see more leadership than James claims.',
  }),
  createSubject({
    id: 'sub_elena_vasquez',
    surveyId: 'surv360_leadership_2025',
    name: 'Elena Vasquez',
    role: 'People Partner',
    overallScore: 84,
    generatedDate: '2025-06-06T16:00:00.000Z',
    strengths: ['Psychological safety', 'Difficult conversations'],
    developmentAreas: ['Saying no to extra programs'],
    alignmentStatement: 'High alignment between self, manager, and peers.',
  }),
  createSubject({
    id: 'sub_david_park',
    surveyId: 'surv360_manager_q1',
    name: 'David Park',
    role: 'Engineering Manager',
    overallScore: 80,
    generatedDate: '2026-03-10T10:00:00.000Z',
    strengths: ['Clear expectations', 'Timely feedback'],
    developmentAreas: ['Workload leveling'],
    alignmentStatement: 'Direct reports rate David higher than he rates himself on feedback quality.',
  }),
  createSubject({
    id: 'sub_lisa_wang',
    surveyId: 'surv360_manager_q1',
    name: 'Lisa Wang',
    role: 'Customer Success Manager',
    overallScore: 58,
    generatedDate: null,
    evaluatorCounts: { self: 1, manager: 1, direct_report: 2, peer: 1, external: 0 },
    strengths: ['Customer empathy'],
    developmentAreas: ['Team coaching', 'Prioritization'],
    alignmentStatement: 'Too few completed evaluations to treat peer scores as stable.',
  }),
  createSubject({
    id: 'sub_noah_kim',
    surveyId: 'surv360_manager_q1',
    name: 'Noah Kim',
    role: 'Operations Lead',
    overallScore: 73,
    generatedDate: '2026-03-08T10:00:00.000Z',
    strengths: ['Process clarity', 'Cross-team handoffs'],
    developmentAreas: ['Coaching depth'],
    alignmentStatement: 'Self and others agree on process strength and coaching as the stretch area.',
  }),
  createSubject({
    id: 'sub_amira_hassan',
    surveyId: 'surv360_newhire_90',
    name: 'Amira Hassan',
    role: 'Associate Product Manager',
    overallScore: 70,
    generatedDate: '2025-08-20T10:00:00.000Z',
    evaluatorCounts: { self: 1, manager: 1, direct_report: 0, peer: 3, external: 1 },
    strengths: ['Curiosity', 'Onboarding speed'],
    developmentAreas: ['Asking for context earlier'],
    alignmentStatement: '90-day scores are directional; rater groups are still thin.',
  }),
]

export function getReport360Subjects(surveyId: string): Report360Subject[] {
  return MOCK_360_REPORT_SUBJECTS.filter((subject) => subject.surveyId === surveyId)
}

export function getReport360Subject(surveyId: string, subjectId: string): Report360Subject | undefined {
  return getReport360Subjects(surveyId).find((subject) => subject.id === subjectId)
}

export function countGeneratedReports(surveyId: string): number {
  return getReport360Subjects(surveyId).filter((subject) => subject.generatedDate).length
}

export function evaluatorTotal(subject: Report360Subject): number {
  return Object.values(subject.evaluatorCounts).reduce((sum, value) => sum + value, 0)
}
