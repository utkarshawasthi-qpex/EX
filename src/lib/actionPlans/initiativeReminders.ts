import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type {
  EmpowerInitiativeRecord,
  InitiativeReminderSettings,
  InitiativeReminderFrequency,
  TaskStatus,
} from '@/types/empowerIntegration'

export const INITIATIVE_REMINDER_FREQUENCY_OPTIONS: {
  value: InitiativeReminderFrequency
  label: string
  description: string
}[] = [
  {
    value: 'off',
    label: 'Off',
    description: 'No automatic reminders for this initiative (completion prompts may still appear).',
  },
  {
    value: 'every_week',
    label: 'Every week',
    description: 'While open tasks match your status filter, at most one reminder per week.',
  },
  {
    value: 'one_week_before_due',
    label: '1 week before each task due date',
    description: 'Remind when a task is exactly 7 days from its due date.',
  },
  {
    value: 'two_days_before_due',
    label: '2 days before each task due date',
    description: 'Remind when a task is exactly 2 days from its due date.',
  },
  {
    value: 'overdue_only',
    label: 'When overdue only',
    description: 'Remind after a task due date has passed.',
  },
  {
    value: 'before_due_and_overdue',
    label: '1 week & 2 days before, plus overdue',
    description: 'Combines early warnings and overdue reminders.',
  },
]

export const DEFAULT_INITIATIVE_REMINDER_SETTINGS: InitiativeReminderSettings = {
  frequency: 'before_due_and_overdue',
  taskStatuses: ['pending', 'in_progress'],
  lastReminderSentAt: null,
}

export function resolveInitiativeReminderSettings(
  plan: EmpowerInitiativeRecord,
): InitiativeReminderSettings {
  return {
    ...DEFAULT_INITIATIVE_REMINDER_SETTINGS,
    ...plan.reminderSettings,
    taskStatuses:
      plan.reminderSettings?.taskStatuses?.length &&
      plan.reminderSettings.taskStatuses.length > 0
        ? plan.reminderSettings.taskStatuses
        : DEFAULT_INITIATIVE_REMINDER_SETTINGS.taskStatuses,
  }
}

function taskMatchesStatusFilter(status: TaskStatus, allowed: TaskStatus[]): boolean {
  return allowed.includes(status)
}

function daysUntilDue(dueDate: string, today: Date): number {
  return differenceInCalendarDays(parseISO(dueDate), today)
}

export type TaskReminderMatch = {
  taskId: string
  taskText: string
  reason: string
}

/** Returns tasks on this initiative that should trigger a reminder today. */
export function tasksDueForReminderToday(
  plan: EmpowerInitiativeRecord,
  today: Date = new Date(),
): TaskReminderMatch[] {
  const settings = resolveInitiativeReminderSettings(plan)
  if (settings.frequency === 'off') return []

  const matches: TaskReminderMatch[] = []

  if (settings.frequency === 'every_week') {
    const hasOpenMatching = plan.tasks.some(
      (t) =>
        t.status !== 'completed' &&
        taskMatchesStatusFilter(t.status, settings.taskStatuses),
    )
    if (!hasOpenMatching) return []

    if (settings.lastReminderSentAt) {
      const daysSince = differenceInCalendarDays(today, parseISO(settings.lastReminderSentAt))
      if (daysSince < 7) return []
    }

    const first = plan.tasks.find(
      (t) =>
        t.status !== 'completed' &&
        taskMatchesStatusFilter(t.status, settings.taskStatuses),
    )
    if (first) {
      matches.push({
        taskId: first.id,
        taskText: first.text,
        reason: 'Weekly check-in on open tasks',
      })
    }
    return matches
  }

  for (const task of plan.tasks) {
    if (task.status === 'completed' || !task.dueDate) continue
    if (!taskMatchesStatusFilter(task.status, settings.taskStatuses)) continue

    const days = daysUntilDue(task.dueDate, today)
    let hit = false
    let reason = ''

    switch (settings.frequency) {
      case 'one_week_before_due':
        hit = days === 7
        reason = 'Due in 1 week'
        break
      case 'two_days_before_due':
        hit = days === 2
        reason = 'Due in 2 days'
        break
      case 'overdue_only':
        hit = days < 0
        reason = 'Overdue'
        break
      case 'before_due_and_overdue':
        if (days === 7) {
          hit = true
          reason = 'Due in 1 week'
        } else if (days === 2) {
          hit = true
          reason = 'Due in 2 days'
        } else if (days < 0) {
          hit = true
          reason = 'Overdue'
        }
        break
      default:
        break
    }

    if (hit) {
      matches.push({ taskId: task.id, taskText: task.text, reason })
    }
  }

  return matches
}

export function markInitiativeReminderSent(
  plan: EmpowerInitiativeRecord,
  sentAt: string = format(new Date(), 'yyyy-MM-dd'),
): EmpowerInitiativeRecord {
  const settings = resolveInitiativeReminderSettings(plan)
  return {
    ...plan,
    reminderSettings: {
      ...settings,
      lastReminderSentAt: sentAt,
    },
  }
}

/** Prototype helper: next expected reminder date for display. */
export function describeNextReminderWindow(plan: EmpowerInitiativeRecord): string {
  const settings = resolveInitiativeReminderSettings(plan)
  if (settings.frequency === 'off') return 'Reminders off'

  const openTasks = plan.tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && settings.taskStatuses.includes(t.status),
  )
  if (openTasks.length === 0) return 'No matching open tasks'

  const today = new Date()
  const upcoming = openTasks
    .map((t) => ({
      due: t.dueDate!,
      d7: format(addDays(parseISO(t.dueDate!), -7), 'yyyy-MM-dd'),
      d2: format(addDays(parseISO(t.dueDate!), -2), 'yyyy-MM-dd'),
    }))
    .sort((a, b) => a.due.localeCompare(b.due))

  const next = upcoming[0]
  if (!next) return 'Based on task due dates and status'

  if (settings.frequency === 'every_week') {
    if (settings.lastReminderSentAt) {
      return `Next weekly reminder after ${format(addDays(parseISO(settings.lastReminderSentAt), 7), 'MMM d, yyyy')}`
    }
    return 'Weekly reminders while tasks stay open'
  }

  if (settings.frequency === 'overdue_only') {
    return `After due date (${format(parseISO(next.due), 'MMM d, yyyy')}) if still open`
  }

  return `Aligned to due dates (next: ${format(parseISO(next.due), 'MMM d, yyyy')})`
}
