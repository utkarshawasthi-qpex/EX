// /src/types/index.ts

// ─── SHARED ──────────────────────────────────────────────────────────────────

export type ID = string

export type UserRole = 'hr_admin' | 'manager' | 'employee' | 'executive' | 'initiative_owner'

export type User = {
  id: ID
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  department?: string
}

export type SelectOption = {
  value: string
  label: string
}

// ─── EMPLOYEE ────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'

export type Employee = {
  id: ID
  firstName: string
  lastName: string
  email: string
  department: string
  location: string
  jobTitle: string
  jobLevel?: string
  hireDate: string           // ISO date string: '2023-04-15'
  terminationDate?: string   // ISO date string, only if terminated
  status: EmployeeStatus
  managerId?: ID
  customFields?: Record<string, string>
}

// Derived helper
export type EmployeeGroup = {
  id: ID
  name: string
  employeeIds: ID[]
  createdAt: string
}

// ─── SURVEYS (shared across Lifecycle + 360) ─────────────────────────────────

export type SurveyType = 'lifecycle' | '360' | 'pulse' | 'engagement' | 'exit' | 'onboarding'

export type SurveyStatus = 'draft' | 'active' | 'paused' | 'closed' | 'archived'

export type QuestionType = 'rating_scale' | 'multiple_choice' | 'open_text' | 'enps' | 'yes_no'

export type Question = {
  id: ID
  text: string
  type: QuestionType
  required: boolean
  markerId?: ID              // For lifecycle surveys: which Marker this belongs to
  competencyId?: ID          // For 360 surveys: which competency this belongs to
  ratingScale?: {
    min: number
    max: number
    labels?: Record<number, string>  // e.g. { 1: 'Never', 5: 'Always' }
  }
  options?: string[]         // For multiple_choice
  branchingRules?: BranchingRule[]
}

export type BranchingRule = {
  questionId: ID
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than'
  value: string | number
  showQuestionIds: ID[]
}

export type SurveyResponse = {
  id: ID
  surveyId: ID
  employeeId?: ID            // undefined if anonymous
  respondedAt: string
  answers: {
    questionId: ID
    value: string | number | string[]
  }[]
}

// ─── LIFECYCLE SURVEYS ───────────────────────────────────────────────────────

export type Marker = {
  id: ID
  name: string
  description?: string
  order: number
  questionIds: ID[]
}

export type LifecycleSurvey = {
  id: ID
  title: string
  type: SurveyType
  status: SurveyStatus
  markers: Marker[]
  questions: Question[]
  anonymityThreshold: number   // min respondents before scores shown
  languages: string[]          // e.g. ['en', 'es', 'fr']
  createdAt: string
  updatedAt: string
  createdBy: ID
  responseCount: number
  responseRate?: number        // 0–100
}

export type SurveyTemplate = {
  id: ID
  title: string
  provider: string
  description: string
  category:
    | 'custom'
    | 'culture'
    | 'recruiting'
    | 'onboarding'
    | 'wellness'
    | 'exit'
    | 'engagement'
    | 'partner'
  surveyType: SurveyType
  questionCount: number
  isPartnerContent?: boolean
  markers?: {
    id: ID
    name: string
    buildingBlocks: {
      id: ID
      name: string
      questions: string[]
    }[]
  }[]
}

export type LifecycleTriggerEvent =
  | 'hire_date'
  | 'termination_date'
  | 'job_change'
  | 'promotion'
  | 'anniversary'
  | 'custom_field_change'

export type RuleStatus = 'active' | 'paused' | 'archived'

export type LifecycleRule = {
  id: ID
  name: string
  triggerEvent: LifecycleTriggerEvent
  delayDays: number            // positive = after event, negative = before event
  surveyId: ID
  status: RuleStatus
  audienceFilter?: AudienceFilter
  createdAt: string
  lastRunAt?: string
  totalDeployments: number
}

export type AudienceFilter = {
  conditions: FilterCondition[]
  operator: 'AND' | 'OR'
}

export type FilterCondition = {
  field: keyof Employee | string    // e.g. 'department', 'location', 'jobLevel'
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string
}

export type DeploymentStatus = 'sent' | 'delivered' | 'opened' | 'responded' | 'bounced'

export type SurveyDeployment = {
  id: ID
  surveyId: ID
  employeeId: ID
  sentAt: string
  status: DeploymentStatus
  respondedAt?: string
  ruleId?: ID                  // populated if triggered by a lifecycle rule
}

// ─── EMPOWER 360 ─────────────────────────────────────────────────────────────

export type RaterCategory = 'self' | 'manager' | 'peer' | 'direct_report' | 'external'

export type Competency = {
  id: ID
  name: string
  description?: string
  order: number
  questionIds: ID[]
}

export type Assessment360 = {
  id: ID
  title: string
  status: SurveyStatus
  competencies: Competency[]
  questions: Question[]
  ratingScale: {
    min: number
    max: number
    labels: Record<number, string>
  }
  displayLabels?: Partial<Record<RaterCategory, string>>   // custom label overrides
  anonymityThresholds: Partial<Record<RaterCategory, number>>
  brandingLogoUrl?: string
  introductoryText?: string
  createdAt: string
  updatedAt: string
}

