import { differenceInCalendarDays, parseISO } from 'date-fns'
import { computeActionPlanProgress } from '@/lib/empowerIntegration/helpers'
import { getInitiativeById, upsertInitiative } from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import {
  markInitiativeReminderSent,
  resolveInitiativeReminderSettings,
  tasksDueForReminderToday,
} from '@/lib/actionPlans/initiativeReminders'
import type { EmpowerInitiativeRecord, ManagerNudgePreferences } from '@/types/empowerIntegration'
import type { AppUser } from '@/lib/userContext'
import { actionPlanDetailPath } from '@/lib/actionPlans/paths'

export const MAX_NUDGES_PER_WEEK = 1
export const AUTO_UNSUBSCRIBE_AFTER = 3

const PREFS_KEY_PREFIX = 'pp_nudge_prefs_'

export type PortalNudge = {
  id: string
  message: string
  href: string
  kind: 'task_reminder' | 'complete_ready'
  planId: string
  taskId?: string
  createdAt: string
}

function prefsKey(userId: string): string {
  return `${PREFS_KEY_PREFIX}${userId}`
}

export function getNudgePreferences(userId: string): ManagerNudgePreferences {
  if (typeof window === 'undefined') {
    return { lastSentAt: null, ignoredStreak: 0, unsubscribed: false }
  }
  try {
    const raw = window.localStorage.getItem(prefsKey(userId))
    if (!raw) return { lastSentAt: null, ignoredStreak: 0, unsubscribed: false }
    return JSON.parse(raw) as ManagerNudgePreferences
  } catch {
    return { lastSentAt: null, ignoredStreak: 0, unsubscribed: false }
  }
}

export function saveNudgePreferences(userId: string, prefs: ManagerNudgePreferences): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(prefsKey(userId), JSON.stringify(prefs))
}

export function buildNudgeCandidates(user: AppUser): PortalNudge[] {
  const today = new Date()
  const nudges: PortalNudge[] = []
  const plans = getVisibleInitiatives(user).filter(
    (p) => p.status === 'active' || p.status === 'new',
  )

  for (const plan of plans) {
    const progress = computeActionPlanProgress(plan)
    if (progress.total > 0 && progress.completed === progress.total) {
      nudges.push({
        id: `complete_${plan.id}`,
        planId: plan.id,
        kind: 'complete_ready',
        message: `All tasks are done on “${plan.title}”. Mark the plan complete?`,
        href: actionPlanDetailPath(plan.id),
        createdAt: today.toISOString(),
      })
    }

    const settings = resolveInitiativeReminderSettings(plan)
    if (settings.frequency === 'off') continue

    const taskMatches = tasksDueForReminderToday(plan, today)
    for (const match of taskMatches) {
      nudges.push({
        id: `reminder_${plan.id}_${match.taskId}`,
        planId: plan.id,
        taskId: match.taskId,
        kind: 'task_reminder',
        message: `${match.reason}: “${match.taskText}” on ${plan.title}`,
        href: actionPlanDetailPath(plan.id),
        createdAt: today.toISOString(),
      })
    }
  }

  return nudges.slice(0, 8)
}

/** Apply Glint-style weekly cap; returns nudges the user should see now. */
export function getActiveNudgesForUser(user: AppUser): PortalNudge[] {
  const prefs = getNudgePreferences(user.id)
  if (prefs.unsubscribed) return []

  const candidates = buildNudgeCandidates(user)
  if (candidates.length === 0) return []

  if (prefs.lastSentAt) {
    const daysSince = differenceInCalendarDays(new Date(), parseISO(prefs.lastSentAt))
    if (daysSince < 7) return []
  }

  return candidates.slice(0, 1)
}

export function recordNudgeShown(userId: string, nudge?: PortalNudge): void {
  const prefs = getNudgePreferences(userId)
  saveNudgePreferences(userId, { ...prefs, lastSentAt: new Date().toISOString().slice(0, 10) })

  if (nudge?.planId && nudge.kind === 'task_reminder') {
    const plan = getInitiativeById(nudge.planId)
    if (plan) {
      upsertInitiative(markInitiativeReminderSent(plan))
    }
  }
}

export function recordNudgeEngaged(userId: string): void {
  const prefs = getNudgePreferences(userId)
  saveNudgePreferences(userId, { ...prefs, ignoredStreak: 0 })
}

export function recordNudgeDismissed(userId: string): void {
  const prefs = getNudgePreferences(userId)
  const nextStreak = prefs.ignoredStreak + 1
  saveNudgePreferences(userId, {
    ...prefs,
    ignoredStreak: nextStreak,
    unsubscribed: nextStreak >= AUTO_UNSUBSCRIBE_AFTER,
  })
}

export function resubscribeNudges(userId: string): void {
  saveNudgePreferences(userId, { lastSentAt: null, ignoredStreak: 0, unsubscribed: false })
}
