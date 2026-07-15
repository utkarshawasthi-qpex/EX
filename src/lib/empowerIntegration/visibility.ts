import { mockEmployees } from '@/data/mock/employees'
import { initiativeMatchesScope } from '@/lib/empowerIntegration/scope'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'
import { getAllInitiativesRaw } from '@/lib/empowerIntegration/storage'
import type { AppUser } from '@/lib/userContext'
import { isAdminContext } from '@/lib/userContext'

export function canSeeInitiative(user: AppUser, initiative: EmpowerInitiativeRecord): boolean {
  if (initiative.ownerId === user.id) return true
  if (initiative.createdBy === user.id) return true
  if (initiative.contributors.includes(user.id)) return true
  if (isAdminContext() && !user.isImpersonating) return true

  if (initiative.surveyLink?.scope.kind === 'org') return true

  if (initiative.surveyLink?.scope.kind === 'team') {
    const managerId = initiative.surveyLink.scope.managerId
    if (user.id === managerId) return true
    const isReport = mockEmployees.some((e) => e.managerId === managerId && e.id === user.id)
    if (isReport) return true
  }

  return false
}

export function getVisibleInitiatives(user: AppUser): EmpowerInitiativeRecord[] {
  return getAllInitiativesRaw().filter((item) => canSeeInitiative(user, item))
}
