import { addDays, subDays } from 'date-fns'
import { getCurrentUser as getPortalUser } from '@/lib/userContext'
import {
  EMPOWER_GOALS,
  type CreateIdeaInput,
  type CreateInitiativeInput,
  type CreateTaskInput,
  type EmpowerIdea,
  type EmpowerInitiative,
  type EmpowerTask,
  type EmpowerUser,
  type HomeAnalytics,
  type InitiativeGoal,
  type InitiativeStatus,
  type SurveyLink,
  type TaskStatus,
} from '@/types/empower'

const INITIATIVES_KEY = 'pp_empower_initiatives'
const IDEAS_KEY = 'pp_empower_ideas'
const USERS_KEY = 'pp_empower_users'

export const SEEDED_USERS: EmpowerUser[] = [
  { id: 'u1', name: 'Sarah Chen', role: 'admin', avatar: 'SC', dept: 'HR' },
  { id: 'u2', name: 'Marcus Lee', role: 'manager', avatar: 'ML', dept: 'Engineering' },
  { id: 'u3', name: 'Priya Sharma', role: 'manager', avatar: 'PS', dept: 'Sales' },
  { id: 'u4', name: 'James Okafor', role: 'manager', avatar: 'JO', dept: 'Product' },
  { id: 'u5', name: 'Aisha Patel', role: 'contributor', avatar: 'AP', dept: 'HR' },
  { id: 'u6', name: 'Raj Singh', role: 'contributor', avatar: 'RS', dept: 'Engineering' },
]

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isoDateTime(date: Date): string {
  return date.toISOString()
}

function makeTask(
  initiativeId: string,
  id: string,
  text: string,
  ownerId: string,
  dueDate: Date,
  status: TaskStatus,
  createdAt: Date,
): EmpowerTask {
  return {
    id,
    initiativeId,
    text,
    ownerId,
    contributorIds: [],
    dueDate: isoDate(dueDate),
    status,
    source: 'manual',
    createdAt: isoDateTime(createdAt),
  }
}

function makeSurveyLink(input: {
  surveyId: string
  surveyName: string
  cycleLabel: string
  focusId: string
  focusLabel: string
  scope: SurveyLink['scope']
  baseline: number
  baselineRespondents: number
  capturedAt: Date
  latest?: { favorability: number; respondents: number; sourceSurveyId: string; computedAt: Date }
}): SurveyLink {
  return {
    surveyId: input.surveyId,
    surveyName: input.surveyName,
    cycleLabel: input.cycleLabel,
    scope: input.scope,
    focus: { kind: 'category', id: input.focusId, label: input.focusLabel },
    baseline: {
      favorability: input.baseline,
      respondentCount: input.baselineRespondents,
      capturedAt: isoDateTime(input.capturedAt),
      surveyStatus: 'closed',
    },
    latest: input.latest
      ? {
          favorability: input.latest.favorability,
          respondentCount: input.latest.respondents,
          sourceSurveyId: input.latest.sourceSurveyId,
          computedAt: isoDateTime(input.latest.computedAt),
        }
      : null,
  }
}

