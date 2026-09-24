'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_PORTAL_ACCESS,
  DEFAULT_PORTAL_LANGUAGE,
  DEFAULT_PORTAL_THEME_COLOR,
  isPortalLanguageCode,
  seedPortalSettings,
  type PortalAccessRule,
  type PortalAccessSettings,
  type PortalContentPage,
  type PortalContentPageId,
  type FilterAudience,
  type PortalFilterAccessRule,
  type PortalGlobalPage,
  type PortalGlobalPageId,
  type PortalLanguageCode,
  type PortalPageCopy,
  type PortalSettingsState,
} from '@/data/mock-portal-settings'
import { MOCK_DIRECTORY_EMPLOYEES } from '@/data/mock-employee-directory'
import {
  createFilterCondition,
  createFilterGroup,
  parseEmployeeFilterGroups,
  type EmployeeFilterGroup,
} from '@/data/mock-employee-filters'
import { getRosterState } from '@/lib/rosterStore'

export const PORTAL_SETTINGS_STORAGE_KEY = 'pp_portal_settings'
export const PORTAL_SETTINGS_CHANGED_EVENT = 'pp_portal_settings_changed'
export const PORTAL_LANGUAGE_STORAGE_KEY = 'pp_portal_language'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asCopyMap(value: unknown): Partial<Record<PortalLanguageCode, PortalPageCopy>> {
  if (!isRecord(value)) return {}
  const next: Partial<Record<PortalLanguageCode, PortalPageCopy>> = {}
  for (const [code, copy] of Object.entries(value)) {
    if (!isPortalLanguageCode(code) || !isRecord(copy)) continue
    next[code] = {
      title: typeof copy.title === 'string' ? copy.title : '',
      body: typeof copy.body === 'string' ? copy.body : '',
    }
  }
  return next
}

function mergePages(raw: unknown): PortalContentPage[] {
  const seeded = seedPortalSettings().pages
  const byId = new Map<string, Record<string, unknown>>()
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (isRecord(item) && typeof item.id === 'string') byId.set(item.id, item)
    })
  }
  return seeded.map((page) => {
    const stored = byId.get(page.id)
    if (!stored) return { ...page, translations: { ...page.translations } }
    const translations = {
      ...page.translations,
      ...asCopyMap(stored.translations),
    }
    return {
      ...page,
      title: typeof stored.title === 'string' && stored.title.trim() ? stored.title : page.title,
      mainTab:
        page.id === 'about' || page.id === 'faq'
          ? false
          : stored.mainTab === true || stored.showInMainTab === true,
      footer: stored.footer === true || stored.showInFooter === true,
      order: typeof stored.order === 'number' && Number.isFinite(stored.order) ? stored.order : page.order,
      body: typeof stored.body === 'string' ? stored.body : page.body,
      translations,
    }
  })
}

function mergePortalAccess(raw: unknown): PortalAccessSettings {
  const seeded = { ...DEFAULT_PORTAL_ACCESS }
  if (!isRecord(raw)) return seeded
  const next = { ...seeded }
  ;(Object.keys(seeded) as (keyof PortalAccessSettings)[]).forEach((key) => {
    if (typeof raw[key] === 'boolean') next[key] = raw[key] as boolean
  })
  return next
}

function mergeAccessRules(raw: unknown): PortalAccessRule[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') return []
    return [
      {
        id: item.id,
        name: item.name,
        description: typeof item.description === 'string' ? item.description : '',
        userIds: Array.isArray(item.userIds) ? item.userIds.filter((id): id is string => typeof id === 'string') : [],
        allowedEmployeeIds: Array.isArray(item.allowedEmployeeIds)
          ? item.allowedEmployeeIds.filter((id): id is string => typeof id === 'string')
          : [],
      },
    ]
  })
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function findEmployeeEmail(id: string): string | null {
  const rosterEmployee =
    typeof window === 'undefined' ? undefined : getRosterState().employees.find((employee) => employee.id === id)
  if (rosterEmployee?.email) return rosterEmployee.email
  return MOCK_DIRECTORY_EMPLOYEES.find((employee) => employee.id === id)?.email ?? null
}

