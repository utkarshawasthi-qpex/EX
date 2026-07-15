import type { AppUser } from '@/lib/userContext'
import { isManagerUser } from '@/lib/userContext'
import type { SummaryAdminConfig } from '@/types'

export type SummaryTab = 'company' | 'team'

export function canGenerateSummary(
  config: SummaryAdminConfig,
  user: AppUser,
  isAdmin: boolean,
  activeTab: SummaryTab,
): boolean {
  if (activeTab === 'company') {
    return isAdmin
  }
  return (
    activeTab === 'team' &&
    !isAdmin &&
    isManagerUser(user) &&
    config.allowEmployeeSummaries
  )
}

export function canRegenerateSummary(
  config: SummaryAdminConfig,
  user: AppUser,
  isAdmin: boolean,
  activeTab: SummaryTab,
  hasContent: boolean,
  teamOwnerId?: string,
): boolean {
  void config
  if (!hasContent) return false
  if (activeTab === 'company') {
    return isAdmin
  }
  return (
    activeTab === 'team' &&
    isManagerUser(user) &&
    teamOwnerId === user.id
  )
}

export function isSharedSummaryViewer(
  user: AppUser,
  config: SummaryAdminConfig,
): boolean {
  if (config.visibility !== 'everyone') return false
  return !(user.role === 'hr_admin' && !user.isImpersonating && user.id === config.createdBy)
}

export function canRateSummary(user: AppUser, config: SummaryAdminConfig): boolean {
  return user.id === config.createdBy && !user.isImpersonating
}