function buildSeedInitiatives(now = new Date()): EmpowerInitiative[] {
  const communicationCreated = subDays(now, 14)
  const recognitionCreated = subDays(now, 30)
  const growthCreated = subDays(now, 60)
  const coachingCreated = subDays(now, 2)
  const wellbeingCreated = subDays(now, 90)

  return [
    {
      id: 'empower_init_communication',
      name: 'Improve Manager Communication Cadence',
      description:
        'Give the Engineering team clearer, more frequent updates on priorities, decisions, and follow-through.',
      goalId: 'communication',
      status: 'active',
      createdBy: 'u1',
      ownerId: 'u2',
      contributors: ['u6'],
      tasks: [
        makeTask(
          'empower_init_communication',
          'task_communication_1',
          'Agree on a weekly team update format',
          'u2',
          subDays(now, 3),
          'completed',
          communicationCreated,
        ),
        makeTask(
          'empower_init_communication',
          'task_communication_2',
          'Publish the first decision and priorities update',
          'u2',
          addDays(now, 3),
          'in_progress',
          communicationCreated,
        ),
        makeTask(
          'empower_init_communication',
          'task_communication_3',
          'Collect team feedback on the new cadence',
          'u6',
          addDays(now, 21),
          'todo',
          communicationCreated,
        ),
      ],
      surveyLinks: [
        makeSurveyLink({
          surveyId: 'surv_engagement_2026',
          surveyName: 'Engagement 2026',
          cycleLabel: '2026 Annual',
          focusId: 'cat_transparency',
          focusLabel: 'Transparency',
          scope: { kind: 'team', managerId: 'u2' },
          baseline: 44,
          baselineRespondents: 14,
          capturedAt: communicationCreated,
        }),
      ],
      pinnedToHome: true,
      history: [
        { at: isoDateTime(communicationCreated), event: 'Initiative created', userId: 'u1' },
      ],
      createdAt: isoDateTime(communicationCreated),
      updatedAt: isoDateTime(now),
    },
    {
      id: 'empower_init_recognition',
      name: 'Build Recognition Framework',
      description:
        'Create a repeatable way for teams to recognize strong work and reinforce the behaviors the company values.',
      goalId: 'retention',
      status: 'active',
      createdBy: 'u1',
      ownerId: 'u3',
      contributors: ['u5'],
      tasks: [
        makeTask(
          'empower_init_recognition',
          'task_recognition_1',
          'Interview managers about current recognition practices',
          'u3',
          subDays(now, 14),
          'completed',
          recognitionCreated,
        ),
        makeTask(
          'empower_init_recognition',
          'task_recognition_2',
          'Draft recognition criteria',
          'u5',
          subDays(now, 4),
          'completed',
          recognitionCreated,
        ),
        makeTask(
          'empower_init_recognition',
          'task_recognition_3',
          'Pilot the framework with Sales',
          'u3',
          addDays(now, 7),
          'in_progress',
          recognitionCreated,
        ),
        makeTask(
          'empower_init_recognition',
          'task_recognition_4',
          'Publish the company-wide rollout plan',
          'u5',
          addDays(now, 45),
          'todo',
          recognitionCreated,
        ),
      ],
      surveyLinks: [],
      pinnedToHome: true,
      history: [{ at: isoDateTime(recognitionCreated), event: 'Initiative created', userId: 'u1' }],
      createdAt: isoDateTime(recognitionCreated),
      updatedAt: isoDateTime(now),
    },
    {
      id: 'empower_init_growth',
      name: 'Launch Growth & Development Program',
      description:
        'Give employees clearer development paths through role guides, growth conversations, and practical learning opportunities.',
      goalId: 'growth',
      status: 'active',
      createdBy: 'u1',
      ownerId: 'u4',
      contributors: ['u5', 'u6'],
      tasks: [
        makeTask('empower_init_growth', 'task_growth_1', 'Map priority role families', 'u4', subDays(now, 40), 'completed', growthCreated),
        makeTask('empower_init_growth', 'task_growth_2', 'Draft role growth guides', 'u5', subDays(now, 28), 'completed', growthCreated),
        makeTask('empower_init_growth', 'task_growth_3', 'Train managers on growth conversations', 'u4', subDays(now, 18), 'completed', growthCreated),
        makeTask('empower_init_growth', 'task_growth_4', 'Launch employee learning sessions', 'u6', subDays(now, 9), 'completed', growthCreated),
        makeTask('empower_init_growth', 'task_growth_5', 'Publish the final development toolkit', 'u4', subDays(now, 5), 'in_progress', growthCreated),
      ],
      surveyLinks: [
        makeSurveyLink({
          surveyId: 'surv_engagement_2026',
          surveyName: 'Engagement 2026',
          cycleLabel: '2026 Annual',
          focusId: 'cat_growth_dev',
          focusLabel: 'Growth & Development',
          scope: { kind: 'org' },
          baseline: 52,
          baselineRespondents: 248,
          capturedAt: growthCreated,
          latest: {
            favorability: 58,
            respondents: 256,
            sourceSurveyId: 'surv_engagement_2027',
            computedAt: subDays(now, 2),
          },
        }),
      ],
      pinnedToHome: false,
      history: [{ at: isoDateTime(growthCreated), event: 'Initiative created', userId: 'u1' }],
      createdAt: isoDateTime(growthCreated),
      updatedAt: isoDateTime(now),
    },
    {
      id: 'empower_init_coaching',
      name: 'Manager Effectiveness Coaching Series',
      description:
        'Turn the strongest manager practices into a practical coaching series for new and experienced people leaders.',
      goalId: 'manager_effectiveness',
      status: 'new',
      createdBy: 'u1',
      ownerId: 'u1',
      contributors: [],
      tasks: [],
      surveyLinks: [
        makeSurveyLink({
          surveyId: 'surv_engagement_2026',
          surveyName: 'Engagement 2026',
          cycleLabel: '2026 Annual',
          focusId: 'cat_manager_rel',
          focusLabel: 'Manager Relationship',
          scope: { kind: 'org' },
          baseline: 82,
          baselineRespondents: 248,
          capturedAt: coachingCreated,
        }),
      ],
      provenance: {
        sourceSummaryVersionId: 'summary_2026_annual',
        sourceWidgetId: 'wid_demo_summary',
        promptVersion: '1.0',
        recommendationPriority: 'P3',
      },
      pinnedToHome: false,
      history: [
        {
          at: isoDateTime(coachingCreated),
          event: 'Initiative created from AI recommendation',
          userId: 'u1',
        },
      ],
      createdAt: isoDateTime(coachingCreated),
      updatedAt: isoDateTime(coachingCreated),
    },
    {
      id: 'empower_init_wellbeing',
      name: 'Wellbeing Check-in Cadence',
      description:
        'Make workload and wellbeing check-ins a consistent part of manager routines and follow through on recurring concerns.',
      goalId: 'wellbeing',
      status: 'completed',
      createdBy: 'u1',
      ownerId: 'u2',
      contributors: ['u5'],
      tasks: [
        makeTask('empower_init_wellbeing', 'task_wellbeing_1', 'Create a wellbeing check-in guide', 'u5', subDays(now, 70), 'completed', wellbeingCreated),
        makeTask('empower_init_wellbeing', 'task_wellbeing_2', 'Pilot check-ins with Engineering', 'u2', subDays(now, 48), 'completed', wellbeingCreated),
        makeTask('empower_init_wellbeing', 'task_wellbeing_3', 'Roll out the cadence to all managers', 'u2', subDays(now, 20), 'completed', wellbeingCreated),
      ],
      surveyLinks: [
        makeSurveyLink({
          surveyId: 'surv_wellbeing_pulse_q3',
          surveyName: 'Wellbeing Pulse Q3',
          cycleLabel: 'Q3 2026',
          focusId: 'cat_wellbeing',
          focusLabel: 'Wellbeing',
          scope: { kind: 'org' },
          baseline: 71,
          baselineRespondents: 248,
          capturedAt: wellbeingCreated,
          latest: {
            favorability: 76,
            respondents: 251,
            sourceSurveyId: 'surv_wellbeing_pulse_q4',
            computedAt: subDays(now, 12),
          },
        }),
      ],
      pinnedToHome: false,
      history: [
        { at: isoDateTime(wellbeingCreated), event: 'Initiative created', userId: 'u1' },
        { at: isoDateTime(subDays(now, 12)), event: 'Initiative completed', userId: 'u2' },
      ],
      createdAt: isoDateTime(wellbeingCreated),
      updatedAt: isoDateTime(subDays(now, 12)),
    },
  ]
}

