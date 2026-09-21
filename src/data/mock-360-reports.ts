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
  | 'keyDevelopmentAreas'
  | 'competencyPriorityIndex'
  | 'strengthGrowthIndicators'
  | 'surveyRespondents'
  | 'nominatedRaters'
  | 'aiRecommendations'
  | 'actionPlan'
  | 'customContent'

export const REPORT360_RELATIONSHIPS: Report360Relationship[] = [
  'self',
  'manager',
  'direct_report',
  'peer',
  'external',
]

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

/**
 * REQ-02 — methodology-agnostic default block names. Admin overrides always win;
 * these are only used for new templates and for "Reset to Default Name".
 */
export const REPORT360_BLOCK_DEFAULT_TITLES: Record<Report360BlockType, string> = {
  masterDesign: 'Master Design Settings',
  cover: 'Cover Page',
  introduction: 'Introduction',
  competencyDetail: 'Competency Detail View',
  executiveSummary: 'Executive Summary',
  overallData: 'Top Behaviors Summary',
  spiderChart: 'Spider / Radar Chart',
  gapAnalysis: 'Gap Analysis',
  performanceTrend: 'Performance Trend',
  rankingByRelationship: 'Relationship Breakdown',
  priorityComments: 'Priority Comments & Evidence',
  keyDevelopmentAreas: 'Key Development Areas',
  competencyPriorityIndex: 'Competency Priority Index',
  strengthGrowthIndicators: 'Strength & Growth Indicators',
  surveyRespondents: 'Response Summary',
  nominatedRaters: 'Evaluator Roster',
  aiRecommendations: 'AI Action Recommendations',
  actionPlan: 'Development Action Plan',
  customContent: 'Custom Content Block',
}

/** Blocks where a mean is calculated, so relationship weighting applies. */
export const REPORT360_SCORED_BLOCK_TYPES: Report360BlockType[] = [
  'competencyDetail',
  'executiveSummary',
  'overallData',
  'spiderChart',
  'gapAnalysis',
  'performanceTrend',
  'rankingByRelationship',
  'keyDevelopmentAreas',
  'competencyPriorityIndex',
  'strengthGrowthIndicators',
]

export type Report360OpenQuestion = {
  id: string
  text: string
}

export const REPORT360_OPEN_QUESTIONS: Report360OpenQuestion[] = [
  { id: 'q_open_continue', text: 'What should this person continue doing?' },
  { id: 'q_open_stop', text: 'What should this person stop doing?' },
  { id: 'q_open_start', text: 'What should this person start doing?' },
]

export const REPORT360_BLOCK_DESCRIPTIONS: Record<Report360BlockType, string> = {
  masterDesign: 'This setup will be consistent in all pages of your report',
  cover: 'First page of the report, with subject name and program details',
  introduction: 'How to read this report',
  competencyDetail: 'Every behavior scored by each relationship',
  executiveSummary: 'One-page overview for a debrief conversation',
  overallData: 'Highest-rated behaviors across all relationships',
  spiderChart: 'Competency shape by relationship',
  gapAnalysis: 'Self compared with everyone else',
  performanceTrend: 'Scores across previous cycles',
  rankingByRelationship: 'Top behaviors ranked within each relationship',
  priorityComments: 'Open-ended responses grouped by question',
  keyDevelopmentAreas: 'Lowest-rated behaviors, ordered by priority',
  competencyPriorityIndex: 'Competencies ranked by importance against score',
  strengthGrowthIndicators: 'Strengths and growth areas side by side',
  surveyRespondents: 'Response counts by relationship',
  nominatedRaters: 'Who was nominated and whether they responded',
  aiRecommendations: 'QxBot recommendations from open-ended feedback',
  actionPlan: 'Development commitments with success measures',
  customContent: 'A free-form page you write yourself',
}

export type Report360CoverTemplate = 'classic' | 'centered' | 'split'

export type Report360LogoAsset = {
  name: string
  dataUrl: string
}

export type Report360RelationshipIcon = {
  letter: string
  color: string
}

export type Report360PerformanceCategory = {
  id: string
  label: string
  min: number
  max: number
  color: string
}

export const REPORT360_MERGE_VARIABLES = [
  { token: '${FIRST_NAME_SUBJECT}', description: 'Subject first name' },
  { token: '${LAST_NAME_SUBJECT}', description: 'Subject last name' },
  { token: '${DEPLOYMENT_DATE_MMM_DD_YYYY}', description: 'Deployment date' },
  { token: '${OVERALL_SCORE_PCT}', description: 'Overall score as a percentage' },
  { token: '${PERFORMANCE_CATEGORY}', description: 'Performance category label' },
  { token: '${EVALUATOR_COUNT}', description: 'Number of evaluators' },
  { token: '${PROGRAM_NAME}', description: '360 program name' },
] as const

