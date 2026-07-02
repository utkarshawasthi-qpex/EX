import { mockEmployees } from '@/data/mock/employees'
import { mockDashboards } from '@/data/mock/dashboards'
import { mockInitiatives, mockTasks } from '@/data/mock/initiatives'
import { mockLifecycleRules } from '@/data/mock/lifecycleRules'
import { mockPptTemplates } from '@/data/mock/pptTemplates'
import { mockPrograms360, mockRaterAssignments } from '@/data/mock/raters'
import { mockSurveys } from '@/data/mock/surveys'
import type { AppUser } from '@/lib/userContext'
import type {
  Dashboard,
  DashboardTab,
  DashboardWidget,
  Employee,
  EmployeeStatus,
  ID,
  Initiative,
  InitiativeStatus,
  LifecycleRule,
  LifecycleSurvey,
  PptTemplate,
  Program360,
  RaterAssignment,
  RuleStatus,
  SurveyStatus,
  SurveyType,
  Task,
} from '@/types'

const CREATED_SURVEYS_STORAGE_KEY = 'pp_created_surveys'
const CREATED_DASHBOARDS_STORAGE_KEY = 'pp_created_dashboards'
const CREATED_INITIATIVES_STORAGE_KEY = 'pp_created_initiatives'
const DASHBOARDS_STORAGE_KEY = 'pp_dashboards'

function getCreatedSurveys(): LifecycleSurvey[] {
  if (typeof window === 'undefined') return []

  try {
    const storedSurveys = window.sessionStorage.getItem(CREATED_SURVEYS_STORAGE_KEY)
    return storedSurveys ? (JSON.parse(storedSurveys) as LifecycleSurvey[]) : []
  } catch {
    return []
  }
}

export function saveCreatedSurvey(survey: LifecycleSurvey): void {
  if (typeof window === 'undefined') return

  const surveys = getCreatedSurveys()
  window.sessionStorage.setItem(CREATED_SURVEYS_STORAGE_KEY, JSON.stringify([survey, ...surveys]))
}

function getCreatedDashboards(): Dashboard[] {
  if (typeof window === 'undefined') return []

  try {
    const storedDashboards = window.sessionStorage.getItem(CREATED_DASHBOARDS_STORAGE_KEY)
    return storedDashboards ? (JSON.parse(storedDashboards) as Dashboard[]) : []
  } catch {
    return []
  }
}

export function saveCreatedDashboard(dashboard: Dashboard): void {
  if (typeof window === 'undefined') return

  const dashboards = getCreatedDashboards()
  window.sessionStorage.setItem(
    CREATED_DASHBOARDS_STORAGE_KEY,
    JSON.stringify([dashboard, ...dashboards]),
  )

  const all = loadDashboards()
  saveDashboards([dashboard, ...all.filter((item) => item.id !== dashboard.id)])
}

function getCreatedInitiatives(): Initiative[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.sessionStorage.getItem(CREATED_INITIATIVES_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Initiative[]) : []
  } catch {
    return []
  }
}

export function saveCreatedInitiative(initiative: Initiative): void {
  if (typeof window === 'undefined') return

  const initiatives = getCreatedInitiatives()
  window.sessionStorage.setItem(
    CREATED_INITIATIVES_STORAGE_KEY,
    JSON.stringify([initiative, ...initiatives]),
  )
}

export function getEmployees(filters?: {
  department?: string
  status?: EmployeeStatus
  location?: string
}): Employee[] {
  return mockEmployees.filter((employee) => {
    if (filters?.department && employee.department !== filters.department) return false
    if (filters?.status && employee.status !== filters.status) return false
    if (filters?.location && employee.location !== filters.location) return false
    return true
  })
}

export function getEmployeeById(id: ID): Employee | undefined {
  return mockEmployees.find((employee) => employee.id === id)
}

export function getSurveys(filters?: {
  type?: SurveyType
  status?: SurveyStatus
}): LifecycleSurvey[] {
  return [...getCreatedSurveys(), ...mockSurveys].filter((survey) => {
    if (filters?.type && survey.type !== filters.type) return false
    if (filters?.status && survey.status !== filters.status) return false
    return true
  })
}

export function getSurveyById(id: ID): LifecycleSurvey | undefined {
  return [...getCreatedSurveys(), ...mockSurveys].find((survey) => survey.id === id)
}

export function getLifecycleRules(filters?: { status?: RuleStatus }): LifecycleRule[] {
  return mockLifecycleRules.filter((rule) => {
    if (filters?.status && rule.status !== filters.status) return false
    return true
  })
}

export function getLifecycleRuleById(id: ID): LifecycleRule | undefined {
  return mockLifecycleRules.find((rule) => rule.id === id)
}

export function getInitiatives(filters?: {
  status?: InitiativeStatus
  ownerId?: ID
}): Initiative[] {
  return [...getCreatedInitiatives(), ...mockInitiatives].filter((initiative) => {
    if (filters?.status && initiative.status !== filters.status) return false
    if (filters?.ownerId && initiative.ownerId !== filters.ownerId) return false
    return true
  })
}