function buildSeedIdeas(now = new Date()): EmpowerIdea[] {
  return [
    {
      id: 'idea_flexible_fridays',
      title: 'Flexible Fridays',
      description: 'Pilot meeting-free Friday afternoons during the summer.',
      initiativeId: 'empower_init_wellbeing',
      createdBy: 'u6',
      votes: 4,
      votedBy: ['u1', 'u2', 'u3', 'u5'],
      status: 'active',
      createdAt: isoDateTime(subDays(now, 8)),
    },
    {
      id: 'idea_peer_kudos',
      title: 'Peer recognition wall',
      description: 'Create a lightweight place for employees to recognize helpful work across teams.',
      initiativeId: 'empower_init_recognition',
      createdBy: 'u5',
      votes: 3,
      votedBy: ['u1', 'u3', 'u6'],
      status: 'active',
      createdAt: isoDateTime(subDays(now, 5)),
    },
    {
      id: 'idea_learning_hours',
      title: 'Monthly learning hours',
      description: 'Protect one hour each month for employee-led skill sharing.',
      initiativeId: 'empower_init_growth',
      createdBy: 'u4',
      votes: 2,
      votedBy: ['u2', 'u5'],
      status: 'active',
      createdAt: isoDateTime(subDays(now, 2)),
    },
  ]
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined'
}

function readStored<T>(key: string): T | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStored<T>(key: string, value: T): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function ensureUsers(): EmpowerUser[] {
  const stored = readStored<EmpowerUser[]>(USERS_KEY)
  if (stored?.length) return stored
  writeStored(USERS_KEY, SEEDED_USERS)
  return SEEDED_USERS
}

export function seedInitiatives(): EmpowerInitiative[] {
  const initiatives = buildSeedInitiatives()
  writeStored(INITIATIVES_KEY, initiatives)
  return initiatives
}

