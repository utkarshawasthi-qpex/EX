import { getOrgContextVersion } from '@/lib/orgContext'
import { normalizeSummaryContent } from '@/lib/summaryContent'
import type { ID, ManagerSummaryCache, SummaryContent } from '@/types'

type CompanySummaryCacheEntry = {
  content: SummaryContent
  contextVersion: string
}

export { normalizeSummaryContent } from '@/lib/summaryContent'

export function getCompanySummaryCacheKey(widgetId: ID): string {
  return `pp_summary_${widgetId}_company`
}

export function getManagerSummaryCacheKey(widgetId: ID, userId: ID): string {
  return `pp_summary_${widgetId}_${userId}`
}

function getLegacyWidgetCacheKey(widgetId: ID): string {
  return `pp_summary_${widgetId}`
}

export function getCachedCompanySummary(widgetId: ID): SummaryContent | null {
  if (typeof window === 'undefined') return null

  try {
    const raw =
      window.localStorage.getItem(getCompanySummaryCacheKey(widgetId)) ??
      window.localStorage.getItem(getLegacyWidgetCacheKey(widgetId))
    if (!raw) return null

    const entry = JSON.parse(raw) as CompanySummaryCacheEntry | SummaryContent
    if ('content' in entry && entry.content) {
      if ('contextVersion' in entry && entry.contextVersion !== getOrgContextVersion()) {
        return null
      }
      return normalizeSummaryContent(entry.content)
    }

    if ('generatedBy' in entry) {
      return normalizeSummaryContent(entry)
    }

    return null
  } catch {
    return null
  }
}

export function saveCachedCompanySummary(widgetId: ID, content: SummaryContent): void {
  if (typeof window === 'undefined') return

  const entry: CompanySummaryCacheEntry = {
    content,
    contextVersion: getOrgContextVersion(),
  }

  window.localStorage.setItem(getCompanySummaryCacheKey(widgetId), JSON.stringify(entry))
}

export function clearCachedCompanySummary(widgetId: ID): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getCompanySummaryCacheKey(widgetId))
  window.localStorage.removeItem(getLegacyWidgetCacheKey(widgetId))
}

export function getCachedManagerSummary(
  widgetId: ID,
  userId: ID,
): ManagerSummaryCache | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(getManagerSummaryCacheKey(widgetId, userId))
    if (!raw) return null
    const cache = JSON.parse(raw) as ManagerSummaryCache
    return {
      ...cache,
      content: normalizeSummaryContent(cache.content),
    }
  } catch {
    return null
  }
}

export function saveCachedManagerSummary(
  widgetId: ID,
  cache: ManagerSummaryCache,
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    getManagerSummaryCacheKey(widgetId, cache.userId),
    JSON.stringify(cache),
  )
}

export function clearCachedManagerSummary(widgetId: ID, userId: ID): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getManagerSummaryCacheKey(widgetId, userId))
}

export function clearAllManagerCachesForWidget(widgetId: ID): void {
  if (typeof window === 'undefined') return

  const prefix = `pp_summary_${widgetId}_`
  const keysToRemove: string[] = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(prefix) && !key.endsWith('_company')) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key)
  }
}

/** @deprecated use getCachedCompanySummary */
export function getCachedSummaryForWidget(widgetId: ID): SummaryContent | null {
  return getCachedCompanySummary(widgetId)
}

/** @deprecated use saveCachedCompanySummary */
export function saveCachedSummaryForWidget(widgetId: ID, content: SummaryContent): void {
  saveCachedCompanySummary(widgetId, content)
}

/** @deprecated use clearCachedCompanySummary */
export function clearCachedSummaryForWidget(widgetId: ID): void {
  clearCachedCompanySummary(widgetId)
}
