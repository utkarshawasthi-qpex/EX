import { DEFAULT_SUMMARY_ADMIN_SETTINGS } from '@/lib/summaryDefaults'
import type { DashboardWidget, SummaryAdminConfig, SummaryVisibilityMode } from '@/types'

function normalizeVisibility(raw: SummaryAdminConfig['visibility'] | { mode?: string }): SummaryVisibilityMode {
  if (typeof raw === 'string') {
    return raw === 'private' ? 'private' : 'everyone'
  }
  if (raw && typeof raw === 'object' && 'mode' in raw) {
    return raw.mode === 'private' ? 'private' : 'everyone'
  }
  return 'everyone'
}

export function normalizeSummaryAdminConfig(
  raw: NonNullable<DashboardWidget['summaryConfig']>,
): SummaryAdminConfig {
  const legacy = raw as SummaryAdminConfig & {
    content?: SummaryAdminConfig['companyContent']
    visibility?: SummaryVisibilityMode | { mode?: string }
    allowPersonalContext?: boolean
  }

  return {
    visibility: normalizeVisibility(legacy.visibility ?? DEFAULT_SUMMARY_ADMIN_SETTINGS.visibility),
    allowEmployeeSummaries:
      legacy.allowEmployeeSummaries ?? DEFAULT_SUMMARY_ADMIN_SETTINGS.allowEmployeeSummaries,
    companyContent: legacy.companyContent ?? legacy.content,
    createdBy: legacy.createdBy,
    isGenerating: legacy.isGenerating ?? false,
    generationError: legacy.generationError,
  }
}
