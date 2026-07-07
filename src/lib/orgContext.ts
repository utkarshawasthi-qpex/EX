import { assembleAiSummaryOrgContextPrompt, createEmptyAiSummaryOrgContext } from '@/lib/aiSummaryOrgContext/budget'
import {
  getAiSummaryOrgContext,
  getAiSummaryOrgContextVersion,
  incrementAiSummaryOrgContextVersion,
  saveAiSummaryOrgContext,
} from '@/lib/aiSummaryOrgContext/storage'
import type { OrgContext } from '@/types'

/** @deprecated Legacy org context — use aiSummaryOrgContext instead */
export const ORG_CONTEXT_STORAGE_KEY = 'pp_org_context'
export const ORG_CONTEXT_VERSION_KEY = 'pp_org_context_version'

export function getOrgContextVersion(): string {
  return getAiSummaryOrgContextVersion()
}

export function incrementOrgContextVersion(): void {
  incrementAiSummaryOrgContextVersion()
}

/** @deprecated Returns empty legacy shape for compatibility */
export function getOrgContext(): OrgContext {
  return { files: [], notes: [] }
}

/** @deprecated No-op — context is saved via saveAiSummaryOrgContext */
export function saveOrgContext(_data: OrgContext): void {
  incrementAiSummaryOrgContextVersion()
}

export function getOrgContextText(): string {
  return assembleAiSummaryOrgContextPrompt(getAiSummaryOrgContext())
}

export {
  assembleAiSummaryOrgContextPrompt,
  createEmptyAiSummaryOrgContext,
  getAiSummaryOrgContext,
  saveAiSummaryOrgContext,
}