function peopleGroupsFromLegacy(userIds: string[], groups: unknown): EmployeeFilterGroup[] {
  const orGroups: EmployeeFilterGroup[] = []
  userIds.forEach((userId) => {
    const email = findEmployeeEmail(userId)
    orGroups.push(
      createFilterGroup([
        email
          ? createFilterCondition('email', 'is', email)
          : createFilterCondition('nameOrEmail', 'is', userId),
      ]),
    )
  })
  if (Array.isArray(groups)) {
    groups.forEach((group) => {
      if (!isRecord(group) || typeof group.value !== 'string') return
      if (group.kind === 'department' || group.kind === 'location') {
        orGroups.push(createFilterGroup([createFilterCondition(group.kind, 'is', group.value)]))
        return
      }
      if (group.kind === 'manager') {
        orGroups.push(createFilterGroup([createFilterCondition('manager', 'is', group.value)]))
        const email = findEmployeeEmail(group.value)
        if (email) {
          orGroups.push(createFilterGroup([createFilterCondition('email', 'is', email)]))
        }
      }
    })
  }
  return orGroups.map((group, index) => ({
    ...group,
    joinWithPrevious: index === 0 ? 'AND' : 'OR',
  }))
}

function mergeAudience(raw: unknown, fallbackId: string): FilterAudience | null {
  if (!isRecord(raw)) return null
  const peopleGroups = Array.isArray(raw.peopleGroups)
    ? parseEmployeeFilterGroups(raw.peopleGroups)
    : peopleGroupsFromLegacy(asStringList(raw.userIds), raw.groups)
  return {
    id: typeof raw.id === 'string' ? raw.id : fallbackId,
    source: raw.source === 'saved' ? 'saved' : 'new',
    savedFilterId: typeof raw.savedFilterId === 'string' ? raw.savedFilterId : undefined,
    peopleGroups,
    allowedFilterIds: asStringList(raw.allowedFilterIds),
  }
}

function mergeFilterAccessRules(raw: unknown): PortalFilterAccessRule[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') return []
    let audiences: FilterAudience[] = []
    if (Array.isArray(item.audiences)) {
      audiences = item.audiences
        .map((audience, index) => mergeAudience(audience, `${item.id}_aud_${index}`))
        .filter((audience): audience is FilterAudience => Boolean(audience))
    }
    if (audiences.length === 0) {
      audiences = [
        {
          id: `${item.id}_aud_legacy`,
          source: 'new',
          peopleGroups: peopleGroupsFromLegacy(asStringList(item.userIds), []),
          allowedFilterIds: asStringList(item.allowedFilterIds),
        },
      ]
    }
    return [
      {
        id: item.id,
        name: item.name,
        description: typeof item.description === 'string' ? item.description : '',
        audiences,
      },
    ]
  })
}

function mergeGlobalPages(raw: unknown): PortalGlobalPage[] {
  const seeded = seedPortalSettings().globalPages
  const byId = new Map<string, Record<string, unknown>>()
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (isRecord(item) && typeof item.id === 'string') byId.set(item.id, item)
    })
  }
  return seeded.map((page) => {
    const stored = byId.get(page.id)
    if (!stored) return { ...page, translations: { ...page.translations } }
    return {
      ...page,
      title: typeof stored.title === 'string' && stored.title.trim() ? stored.title : page.title,
      body: typeof stored.body === 'string' ? stored.body : page.body,
      translations: { ...page.translations, ...asCopyMap(stored.translations) },
    }
  })
}

function normalizeState(raw: unknown): PortalSettingsState | null {
  if (!isRecord(raw)) return null
  const seeded = seedPortalSettings()
  const setup = isRecord(raw.setup) ? raw.setup : {}
  return {
    pages: mergePages(raw.pages),
    globalPages: mergeGlobalPages(raw.globalPages),
    languages: seeded.languages.map((language) => {
      const stored = Array.isArray(raw.languages)
        ? raw.languages.find((item) => isRecord(item) && item.code === language.code)
        : undefined
      if (!isRecord(stored)) return { ...language }
      return {
        ...language,
        enabled: stored.enabled !== false,
      }
    }),
    permissions: seeded.permissions,
    logs: Array.isArray(raw.logs) ? (raw.logs as PortalSettingsState['logs']) : seeded.logs,
    setup: {
      ...seeded.setup,
      portalEnabled: setup.portalEnabled !== false,
      requireLogin: setup.requireLogin !== false,
      showLandingPage: Boolean(setup.showLandingPage),
      allowDownloads: setup.allowDownloads !== false,
      defaultLanguage: isPortalLanguageCode(String(setup.defaultLanguage ?? ''))
        ? (setup.defaultLanguage as PortalLanguageCode)
        : seeded.setup.defaultLanguage,
    },
    portalAccess: mergePortalAccess(raw.portalAccess),
    accessRules: mergeAccessRules(raw.accessRules),
    filterAccessRules: mergeFilterAccessRules(raw.filterAccessRules),
  }
}