export type RaterStatus = 'invited' | 'opened' | 'completed' | 'declined'

export type RaterAssignment = {
  id: ID
  programId: ID
  subjectId: ID              // Employee being assessed
  raterId: ID                // Employee providing the rating
  category: RaterCategory
  status: RaterStatus
  invitedAt?: string
  completedAt?: string
  externalEmail?: string     // for external raters not in the system
}

export type Program360 = {
  id: ID
  assessmentId: ID
  title: string
  status: 'draft' | 'active' | 'closed' | 'archived'
  subjectIds: ID[]
  openDate: string
  closeDate: string
  responseRate: number       // 0–100 across all subjects
  createdAt: string
}

export type CompetencyScore = {
  competencyId: ID
  scores: Partial<Record<RaterCategory, number>>   // avg score per rater category
  overallScore: number
}

export type SubjectReport = {
  subjectId: ID
  programId: ID
  competencyScores: CompetencyScore[]
  overallScore: number
  gapAnalysis: {
    competencyId: ID
    selfScore: number
    othersAvgScore: number
    gap: number              // others - self; positive = others rate higher
  }[]
  openTextFeedback: {
    competencyId: ID
    category: RaterCategory
    text: string
  }[]
}

// ─── EMPOWER EX (ACTION PLANNING) ────────────────────────────────────────────

