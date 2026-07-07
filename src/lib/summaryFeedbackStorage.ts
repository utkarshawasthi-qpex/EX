import type { ID, SummaryFeedbackRecord } from '@/types'

const STORAGE_KEY = 'pp_summary_feedback'

function storageKey(summaryId: ID, versionId: string, userId: ID): string {
  return `${summaryId}:${versionId}:${userId}`
}

function readAll(): Record<string, SummaryFeedbackRecord> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SummaryFeedbackRecord>
  } catch {
    return {}
  }
}

function writeAll(records: Record<string, SummaryFeedbackRecord>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function getSummaryFeedback(
  summaryId: ID,
  versionId: string,
  userId: ID,
): SummaryFeedbackRecord | null {
  const records = readAll()
  return records[storageKey(summaryId, versionId, userId)] ?? null
}

export function saveSummaryFeedback(record: SummaryFeedbackRecord): void {
  const records = readAll()
  records[storageKey(record.summaryId, record.versionId, record.userId)] = record
  writeAll(records)
}

export function clearSummaryFeedback(
  summaryId: ID,
  versionId: string,
  userId: ID,
): void {
  const records = readAll()
  delete records[storageKey(summaryId, versionId, userId)]
  writeAll(records)
}