function readStored(): PortalSettingsState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PORTAL_SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return normalizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeStored(state: PortalSettingsState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(PORTAL_SETTINGS_CHANGED_EVENT))
}

export function getPortalSettings(): PortalSettingsState {
  const stored = readStored()
  if (stored) return stored
  const seeded = seedPortalSettings()
  writeStored(seeded)
  return seeded
}

function updateSettings(updater: (current: PortalSettingsState) => PortalSettingsState) {
  const next = updater(getPortalSettings())
  writeStored(next)
  return next
}

function withLog(state: PortalSettingsState, action: string): PortalSettingsState {
  return {
    ...state,
    logs: [
      {
        id: `log_${Date.now()}`,
        at: new Date().toISOString(),
        actor: 'Sarah Johnson',
        action,
      },
      ...state.logs,
    ].slice(0, 20),
  }
}

export function patchPortalPage(id: PortalContentPageId, patch: Partial<PortalContentPage>) {
  return updateSettings((current) => ({
    ...current,
    pages: current.pages.map((page) => (page.id === id ? { ...page, ...patch } : page)),
  }))
}

export function savePortalPageTranslation(
  id: PortalContentPageId,
  language: PortalLanguageCode,
  copy: PortalPageCopy,
) {
  return updateSettings((current) =>
    withLog(
      {
        ...current,
        pages: current.pages.map((page) => {
          if (page.id !== id) return page
          return {
            ...page,
            title: language === 'en' ? copy.title || page.title : page.title,
            body: language === 'en' ? copy.body : page.body,
            translations: { ...page.translations, [language]: copy },
          }
        }),
      },
      `Updated ${id.replace(/-/g, ' ')} content`,
    ),
  )
}

export function savePortalGlobalTranslation(
  id: PortalGlobalPageId,
  language: PortalLanguageCode,
  copy: PortalPageCopy,
) {
  return updateSettings((current) =>
    withLog(
      {
        ...current,
        globalPages: current.globalPages.map((page) => {
          if (page.id !== id) return page
          return {
            ...page,
            title: language === 'en' ? copy.title || page.title : page.title,
            body: language === 'en' ? copy.body : page.body,
            translations: { ...page.translations, [language]: copy },
          }
        }),
      },
      `Updated ${id.replace(/-/g, ' ')}`,
    ),
  )
}

export function setPortalThemeColor(color: string) {
  const nextColor = color.trim() || DEFAULT_PORTAL_THEME_COLOR
  return savePortalGlobalTranslation('customize-theme', 'en', {
    title: 'Customize Theme',
    body: nextColor,
  })
}

export function patchPortalAccess(patch: Partial<PortalAccessSettings>) {
  return updateSettings((current) =>
    withLog(
      {
        ...current,
        portalAccess: { ...current.portalAccess, ...patch },
      },
      'Updated portal access',
    ),
  )
}

export function savePortalAccessRule(rule: PortalAccessRule) {
  return updateSettings((current) => {
    const exists = current.accessRules.some((item) => item.id === rule.id)
    return withLog(
      {
        ...current,
        accessRules: exists
          ? current.accessRules.map((item) => (item.id === rule.id ? rule : item))
          : [...current.accessRules, rule],
      },
      exists ? `Updated data access rule ${rule.name}` : `Added data access rule ${rule.name}`,
    )
  })
}

export function deletePortalAccessRule(id: string) {
  return updateSettings((current) => {
    const rule = current.accessRules.find((item) => item.id === id)
    return withLog(
      {
        ...current,
        accessRules: current.accessRules.filter((item) => item.id !== id),
      },
      `Deleted data access rule ${rule?.name ?? id}`,
    )
  })
}

