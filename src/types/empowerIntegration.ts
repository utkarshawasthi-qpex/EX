import type { ID } from '@/types'

export type InitiativeClass = 'team' | 'development'
export type InitiativeProgress = 'on_track' | 'stuck' | 'done'
export type InitiativeLifecycleStatus = 'active' | 'completed'

export type SurveyLinkScope =
  | { kind: 'org' }
  | { kind: 'team'; managerId: ID }
  | { kind: 'filter'; filters: Record<string, string> }

export type SurveyLinkFocus =
  | { kind: 'category'; id: string; label: string }
  | { kind: 'question'; id: string; label: string }
  | { kind: 'competency'; id: string; label: string }

export type SurveyBaselineScores = {
  favorability?: number
  selfScore?: number
  othersAvg?: number
  gap?: number
  respondentCount: number
  capturedAt: string
  surveyStatus: 'closed' | 'live'
}

export type SurveyLatestScores = {
  favorability?: number
  selfScore?: number
  othersAvg?: number
  gap?: number
  respondentCount: number
  sourceSurveyId: string
  computedAt: string
}

export type SurveyLink = {
  surveyId: string
  surveyName: string
  surveyType: 'ex' | '360'
  cycleLabel: string
  scope: SurveyLinkScope
  focus: SurveyLinkFocus
  baseline: SurveyBaselineScores
  latest: SurveyLatestScores | null
}

export type InitiativeTask = {
  id: string
  text: string
  done: boolean
  source: 'ai_recommendation' | 'manual'
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
  class: InitiativeClass
  status: InitiativeLifecycleStatus
  progress: InitiativeProgress
  createdBy: ID
  ownerId: ID
  contributors: ID[]
  dueDate: string
  createdAt: string
  tasks: InitiativeTask[]
  provenance: InitiativeProvenance | null
  surveyLink: SurveyLink | null
  history: InitiativeHistoryEvent[]
}

export type OrgSettings = {
  shareDevelopmentWithManager: boolean
  activeInitiativeCap: number
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
    }
  >
}

export type RaterGroupScores = {
  self?: number
  manager?: number
  peers?: number
  directReports?: number
  respondentCounts: Partial<Record<'self' | 'manager' | 'peers' | 'directReports', number>>
}

export type Competency360Aggregate = {
  id: string
  label: string
  scores: RaterGroupScores
  othersAvg: number | null
  gap: number | null
  totalRaters: number
}

export type Survey360Dataset = {
  id: string
  name: string
  cycleLabel: string
  subjectId: ID
  subjectName: string
  status: 'closed' | 'live'
  totalRatersInvited: number
  totalRatersResponded: number
  competencies: Competency360Aggregate[]
}

export type SurveyDataStore = {
  ex: Record<string, ExSurveyDataset>
  surveys360: Record<string, Survey360Dataset>
}

export type AggregateResult = {
  scores: SurveyBaselineScores
  respondentCount: number
  meetsThreshold: boolean
}

export type EmpowerGoal = {
  id: string
  title: string
}
