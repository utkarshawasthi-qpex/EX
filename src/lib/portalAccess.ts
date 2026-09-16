'use client'

import type { DirectoryEmployee } from '@/data/mock-employee-directory'
import {
  employeeMatchesFilterGroups,
  hasActiveFilterConditions,
  type EmployeeFilterGroup,
  type EmployeeFilterPreset,
} from '@/data/mock-employee-filters'
import { DASHBOARD_FILTER_FIELDS } from '@/data/mock/dashboardFilters'
import type {
  FilterAudience,
  PortalAccessRule,
  PortalAccessSettings,
  PortalFilterAccessRule,
  PortalProductId,
} from '@/data/mock-portal-settings'
import { getPortalSettings } from '@/lib/portalSettingsStore'
import { getRosterState } from '@/lib/rosterStore'
import { getCurrentUser, isAdminContext, type AppUser } from '@/lib/userContext'
import type { FilterField } from '@/types'

export type { PortalProductId }

export const PORTAL_PRODUCT_HREFS: Record<PortalProductId, string> = {
  employeeExperience: '/lifecycle/analytics/list',
  threeSixty: '/360/surveys',
  empower: '/empower',
}

export const PORTAL_PRODUCT_LABELS: Record<PortalProductId, string> = {
  employeeExperience: 'Employee Experience',
  threeSixty: '360°',
  empower: 'Empower',
}

function collectHierarchyIds(rootId: string, employees: DirectoryEmployee[]): string[] {
  const ids = new Set<string>([rootId])
  const byManager = new Map<string, DirectoryEmployee[]>()
  employees.forEach((employee) => {
    if (!employee.managerId || employee.managerId === employee.id) return
    const siblings = byManager.get(employee.managerId) ?? []
    siblings.push(employee)
    byManager.set(employee.managerId, siblings)
  })

  const walk = (id: string) => {
    const children = byManager.get(id) ?? []
    children.forEach((child) => {
      if (ids.has(child.id)) return
      ids.add(child.id)
      walk(child.id)
    })
  }
  walk(rootId)
  return [...ids]
}

export function getMatchingAccessRules(userId: string, rules: PortalAccessRule[]) {
  return rules.filter((rule) => rule.userIds.includes(userId))
}

function resolveAudiencePeopleGroups(
  audience: FilterAudience,
  savedFilters: EmployeeFilterPreset[],
): EmployeeFilterGroup[] {
  if (audience.source === 'saved' && audience.savedFilterId) {
    const preset = savedFilters.find((filter) => filter.id === audience.savedFilterId)
    if (preset) return preset.groups
  }
  return audience.peopleGroups
}

export function audienceMatchesUser(
  audience: FilterAudience,
  user: AppUser,
  employees: DirectoryEmployee[],
  savedFilters: EmployeeFilterPreset[] = getRosterState().savedFilters,
) {
  const peopleGroups = resolveAudiencePeopleGroups(audience, savedFilters)
  if (!hasActiveFilterConditions(peopleGroups)) return false
  const employee = employees.find((item) => item.id === user.id)
  if (!employee) return false
  return employeeMatchesFilterGroups(employee, peopleGroups)
}

export function getActiveAccessRule(user: AppUser, rules: PortalAccessRule[]) {
  return getMatchingAccessRules(user.id, rules)[0] ?? null
}

export function getAccessibleEmployeeIds(
  user: AppUser = getCurrentUser(),
  employees: DirectoryEmployee[] = getRosterState().employees,
  accessRules: PortalAccessRule[] = getPortalSettings().accessRules,
): string[] | null {
  if (user.role === 'hr_admin' && !user.isImpersonating) return null
  const matching = getMatchingAccessRules(user.id, accessRules)
  if (matching.length > 0) {
    return [...new Set(matching.flatMap((rule) => rule.allowedEmployeeIds))]
  }
  return collectHierarchyIds(user.id, employees)
}

export function getAccessibleFilterIds(
  user: AppUser = getCurrentUser(),
  filterAccessRules: PortalFilterAccessRule[] = getPortalSettings().filterAccessRules,
  employees: DirectoryEmployee[] = getRosterState().employees,
  savedFilters: EmployeeFilterPreset[] = getRosterState().savedFilters,
): string[] | null {
  if (user.role === 'hr_admin' && !user.isImpersonating) return null
  const matching = filterAccessRules.flatMap((rule) =>
    rule.audiences.filter((audience) => audienceMatchesUser(audience, user, employees, savedFilters)),
  )
  if (matching.length === 0) return null
  return [...new Set(matching.flatMap((audience) => audience.allowedFilterIds))]
}

export function getVisibleDashboardFilterFields(
  user: AppUser = getCurrentUser(),
  filterAccessRules: PortalFilterAccessRule[] = getPortalSettings().filterAccessRules,
): FilterField[] {
  const allowedIds = getAccessibleFilterIds(user, filterAccessRules)
  if (!allowedIds) return DASHBOARD_FILTER_FIELDS
  return DASHBOARD_FILTER_FIELDS.filter((field) => allowedIds.includes(field.id))
}

export function applyRespondentAccessScope<T extends { id: string; department: string }>(
  respondents: T[],
): T[] {
  if (typeof window === 'undefined') return respondents
  const allowedIds = getAccessibleEmployeeIds()
  if (!allowedIds) return respondents
  const allowed = new Set(allowedIds)
  const employees = getRosterState().employees
  const departments = new Set(
    employees.filter((employee) => allowed.has(employee.id)).map((employee) => employee.department),
  )
  return respondents.filter((respondent) => {
    if (allowed.has(respondent.id)) return true
    if (respondent.id.startsWith('resp_synth_')) {
      return departments.size === 0 || departments.has(respondent.department)
    }
    return false
  })
}

export function isPortalProductEnabled(id: PortalProductId, access: PortalAccessSettings) {
  if (id === 'employeeExperience') return access.employeeExperience
  if (id === 'threeSixty') return access.threeSixty
  return access.empower
}

export function getEnabledPortalProducts(access: PortalAccessSettings = getPortalSettings().portalAccess) {
  return (['employeeExperience', 'threeSixty', 'empower'] as PortalProductId[]).filter((id) =>
    isPortalProductEnabled(id, access),
  )
}

export function getDefaultPortalHref(access: PortalAccessSettings = getPortalSettings().portalAccess) {
  const enabled = getEnabledPortalProducts(access)
  if (enabled.includes('employeeExperience')) return PORTAL_PRODUCT_HREFS.employeeExperience
  const first = enabled[0]
  return first ? PORTAL_PRODUCT_HREFS[first] : PORTAL_PRODUCT_HREFS.employeeExperience
}

export function canCreatePortalDashboard(access: PortalAccessSettings = getPortalSettings().portalAccess) {
  return isAdminContext() || (access.employeeExperience && access.createDashboard)
}

export function canCreatePortalWidget(access: PortalAccessSettings = getPortalSettings().portalAccess) {
  return isAdminContext() || (access.employeeExperience && access.createWidget)
}

export function canSeeDriverAnalysisColorCode(
  access: PortalAccessSettings = getPortalSettings().portalAccess,
) {
  return isAdminContext() || access.driverAnalysisColorCode
}
