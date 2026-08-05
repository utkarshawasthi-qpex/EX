import { format } from 'date-fns'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import type { EmpowerInitiativeRecord, InitiativeType, SurveyLink } from '@/types/empowerIntegration'

export function getGoalTitle(goalId: string): string {
  return EMPOWER_GOALS.find((g) => g.id === goalId)?.title ?? goalId
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
