import type {
  ActiveFilter,
  ID,
  SummaryAction,
  SummaryContent,
  SummaryPriority,
} from '@/types'

export const SUMMARY_PRIORITIES: SummaryPriority[] = [1, 2, 3, 4]

export const EMPTY_ACTION_FEEDBACK: Record<SummaryPriority, 'up' | 'down' | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
}

type LegacyVersionedSummary = {
  summaryVersions?: Array<{ summary: string; generatedAt?: string }>
  actionVersions?: Record<string, Array<{ action: string; timeframe: string; owner: string; priority: number; context: string; linkedInitiativeId?: string }>>
  activeSummaryVersionId?: string
  activeActionVersionIds?: Record<string, string>
  summary?: string
  actions?: SummaryAction[]
  generatedAt?: string
  generatedBy?: string
  summaryFeedback?: 'up' | 'down' | null
  summaryFeedbackReason?: string | null
  actionFeedback?: Record<SummaryPriority, 'up' | 'down' | null>
}

function filterKey(filter: ActiveFilter): string {
  return `${filter.fieldId}:${filter.value}`
}

export function filtersMatch(a: ActiveFilter[], b: ActiveFilter[]): boolean {
  if (a.length !== b.length) return false
  const keysA = a.map(filterKey).sort()
  const keysB = b.map(filterKey).sort()
  return keysA.every((key, index) => key === keysB[index])
}

export function computeIsStale(
  activeFilters: ActiveFilter[],
  generatedAtFilters: ActiveFilter[],
): boolean {
  return !filtersMatch(activeFilters, generatedAtFilters)
}

export function withComputedStaleness(
  content: SummaryContent,
  activeFilters: ActiveFilter[],
): SummaryContent {
  if (!content.summary?.length) return content
  return {
    ...content,
    isStale: computeIsStale(activeFilters, content.generatedAtFilters),
  }
}

