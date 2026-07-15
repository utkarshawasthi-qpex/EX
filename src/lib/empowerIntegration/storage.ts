import {
  DEFAULT_ORG_SETTINGS,
  SEED_FUNNEL,
  SEED_INITIATIVES,
  SEED_SURVEY_DATA,
} from '@/data/mock/empowerIntegrationSeed'
import { initiativeMatchesScope, toSurveyLinkScope } from '@/lib/empowerIntegration/scope'
import type {
  EmpowerInitiativeRecord,
  EmpowerNotification,
  FunnelSeed,
  OrgSettings,
  SurveyDataStore,
} from '@/types/empowerIntegration'

const INITIATIVES_KEY = 'pp_initiatives'
const ORG_SETTINGS_KEY = 'pp_org_settings'
const SURVEY_DATA_KEY = 'pp_survey_data'
const NOTIFICATIONS_KEY = 'pp_notifications'
const FUNNEL_KEY = 'pp_funnel_seed'
const SEEDED_KEY = 'pp_empower_ex_seeded'

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
  const previous = index >= 0 ? all[index] : undefined
  if (index >= 0) all[index] = initiative
  else all.unshift(initiative)
  saveAllInitiatives(all)
  updateFunnelFromInitiativeChange(previous, initiative)
}

const FUNNEL_STAGE_ORDER = ['viewed', 'created', 'updated', 'completed'] as const

function funnelStageRank(stage: (typeof FUNNEL_STAGE_ORDER)[number]): number {
  return FUNNEL_STAGE_ORDER.indexOf(stage)
}

function recalculateFunnelCounts(funnel: FunnelSeed): FunnelSeed {
  const managers = funnel.managers
  return {
    ...funnel,
    viewed: managers.filter((m) => funnelStageRank(m.stage) >= funnelStageRank('viewed')).length,
    created: managers.filter((m) => funnelStageRank(m.stage) >= funnelStageRank('created')).length,
    updated: managers.filter((m) => funnelStageRank(m.stage) >= funnelStageRank('updated')).length,
    completed: managers.filter((m) => funnelStageRank(m.stage) >= funnelStageRank('completed')).length,
  }
}

function updateFunnelFromInitiativeChange(
  previous: EmpowerInitiativeRecord | undefined,
  next: EmpowerInitiativeRecord,
): void {
  const funnel = getFunnelSeed()
  const managerIndex = funnel.managers.findIndex((m) => m.managerId === next.ownerId)
  if (managerIndex < 0) return

  const manager = { ...funnel.managers[managerIndex] }
  const today = new Date().toISOString().slice(0, 10)

  if (!previous) {
    if (funnelStageRank(manager.stage) < funnelStageRank('created')) {
      manager.stage = 'created'
    }
  } else {
    if (next.progress !== previous.progress && next.progress !== 'on_track') {
      if (funnelStageRank(manager.stage) < funnelStageRank('updated')) {
        manager.stage = 'updated'
      }
    }
    if (next.status === 'completed' && previous.status !== 'completed') {
      manager.stage = 'completed'
    }
  }

  manager.lastActivity = today
  const nextManagers = [...funnel.managers]
  nextManagers[managerIndex] = manager
  writeJson(FUNNEL_KEY, recalculateFunnelCounts({ ...funnel, managers: nextManagers }))
}

export function getNotifications(): EmpowerNotification[] {
  return readJson(NOTIFICATIONS_KEY, [])
}

export function addNotification(notification: Omit<EmpowerNotification, 'id'>): void {
  const items = getNotifications()
  items.unshift({ ...notification, id: `notif_${Date.now()}` })
  writeJson(NOTIFICATIONS_KEY, items)
}

export function getFunnelSeed(): FunnelSeed {
  return readJson(FUNNEL_KEY, SEED_FUNNEL)
}

export function countActiveInitiativesForScope(scope: {
  kind: 'org' | 'team' | 'filter'
  managerId?: string
  filters?: Record<string, string>
}): number {
  const linkScope = toSurveyLinkScope(scope)
  return getAllInitiativesRaw().filter(
    (initiative) => initiative.status === 'active' && initiativeMatchesScope(initiative, linkScope),
  ).length
}
