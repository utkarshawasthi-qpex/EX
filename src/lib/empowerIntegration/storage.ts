import { mockEmployees } from '@/data/mock/employees'
import {
  DEFAULT_ORG_SETTINGS,
  MARCUS_LEE_SUBJECT,
  SEED_FUNNEL,
  SEED_INITIATIVES,
  SEED_SURVEY_DATA,
} from '@/data/mock/empowerIntegrationSeed'
import type {
  EmpowerInitiativeRecord,
  EmpowerNotification,
  FunnelSeed,
  OrgSettings,
  SurveyDataStore,
} from '@/types/empowerIntegration'
import type { AppUser } from '@/lib/userContext'

const INITIATIVES_KEY = 'pp_initiatives'
const ORG_SETTINGS_KEY = 'pp_org_settings'
const SURVEY_DATA_KEY = 'pp_survey_data'
const NOTIFICATIONS_KEY = 'pp_notifications'
const FUNNEL_KEY = 'pp_funnel_seed'
const SEEDED_KEY = 'pp_empower_integration_seeded'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function seedEmpowerIntegrationIfNeeded(): void {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(SEEDED_KEY) === 'true') return

  writeJson(INITIATIVES_KEY, SEED_INITIATIVES)
  writeJson(ORG_SETTINGS_KEY, DEFAULT_ORG_SETTINGS)
  writeJson(SURVEY_DATA_KEY, SEED_SURVEY_DATA)
  writeJson(NOTIFICATIONS_KEY, [] as EmpowerNotification[])
  writeJson(FUNNEL_KEY, SEED_FUNNEL)
  window.localStorage.setItem(SEEDED_KEY, 'true')
}

export function getSurveyDataStore(): SurveyDataStore {
  return readJson(SURVEY_DATA_KEY, SEED_SURVEY_DATA)
}

export function saveSurveyDataStore(store: SurveyDataStore): void {
  writeJson(SURVEY_DATA_KEY, store)
}

export function getOrgSettings(): OrgSettings {
  return readJson(ORG_SETTINGS_KEY, DEFAULT_ORG_SETTINGS)
}

export function saveOrgSettings(settings: OrgSettings): void {
  writeJson(ORG_SETTINGS_KEY, settings)
}

export function getAllInitiativesRaw(): EmpowerInitiativeRecord[] {
  return readJson(INITIATIVES_KEY, SEED_INITIATIVES)
}

export function saveAllInitiatives(initiatives: EmpowerInitiativeRecord[]): void {
  writeJson(INITIATIVES_KEY, initiatives)
}

export function getInitiativeById(id: string): EmpowerInitiativeRecord | undefined {
  return getAllInitiativesRaw().find((item) => item.id === id)
}

export function upsertInitiative(initiative: EmpowerInitiativeRecord): void {
  const all = getAllInitiativesRaw()
  const index = all.findIndex((item) => item.id === initiative.id)
  if (index >= 0) {
    all[index] = initiative
  } else {
    all.unshift(initiative)
  }
  saveAllInitiatives(all)
}

export function getNotifications(): EmpowerNotification[] {
  return readJson(NOTIFICATIONS_KEY, [])
}

export function addNotification(notification: Omit<EmpowerNotification, 'id'>): void {
  const notifications = getNotifications()
  notifications.unshift({
    ...notification,
    id: `notif_${Date.now()}`,
  })
  writeJson(NOTIFICATIONS_KEY, notifications)
}

export function getFunnelSeed(): FunnelSeed {
  return readJson(FUNNEL_KEY, SEED_FUNNEL)
}

export function isMarcusLeeSubject(user: AppUser): boolean {
  return user.id === MARCUS_LEE_SUBJECT.id
}

export function getMarcusLeeUser(): AppUser {
  return {
    id: MARCUS_LEE_SUBJECT.id,
    name: MARCUS_LEE_SUBJECT.name,
    email: MARCUS_LEE_SUBJECT.email,
    role: 'employee',
    department: 'Engineering',
    location: 'Austin',
    jobLevel: 'Manager',
  }
}

export function getSubjectManagerId(subjectId: string): string | undefined {
  if (subjectId === MARCUS_LEE_SUBJECT.id) return MARCUS_LEE_SUBJECT.managerId
  return mockEmployees.find((employee) => employee.id === subjectId)?.managerId
}

export function countActiveTeamInitiativesForScope(
  ownerId: string,
  scopeManagerId?: string,
): number {
  return getAllInitiativesRaw().filter((initiative) => {
    if (initiative.class !== 'team' || initiative.status !== 'active') return false
    if (initiative.ownerId !== ownerId) return false
    if (!scopeManagerId) return true
    if (!initiative.surveyLink) return true
    if (initiative.surveyLink.scope.kind === 'team') {
      return initiative.surveyLink.scope.managerId === scopeManagerId
    }
    return true
  }).length
}
