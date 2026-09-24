import type { ID } from '@/types'

export type InitiativeProgress = 'on_track' | 'stuck' | 'done'
export type InitiativeLifecycleStatus = 'new' | 'active' | 'completed' | 'closed' | 'cancelled'
export type InitiativeType = 'none' | 'upstream' | 'downstream'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type SurveyLinkScope =
  | { kind: 'org' }
  | { kind: 'team'; managerId: ID }
  | { kind: 'filter'; filters: Record<string, string> }

export type SurveyLinkFocus =
  | { kind: 'category'; id: string; label: string }
  | { kind: 'question'; id: string; label: string }
  | { kind: 'marker'; id: string; label: string }
  | { kind: 'block'; id: string; label: string }

export type ActionPlanCollaboratorTier = 'view' | 'view_assign' | 'co_manage'

export type ActionPlanCollaborator = {
  userId: ID
  tier: ActionPlanCollaboratorTier
  invitedAt: string
  invitedBy: ID
  acceptedAt?: string
}

export type ActionFeedbackResponse = {
  employeeId: ID
  happened: 'yes' | 'no' | 'unsure'
  helped: 'yes' | 'no' | 'unsure'
  wouldRecommend: 'yes' | 'no' | 'unsure'
}

export type ActionFeedbackRequest = {
  sentAt: string
  responses: ActionFeedbackResponse[]
}

export type ManagerNudgePreferences = {
  lastSentAt: string | null
  ignoredStreak: number
  unsubscribed: boolean
}

/** Initiative-level automatic reminder schedule (in-app nudges). */
export type InitiativeReminderFrequency =
  | 'off'
  | 'every_week'
  | 'one_week_before_due'
  | 'two_days_before_due'
  | 'overdue_only'
  | 'before_due_and_overdue'

export type InitiativeReminderSettings = {
  frequency: InitiativeReminderFrequency
  /** Remind only for tasks in these statuses (default: pending + in progress). */
  taskStatuses: TaskStatus[]
  /** Last in-app reminder sent for this initiative (weekly cadence). */
  lastReminderSentAt?: string | null
}

export type SurveyBaseline = {
  favorability?: number
  respondentCount: number
  capturedAt: string
  surveyStatus: 'closed' | 'live'
}

export type SurveyLatest = {
  favorability?: number
  respondentCount: number
  sourceSurveyId: string
  computedAt: string
}

export type SurveyLink = {
  surveyId: string
  surveyName: string
  cycleLabel: string
  scope: SurveyLinkScope
  focus: SurveyLinkFocus
  baseline: SurveyBaseline
  latest: SurveyLatest | null
}

/** Immutable snapshot of survey/dashboard data at action plan creation (not a live survey link). */
export type ActionPlanDataFocus = {
  label: string
  surveyName?: string
  cycleLabel?: string
  favorability?: number
  capturedAt: string
  source: 'dashboard' | 'survey' | 'summary'
  dashboardId?: string
  dashboardName?: string
}

export type InitiativeTask = {
  id: string
  text: string
  description?: string
  ownerId?: string
  contributorIds?: string[]
  dueDate?: string
  status: TaskStatus
  /** Set when status becomes 'completed', cleared when it moves back. */
  completedAt?: string
  source: 'ai_recommendation' | 'manual'
  provenance?: InitiativeProvenance | null
}

export type NewTaskFormInput = {
  text: string
  description?: string
  ownerId: string
  contributorIds: string[]
  dueDate: string
}

export type InitiativeProvenance = {
  sourceSummaryVersionId: string
  sourceWidgetId: string
  promptVersion: string
  recommendationPriority: 1 | 2 | 3 | 4
}

export type InitiativeHistoryEvent = {
  at: string
  event: string
}

export type EmpowerInitiativeRecord = {
  id: ID
  title: string
  description: string
  goalId: string
  type: InitiativeType
  status: InitiativeLifecycleStatus
  progress: InitiativeProgress
  createdBy: ID
  ownerId: ID
  contributors: ID[]
  /** Absent on initiatives created after the due date field was dropped from the form. */
  dueDate?: string
  createdAt: string
  tasks: InitiativeTask[]
  provenance: InitiativeProvenance | null
  /** @deprecated Prototype legacy — new plans use `dataFocus` only. */
  surveyLink: SurveyLink | null
  dataFocus?: ActionPlanDataFocus | null
  history: InitiativeHistoryEvent[]
  collaborators?: ActionPlanCollaborator[]
  actionFeedback?: ActionFeedbackRequest | null
  reminderSettings?: InitiativeReminderSettings
}

/** Portal action planning record (alias for initiatives). */
export type ActionPlanRecord = EmpowerInitiativeRecord

export type OrgSettings = {
  engagement2027Closed?: boolean
}

export type EmpowerNotification = {
  id: string
  message: string
  initiativeId?: string
  read: boolean
  createdAt: string
}

export type FunnelManagerRecord = {
  managerId: ID
  managerName: string
  team: string
  stage: 'viewed' | 'created' | 'updated' | 'completed'
  lastActivity: string
}

export type FunnelSeed = {
  totalManagers: number
  viewed: number
  created: number
  updated: number
  completed: number
  managers: FunnelManagerRecord[]
}

export type ExCategoryAggregate = {
  id: string
  label: string
  favorability: number
  respondentCount: number
  questions?: { id: string; label: string; favorability: number; respondentCount: number }[]
}

export type ExSurveyDataset = {
  id: string
  name: string
  cycleLabel: string
  status: 'closed' | 'live'
  flagged?: boolean
  hidden?: boolean
  orgRespondentCount: number
  categories: ExCategoryAggregate[]
  teamScopes: Record<
    string,
    {
      managerId: string
      respondentCount: number
      categories: ExCategoryAggregate[]
      filterScopes?: Record<string, { respondentCount: number; categories: ExCategoryAggregate[] }>
    }
  >
}

export type SurveyDataStore = {
  ex: Record<string, ExSurveyDataset>
}

export type AggregateResult = {
  favorability?: number
  respondentCount: number
  meetsThreshold: boolean
}

export type EmpowerGoal = {
  id: string
  title: string
  color: string
}

export type SurveyLinkCandidate = {
  widgetId: string
  label: string
  link: SurveyLink
  meetsThreshold: boolean
}
