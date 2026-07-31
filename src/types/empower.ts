export type InitiativeStatus = 'new' | 'active' | 'completed' | 'closed'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'
export type InitiativeGoal =
  | 'improve_engagement'
  | 'retention'
  | 'manager_effectiveness'
  | 'wellbeing'
  | 'communication'
  | 'inclusion'
  | 'growth'
  | 'custom'

export type EmpowerUser = {
  id: string
  name: string
  role: 'admin' | 'manager' | 'contributor'
  avatar: string
  dept: string
}

export interface EmpowerTask {
  id: string
  initiativeId: string
  text: string
  description?: string
  ownerId: string
  contributorIds: string[]
  dueDate: string
  status: TaskStatus
  source: 'manual' | 'ai_recommendation' | 'template'
  provenance?: {
    sourceSummaryVersionId?: string
    sourceWidgetId?: string
    promptVersion?: string
    recommendationPriority?: string
  }
  createdAt: string
}

export interface SurveyLink {
  surveyId: string
  surveyName: string
  cycleLabel: string
  scope: {
    kind: 'org' | 'team' | 'filter'
    managerId?: string
    filters?: { field: string; value: string }[]
  }
  focus: { kind: 'category' | 'question'; id: string; label: string }
  baseline: {
    favorability: number
    respondentCount: number
    capturedAt: string
    surveyStatus: 'closed' | 'live'
  }
  latest: null | {
    favorability: number
    respondentCount: number
    sourceSurveyId: string
    computedAt: string
  }
}

export interface EmpowerInitiative {
  id: string
  name: string
  description: string
  goalId: InitiativeGoal
  status: InitiativeStatus
  createdBy: string
  ownerId: string
  contributors: string[]
  tasks: EmpowerTask[]
  surveyLinks: SurveyLink[]
  provenance?: {
    sourceSummaryVersionId?: string
    sourceWidgetId?: string
    promptVersion?: string
    recommendationPriority?: string
  }
  pinnedToHome: boolean
  history: { at: string; event: string; userId: string }[]
  createdAt: string
  updatedAt: string
}

export interface EmpowerIdea {
  id: string
  title: string
  description: string
  initiativeId?: string
  createdBy: string
  votes: number
  votedBy: string[]
  status: 'active' | 'implemented' | 'declined'
  createdAt: string
}

export interface EmpowerGoalConfig {
  id: InitiativeGoal
  label: string
  color: string
}

export interface HomeAnalytics {
  activeInitiatives: number
  tasksInProgress: number
  newIdeas: number
  topGoals: { goalId: InitiativeGoal; label: string; count: number }[]
  topContributors: { user: EmpowerUser; taskCount: number }[]
}

export type CreateInitiativeInput = {
  name: string
  description: string
  goalId: InitiativeGoal
  createdBy: string
  ownerId: string
  contributors?: string[]
  surveyLinks?: SurveyLink[]
  provenance?: EmpowerInitiative['provenance']
  pinnedToHome?: boolean
}

export type CreateTaskInput = {
  text: string
  description?: string
  ownerId: string
  contributorIds?: string[]
  dueDate: string
  source?: EmpowerTask['source']
  provenance?: EmpowerTask['provenance']
}

export type CreateIdeaInput = {
  title: string
  description: string
  initiativeId?: string
  createdBy: string
}

export const EMPOWER_GOALS: EmpowerGoalConfig[] = [
  { id: 'improve_engagement', label: 'Improve Engagement', color: '#1B87E6' },
  { id: 'retention', label: 'Retention', color: '#16A34A' },
  { id: 'manager_effectiveness', label: 'Manager Effectiveness', color: '#7C3AED' },
  { id: 'wellbeing', label: 'Wellbeing', color: '#DB2777' },
  { id: 'communication', label: 'Communication', color: '#D97706' },
  { id: 'inclusion', label: 'Inclusion', color: '#0891B2' },
  { id: 'growth', label: 'Growth & Development', color: '#65A30D' },
  { id: 'custom', label: 'Custom', color: '#6B7280' },
]
