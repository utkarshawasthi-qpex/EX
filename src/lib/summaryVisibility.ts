import type { AppUser } from '@/lib/userContext'
import type { ID, SummaryVisibilityMode } from '@/types'

export function canSeeCompanySummary(
  visibility: SummaryVisibilityMode,
  currentUser: AppUser,
  createdBy: ID,
): boolean {
  if (visibility === 'private') {
    return currentUser.id === createdBy && !currentUser.isImpersonating
  }
  return true
}