function ensureInitiatives(): EmpowerInitiative[] {
  const stored = readStored<EmpowerInitiative[]>(INITIATIVES_KEY)
  if (stored?.length) return stored
  return seedInitiatives()
}

function ensureIdeas(): EmpowerIdea[] {
  const stored = readStored<EmpowerIdea[]>(IDEAS_KEY)
  if (stored?.length) return stored
  const ideas = buildSeedIdeas()
  writeStored(IDEAS_KEY, ideas)
  return ideas
}

function isParticipant(initiative: EmpowerInitiative, userId: string): boolean {
  return (
    initiative.createdBy === userId ||
    initiative.ownerId === userId ||
    initiative.contributors.includes(userId)
  )
}

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function requireInitiative(id: string): EmpowerInitiative {
  const initiative = ensureInitiatives().find((item) => item.id === id)
  if (!initiative) throw new Error('Initiative not found')
  return initiative
}

function replaceInitiative(updated: EmpowerInitiative): EmpowerInitiative {
  const initiatives = ensureInitiatives()
  writeStored(
    INITIATIVES_KEY,
    initiatives.map((item) => (item.id === updated.id ? updated : item)),
  )
  return updated
}

export function getInitiatives(userId?: string): EmpowerInitiative[] {
  ensureUsers()
  const initiatives = ensureInitiatives()
  return userId ? initiatives.filter((item) => isParticipant(item, userId)) : initiatives
}

export function getInitiativeById(id: string): EmpowerInitiative | null {
  return ensureInitiatives().find((item) => item.id === id) ?? null
}

export function getUpcomingTasks(
  userId: string,
  limit = 6,
): { task: EmpowerTask; initiative: EmpowerInitiative }[] {
  return getInitiatives(userId)
    .flatMap((initiative) =>
      initiative.tasks
        .filter((task) => task.status !== 'completed')
        .map((task) => ({ task, initiative })),
    )
    .sort((left, right) => left.task.dueDate.localeCompare(right.task.dueDate))
    .slice(0, limit)
}

export function getPinnedInitiatives(userId: string): EmpowerInitiative[] {
  return getInitiatives(userId)
    .filter((initiative) => initiative.pinnedToHome)
    .slice(0, 4)
}

