import { format } from 'date-fns'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import type {
  EmpowerInitiativeRecord,
  InitiativeLifecycleStatus,
  InitiativeTask,
  InitiativeType,
  SurveyLink,
  TaskStatus,
} from '@/types/empowerIntegration'

export function getGoalTitle(goalId: string): string {
  return EMPOWER_GOALS.find((g) => g.id === goalId)?.title ?? goalId
}

export function getGoalColor(goalId: string): string {
  return EMPOWER_GOALS.find((g) => g.id === goalId)?.color ?? '#9CA3AF'
}

export function formatLatestChip(link: SurveyLink): string {
  if (!link.latest?.favorability) {
    return `${link.focus.label} · ${link.baseline.favorability ?? '—'}% · awaiting next cycle`
  }
  const baseline = link.baseline.favorability ?? 0
  const latest = link.latest.favorability ?? baseline
  const delta = latest - baseline
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—'
  const color = delta > 0 ? 'green' : delta < 0 ? 'red' : 'grey'
  return `${link.focus.label} · ${baseline}% → ${latest}% ${arrow} ${delta >= 0 ? '+' : ''}${delta}|${color}`
}

export function formatDueDate(date: string | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}

/** Long form used for created dates, e.g. "August 5, 2026". */
export function formatLongDate(date: string | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMMM d, yyyy')
  } catch {
    return date
  }
}

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export function taskStatusLabel(status: TaskStatus | undefined): string {
  return TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Pending'
}

export function isTaskComplete(task: InitiativeTask): boolean {
  return task.status === 'completed'
}

export const INITIATIVE_STATUS_OPTIONS: {
  value: InitiativeLifecycleStatus
  label: string
  color: string | null
}[] = [
  { value: 'new', label: 'New', color: null },
  { value: 'active', label: 'Active', color: '#16A34A' },
  { value: 'completed', label: 'Completed', color: '#1B87E6' },
  { value: 'closed', label: 'Closed', color: '#9CA3AF' },
]

export function initiativeStatusLabel(status: InitiativeLifecycleStatus | undefined): string {
  return INITIATIVE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'New'
}

export const INITIATIVE_TYPE_OPTIONS: { value: InitiativeType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'upstream', label: 'Upstream' },
  { value: 'downstream', label: 'Downstream' },
]

export function initiativeTypeLabel(type: InitiativeType | undefined): string {
  if (type === 'upstream') return 'Upstream'
  if (type === 'downstream') return 'Downstream'
  return 'None'
}

export function progressLabel(progress: EmpowerInitiativeRecord['progress']): string {
  if (progress === 'on_track') return 'On track'
  if (progress === 'stuck') return 'Stuck'
  return 'Done'
}

export function parseTimeframeDays(timeframe: string): number {
  const match = timeframe.match(/(\d+)/)
  return match ? Number(match[1]) : 30
}
