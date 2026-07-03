import type {
  ActionVersion,
  ID,
  SummaryAction,
  SummaryContent,
  SummaryPriority,
  SummaryVersion,
} from '@/types'

export const SUMMARY_PRIORITIES: SummaryPriority[] = [1, 2, 3, 4]

export const EMPTY_ACTION_FEEDBACK: Record<SummaryPriority, 'up' | 'down' | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
}

export const EMPTY_ACTION_VERSIONS: Record<SummaryPriority, ActionVersion[]> = {
  1: [],
  2: [],
  3: [],
  4: [],
}

export const EMPTY_ACTIVE_ACTION_VERSION_IDS: Record<SummaryPriority, string> = {
  1: '',
  2: '',
  3: '',
  4: '',
}

function createVersionId(prefix: string): string {
  return `${prefix}_${Date.now()}`
}

export function getActiveSummaryVersion(content: SummaryContent): SummaryVersion | undefined {
  return content.summaryVersions.find(
    (version) => version.versionId === content.activeSummaryVersionId,
  )
}

export function getActiveSummaryText(content: SummaryContent): string {
  return getActiveSummaryVersion(content)?.summary ?? ''
}

export function getActiveSummaryGeneratedAt(content: SummaryContent): string {
  return getActiveSummaryVersion(content)?.generatedAt ?? new Date().toISOString()
}

export function getActiveActionVersion(
  content: SummaryContent,
  priority: SummaryPriority,
): ActionVersion | undefined {
  const versionId = content.activeActionVersionIds[priority]
  return content.actionVersions[priority].find((version) => version.versionId === versionId)
}

export function getActiveActions(content: SummaryContent): SummaryAction[] {
  const actions: SummaryAction[] = []
  for (const priority of SUMMARY_PRIORITIES) {
    const version = getActiveActionVersion(content, priority)
    if (version) {
      actions.push(actionVersionToSummaryAction(version))
    }
  }
  return actions
}

export function actionVersionToSummaryAction(version: ActionVersion): SummaryAction {
  return {
    id: `action_${version.priority}_${version.versionId}`,
    action: version.action,
    timeframe: version.timeframe,
    owner: version.owner,
    priority: version.priority,
    context: version.context,
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
  }))
}

export function buildSummaryContent(
  summary: string,
  actions: SummaryAction[],
  generatedBy: ID,
  dashboardDataSnapshot: string,
): SummaryContent {
  validateActionsLength(actions)
  const generatedAt = new Date().toISOString()
  const summaryVersionId = createVersionId('sv')

  const summaryVersions: SummaryVersion[] = [
    { versionId: summaryVersionId, summary, generatedAt },
  ]

  const actionVersions: Record<SummaryPriority, ActionVersion[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  }
  const activeActionVersionIds = { ...EMPTY_ACTIVE_ACTION_VERSION_IDS }

  for (const action of actions.sort((a, b) => a.priority - b.priority)) {
    const versionId = createVersionId(`av${action.priority}`)
    const version: ActionVersion = {
      versionId,
      action: action.action,
      timeframe: action.timeframe,
      owner: action.owner,
      priority: action.priority,
      context: action.context,
      generatedAt,
    }
    actionVersions[action.priority] = [version]
    activeActionVersionIds[action.priority] = versionId
  }

  return {
    activeSummaryVersionId: summaryVersionId,
    activeActionVersionIds,
    summaryVersions,
    actionVersions,
    summaryFeedback: null,
    summaryFeedbackReason: null,
    actionFeedback: { ...EMPTY_ACTION_FEEDBACK },
    generatedBy,
    dashboardDataSnapshot,
  }
}

type LegacyFlatSummary = {
  summary?: string
  actions?: Array<Partial<SummaryAction> & { action: string }>
  generatedAt?: string
  generatedBy?: ID
  dashboardDataSnapshot?: string
  what?: string[]
  why?: string[]
}

function padLegacyActions(
  actions: Array<Partial<SummaryAction> & { action: string }>,
): SummaryAction[] {
  const sorted = [...actions]
    .map((action, index) => ({
      id: action.id ?? `action_${index + 1}`,
      action: action.action,
      timeframe: (action.timeframe ?? '30 days') as SummaryAction['timeframe'],
      owner: (action.owner ?? 'Manager') as SummaryAction['owner'],
      priority: (action.priority ?? ((index + 1) as SummaryPriority)) as SummaryPriority,
      context: action.context ?? '',
    }))
    .sort((a, b) => a.priority - b.priority)

  while (sorted.length < 4) {
    const nextPriority = (sorted.length + 1) as SummaryPriority
    sorted.push({
      id: `action_${nextPriority}`,
      action: `Follow up on priority ${nextPriority} engagement theme from survey data.`,
      timeframe: '60 days',
      owner: 'Manager',
      priority: nextPriority,
      context: 'Derived from survey data',
    })
  }

  return sorted.slice(0, 4).map((action, index) => ({
    id: `action_${index + 1}`,
    action: action.action,
    timeframe: action.timeframe,
    owner: action.owner,
    priority: (index + 1) as SummaryPriority,
    context: action.context,
  }))
}

