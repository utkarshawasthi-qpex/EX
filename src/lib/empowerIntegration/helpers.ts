import { format } from 'date-fns'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import type { EmpowerInitiativeRecord, SurveyLink } from '@/types/empowerIntegration'

export function getGoalTitle(goalId: string): string {
  return EMPOWER_GOALS.find((goal) => goal.id === goalId)?.title ?? goalId
}

export function formatBaselineChip(link: SurveyLink): string {
  if (link.surveyType === '360') {
    const baseline = link.baseline
    return `${link.focus.label} · Self ${baseline.selfScore?.toFixed(1) ?? '—'} / Others ${baseline.othersAvg?.toFixed(1) ?? '—'} / Gap ${baseline.gap?.toFixed(1) ?? '—'} · ${baseline.respondentCount} raters`
  }

  return `${link.focus.label} · ${link.baseline.favorability ?? '—'}% · ${link.baseline.respondentCount} responses`
}

export function formatLatestChip(link: SurveyLink): string {
  if (!link.latest) {
    return `${link.focus.label} · ${link.baseline.favorability ?? '—'}% · awaiting next cycle`
  }

  const baseline = link.baseline.favorability ?? 0
  const latest = link.latest.favorability ?? baseline
  const delta = latest - baseline
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—'
  const deltaColor = delta > 0 ? 'green' : delta < 0 ? 'red' : 'grey'

  return `${link.focus.label} · ${baseline}% → ${latest}% ${arrow} ${delta >= 0 ? '+' : ''}${delta}|${deltaColor}`
}

export function formatDueDate(date: string): string {
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}

export function progressLabel(progress: EmpowerInitiativeRecord['progress']): string {
  if (progress === 'on_track') return 'On track'
  if (progress === 'stuck') return 'Stuck'
  return 'Done'
}

export function classBadgeLabel(classType: EmpowerInitiativeRecord['class']): string {
  return classType === 'development' ? 'Development' : 'Team'
}

export function parseTimeframeDays(timeframe: string): number {
  const match = timeframe.match(/(\d+)/)
  return match ? Number(match[1]) : 30
}

export function buildInheritedLinkBlock(link: SurveyLink, scopeLabel: string): string {
  if (link.surveyType === '360') {
    return `Linked to: ${link.surveyName} · ${link.focus.label} · ${scopeLabel} · Baseline Self ${link.baseline.selfScore?.toFixed(1)} / Others ${link.baseline.othersAvg?.toFixed(1)} / Gap ${link.baseline.gap?.toFixed(1)} (${link.baseline.respondentCount} raters)`
  }
  return `Linked to: ${link.surveyName} · ${link.focus.label} · ${scopeLabel} · Baseline ${link.baseline.favorability}% (${link.baseline.respondentCount} responses)`
}
