import type { SummaryVisibilityMode } from '@/types'

export const DEFAULT_SUMMARY_ADMIN_SETTINGS = {
  visibility: 'everyone' as SummaryVisibilityMode,
  allowEmployeeSummaries: true,
} as const
