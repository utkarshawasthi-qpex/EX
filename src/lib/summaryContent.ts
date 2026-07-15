import type {
  ActionVersion,
  ID,
  SummaryAction,
  SummaryContent,
  SummaryPriority,
  SummaryScope,
  SummaryVersion,
  SummaryVisibilityMode,
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

function createSummaryId(): string {
  return `summary_${Date.now()}`
}

function snapshotActiveActions(
  content: SummaryContent,
): Partial<Record<SummaryPriority, ActionVersion>> {
  const snapshots: Partial<Record<SummaryPriority, ActionVersion>> = {}
  for (const priority of SUMMARY_PRIORITIES) {
    const version = getActiveActionVersion(content, priority)
    if (version) {
      snapshots[priority] = { ...version }
    }
  }
  return snapshots
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
  const summaryVersion = getActiveSummaryVersion(content)
  if (summaryVersion?.actionSnapshots?.[priority]) {
    return summaryVersion.actionSnapshots[priority]
  }

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
    linkedInitiativeId: version.linkedInitiativeId,
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

type BuildSummaryContentOptions = {
  scope?: SummaryScope
  createdBy?: ID
  visibility?: SummaryVisibilityMode
  summaryId?: ID
}

export function buildSummaryContent(
  summary: string,
  actions: SummaryAction[],
  generatedBy: ID,
  dashboardDataSnapshot: string,
  options?: BuildSummaryContentOptions,
): SummaryContent {
  validateActionsLength(actions)
  const generatedAt = new Date().toISOString()
  const summaryVersionId = createVersionId('sv')
  const scope = options?.scope ?? 'company'

  const actionVersions: Record<SummaryPriority, ActionVersion[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  }
  const activeActionVersionIds = { ...EMPTY_ACTIVE_ACTION_VERSION_IDS }
  const actionSnapshots: Partial<Record<SummaryPriority, ActionVersion>> = {}

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
    actionSnapshots[action.priority] = version
  }

  const summaryVersions: SummaryVersion[] = [
    {
      versionId: summaryVersionId,
      summary,
      generatedAt,
      generatedBy,
      actionSnapshots,
    },
  ]

  return {
    id: options?.summaryId ?? createSummaryId(),
    scope,
    createdBy: options?.createdBy ?? generatedBy,
    visibility: options?.visibility ?? 'everyone',
    publishedVersionId: null,
    activeSummaryVersionId: summaryVersionId,
    activeActionVersionIds,
    summaryVersions,
    actionVersions,
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
  content?: string
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

function ensureActionSnapshots(content: SummaryContent): SummaryContent {
  let changed = false
  const summaryVersions = content.summaryVersions.map((version) => {
    if (version.actionSnapshots && Object.keys(version.actionSnapshots).length > 0) {
      return version
    }

    changed = true
    const snapshots: Partial<Record<SummaryPriority, ActionVersion>> = {}
    for (const priority of SUMMARY_PRIORITIES) {
      const versionId = content.activeActionVersionIds[priority]
      const actionVersion = content.actionVersions[priority].find(
        (item) => item.versionId === versionId,
      )
      if (actionVersion) {
        snapshots[priority] = actionVersion
      }
    }
    return { ...version, actionSnapshots: snapshots }
  })

  if (!changed) return content
  return { ...content, summaryVersions }
}

export function normalizeSummaryContent(
  raw: LegacyFlatSummary | SummaryContent,
  options?: {
    scope?: SummaryScope
    createdBy?: ID
    visibility?: SummaryVisibilityMode
  },
): SummaryContent {
  if ('summaryVersions' in raw && Array.isArray(raw.summaryVersions)) {
    const legacy = raw as SummaryContent & {
      id?: ID
      scope?: SummaryScope
      createdBy?: ID
      visibility?: SummaryVisibilityMode
      publishedVersionId?: string | null
    }

    const activeSummaryVersionId =
      legacy.activeSummaryVersionId || legacy.summaryVersions[0]?.versionId || ''

    const normalized: SummaryContent = {
      id: legacy.id ?? createSummaryId(),
      scope: legacy.scope ?? options?.scope ?? 'company',
      createdBy: legacy.createdBy ?? legacy.generatedBy ?? options?.createdBy ?? 'system',
      visibility: legacy.visibility ?? options?.visibility ?? 'everyone',
      publishedVersionId:
        legacy.publishedVersionId === undefined
          ? activeSummaryVersionId || null
          : legacy.publishedVersionId,
      activeSummaryVersionId,
      activeActionVersionIds: {
        ...EMPTY_ACTIVE_ACTION_VERSION_IDS,
        ...legacy.activeActionVersionIds,
      },
      summaryVersions: legacy.summaryVersions,
      actionVersions: {
        1: legacy.actionVersions[1] ?? [],
        2: legacy.actionVersions[2] ?? [],
        3: legacy.actionVersions[3] ?? [],
        4: legacy.actionVersions[4] ?? [],
      },
      generatedBy: legacy.generatedBy,
      dashboardDataSnapshot: legacy.dashboardDataSnapshot,
    }

    return ensureActionSnapshots(normalized)
  }

  const legacy = raw as LegacyFlatSummary
  let summaryText = legacy.summary ?? legacy.content ?? ''

  if (!summaryText.trim()) {
    const parts = [...(legacy.what ?? []), ...(legacy.why ?? [])].map((part) =>
      part.replace(/\*\*/g, ''),
    )
    summaryText =
      parts.length > 0
        ? parts.slice(0, 2).join(' ')
        : 'Summary data is unavailable for this dashboard view.'
  }

  const actions = padLegacyActions(legacy.actions ?? [])
  const base = buildSummaryContent(
    summaryText,
    actions,
    legacy.generatedBy ?? options?.createdBy ?? 'system',
    legacy.dashboardDataSnapshot ?? '',
    {
      scope: options?.scope ?? 'company',
      createdBy: options?.createdBy ?? legacy.generatedBy,
      visibility: options?.visibility,
    },
  )

  if (legacy.generatedAt && base.summaryVersions[0]) {
    base.summaryVersions[0].generatedAt = legacy.generatedAt
    for (const priority of SUMMARY_PRIORITIES) {
      if (base.actionVersions[priority][0]) {
        base.actionVersions[priority][0].generatedAt = legacy.generatedAt
      }
      if (base.summaryVersions[0].actionSnapshots?.[priority]) {
        base.summaryVersions[0].actionSnapshots[priority]!.generatedAt = legacy.generatedAt
      }
    }
  }

  return base
}

export function appendSummaryVersion(
  content: SummaryContent,
  summary: string,
  generatedBy?: ID,
): SummaryContent {
  const versionId = createVersionId('sv')
  const newVersion: SummaryVersion = {
    versionId,
    summary,
    generatedAt: new Date().toISOString(),
    generatedBy: generatedBy ?? content.generatedBy,
    actionSnapshots: snapshotActiveActions(content),
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

  const nextContent: SummaryContent = {
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

  const activeSummary = getActiveSummaryVersion(nextContent)
  if (!activeSummary) return nextContent

  const summaryVersions = nextContent.summaryVersions.map((version) => {
    if (version.versionId !== activeSummary.versionId) return version
    return {
      ...version,
      actionSnapshots: {
        ...version.actionSnapshots,
        [priority]: newVersion,
      },
    }
  })

  return { ...nextContent, summaryVersions }
}

export function setActiveSummaryVersionId(
  content: SummaryContent,
  versionId: string,
): SummaryContent {
  const version = content.summaryVersions.find((item) => item.versionId === versionId)
  if (!version) return content

  const activeActionVersionIds = { ...content.activeActionVersionIds }
  if (version.actionSnapshots) {
    for (const priority of SUMMARY_PRIORITIES) {
      const snapshot = version.actionSnapshots[priority]
      if (snapshot) {
        activeActionVersionIds[priority] = snapshot.versionId
      }
    }
  }

  return {
    ...content,
    activeSummaryVersionId: versionId,
    activeActionVersionIds,
  }
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

export function setLinkedInitiativeOnRecommendation(
  content: SummaryContent,
  priority: SummaryPriority,
  initiativeId: string,
): SummaryContent {
  const versionId = content.activeActionVersionIds[priority]
  if (!versionId) return content

  const actionVersions = { ...content.actionVersions }
  actionVersions[priority] = actionVersions[priority].map((version) =>
    version.versionId === versionId ? { ...version, linkedInitiativeId: initiativeId } : version,
  )

  return { ...content, actionVersions }
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

export function getSummaryVersionsNewestFirst(content: SummaryContent): SummaryVersion[] {
  return [...content.summaryVersions].reverse()
}

export function getVersionDisplayLabel(version: SummaryVersion, versionNumber: number): string {
  const dateLabel = new Date(version.generatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `v${versionNumber} — ${dateLabel}`
}

export function publishSummaryVersion(
  content: SummaryContent,
  versionId: string,
): SummaryContent {
  if (!content.summaryVersions.some((version) => version.versionId === versionId)) {
    return content
  }
  return { ...content, publishedVersionId: versionId }
}

export type ResolvedSummaryView = {
  content: SummaryContent
  isPendingShare: boolean
  publishedVersionMissing: boolean
}

export function resolveSummaryContentForViewer(
  content: SummaryContent,
  options: {
    canManageVersions: boolean
    isSharedViewer: boolean
    visibility: SummaryVisibilityMode
  },
): ResolvedSummaryView {
  const normalized = normalizeSummaryContent(content)

  if (options.canManageVersions) {
    return {
      content: normalized,
      isPendingShare: false,
      publishedVersionMissing: false,
    }
  }

  if (!options.isSharedViewer) {
    return {
      content: normalized,
      isPendingShare: false,
      publishedVersionMissing: false,
    }
  }

  if (options.visibility === 'everyone' && !normalized.publishedVersionId) {
    return {
      content: normalized,
      isPendingShare: true,
      publishedVersionMissing: false,
    }
  }

  const publishedId = normalized.publishedVersionId
  if (!publishedId) {
    return {
      content: normalized,
      isPendingShare: false,
      publishedVersionMissing: false,
    }
  }

  const publishedVersion = normalized.summaryVersions.find(
    (version) => version.versionId === publishedId,
  )

  if (!publishedVersion) {
    return {
      content: normalized,
      isPendingShare: false,
      publishedVersionMissing: true,
    }
  }

  return {
    content: setActiveSummaryVersionId(normalized, publishedId),
    isPendingShare: false,
    publishedVersionMissing: false,
  }
}

/** @deprecated use summaryFeedbackStorage */
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

/** @deprecated use summaryFeedbackStorage */
export function updateActionFeedback(
  content: SummaryContent,
  priority: SummaryPriority,
  feedback: 'up' | 'down' | null,
): SummaryContent {
  return {
    ...content,
    actionFeedback: {
      ...EMPTY_ACTION_FEEDBACK,
      ...content.actionFeedback,
      [priority]: feedback,
    },
  }
}
