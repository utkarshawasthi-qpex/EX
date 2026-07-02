# Percussion Project — Data Models
> Cursor must read this file before writing any component, page, or mock data file.  
> All TypeScript interfaces live in `/src/types/index.ts`. Never define types inline in components.

---

## Shared / Foundation Types

```ts
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
```

---

## Mock Data Shape Reference

When writing mock data files, use these shapes exactly.

### /src/data/mock/employees.ts
Export a const array: `export const mockEmployees: Employee[] = [...]`  
Include 25 employees across 5 departments: Engineering, Product, Sales, HR, Operations.

### /src/data/mock/surveys.ts
Export: `export const mockSurveys: LifecycleSurvey[] = [...]`  
Include 6 surveys: Onboarding D30, Onboarding D90, Exit, Pulse Q1, Annual Engagement, eNPS.

### /src/data/mock/lifecycleRules.ts
Export: `export const mockLifecycleRules: LifecycleRule[] = [...]`  
Include 5 rules covering: hire_date +30, hire_date +90, anniversary, termination_date -7, promotion.

### /src/data/mock/initiatives.ts
Export: `export const mockInitiatives: Initiative[] = [...]`  
Include 10 initiatives across different statuses and owners.  
Export: `export const mockTasks: Task[] = [...]`  
Include 20 tasks spread across initiatives.

### /src/data/mock/raters.ts
Export: `export const mockPrograms360: Program360[] = [...]`  
Export: `export const mockRaterAssignments: RaterAssignment[] = [...]`  
Include 1 program, 5 subjects, each with 4–6 raters across categories.