export function getHomeAnalytics(userId: string): HomeAnalytics {
  const initiatives = getInitiatives(userId)
  const activeInitiatives = initiatives.filter((item) => item.status === 'active').length
  const tasksInProgress = initiatives.flatMap((item) => item.tasks).filter(
    (task) => task.status === 'in_progress',
  ).length
  const initiativeIds = new Set(initiatives.map((item) => item.id))
  const newIdeas = ensureIdeas().filter(
    (idea) =>
      idea.status === 'active' &&
      (idea.createdBy === userId || (idea.initiativeId && initiativeIds.has(idea.initiativeId))),
  ).length

  const goalCounts = new Map<InitiativeGoal, number>()
  for (const initiative of initiatives) {
    goalCounts.set(initiative.goalId, (goalCounts.get(initiative.goalId) ?? 0) + 1)
  }
  const topGoals = [...goalCounts.entries()]
    .map(([goalId, count]) => ({
      goalId,
      label: EMPOWER_GOALS.find((goal) => goal.id === goalId)?.label ?? goalId,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const taskCounts = new Map<string, number>()
  for (const task of initiatives.flatMap((item) => item.tasks)) {
    taskCounts.set(task.ownerId, (taskCounts.get(task.ownerId) ?? 0) + 1)
  }
  const topContributors = [...taskCounts.entries()]
    .map(([contributorId, taskCount]) => ({
      user: getUserById(contributorId),
      taskCount,
    }))
    .filter((item): item is { user: EmpowerUser; taskCount: number } => item.user !== null)
    .sort((a, b) => b.taskCount - a.taskCount)

  return { activeInitiatives, tasksInProgress, newIdeas, topGoals, topContributors }
}

export function getIdeas(): EmpowerIdea[] {
  return ensureIdeas()
}

export function getUserById(id: string): EmpowerUser | null {
  return ensureUsers().find((user) => user.id === id) ?? null
}

export function getAllUsers(): EmpowerUser[] {
  return ensureUsers()
}

export function getCurrentEmpowerUser(): EmpowerUser {
  const portalUser = getPortalUser()
  const role =
    portalUser.role === 'hr_admin'
      ? 'admin'
      : portalUser.role === 'manager'
        ? 'manager'
        : 'contributor'
  const matchingRole = ensureUsers().find((user) => user.role === role)
  return matchingRole ?? SEEDED_USERS[0]
}

export function createInitiative(input: CreateInitiativeInput): EmpowerInitiative {
  const now = new Date().toISOString()
  const initiative: EmpowerInitiative = {
    id: newId('initiative'),
    name: input.name.trim(),
    description: input.description.trim(),
    goalId: input.goalId,
    status: 'new',
    createdBy: input.createdBy,
    ownerId: input.ownerId,
    contributors: input.contributors ?? [],
    tasks: [],
    surveyLinks: input.surveyLinks ?? [],
    provenance: input.provenance,
    pinnedToHome: input.pinnedToHome ?? false,
    history: [{ at: now, event: 'Initiative created', userId: input.createdBy }],
    createdAt: now,
    updatedAt: now,
  }
  writeStored(INITIATIVES_KEY, [initiative, ...ensureInitiatives()])
  return initiative
}

export function updateInitiativeStatus(
  id: string,
  status: InitiativeStatus,
): EmpowerInitiative {
  const current = requireInitiative(id)
  const now = new Date().toISOString()
  return replaceInitiative({
    ...current,
    status,
    updatedAt: now,
    history: [
      ...current.history,
      { at: now, event: `Status changed to ${status}`, userId: current.ownerId },
    ],
  })
}

export function updateInitiative(
  id: string,
  updates: Partial<EmpowerInitiative>,
): EmpowerInitiative {
  const current = requireInitiative(id)
  return replaceInitiative({
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  })
}

export function pinInitiative(id: string, userId: string): void {
  const current = requireInitiative(id)
  if (current.pinnedToHome) return
  if (getPinnedInitiatives(userId).length >= 4) {
    throw new Error('You can pin up to 4 initiatives to Home.')
  }
  updateInitiative(id, {
    pinnedToHome: true,
    history: [
      ...current.history,
      { at: new Date().toISOString(), event: 'Pinned to Home', userId },
    ],
  })
}

export function unpinInitiative(id: string, userId: string): void {
  const current = requireInitiative(id)
  if (!current.pinnedToHome) return
  updateInitiative(id, {
    pinnedToHome: false,
    history: [
      ...current.history,
      { at: new Date().toISOString(), event: 'Unpinned from Home', userId },
    ],
  })
}

export function createTask(initiativeId: string, input: CreateTaskInput): EmpowerTask {
  const current = requireInitiative(initiativeId)
  const task: EmpowerTask = {
    id: newId('task'),
    initiativeId,
    text: input.text.trim(),
    description: input.description?.trim(),
    ownerId: input.ownerId,
    contributorIds: input.contributorIds ?? [],
    dueDate: input.dueDate,
    status: 'todo',
    source: input.source ?? 'manual',
    provenance: input.provenance,
    createdAt: new Date().toISOString(),
  }
  updateInitiative(initiativeId, { tasks: [...current.tasks, task] })
  return task
}

export function updateTaskStatus(
  taskId: string,
  initiativeId: string,
  status: TaskStatus,
): EmpowerTask {
  const current = requireInitiative(initiativeId)
  const task = current.tasks.find((item) => item.id === taskId)
  if (!task) throw new Error('Task not found')
  const updated = { ...task, status }
  updateInitiative(initiativeId, {
    tasks: current.tasks.map((item) => (item.id === taskId ? updated : item)),
  })
  return updated
}

export function createIdea(input: CreateIdeaInput): EmpowerIdea {
  const idea: EmpowerIdea = {
    id: newId('idea'),
    title: input.title.trim(),
    description: input.description.trim(),
    initiativeId: input.initiativeId,
    createdBy: input.createdBy,
    votes: 0,
    votedBy: [],
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  writeStored(IDEAS_KEY, [idea, ...ensureIdeas()])
  return idea
}

export function voteOnIdea(ideaId: string, userId: string): EmpowerIdea {
  const ideas = ensureIdeas()
  const idea = ideas.find((item) => item.id === ideaId)
  if (!idea) throw new Error('Idea not found')
  const hasVoted = idea.votedBy.includes(userId)
  const updated = {
    ...idea,
    votes: Math.max(0, idea.votes + (hasVoted ? -1 : 1)),
    votedBy: hasVoted
      ? idea.votedBy.filter((id) => id !== userId)
      : [...idea.votedBy, userId],
  }
  writeStored(
    IDEAS_KEY,
    ideas.map((item) => (item.id === ideaId ? updated : item)),
  )
  return updated
}