export type Report360MasterDesign = {
  // Header and footer
  showLogo: boolean
  pageNumbering: boolean
  leftHeaderLogo: Report360LogoAsset | null
  rightHeaderLogo: Report360LogoAsset | null
  headerText: string
  footerText: string
  // Typography and color
  themeColor: string
  fontFamily: string
  fontColor: string
  // Table styling
  tableHeadingTextColor: string
  tableBackground1: string
  tableBackground2: string
  tableBorderColor: string
  // Relationships
  relationshipIcons: Record<Report360Relationship, Report360RelationshipIcon>
  globalWeightsEnabled: boolean
  relationshipWeights: Record<Report360Relationship, number>
  // Category headers
  showCategoryHeaders: boolean
  categoryHeaderTitle: string
  // Scoring
  excludeSelfInAverageScore: boolean
  excludeSelfInPriorityScore: boolean
  performanceCategories: Report360PerformanceCategory[]
  // Content rendering
  pageSize: 'Letter' | 'A4'
  minRatersPerGroup: number
  skipEmptyBlocks: boolean
}

export type Report360Block = {
  id: string
  type: Report360BlockType
  title: string
  defaultTitle: string
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
  itemCount: number
  actionPlanPriorities: string[]
  // REQ-04 cover page
  coverTemplate: Report360CoverTemplate
  coverBackgroundColor: string
  showOverallScoreOnCover: boolean
  showPerformanceCategoryOnCover: boolean
  includeBackCover: boolean
  backCoverLogo: boolean
  contactName: string
  contactEmail: string
  confidentialityNote: string
  // REQ-03 per-question comment attribution
  commentQuestionIds: string[]
  commentDisplayMode: 'grouped' | 'combined'
  showRelationshipLabel: boolean
  // REQ-06 QxBot
  aiDataSource: string
  aiRecommendationCount: number
  showSentimentBar: boolean
  showThemeTags: boolean
  includeReinforcement: boolean
  // Custom Content Block
  customBody: string
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
  responseCounts: Record<Report360Relationship, number>
  importance: number
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
  relationship: Report360Relationship
  text: string
}

export type Report360QxBotCard = {
  title: string
  tag: string
  body: string
  steps: string[]
}

export type Report360Subject = {
  id: string
  surveyId: string
  name: string
  role: string
  /** Seed value used to generate mock ratings. Displayed scores are computed from weights. */
  baselineScore: number
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
    responseCount: number
    generatedAt: string | null
    sentimentPositive: number
    sentimentNeutral: number
    sentimentNegative: number
    cards: Report360QxBotCard[]
    commentInsights: { strengths: string[]; improvements: string[] }
  }
  comments: Record<string, Report360Comment[]>
  nominatedRaters: { name: string; relationship: string; status: string }[]
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

export const DEFAULT_RELATIONSHIP_ICONS: Record<Report360Relationship, Report360RelationshipIcon> = {
  self: { letter: 'S', color: REPORT360_RELATIONSHIP_COLORS.self },
  manager: { letter: 'M', color: REPORT360_RELATIONSHIP_COLORS.manager },
  direct_report: { letter: 'D', color: REPORT360_RELATIONSHIP_COLORS.direct_report },
  peer: { letter: 'P', color: REPORT360_RELATIONSHIP_COLORS.peer },
  external: { letter: 'O', color: REPORT360_RELATIONSHIP_COLORS.external },
}

export const DEFAULT_PERFORMANCE_CATEGORIES: Report360PerformanceCategory[] = [
  { id: 'cat_outstanding', label: 'Outstanding', min: 85, max: 100, color: '#16A34A' },
  { id: 'cat_excellent', label: 'Excellent', min: 75, max: 84, color: '#1B87E6' },
  { id: 'cat_strong', label: 'Strong', min: 65, max: 74, color: '#7C3AED' },
  { id: 'cat_developing', label: 'Developing', min: 55, max: 64, color: '#EA580C' },
  { id: 'cat_attention', label: 'Needs attention', min: 0, max: 54, color: '#DC2626' },
]