export function normalizeSummaryContent(raw: LegacyFlatSummary | SummaryContent): SummaryContent {
  if ('summaryVersions' in raw && Array.isArray(raw.summaryVersions)) {
    return {
      ...raw,
      actionFeedback: { ...EMPTY_ACTION_FEEDBACK, ...raw.actionFeedback },
      actionVersions: {
        1: raw.actionVersions[1] ?? [],
        2: raw.actionVersions[2] ?? [],
        3: raw.actionVersions[3] ?? [],
        4: raw.actionVersions[4] ?? [],
      },
    }
  }

  let summaryText = ''
  let legacyGeneratedAt: string | undefined
  let legacyGeneratedBy: ID | undefined
  let legacySnapshot: string | undefined
  let legacyActions: LegacyFlatSummary['actions'] = []

  const legacy = raw as LegacyFlatSummary
  summaryText = legacy.summary ?? ''
  legacyGeneratedAt = legacy.generatedAt
  legacyGeneratedBy = legacy.generatedBy
  legacySnapshot = legacy.dashboardDataSnapshot
  legacyActions = legacy.actions ?? []

  if (!summaryText.trim()) {
    const parts = [...(legacy.what ?? []), ...(legacy.why ?? [])].map((part) =>
      part.replace(/\*\*/g, ''),
    )
    summaryText =
      parts.length > 0
        ? parts.slice(0, 2).join(' ')
        : 'Summary data is unavailable for this dashboard view.'
  }

  const actions = padLegacyActions(legacyActions)
  const base = buildSummaryContent(
    summaryText,
    actions,
    legacyGeneratedBy ?? 'system',
    legacySnapshot ?? '',
  )

  if (legacyGeneratedAt && base.summaryVersions[0]) {
    base.summaryVersions[0].generatedAt = legacyGeneratedAt
    for (const priority of SUMMARY_PRIORITIES) {
      if (base.actionVersions[priority][0]) {
        base.actionVersions[priority][0].generatedAt = legacyGeneratedAt
      }
    }
  }

  return base
}

export function appendSummaryVersion(content: SummaryContent, summary: string): SummaryContent {
  const versionId = createVersionId('sv')
  const newVersion: SummaryVersion = {
    versionId,
    summary,
    generatedAt: new Date().toISOString(),
  }
  let summaryVersions = [...content.summaryVersions, newVersion]
  if (summaryVersions.length > 5) {
    summaryVersions = summaryVersions.slice(summaryVersions.length - 5)
  }
  return {
    ...content,
    summaryVersions,
    activeSummaryVersionId: versionId,
  }
}

export function appendActionVersion(
  content: SummaryContent,
  priority: SummaryPriority,
  action: Omit<ActionVersion, 'versionId' | 'generatedAt' | 'priority'>,
): SummaryContent {
  const versionId = createVersionId(`av${priority}`)
  const newVersion: ActionVersion = {
    versionId,
    priority,
    action: action.action,
    timeframe: action.timeframe,
    owner: action.owner,
    context: action.context,
    generatedAt: new Date().toISOString(),
  }
  let versions = [...content.actionVersions[priority], newVersion]
  if (versions.length > 5) {
    versions = versions.slice(versions.length - 5)
  }
  return {
    ...content,
    actionVersions: {
      ...content.actionVersions,
      [priority]: versions,
    },
    activeActionVersionIds: {
      ...content.activeActionVersionIds,
      [priority]: versionId,
    },
  }
}

export function setActiveSummaryVersionId(
  content: SummaryContent,
  versionId: string,
): SummaryContent {
  if (!content.summaryVersions.some((version) => version.versionId === versionId)) {
    return content
  }
  return { ...content, activeSummaryVersionId: versionId }
}

export function setActiveActionVersionId(
  content: SummaryContent,
  priority: SummaryPriority,
  versionId: string,
): SummaryContent {
  if (!content.actionVersions[priority].some((version) => version.versionId === versionId)) {
    return content
  }
  return {
    ...content,
    activeActionVersionIds: {
      ...content.activeActionVersionIds,
      [priority]: versionId,
    },
  }
}

export function getSummaryVersionIndex(content: SummaryContent): number {
  return content.summaryVersions.findIndex(
    (version) => version.versionId === content.activeSummaryVersionId,
  )
}

export function getActionVersionIndex(
  content: SummaryContent,
  priority: SummaryPriority,
): number {
  const versionId = content.activeActionVersionIds[priority]
  return content.actionVersions[priority].findIndex((version) => version.versionId === versionId)
}

export function updateSummaryFeedback(
  content: SummaryContent,
  feedback: 'up' | 'down' | null,
  reason: string | null = null,
): SummaryContent {
  return {
    ...content,
    summaryFeedback: feedback,
    summaryFeedbackReason: feedback === 'down' ? reason : null,
  }
}

export function updateActionFeedback(
  content: SummaryContent,
  priority: SummaryPriority,
  feedback: 'up' | 'down' | null,
): SummaryContent {
  return {
    ...content,
    actionFeedback: {
      ...content.actionFeedback,
      [priority]: feedback,
    },
  }
}