export type InitiativeStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Initiative = {
  id: ID
  title: string
  description: string
  status: InitiativeStatus
  priority: Priority
  ownerId: ID
  linkedSurveyId?: ID
  linkedMarkerId?: ID        // which survey theme triggered this
  dueDate?: string
  createdAt: string
  updatedAt: string
  upstreamIds: ID[]          // parent initiative IDs
  downstreamIds: ID[]        // child initiative IDs
  goalIds: ID[]              // linked organizational goals
  taskIds: ID[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type Task = {
  id: ID
  initiativeId: ID
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  ownerId: ID
  dueDate?: string
  createdAt: string
  completedAt?: string
}

export type Note = {
  id: ID
  initiativeId: ID
  authorId: ID
  body: string               // plain text or markdown
  createdAt: string
  updatedAt?: string
}

export type Idea = {
  id: ID
  title: string
  description: string
  authorId?: ID              // undefined if anonymous
  category: string
  votes: number
  voterIds: ID[]
  status: 'pending' | 'approved' | 'promoted' | 'rejected'
  promotedInitiativeId?: ID
  createdAt: string
  flagged?: boolean
}

export type Conversation = {
  id: ID
  title: string
  initiativeId?: ID
  participantIds: ID[]
  createdBy: ID
  createdAt: string
  messages: ConversationMessage[]
}

export type ConversationMessage = {
  id: ID
  conversationId: ID
  authorId: ID
  body: string
  createdAt: string
  reactions?: { emoji: string; userIds: ID[] }[]
  flagged?: boolean
}

export type Goal = {
  id: ID
  title: string
  description?: string
  ownerId: ID
  targetDate?: string
  initiativeIds: ID[]
  progress: number           // 0–100 derived from linked initiative completion
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export type FavorabilityScore = {
  markerId?: ID
  competencyId?: ID
  label: string
  score: number              // 0–100 favorability %
  responseCount: number
  benchmark?: number         // comparison benchmark score
  delta?: number             // vs prior period
}

export type TrendDataPoint = {
  date: string               // ISO date string
  score: number
  label?: string
}

export type ENPSData = {
  score: number              // -100 to +100
  promoters: number          // % of respondents
  passives: number
  detractors: number
  responseCount: number
}

export type DashboardAccess = 'private' | 'custom' | 'global'

export type ViewerCapabilities = {
  canEdit: boolean
  canExport: boolean
  canFilter: boolean
  canAddWidgets: boolean
  canDeleteWidgets: boolean
  isOwner: boolean
}

export type SummaryVisibilityMode = 'private' | 'everyone'

export type SummaryAdminConfig = {
  visibility: SummaryVisibilityMode
  allowEmployeeSummaries: boolean
  companyContent?: SummaryContent
  createdBy: ID
  isGenerating: boolean
  generationError?: 'no_data' | 'api_error'
}

export type ManagerSummaryCache = {
  userId: ID
  content: SummaryContent
  generatedAt: string
  dataFilters: ActiveFilter[]
}

export type SummaryPriority = 1 | 2 | 3 | 4

export type SummaryAction = {
  id: string
  action: string
  timeframe: '30 days' | '60 days' | '90 days'
  owner: 'Manager' | 'HR' | 'Leadership'
  priority: SummaryPriority
  context: string
  linkedInitiativeId?: string
}

export type SummarySharedSnapshot = {
  summary: string
  actions: SummaryAction[]
  sharedAt: string
}

export type StalenessReason = 'filters' | 'widgets' | 'both'

export type SummaryContent = {
  summary: string
  actions: SummaryAction[]
  summaryRegenerationsUsed: number
  recsRegenerationsUsed: number
  isStale: boolean
  stalenessReason?: StalenessReason | null
  generatedAtFilters: ActiveFilter[]
  generatedAtWidgetIds: string[]
  sharedSnapshot: SummarySharedSnapshot | null
  summaryFeedback: 'up' | 'down' | null
  summaryFeedbackReason: string | null
  actionFeedback: Record<SummaryPriority, 'up' | 'down' | null>
  generatedBy: string
  generatedAt: string
  lastFullUpdateAt: string
}

export type FilterField = {
  id: string
  label: string
  values: string[]
}

export type ActiveFilter = {
  fieldId: string
  fieldLabel: string
  value: string
}

export type SummaryFeedbackRecord = {
  summaryId: ID
  versionId: string
  userId: ID
  rating: 'up' | 'down'
  comment?: string
  createdAt: string
}

export type OrgContextCategory =
  | 'policy'
  | 'initiative'
  | 'to_do'
  | 'not_to_do'
  | 'guideline'
  | 'kpi'

export type OrgContextFile = {
  id: ID
  name: string
  sizeLabel: string
  extension: string
  category: OrgContextCategory
  uploadedAt: string
}

export type OrgContextNote = {
  id: ID
  text: string
  category: OrgContextCategory
  addedAt: string
}

export type OrgContext = {
  files: OrgContextFile[]
  notes: OrgContextNote[]
}

export type AiSummaryFileSlotKey = 'policy' | 'guidelines' | 'initiative'

export type AiSummaryFileRecord = {
  name: string
  sizeBytes: number
  pageCount: number | null
  extractedText: string
  tokenEstimate: number
  uploadedAt: string
}

export type AiSummaryOrgContext = {
  files: Record<AiSummaryFileSlotKey, AiSummaryFileRecord | null>
  textFields: {
    todo: string
    notToDo: string
    kpis: string
  }
  updatedAt: string
}

export type AiSummaryOrgContextInputKey =
  | AiSummaryFileSlotKey
  | 'todo'
  | 'notToDo'
  | 'kpis'

export type AiSummaryOrgContextBudgetSegment = {
  key: AiSummaryOrgContextInputKey
  label: string
  tokens: number
}

export type LogoAlignment = 'left' | 'center' | 'right'
export type ImageLayout = 'full' | 'left' | 'right' | 'top'

export type PptFontConfig = {
  family: string
  size: number
  bold: boolean
  color: string
  alignment: 'left' | 'center' | 'right'
}

export type PptTemplate = {
  id: ID
  name: string
  themeColor: string
  isActive: boolean
  isDefault: boolean
  confidentialityEnabled: boolean
  confidentialityText: string
  firstSlide: {
    logoAlignment: LogoAlignment
    title: string
    titleFont: PptFontConfig
    description: string
    descriptionFont: PptFontConfig
    coverImageLayout: ImageLayout
  }
  widgetSlide: {
    logoAlignment: LogoAlignment
    headingFont: PptFontConfig
  }
  lastSlide: {
    closingImageAlignment: LogoAlignment
    closingText: string
    closingTextFont: PptFontConfig
  }
  createdAt: string
}

export type PptExportWidget = {
  id: ID
  type: WidgetType
  title: string
  selected: boolean
}

export type WidgetType =
  | 'response_rate'
  | 'scorecard'
  | 'enps'
  | 'heatmap'
  | 'text_analysis'
  | 'text_report'
  | 'survey_comparison'
  | 'time_trend'
  | 'notes'
  | 'single_question'
  | 'driver_analysis'
  | 'summary'

export type WidgetSurveySource = {
  surveyId: ID
  surveyName: string
  surveyType: 'ex'
  surveyCycleYear: string
}

export type DashboardWidget = {
  id: ID
  type: WidgetType
  title: string
  surveyId?: ID
  surveySource?: WidgetSurveySource
  appliedFilters?: Record<string, string>
  width: 'full' | 'half'
  order: number
  config?: Record<string, unknown>
  summaryConfig?: SummaryAdminConfig & {
    /** @deprecated use companyContent */
    content?: SummaryContent
  }
  layout?: {
    x: number
    y: number
    w: number
    h: number
  }
}

export type DashboardTab = {
  id: ID
  name: string
  order: number
  widgets: DashboardWidget[]
  customGroups?: string[]
}

export type Dashboard = {
  id: ID
  name: string
  access: DashboardAccess
  isHome?: boolean
  authorEmail: string
  createdAt: string
  tabs: DashboardTab[]
}

export function getDashboardCapabilities(
  dashboard: Dashboard,
  user: { email: string; role: 'hr_admin' | 'manager' | 'employee' },
): ViewerCapabilities {
  const isOwner = dashboard.authorEmail === user.email || user.role === 'hr_admin'

  return {
    canEdit: isOwner,
    canExport: true,
    canFilter: true,
    canAddWidgets: isOwner,
    canDeleteWidgets: isOwner,
    isOwner,
  }
}