export function getInitiativeById(id: ID): Initiative | undefined {
  return [...getCreatedInitiatives(), ...mockInitiatives].find((initiative) => initiative.id === id)
}

export function getTasksByInitiativeId(initiativeId: ID): Task[] {
  return mockTasks.filter((task) => task.initiativeId === initiativeId)
}

export function getTaskById(id: ID): Task | undefined {
  return mockTasks.find((task) => task.id === id)
}

export function getTasksByOwnerId(ownerId: ID): Task[] {
  return mockTasks.filter((task) => task.ownerId === ownerId)
}

export function getPrograms360(): Program360[] {
  return mockPrograms360
}

export function getRatersBySubjectId(subjectId: ID): RaterAssignment[] {
  return mockRaterAssignments.filter((assignment) => assignment.subjectId === subjectId)
}

export function loadDashboards(): Dashboard[] {
  if (typeof window === 'undefined') {
    return mockDashboards
  }

  try {
    const stored = window.localStorage.getItem(DASHBOARDS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Dashboard[]
    }

    const merged = [...getCreatedDashboards(), ...mockDashboards]
    const byId = new Map<string, Dashboard>()
    for (const dashboard of merged) {
      byId.set(dashboard.id, dashboard)
    }
    return Array.from(byId.values())
  } catch {
    return mockDashboards
  }
}

export function saveDashboards(dashboards: Dashboard[]): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify(dashboards))
  } catch (err) {
    console.error('Failed to save dashboards:', err)
  }
}

function getDefaultWidgets(dashboardId: ID, tabId: ID): DashboardWidget[] {
  const dashboard =
    loadDashboards().find((item) => item.id === dashboardId) ??
    mockDashboards.find((item) => item.id === dashboardId)
  if (!dashboard) return []
  const tab = dashboard.tabs.find((item) => item.id === tabId)
  return tab?.widgets ?? []
}

export function getDashboardWidgets(dashboardId: ID, tabId: ID): DashboardWidget[] {
  if (typeof window === 'undefined') {
    return getDefaultWidgets(dashboardId, tabId)
  }

  try {
    const key = `pp_dashboard_${dashboardId}_widgets`
    const stored = window.localStorage.getItem(key)
    if (!stored) {
      return getDefaultWidgets(dashboardId, tabId)
    }
    const parsed = JSON.parse(stored) as Record<string, DashboardWidget[]>
    return parsed[tabId] ?? getDefaultWidgets(dashboardId, tabId)
  } catch {
    return getDefaultWidgets(dashboardId, tabId)
  }
}

export function saveDashboardWidgets(
  dashboardId: ID,
  allTabWidgets: Record<string, DashboardWidget[]>,
): void {
  if (typeof window === 'undefined') return

  try {
    const key = `pp_dashboard_${dashboardId}_widgets`
    window.localStorage.setItem(key, JSON.stringify(allTabWidgets))
  } catch (err) {
    console.error('Failed to save widgets:', err)
  }
}

export function saveDashboardTabs(dashboardId: ID, tabs: DashboardTab[]): void {
  if (typeof window === 'undefined') return

  try {
    const key = `pp_dashboard_${dashboardId}_tabs`
    window.localStorage.setItem(key, JSON.stringify(tabs))
  } catch (err) {
    console.error('Failed to save tabs:', err)
  }
}

export function getDashboardTabs(dashboardId: ID): DashboardTab[] {
  if (typeof window === 'undefined') {
    return mockDashboards.find((item) => item.id === dashboardId)?.tabs ?? []
  }

  try {
    const key = `pp_dashboard_${dashboardId}_tabs`
    const stored = window.localStorage.getItem(key)
    if (!stored) {
      const dashboard = loadDashboards().find((item) => item.id === dashboardId)
      return dashboard?.tabs ?? mockDashboards.find((item) => item.id === dashboardId)?.tabs ?? []
    }
    return JSON.parse(stored) as DashboardTab[]
  } catch {
    return mockDashboards.find((item) => item.id === dashboardId)?.tabs ?? []
  }
}

export function getVisibleDashboards(user: AppUser): Dashboard[] {
  const all = loadDashboards()

  if (user.role === 'hr_admin' && !user.isImpersonating) {
    return all
  }

  return all.filter((dashboard) => {
    switch (dashboard.access) {
      case 'global':
        return true
      case 'private':
      case 'custom':
        return false
      default:
        return false
    }
  })
}

export function getDashboards(): Dashboard[] {
  return loadDashboards()
}

export function getDashboardById(id: ID): Dashboard | undefined {
  return loadDashboards().find((dashboard) => dashboard.id === id)
}

export function getPptTemplates(): PptTemplate[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('pp_ppt_templates')
      if (stored) return JSON.parse(stored) as PptTemplate[]
    } catch {
      return mockPptTemplates
    }
  }

  return mockPptTemplates
}

export function getActivePptTemplate(): PptTemplate {
  const templates = getPptTemplates()
  return templates.find((template) => template.isActive) ?? mockPptTemplates[0]
}
