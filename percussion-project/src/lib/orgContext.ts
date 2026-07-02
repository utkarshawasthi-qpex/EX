import { mockOrgContext } from '@/data/mock/analyticsData'
import { formatOrgContextForPrompt } from '@/lib/orgContextCategories'
import type { OrgContext, OrgContextCategory, OrgContextFile, OrgContextNote } from '@/types'

export const ORG_CONTEXT_STORAGE_KEY = 'pp_org_context'
export const ORG_CONTEXT_VERSION_KEY = 'pp_org_context_version'

type LegacyOrgContext = {
  text?: string
  files?: Array<{ name: string; uploadedAt: string; category?: OrgContextCategory }>
  notes?: OrgContextNote[]
}

function isFullOrgContext(parsed: LegacyOrgContext | OrgContext): parsed is OrgContext {
  if (!Array.isArray(parsed.notes) || !Array.isArray(parsed.files)) {
    return false
  }
  if (parsed.files.length === 0) {
    return true
  }
  const first = parsed.files[0]
  return typeof first === 'object' && first !== null && 'id' in first && 'sizeLabel' in first
}

function normalizeLegacyContext(parsed: LegacyOrgContext | OrgContext): OrgContext {
  if (isFullOrgContext(parsed)) {
    return parsed
  }

  const files: OrgContextFile[] = (parsed.files ?? mockOrgContext.files).map((file, index) => {
    if ('id' in file && 'sizeLabel' in file) {
      return file as OrgContextFile
    }
    const legacy = file as { name: string; uploadedAt: string; category?: OrgContextCategory }
    return {
      id: `file_legacy_${index}`,
      name: legacy.name,
      sizeLabel: '—',
      extension: legacy.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      category: legacy.category ?? 'policy',
      uploadedAt: legacy.uploadedAt,
    }
  })

  const notes: OrgContextNote[] =
    parsed.notes ??
    (parsed.text
      ? [
          {
            id: 'note_legacy',
            text: parsed.text,
            category: 'guideline' as OrgContextCategory,
            addedAt: new Date().toISOString(),
          },
        ]
      : mockOrgContext.notes)

  return { files, notes }
}

export function getOrgContextVersion(): string {
  if (typeof window === 'undefined') return '1'

  return window.localStorage.getItem(ORG_CONTEXT_VERSION_KEY) ?? '1'
}

export function incrementOrgContextVersion(): void {
  if (typeof window === 'undefined') return

  const current = Number.parseInt(getOrgContextVersion(), 10) || 1
  window.localStorage.setItem(ORG_CONTEXT_VERSION_KEY, String(current + 1))
}

export function getOrgContext(): OrgContext {
  if (typeof window === 'undefined') {
    return mockOrgContext
  }

  try {
    const stored = window.localStorage.getItem(ORG_CONTEXT_STORAGE_KEY)
    if (!stored) {
      return mockOrgContext
    }
    const parsed = JSON.parse(stored) as LegacyOrgContext | OrgContext
    return normalizeLegacyContext(parsed)
  } catch {
    return mockOrgContext
  }
}

export function saveOrgContext(data: OrgContext): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    ORG_CONTEXT_STORAGE_KEY,
    JSON.stringify({
      files: data.files,
      notes: data.notes,
      savedAt: new Date().toISOString(),
    }),
  )
}

export function getOrgContextText(): string {
  return formatOrgContextForPrompt(getOrgContext())
}
