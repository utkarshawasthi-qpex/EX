import { mockEmployees } from '@/data/mock/employees'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'
import { getAllInitiativesRaw, getOrgSettings, getSubjectManagerId } from '@/lib/empowerIntegration/storage'
import type { AppUser } from '@/lib/userContext'
import { isAdminContext } from '@/lib/userContext'

export function canSeeInitiative(user: AppUser, initiative: EmpowerInitiativeRecord): boolean {
  if (initiative.class === 'development') {
    if (user.id === initiative.ownerId) return true

    const settings = getOrgSettings()
    if (settings.shareDevelopmentWithManager) {
      const managerId = getSubjectManagerId(initiative.ownerId)
      if (managerId && user.id === managerId) return true
    }

    return false
  }

  if (isAdminContext() && user.id === 'emp_001' && !user.isImpersonating) {
    return true
  }

  if (initiative.ownerId === user.id) return true
  if (initiative.createdBy === user.id) return true
  if (initiative.contributors.includes(user.id)) return true

  const employee = mockEmployees.find((item) => item.id === user.id)
  if (employee?.managerId === initiative.ownerId) return false

  if (initiative.surveyLink?.scope.kind === 'team') {
    const teamManagerId = initiative.surveyLink.scope.managerId
    if (user.id === teamManagerId) return true
    const isReport = mockEmployees.some(
      (item) => item.managerId === teamManagerId && item.id === user.id,
    )
    if (isReport) return true
  }

  if (isAdminContext()) return true

  return false
}

export function getVisibleInitiatives(user: AppUser): EmpowerInitiativeRecord[] {
  return getAllInitiativesRaw().filter((initiative) => canSeeInitiative(user, initiative))
}

export function isDevelopmentInitiative(initiative: EmpowerInitiativeRecord): boolean {
  return initiative.class === 'development'
}

export function excludeDevelopmentForAnalytics(
  initiatives: EmpowerInitiativeRecord[],
): EmpowerInitiativeRecord[] {
  return initiatives.filter((initiative) => initiative.class !== 'development')
}
