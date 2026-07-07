import type { AiSummaryOrgContext } from '@/types'
import { AI_SUMMARY_ORG_CONTEXT_STORAGE_KEY, AI_SUMMARY_ORG_CONTEXT_VERSION_KEY } from '@/lib/aiSummaryOrgContext/constants'
import { assembleAiSummaryOrgContextPrompt, createEmptyAiSummaryOrgContext } from '@/lib/aiSummaryOrgContext/budget'

export function getAiSummaryOrgContextVersion(): string {
  if (typeof window === 'undefined') return '1'
  return window.localStorage.getItem(AI_SUMMARY_ORG_CONTEXT_VERSION_KEY) ?? '1'
}

export function incrementAiSummaryOrgContextVersion(): void {
  if (typeof window === 'undefined') return
  const current = Number.parseInt(getAiSummaryOrgContextVersion(), 10) || 1
  window.localStorage.setItem(AI_SUMMARY_ORG_CONTEXT_VERSION_KEY, String(current + 1))
}

export function getAiSummaryOrgContext(): AiSummaryOrgContext {
  if (typeof window === 'undefined') {
    return createEmptyAiSummaryOrgContext()
  }

  try {
    const raw = window.localStorage.getItem(AI_SUMMARY_ORG_CONTEXT_STORAGE_KEY)
    if (!raw) return createEmptyAiSummaryOrgContext()
    const parsed = JSON.parse(raw) as AiSummaryOrgContext
    return {
      ...createEmptyAiSummaryOrgContext(),
      ...parsed,
      files: {
        ...createEmptyAiSummaryOrgContext().files,
        ...parsed.files,
      },
      textFields: {
        ...createEmptyAiSummaryOrgContext().textFields,
        ...parsed.textFields,
      },
    }
  } catch {
    return createEmptyAiSummaryOrgContext()
  }
}

export function saveAiSummaryOrgContext(context: AiSummaryOrgContext): void {
  if (typeof window === 'undefined') return
  const next: AiSummaryOrgContext = {
    ...context,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(AI_SUMMARY_ORG_CONTEXT_STORAGE_KEY, JSON.stringify(next))
  incrementAiSummaryOrgContextVersion()
}

export function getAiSummaryOrgContextPromptText(): string {
  return assembleAiSummaryOrgContextPrompt(getAiSummaryOrgContext())
}