export function importPortalAccessRules(rules: PortalAccessRule[]) {
  return updateSettings((current) => {
    const existingIds = new Set(current.accessRules.map((rule) => rule.id))
    const incoming = rules.filter((rule) => !existingIds.has(rule.id))
    if (incoming.length === 0) return current
    return withLog(
      {
        ...current,
        accessRules: [...current.accessRules, ...incoming],
      },
      `Imported ${incoming.length} data access rules`,
    )
  })
}

export function savePortalFilterAccessRule(rule: PortalFilterAccessRule) {
  return updateSettings((current) => {
    const exists = current.filterAccessRules.some((item) => item.id === rule.id)
    return withLog(
      {
        ...current,
        filterAccessRules: exists
          ? current.filterAccessRules.map((item) => (item.id === rule.id ? rule : item))
          : [...current.filterAccessRules, rule],
      },
      exists ? `Updated filter access rule ${rule.name}` : `Added filter access rule ${rule.name}`,
    )
  })
}

export function deletePortalFilterAccessRule(id: string) {
  return updateSettings((current) => {
    const rule = current.filterAccessRules.find((item) => item.id === id)
    return withLog(
      {
        ...current,
        filterAccessRules: current.filterAccessRules.filter((item) => item.id !== id),
      },
      `Deleted filter access rule ${rule?.name ?? id}`,
    )
  })
}

export function importPortalFilterAccessRules(rules: PortalFilterAccessRule[]) {
  return updateSettings((current) => {
    const existingIds = new Set(current.filterAccessRules.map((rule) => rule.id))
    const incoming = rules.filter((rule) => !existingIds.has(rule.id))
    if (incoming.length === 0) return current
    return withLog(
      {
        ...current,
        filterAccessRules: [...current.filterAccessRules, ...incoming],
      },
      `Imported ${incoming.length} filter access rules`,
    )
  })
}

export function getPortalLanguage(): PortalLanguageCode {
  if (typeof window === 'undefined') return DEFAULT_PORTAL_LANGUAGE
  const stored = window.localStorage.getItem(PORTAL_LANGUAGE_STORAGE_KEY)
  if (stored && isPortalLanguageCode(stored)) return stored
  return getPortalSettings().setup.defaultLanguage
}

export function setPortalLanguage(language: PortalLanguageCode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PORTAL_LANGUAGE_STORAGE_KEY, language)
  window.dispatchEvent(new Event(PORTAL_SETTINGS_CHANGED_EVENT))
}

export function subscribePortalSettings(listener: (state: PortalSettingsState) => void) {
  const notify = () => listener(getPortalSettings())
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === PORTAL_SETTINGS_STORAGE_KEY || event.key === PORTAL_LANGUAGE_STORAGE_KEY) {
      notify()
    }
  }
  window.addEventListener(PORTAL_SETTINGS_CHANGED_EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PORTAL_SETTINGS_CHANGED_EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}

export function usePortalSettings() {
  const [state, setState] = useState<PortalSettingsState>(seedPortalSettings)
  const [language, setLanguage] = useState<PortalLanguageCode>(DEFAULT_PORTAL_LANGUAGE)

  useEffect(() => {
    setState(getPortalSettings())
    setLanguage(getPortalLanguage())
    return subscribePortalSettings((next) => {
      setState(next)
      setLanguage(getPortalLanguage())
    })
  }, [])

  return {
    ...state,
    language,
    patchPage: patchPortalPage,
    savePageTranslation: savePortalPageTranslation,
    saveGlobalTranslation: savePortalGlobalTranslation,
    setThemeColor: setPortalThemeColor,
    patchAccess: patchPortalAccess,
    saveAccessRule: savePortalAccessRule,
    deleteAccessRule: deletePortalAccessRule,
    importAccessRules: importPortalAccessRules,
    saveFilterAccessRule: savePortalFilterAccessRule,
    deleteFilterAccessRule: deletePortalFilterAccessRule,
    importFilterAccessRules: importPortalFilterAccessRules,
    setLanguage: setPortalLanguage,
  }
}