function createBlock(
  type: Report360BlockType,
  extras: Partial<Report360Block> = {},
): Report360Block {
  const defaultTitle = REPORT360_BLOCK_DEFAULT_TITLES[type]
  return {
    id: `block_${type}`,
    type,
    title: defaultTitle,
    defaultTitle,
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
    includeInOverallScore: REPORT360_SCORED_BLOCK_TYPES.includes(type),
    useBlockWeights: false,
    relationshipWeights: { ...DEFAULT_WEIGHTS },
    visibleToSubject: true,
    visibleToManager: true,
    visibleToAdmin: true,
    spiderCompetencyIds: REPORT360_COMPETENCIES.map((item) => item.id),
    spiderRelationships: ['self', 'manager', 'direct_report', 'peer'],
    lineStyles: { ...DEFAULT_LINE_STYLES },
    rankingCount: 5,
    itemCount: 5,
    actionPlanPriorities: ['#1', '#2', '#3'],
    coverTemplate: 'classic',
    coverBackgroundColor: '#0B1F4B',
    showOverallScoreOnCover: true,
    showPerformanceCategoryOnCover: true,
    includeBackCover: false,
    backCoverLogo: true,
    contactName: 'People Development Team',
    contactEmail: 'people-development@questionpro.com',
    confidentialityNote:
      'This report is confidential and intended for development purposes only. Do not redistribute.',
    commentQuestionIds: REPORT360_OPEN_QUESTIONS.map((question) => question.id),
    commentDisplayMode: 'grouped',
    showRelationshipLabel: true,
    aiDataSource: 'All open-ended questions',
    aiRecommendationCount: 3,
    showSentimentBar: true,
    showThemeTags: true,
    includeReinforcement: true,
    customBody: '',
    ...extras,
  }
}

export function createDefaultReport360Template(): Report360Template {
  return {
    masterDesign: {
      showLogo: true,
      pageNumbering: true,
      leftHeaderLogo: { name: 'qp.png', dataUrl: '' },
      rightHeaderLogo: null,
      headerText: 'QuestionPro Employee Experience',
      footerText: 'Confidential — for development use only',
      themeColor: '#1B87E6',
      fontFamily: 'Fira Sans',
      fontColor: '#111827',
      tableHeadingTextColor: '#374151',
      tableBackground1: '#FFFFFF',
      tableBackground2: '#F9FAFB',
      tableBorderColor: '#E5E7EB',
      relationshipIcons: { ...DEFAULT_RELATIONSHIP_ICONS },
      globalWeightsEnabled: true,
      relationshipWeights: { ...DEFAULT_WEIGHTS },
      showCategoryHeaders: true,
      categoryHeaderTitle: 'Competency',
      excludeSelfInAverageScore: false,
      excludeSelfInPriorityScore: false,
      performanceCategories: DEFAULT_PERFORMANCE_CATEGORIES.map((category) => ({ ...category })),
      pageSize: 'Letter',
      minRatersPerGroup: 3,
      skipEmptyBlocks: true,
    },
    blocks: [
      createBlock('masterDesign', { enabled: true, locked: true }),
      createBlock('cover', { introduction: '360° Development Report' }),
      createBlock('introduction', {
        introduction:
          'This report summarizes multi-rater feedback for development planning. Scores are shown by relationship and should be read as patterns, not as a performance rating.',
      }),
      createBlock('executiveSummary'),
      createBlock('competencyDetail', {
        dataSource: 'Inclusive Leadership',
        chartType: 'bar',
        meanColumn: true,
        relationshipIcons: true,
        tabularData: true,
        qxBotInsights: true,
      }),
      createBlock('overallData', { enabled: false }),
      createBlock('spiderChart', {
        introduction:
          'Competency scores by relationship. Higher spikes are strengths; dips are opportunities.',
      }),
      createBlock('gapAnalysis'),
      createBlock('performanceTrend'),
      createBlock('keyDevelopmentAreas'),
      createBlock('strengthGrowthIndicators', { enabled: false }),
      createBlock('competencyPriorityIndex', { enabled: false }),
      createBlock('rankingByRelationship', { enabled: false, rankingCount: 5 }),
      createBlock('priorityComments'),
      createBlock('surveyRespondents', { enabled: false }),
      createBlock('nominatedRaters', { enabled: false }),
      createBlock('aiRecommendations', { qxBotInsights: true }),
      createBlock('actionPlan', { enabled: false, actionPlanPriorities: ['#1', '#2', '#3'] }),
      createBlock('customContent', {
        enabled: false,
        customBody:
          'Use this page for a message from leadership, a description of the competency model, or next steps in the development program.',
      }),
    ],
  }
}

/**
 * Preset block sets so admins are not locked into a single methodology.
 * Each preset enables a different slice of the same block library.
 */