function actionsMatchForShare(a: SummaryAction[], b: SummaryAction[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort((left, right) => left.priority - right.priority)
  const sortedB = [...b].sort((left, right) => left.priority - right.priority)
  return sortedA.every((action, index) => {
    const other = sortedB[index]
    return (
      action.action === other.action &&
      action.timeframe === other.timeframe &&
      action.owner === other.owner &&
      action.priority === other.priority &&
      action.context === other.context
    )
  })
}

export function liveContentMatchesSnapshot(content: SummaryContent): boolean {
  if (!content.sharedSnapshot) return false
  return (
    content.summary === content.sharedSnapshot.summary &&
    actionsMatchForShare(content.actions, content.sharedSnapshot.actions)
  )
}

export type ShareSnapshotState = 'never_shared' | 'in_sync' | 'diverged'

export function getShareSnapshotState(content: SummaryContent): ShareSnapshotState {
  if (!content.sharedSnapshot) return 'never_shared'
  if (liveContentMatchesSnapshot(content)) return 'in_sync'
  return 'diverged'
}

export function shareSummarySnapshot(content: SummaryContent): SummaryContent {
  const now = new Date().toISOString()
  return {
    ...content,
    sharedSnapshot: {
      summary: content.summary,
      actions: content.actions.map((action) => ({ ...action })),
      sharedAt: now,
    },
  }
}

export function validateActionsLength(actions: unknown[]): asserts actions is SummaryAction[] {
  if (!Array.isArray(actions) || actions.length !== 4) {
    throw new Error('Expected exactly 4 actions')
  }
}

export function normalizeActionsFromApi(
  actions: Array<Omit<SummaryAction, 'id' | 'priority'> & { priority?: SummaryPriority }>,
): SummaryAction[] {
  validateActionsLength(actions)
  return actions.map((raw, index) => ({
    id: `action_${index + 1}`,
    action: raw.action,
    timeframe: raw.timeframe,
    owner: raw.owner,
    priority: (index + 1) as SummaryPriority,
    context: raw.context ?? '',
    linkedInitiativeId: raw.linkedInitiativeId,
  }))
}

export function buildSummaryContent(
  summary: string,
  actions: SummaryAction[],
  generatedBy: ID,
  generatedAtFilters: ActiveFilter[] = [],
): SummaryContent {
  validateActionsLength(actions)
  const now = new Date().toISOString()
  const sortedActions = [...actions].sort((a, b) => a.priority - b.priority)

  return {
    summary,
    actions: sortedActions,
    summaryRegenerationsUsed: 0,
    recsRegenerationsUsed: 0,
    isStale: false,
    generatedAtFilters: [...generatedAtFilters],
    sharedSnapshot: null,
    summaryFeedback: null,
    summaryFeedbackReason: null,
    actionFeedback: { ...EMPTY_ACTION_FEEDBACK },
    generatedBy,
    generatedAt: now,
    lastFullUpdateAt: now,
  }
}

function migrateLegacyVersioned(raw: LegacyVersionedSummary, generatedBy: ID): SummaryContent {
  const activeSummary =
    raw.summaryVersions?.find((v) => v.summary)?.summary ??
    raw.summaryVersions?.[0]?.summary ??
    raw.summary ??
    ''

  let actions: SummaryAction[] = []
  if (raw.actionVersions) {
    for (const priority of SUMMARY_PRIORITIES) {
      const versionId = raw.activeActionVersionIds?.[priority]
      const versions = raw.actionVersions[priority] ?? raw.actionVersions[String(priority)] ?? []
      const active = versionId
        ? versions.find((v) => (v as { versionId?: string }).versionId === versionId)
        : versions[versions.length - 1]
      if (active) {
        actions.push({
          id: `action_${priority}`,
          action: active.action,
          timeframe: active.timeframe as SummaryAction['timeframe'],
          owner: active.owner as SummaryAction['owner'],
          priority,
          context: active.context,
          linkedInitiativeId: active.linkedInitiativeId,
        })
      }
    }
  }

  if (actions.length === 0 && raw.actions?.length) {
    actions = raw.actions
  }

  while (actions.length < 4) {
    const p = (actions.length + 1) as SummaryPriority
    actions.push({
      id: `action_${p}`,
      action: `Follow up on priority ${p} engagement theme from survey data.`,
      timeframe: '60 days',
      owner: 'Manager',
      priority: p,
      context: 'Derived from survey data',
    })
  }

  const generatedAt =
    raw.generatedAt ??
    raw.summaryVersions?.[0]?.generatedAt ??
    new Date().toISOString()

  return {
    summary: activeSummary,
    actions: actions.slice(0, 4),
    summaryRegenerationsUsed: 0,
    recsRegenerationsUsed: 0,
    isStale: false,
    generatedAtFilters: [],
    sharedSnapshot: null,
    summaryFeedback: raw.summaryFeedback ?? null,
    summaryFeedbackReason: raw.summaryFeedbackReason ?? null,
    actionFeedback: { ...EMPTY_ACTION_FEEDBACK, ...raw.actionFeedback },
    generatedBy: raw.generatedBy ?? generatedBy,
    generatedAt,
    lastFullUpdateAt: generatedAt,
  }
}

export function normalizeSummaryContent(raw: unknown, generatedBy = 'system'): SummaryContent {
  if (!raw || typeof raw !== 'object') {
    return buildSummaryContent('Summary unavailable.', normalizeActionsFromApi([
      { action: 'Review survey results with your team.', timeframe: '30 days', owner: 'Manager', context: 'Team follow-up' },
      { action: 'Identify top three improvement areas.', timeframe: '60 days', owner: 'HR', context: 'HR support' },
      { action: 'Communicate priorities to all staff.', timeframe: '60 days', owner: 'Leadership', context: 'Leadership cadence' },
      { action: 'Re-measure engagement markers.', timeframe: '90 days', owner: 'Manager', context: 'Track progress' },
    ]), generatedBy)
  }

  const record = raw as SummaryContent & LegacyVersionedSummary

  if ('summaryVersions' in record && Array.isArray(record.summaryVersions)) {
    return migrateLegacyVersioned(record, generatedBy)
  }

  if ('summary' in record && Array.isArray(record.actions)) {
    return {
      summary: record.summary,
      actions: record.actions,
      summaryRegenerationsUsed: record.summaryRegenerationsUsed ?? 0,
      recsRegenerationsUsed: record.recsRegenerationsUsed ?? 0,
      isStale: record.isStale ?? false,
      generatedAtFilters: record.generatedAtFilters ?? [],
      sharedSnapshot: record.sharedSnapshot ?? null,
      summaryFeedback: record.summaryFeedback ?? null,
      summaryFeedbackReason: record.summaryFeedbackReason ?? null,
      actionFeedback: { ...EMPTY_ACTION_FEEDBACK, ...record.actionFeedback },
      generatedBy: record.generatedBy ?? generatedBy,
      generatedAt: record.generatedAt ?? new Date().toISOString(),
      lastFullUpdateAt: record.lastFullUpdateAt ?? record.generatedAt ?? new Date().toISOString(),
    }
  }

  return migrateLegacyVersioned(record, generatedBy)
}

export function applyFullUpdate(
  content: SummaryContent,
  summary: string,
  actions: SummaryAction[],
  generatedBy: ID,
  activeFilters: ActiveFilter[],
): SummaryContent {
  const now = new Date().toISOString()
  validateActionsLength(actions)
  return {
    ...content,
    summary,
    actions: [...actions].sort((a, b) => a.priority - b.priority),
    summaryRegenerationsUsed: 0,
    recsRegenerationsUsed: 0,
    isStale: false,
    generatedAtFilters: [...activeFilters],
    generatedBy,
    generatedAt: now,
    lastFullUpdateAt: now,
  }
}

export function applySummaryRegeneration(
  content: SummaryContent,
  summary: string,
  activeFilters: ActiveFilter[],
): SummaryContent {
  const now = new Date().toISOString()
  return {
    ...content,
    summary,
    summaryRegenerationsUsed: content.summaryRegenerationsUsed + 1,
    generatedAtFilters: [...activeFilters],
    isStale: false,
    generatedAt: now,
  }
}

export function applyRecommendationsRegeneration(
  content: SummaryContent,
  actions: SummaryAction[],
  activeFilters: ActiveFilter[],
): SummaryContent {
  validateActionsLength(actions)
  const now = new Date().toISOString()
  return {
    ...content,
    actions: [...actions].sort((a, b) => a.priority - b.priority),
    recsRegenerationsUsed: content.recsRegenerationsUsed + 1,
    generatedAtFilters: [...activeFilters],
    isStale: false,
    generatedAt: now,
  }
}

export function setLinkedInitiativeOnRecommendation(
  content: SummaryContent,
  priority: SummaryPriority,
  initiativeId: string,
): SummaryContent {
  return {
    ...content,
    actions: content.actions.map((action) =>
      action.priority === priority ? { ...action, linkedInitiativeId: initiativeId } : action,
    ),
  }
}

export type ResolvedSummaryView = {
  content: SummaryContent
  isPendingShare: boolean
  sharedAt: string | null
}

export function resolveSummaryContentForViewer(
  content: SummaryContent,
  options: {
    isSharedViewer: boolean
    visibility: 'private' | 'everyone'
  },
): ResolvedSummaryView {
  const normalized = normalizeSummaryContent(content)

  if (options.isSharedViewer && options.visibility === 'everyone') {
    if (!normalized.sharedSnapshot) {
      return { content: normalized, isPendingShare: true, sharedAt: null }
    }

    return {
      content: {
        ...normalized,
        summary: normalized.sharedSnapshot.summary,
        actions: normalized.sharedSnapshot.actions.map((action) => ({ ...action })),
        isStale: false,
      },
      isPendingShare: false,
      sharedAt: normalized.sharedSnapshot.sharedAt,
    }
  }

  return { content: normalized, isPendingShare: false, sharedAt: null }
}
