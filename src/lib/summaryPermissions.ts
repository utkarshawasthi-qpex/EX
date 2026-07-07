import type { AppUser } from '@/lib/userContext'
import { isManagerUser } from '@/lib/userContext'
import type { SummaryAdminConfig, SummaryContent } from '@/types'

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
  if (!hasContent) return false
  if (activeTab === 'company') {
    return isAdmin
  }
  return (
    activeTab === 'team' &&
    isManagerUser(user) &&
    config.allowEmployeeSummaries &&
    teamOwnerId === user.id
  )
}

export function canManageVersions(user: AppUser, content: SummaryContent): boolean {
  return (
    user.role === 'hr_admin' &&
    !user.isImpersonating &&
    user.id === content.createdBy
  )
}

export function isSharedSummaryViewer(
  user: AppUser,
  content: SummaryContent,
  config: SummaryAdminConfig,
): boolean {
  if (config.visibility !== 'everyone') return false
  return !canManageVersions(user, content)
}

export function canRateSummary(user: AppUser, content: SummaryContent): boolean {
  return user.id === content.createdBy && !user.isImpersonating
}