export const REPORT360_PRESETS: {
  id: string
  name: string
  description: string
  enabledTypes: Report360BlockType[]
}[] = [
  {
    id: 'preset_traditional',
    name: 'Traditional 360',
    description: 'Scores by relationship, gap analysis, and verbatim comments.',
    enabledTypes: [
      'cover',
      'introduction',
      'competencyDetail',
      'gapAnalysis',
      'rankingByRelationship',
      'priorityComments',
      'surveyRespondents',
    ],
  },
  {
    id: 'preset_competency',
    name: 'Competency 360',
    description: 'Competency-model depth with executive summary and development planning.',
    enabledTypes: [
      'cover',
      'introduction',
      'executiveSummary',
      'competencyDetail',
      'spiderChart',
      'gapAnalysis',
      'keyDevelopmentAreas',
      'competencyPriorityIndex',
      'priorityComments',
      'aiRecommendations',
      'actionPlan',
    ],
  },
  {
    id: 'preset_agile',
    name: 'Agile Lightweight',
    description: 'A short, fast-turnaround report focused on what to do next.',
    enabledTypes: [
      'cover',
      'executiveSummary',
      'strengthGrowthIndicators',
      'priorityComments',
      'aiRecommendations',
    ],
  },
]

export function applyReport360Preset(
  template: Report360Template,
  presetId: string,
): Report360Template {
  const preset = REPORT360_PRESETS.find((item) => item.id === presetId)
  if (!preset) return template
  return {
    ...template,
    blocks: template.blocks.map((block) => ({
      ...block,
      enabled: block.locked ? block.enabled : preset.enabledTypes.includes(block.type),
    })),
  }
}

export function cloneReport360Template(template: Report360Template): Report360Template {
  return {
    masterDesign: {
      ...template.masterDesign,
      relationshipWeights: { ...template.masterDesign.relationshipWeights },
      relationshipIcons: { ...template.masterDesign.relationshipIcons },
      leftHeaderLogo: template.masterDesign.leftHeaderLogo
        ? { ...template.masterDesign.leftHeaderLogo }
        : null,
      rightHeaderLogo: template.masterDesign.rightHeaderLogo
        ? { ...template.masterDesign.rightHeaderLogo }
        : null,
      performanceCategories: template.masterDesign.performanceCategories.map((category) => ({
        ...category,
      })),
    },
    blocks: template.blocks.map((block) => ({
      ...block,
      relationshipWeights: { ...block.relationshipWeights },
      spiderCompetencyIds: [...block.spiderCompetencyIds],
      spiderRelationships: [...block.spiderRelationships],
      lineStyles: { ...block.lineStyles },
      actionPlanPriorities: [...block.actionPlanPriorities],
      commentQuestionIds: [...block.commentQuestionIds],
    })),
  }
}

/**
 * Brings a stored template up to the current shape: new blocks are appended,
 * new fields get defaults, and admin-set custom titles are preserved.
 */
