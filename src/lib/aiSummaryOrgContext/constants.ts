export const AI_SUMMARY_ORG_CONTEXT_STORAGE_KEY = 'aiSummaryOrgContext'
export const AI_SUMMARY_ORG_CONTEXT_VERSION_KEY = 'pp_org_context_version'

export const AI_SUMMARY_MAX_FILE_BYTES = 10 * 1024 * 1024
export const AI_SUMMARY_MAX_COMBINED_FILE_BYTES = 20 * 1024 * 1024
export const AI_SUMMARY_MAX_PDF_PAGES = 100
export const AI_SUMMARY_MAX_TOKENS = 50_000
export const AI_SUMMARY_MAX_TEXT_CHARS = 1_500
export const AI_SUMMARY_TEXT_WARN_CHARS = 1_400
export const AI_SUMMARY_CHARS_PER_TOKEN = 4
export const AI_SUMMARY_MIN_EXTRACTED_CHARS = 200
export const AI_SUMMARY_SCANNED_FILE_MIN_BYTES = 100 * 1024

export const AI_SUMMARY_ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'] as const

export const AI_SUMMARY_FILE_SLOTS = [
  {
    key: 'policy' as const,
    label: 'Policy',
    helper: 'Company policy document (PDF/DOCX). Under 30 pages works best.',
    meterColor: 'bg-blue-500',
  },
  {
    key: 'guidelines' as const,
    label: 'Guidelines',
    helper: 'HR or EX guidelines the recommendations must follow.',
    meterColor: 'bg-purple-500',
  },
  {
    key: 'initiative' as const,
    label: 'Initiative',
    helper: 'Current initiatives or action plans already underway.',
    meterColor: 'bg-green-500',
  },
] as const

export const AI_SUMMARY_TEXT_FIELDS = [
  {
    key: 'todo' as const,
    label: 'To-do',
    placeholder: "Directions the AI should follow, e.g. 'Prioritize manager enablement actions'",
    meterColor: 'bg-amber-500',
  },
  {
    key: 'notToDo' as const,
    label: 'Not-to-do',
    placeholder: "What the AI must never recommend, e.g. 'No compensation changes'",
    meterColor: 'bg-red-500',
  },
  {
    key: 'kpis' as const,
    label: 'KPI',
    placeholder: "Metrics and targets, one per line, e.g. 'eNPS ≥ +40'",
    meterColor: 'bg-indigo-500',
  },
] as const

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

export function estimateTokensFromText(text: string): number {
  if (!text.trim()) return 0
  return Math.ceil(text.length / AI_SUMMARY_CHARS_PER_TOKEN)
}

export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString()
}

export function orgContextErrorE1(sizeBytes: number): string {
  return `This file is ${formatFileSize(sizeBytes)} — the limit is 10 MB per document. Try compressing or splitting it.`
}

export function orgContextErrorE2(pageCount: number): string {
  return `This document has ${pageCount} pages — the limit is 100. Shorter documents produce more accurate summaries.`
}

export const ORG_CONTEXT_ERROR_E3 =
  "Combined uploads can't exceed 20 MB. Remove or replace another document first."

export const ORG_CONTEXT_ERROR_E4 =
  "We couldn't read text from this file — it appears to be a scanned image. Upload a text-based version."

export const ORG_CONTEXT_ERROR_E5 =
  'This would exceed the context limit. Trim a document or shorten a text field — the meter shows what\u2019s using space.'

export const ORG_CONTEXT_BUDGET_HELPER =
  'Getting close — shorter documents improve summary accuracy.'