export function migrateReport360Template(stored: Report360Template): Report360Template {
  const fresh = createDefaultReport360Template()
  const storedBlocks = stored.blocks ?? []

  const merged = fresh.blocks.map((freshBlock) => {
    const previous = storedBlocks.find((block) => block.type === freshBlock.type)
    if (!previous) return freshBlock
    const hadCustomTitle = Boolean(
      previous.title && previous.defaultTitle && previous.title !== previous.defaultTitle,
    )
    return {
      ...freshBlock,
      ...previous,
      defaultTitle: freshBlock.defaultTitle,
      title: hadCustomTitle ? previous.title : freshBlock.defaultTitle,
      locked: freshBlock.locked,
      relationshipWeights: { ...freshBlock.relationshipWeights, ...previous.relationshipWeights },
      lineStyles: { ...freshBlock.lineStyles, ...previous.lineStyles },
      spiderCompetencyIds: previous.spiderCompetencyIds ?? freshBlock.spiderCompetencyIds,
      spiderRelationships: previous.spiderRelationships ?? freshBlock.spiderRelationships,
      actionPlanPriorities: previous.actionPlanPriorities ?? freshBlock.actionPlanPriorities,
      commentQuestionIds: previous.commentQuestionIds ?? freshBlock.commentQuestionIds,
    }
  })

  const order = storedBlocks.map((block) => block.type)
  merged.sort((a, b) => {
    const indexA = order.indexOf(a.type)
    const indexB = order.indexOf(b.type)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
  const masterIndex = merged.findIndex((block) => block.type === 'masterDesign')
  if (masterIndex > 0) {
    const [master] = merged.splice(masterIndex, 1)
    merged.unshift(master)
  }

  return {
    masterDesign: {
      ...fresh.masterDesign,
      ...stored.masterDesign,
      relationshipWeights: {
        ...fresh.masterDesign.relationshipWeights,
        ...stored.masterDesign?.relationshipWeights,
      },
      relationshipIcons: {
        ...fresh.masterDesign.relationshipIcons,
        ...stored.masterDesign?.relationshipIcons,
      },
      performanceCategories:
        stored.masterDesign?.performanceCategories?.length
          ? stored.masterDesign.performanceCategories
          : fresh.masterDesign.performanceCategories,
    },
    blocks: merged,
  }
}

const BEHAVIOR_BANK: { competencyId: string; competency: string; text: string; importance: number }[] = [
  {
    competencyId: 'comp_leadership',
    competency: 'Leadership',
    text: 'Sets a clear direction for the team.',
    importance: 82,
  },
  {
    competencyId: 'comp_leadership',
    competency: 'Leadership',
    text: 'Makes timely decisions with incomplete information.',
    importance: 91,
  },
  {
    competencyId: 'comp_leadership',
    competency: 'Leadership',
    text: 'Develops people for the next role.',
    importance: 74,
  },
  {
    competencyId: 'comp_communication',
    competency: 'Communication',
    text: 'Pays focused attention when speaking with others.',
    importance: 63,
  },
  {
    competencyId: 'comp_communication',
    competency: 'Communication',
    text: 'Communicates a compelling vision.',
    importance: 79,
  },
  {
    competencyId: 'comp_collaboration',
    competency: 'Collaboration',
    text: 'Brings people together to make the best decisions.',
    importance: 68,
  },
  {
    competencyId: 'comp_inclusion',
    competency: 'Inclusive Leadership',
    text: 'Listens to and understands diverse viewpoints.',
    importance: 71,
  },
  {
    competencyId: 'comp_inclusion',
    competency: 'Inclusive Leadership',
    text: 'Fosters a team where each member feels included.',
    importance: 66,
  },
  {
    competencyId: 'comp_influence',
    competency: 'Influence',
    text: 'Has effective relationships with diverse stakeholders.',
    importance: 58,
  },
]

function round1(value: number) {
  return Math.round(value * 10) / 10
}

const COMPETENCY_ORDER = REPORT360_COMPETENCIES.map((item) => item.id)

function clamp(value: number) {
  return round1(Math.min(5, Math.max(1, value)))
}

/**
 * `selfBias` shifts the self-rating relative to everyone else, which is what
 * produces blind spots (positive bias) and hidden strengths (negative bias).
 * The per-competency offset keeps a subject from being uniformly off.
 */
function buildBehaviors(
  base: number,
  counts: Record<Report360Relationship, number>,
  selfBias: number,
): Report360BehaviorScore[] {
  return BEHAVIOR_BANK.map((item, index) => {
    const anchor = round1(Math.min(5, Math.max(2.2, base + (index % 3) * 0.15 - 0.2)))
    const competencyOffset = ((COMPETENCY_ORDER as readonly string[]).indexOf(item.competencyId) - 2) * 0.4
    const raw: Record<Report360Relationship, number> = {
      self: clamp(anchor + selfBias + competencyOffset),
      manager: clamp(anchor + 0.3),
      direct_report: clamp(anchor + 0.1),
      peer: clamp(anchor - 0.05),
      external: clamp(anchor + 0.05),
    }
    const scores = {} as Record<Report360Relationship, number | null>
    const responseCounts = {} as Record<Report360Relationship, number>
    REPORT360_RELATIONSHIPS.forEach((relationship) => {
      const responders = counts[relationship] ?? 0
      responseCounts[relationship] = responders
      scores[relationship] = responders > 0 ? raw[relationship] : null
    })
    const present = REPORT360_RELATIONSHIPS.map((key) => scores[key]).filter(
      (value): value is number => value != null,
    )
    const mean = present.length === 0 ? 0 : round1(present.reduce((sum, value) => sum + value, 0) / present.length)
    return {
      id: `beh_${index + 1}`,
      competencyId: item.competencyId,
      competency: item.competency,
      text: item.text,
      importance: item.importance,
      scores,
      responseCounts,
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
        const others = [
          item.scores.manager,
          item.scores.direct_report,
          item.scores.peer,
          item.scores.external,
        ].filter((value): value is number => value != null)
        if (others.length === 0) return sum
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

const DEFAULT_COMMENTS: Record<string, Report360Comment[]> = {
  q_open_continue: [
    {
      relationship: 'manager',
      text: 'Keep running the cross-functional forum — it is the one meeting where decisions actually get made.',
    },
    {
      relationship: 'peer',
      text: 'Continue bringing people in early. Partner teams feel consulted rather than informed.',
    },
    {
      relationship: 'direct_report',
      text: 'Please keep the weekly written update. It is the only place I see the full picture.',
    },
  ],
  q_open_stop: [
    {
      relationship: 'peer',
      text: 'Stop reopening decisions after the group has committed. It resets the work.',
    },
    {
      relationship: 'direct_report',
      text: 'Stop taking the escalation yourself — hand it to the person who owns the area.',
    },
  ],
  q_open_start: [
    {
      relationship: 'manager',
      text: 'Start naming one development focus per quarter so we can track progress together.',
    },
    {
      relationship: 'external',
      text: 'Start sharing the reasoning earlier. Trusted advisor already, but the "why" arrives late.',
    },
    {
      relationship: 'peer',
      text: 'Start closing meetings with who owns what by when.',
    },
  ],
}

function defaultQxBotCards(): Report360QxBotCard[] {
  return [
    {
      title: 'Coach in public, correct in private',
      tag: 'Leadership',
      body: 'Direct reports consistently describe fair process but want more visible recognition of their work.',
      steps: [
        'Schedule two skip-level conversations this month.',
        'Share one decision rationale in the next team meeting.',
        'Ask a direct report to lead a standup recap.',
      ],
    },
    {
      title: 'Close the self versus others gap',
      tag: 'Self-awareness',
      body: 'Self-ratings sit below the manager and peer average on decision-making behaviors.',
      steps: [
        'Ask your manager which behavior they rated highest.',
        'Pick one inclusion behavior to practice for 30 days.',
        'Request a mid-cycle pulse from two peers.',
      ],
    },
    {
      title: 'Turn comments into a 90-day plan',
      tag: 'Development planning',
      body: 'Multiple rater groups raised decision speed, which makes it the highest-value place to start.',
      steps: [
        'Choose the top priority comment and write a success metric.',
        'Pair with a peer coach for monthly check-ins.',
        'Review progress in your next 1:1.',
      ],
    },
    {
      title: 'Protect the deep-work block',
      tag: 'Focus',
      body: 'Comments mention slow written responses during weeks with heavy meeting load.',
      steps: [
        'Block two 90-minute focus sessions each week.',
        'Move status updates to an async doc.',
        'Decline meetings without an agenda.',
      ],
    },
    {
      title: 'Make priorities visible',
      tag: 'Communication',
      body: 'Peers report they are unsure which of three initiatives matters most this quarter.',
      steps: [
        'Publish a one-page quarterly priority list.',
        'Restate the top priority at the start of each staff meeting.',
        'Retire one initiative that no longer fits.',
      ],
    },
  ]
}

function createSubject(params: {
  id: string
  surveyId: string
  name: string
  role: string
  baselineScore: number
  generatedDate: string | null
  evaluatorCounts?: Partial<Record<Report360Relationship, number>>
  strengths: string[]
  developmentAreas: string[]
  alignmentStatement: string
  comments?: Record<string, Report360Comment[]>
  includeTrend?: boolean
  qxBotGeneratedAt?: string | null
  /** Positive: rates self above others. Negative: rates self below others. */
  selfBias?: number
}): Report360Subject {
  const counts: Record<Report360Relationship, number> = {
    self: 1,
    manager: 1,
    direct_report: 4,
    peer: 5,
    external: 1,
    ...params.evaluatorCounts,
  }
  const behaviors = buildBehaviors(params.baselineScore / 20, counts, params.selfBias ?? 0)
  const comments = params.comments ?? DEFAULT_COMMENTS
  const commentCount = Object.values(comments).reduce((sum, list) => sum + list.length, 0)
  return {
    id: params.id,
    surveyId: params.surveyId,
    name: params.name,
    role: params.role,
    baselineScore: params.baselineScore,
    generatedDate: params.generatedDate,
    evaluatorCounts: counts,
    behaviors,
    gaps: buildGaps(behaviors),
    trend: params.includeTrend === false ? [] : buildTrend(params.baselineScore),
    strengths: params.strengths,
    developmentAreas: params.developmentAreas,
    alignmentStatement: params.alignmentStatement,
    qxBot: {
      responseCount: commentCount,
      generatedAt: params.qxBotGeneratedAt ?? params.generatedDate,
      sentimentPositive: Math.min(78, params.baselineScore - 4),
      sentimentNeutral: 14,
      sentimentNegative: Math.max(8, 100 - params.baselineScore - 10),
      cards: defaultQxBotCards(),
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
    comments,
    nominatedRaters: [
      { name: 'Rajesh Kumar', relationship: 'Manager', status: 'Completed' },
      { name: 'Nina Patel', relationship: 'Direct Report', status: 'Completed' },
      { name: 'Omar Haddad', relationship: 'Direct Report', status: 'Completed' },
      { name: 'Grace Liu', relationship: 'Peer', status: 'Completed' },
      { name: 'Chris Vogel', relationship: 'Peer', status: 'Opened' },
      { name: 'Dana Ruiz', relationship: 'External', status: 'Invited' },
    ],
    actionPlanItems: [
      {
        priority: '#1',
        behavior: 'Makes timely decisions with incomplete information.',
        action: 'Time-box two decisions per week and share the rationale in Slack.',
      },
      {
        priority: '#2',
        behavior: 'Develops people for the next role.',
        action: 'Run a career 1:1 with each direct report this month.',
      },
      {
        priority: '#3',
        behavior: 'Communicates a compelling vision.',
        action: 'Open the next all-hands with a 3-slide “where we are going” story.',
      },
    ],
  }
}

export const MOCK_360_REPORT_SUBJECTS: Report360Subject[] = [
  createSubject({
    id: 'sub_sarah_mehta',
    surveyId: 'surv360_leadership_2025',
    name: 'Sarah Mehta',
    role: 'Senior Manager',
    baselineScore: 76,
    generatedDate: '2025-06-12T10:00:00.000Z',
    strengths: ['Inclusive facilitation', 'Stakeholder relationships', 'Follow-through'],
    developmentAreas: ['Decision speed', 'Visible career coaching', 'Closing the loop'],
    alignmentStatement:
      'Others rate Sarah slightly higher than she rates herself — a constructive, modest self-view.',
  }),
  createSubject({
    id: 'sub_arun_sharma',
    surveyId: 'surv360_leadership_2025',
    name: 'Arun Sharma',
    role: 'Director',
    baselineScore: 82,
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
    baselineScore: 71,
    generatedDate: '2025-06-10T09:00:00.000Z',
    strengths: ['Peer collaboration', 'Listening'],
    developmentAreas: ['Setting direction', 'Holding the bar'],
    alignmentStatement:
      'Priya rates herself above peers on direction-setting; others want more explicit priorities.',
    selfBias: 1,
  }),
  createSubject({
    id: 'sub_raj_patel',
    surveyId: 'surv360_leadership_2025',
    name: 'Raj Patel',
    role: 'Analyst',
    baselineScore: 64,
    generatedDate: '2025-06-09T09:00:00.000Z',
    evaluatorCounts: { self: 1, manager: 1, direct_report: 0, peer: 4, external: 0 },
    strengths: ['Reliability', 'Peer support'],
    developmentAreas: ['Influence without authority', 'Executive presence'],
    alignmentStatement:
      'No Direct Report or External evaluators — those columns are omitted from this report.',
  }),
  createSubject({
    id: 'sub_alexandria',
    surveyId: 'surv360_leadership_2025',
    name: 'Alexandria-Catherine Montgomery-Whitaker',
    role: 'Principal Program Manager, Global Workforce Experience Operations',
    baselineScore: 88,
    generatedDate: '2025-06-08T14:00:00.000Z',
    strengths: ['Inclusive leadership', 'Stakeholder orchestration', 'Coaching'],
    developmentAreas: ['Protecting focus time'],
    alignmentStatement: 'Consistently high scores across relationships with little self-other gap.',
    selfBias: 0,
  }),
  createSubject({
    id: 'sub_maya_okonkwo',
    surveyId: 'surv360_leadership_2025',
    name: 'Maya Okonkwo',
    role: 'Engineering Manager',
    baselineScore: 69,
    generatedDate: null,
    strengths: ['Technical mentoring', 'Fair process'],
    developmentAreas: ['Upward communication', 'Celebrating wins'],
    alignmentStatement: 'First cycle for Maya, so there is no prior-year trend to compare against.',
    includeTrend: false,
    selfBias: 0.5,
  }),
  createSubject({
    id: 'sub_james_whitfield',
    surveyId: 'surv360_leadership_2025',
    name: 'James Whitfield',
    role: 'Sales Manager',
    baselineScore: 79,
    generatedDate: '2025-06-07T11:00:00.000Z',
    strengths: ['Energy in the room', 'Customer advocacy'],
    developmentAreas: ['Listening before pitching', 'Peer coordination'],
    alignmentStatement: 'Manager scores lead self scores — others see more leadership than James claims.',
    selfBias: -1,
  }),
  createSubject({
    id: 'sub_elena_vasquez',
    surveyId: 'surv360_leadership_2025',
    name: 'Elena Vasquez',
    role: 'People Partner',
    baselineScore: 84,
    generatedDate: '2025-06-06T16:00:00.000Z',
    strengths: ['Psychological safety', 'Difficult conversations'],
    developmentAreas: ['Saying no to extra programs'],
    alignmentStatement: 'High alignment between self, manager, and peers.',
  }),
  createSubject({
    id: 'sub_tom_bergstrom',
    surveyId: 'surv360_leadership_2025',
    name: 'Tom Bergström',
    role: 'Finance Manager',
    baselineScore: 74,
    generatedDate: '2025-06-05T09:00:00.000Z',
    strengths: ['Analytical rigor', 'Audit readiness'],
    developmentAreas: ['Storytelling with numbers'],
    alignmentStatement: 'Ratings are stable, but no evaluator left written feedback this cycle.',
    comments: {},
  }),
  createSubject({
    id: 'sub_david_park',
    surveyId: 'surv360_manager_q1',
    name: 'David Park',
    role: 'Engineering Manager',
    baselineScore: 80,
    generatedDate: '2026-03-10T10:00:00.000Z',
    strengths: ['Clear expectations', 'Timely feedback'],
    developmentAreas: ['Workload leveling'],
    alignmentStatement:
      'Direct reports rate David higher than he rates himself on feedback quality.',
    selfBias: -0.6,
  }),
  createSubject({
    id: 'sub_lisa_wang',
    surveyId: 'surv360_manager_q1',
    name: 'Lisa Wang',
    role: 'Customer Success Manager',
    baselineScore: 58,
    generatedDate: null,
    evaluatorCounts: { self: 1, manager: 1, direct_report: 2, peer: 1, external: 0 },
    strengths: ['Customer empathy'],
    developmentAreas: ['Team coaching', 'Prioritization'],
    alignmentStatement:
      'Direct Report and Peer groups are below the confidentiality threshold, so they are reported as Combined others.',
    comments: {
      q_open_continue: [
        { relationship: 'manager', text: 'Keep protecting renewal accounts during the transition.' },
      ],
      q_open_start: [
        { relationship: 'manager', text: 'Start delegating the weekly account review.' },
      ],
    },
  }),
  createSubject({
    id: 'sub_noah_kim',
    surveyId: 'surv360_manager_q1',
    name: 'Noah Kim',
    role: 'Operations Lead',
    baselineScore: 73,
    generatedDate: '2026-03-08T10:00:00.000Z',
    strengths: ['Process clarity', 'Cross-team handoffs'],
    developmentAreas: ['Coaching depth'],
    alignmentStatement:
      'Self and others agree on process strength and coaching as the stretch area.',
  }),
  createSubject({
    id: 'sub_amira_hassan',
    surveyId: 'surv360_newhire_90',
    name: 'Amira Hassan',
    role: 'Associate Product Manager',
    baselineScore: 70,
    generatedDate: '2025-08-20T10:00:00.000Z',
    evaluatorCounts: { self: 1, manager: 1, direct_report: 0, peer: 3, external: 1 },
    strengths: ['Curiosity', 'Onboarding speed'],
    developmentAreas: ['Asking for context earlier'],
    alignmentStatement: '90-day scores are directional; rater groups are still thin.',
    includeTrend: false,
  }),
]

export function getReport360Subjects(surveyId: string): Report360Subject[] {
  return MOCK_360_REPORT_SUBJECTS.filter((subject) => subject.surveyId === surveyId)
}

export function getReport360Subject(
  surveyId: string,
  subjectId: string,
): Report360Subject | undefined {
  return getReport360Subjects(surveyId).find((subject) => subject.id === subjectId)
}

export function countGeneratedReports(surveyId: string): number {
  return getReport360Subjects(surveyId).filter((subject) => subject.generatedDate).length
}

export function evaluatorTotal(subject: Report360Subject): number {
  return Object.values(subject.evaluatorCounts).reduce((sum, value) => sum + value, 0)
}

export function getOpenQuestion(questionId: string): Report360OpenQuestion | undefined {
  return REPORT360_OPEN_QUESTIONS.find((question) => question.id === questionId)
}
