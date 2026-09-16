'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_DIRECTORY_CUSTOM_FIELDS,
  createFieldKey,
  type DirectoryCustomField,
} from '@/data/mock-custom-fields'
import { MOCK_DIRECTORY_EMPLOYEES, type DirectoryEmployee } from '@/data/mock-employee-directory'
import {
  APPLY_NEW_PRESET_ID,
  DEFAULT_SAVED_FILTERS,
  type EmployeeFilterPreset,
} from '@/data/mock-employee-filters'

export const ROSTER_STORAGE_KEY = 'pp_roster'
export const ROSTER_CHANGED_EVENT = 'pp_roster_changed'
export const DEFAULT_FOLDER_NAME = 'New folks'

export type RosterSetup = {
  folderName: string
  accessCode: string
}

export type RosterState = {
  employees: DirectoryEmployee[]
  customFields: DirectoryCustomField[]
  savedFilters: EmployeeFilterPreset[]
  setup: RosterSetup
}

function seedState(): RosterState {
  return {
    employees: MOCK_DIRECTORY_EMPLOYEES.map((employee) => ({
      ...employee,
      customFields: employee.customFields ? { ...employee.customFields } : undefined,
    })),
    customFields: DEFAULT_DIRECTORY_CUSTOM_FIELDS.map((field) => ({
      ...field,
      options: [...field.options],
    })),
    savedFilters: DEFAULT_SAVED_FILTERS.map((filter) => ({
      ...filter,
      groups: filter.groups.map((group) => ({
        ...group,
        conditions: group.conditions.map((condition) => ({ ...condition })),
      })),
    })),
    setup: { folderName: DEFAULT_FOLDER_NAME, accessCode: '' },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeState(raw: unknown): RosterState | null {
  if (!isRecord(raw)) return null
  if (!Array.isArray(raw.employees) || !Array.isArray(raw.customFields) || !Array.isArray(raw.savedFilters)) {
    return null
  }
  const setup = isRecord(raw.setup) ? raw.setup : {}
  return {
    employees: raw.employees as DirectoryEmployee[],
    customFields: (raw.customFields as DirectoryCustomField[]).map((field) => ({
      ...field,
      visible: field.visible !== false,
    })),
    savedFilters: (raw.savedFilters as EmployeeFilterPreset[]).filter(
      (filter) => filter.id !== APPLY_NEW_PRESET_ID,
    ),
    setup: {
      folderName:
        typeof setup.folderName === 'string' && setup.folderName.trim()
          ? setup.folderName
          : DEFAULT_FOLDER_NAME,
      accessCode: typeof setup.accessCode === 'string' ? setup.accessCode : '',
    },
  }
}

function readStored(): RosterState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ROSTER_STORAGE_KEY)
    if (!raw) return null
    return normalizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeStored(state: RosterState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(ROSTER_CHANGED_EVENT))
}

export function getRosterState(): RosterState {
  const stored = readStored()
  if (stored) return stored
  const seeded = seedState()
  writeStored(seeded)
  return seeded
}

function updateRoster(updater: (current: RosterState) => RosterState): RosterState {
  const next = updater(getRosterState())
  writeStored(next)
  return next
}

export function getRosterFolderName(): string {
  return getRosterState().setup.folderName
}

export function setRosterEmployees(employees: DirectoryEmployee[]): RosterState {
  return updateRoster((current) => ({ ...current, employees }))
}

export function addRosterEmployees(employees: DirectoryEmployee[]): RosterState {
  return updateRoster((current) => ({
    ...current,
    employees: [...employees, ...current.employees],
  }))
}

export function patchRosterEmployee(id: string, patch: Partial<DirectoryEmployee>): RosterState {
  return updateRoster((current) => ({
    ...current,
    employees: current.employees.map((employee) =>
      employee.id === id ? { ...employee, ...patch } : employee,
    ),
  }))
}

export function replaceRosterEmployee(updated: DirectoryEmployee): RosterState {
  return updateRoster((current) => ({
    ...current,
    employees: current.employees.map((employee) => (employee.id === updated.id ? updated : employee)),
  }))
}

export function removeRosterEmployees(ids: string[]): RosterState {
  const remove = new Set(ids)
  return updateRoster((current) => ({
    ...current,
    employees: current.employees.filter((employee) => !remove.has(employee.id)),
  }))
}

export function saveRosterCustomField(field: DirectoryCustomField): RosterState {
  return updateRoster((current) => {
    const existing = current.customFields.find((item) => item.key === field.key)
    if (existing) {
      return {
        ...current,
        customFields: current.customFields.map((item) => (item.key === field.key ? field : item)),
      }
    }
    const key = field.key || createFieldKey(field.title, current.customFields)
    return {
      ...current,
      customFields: [...current.customFields, { ...field, key, visible: field.visible !== false }],
    }
  })
}

export function setRosterCustomFields(customFields: DirectoryCustomField[]): RosterState {
  return updateRoster((current) => ({ ...current, customFields }))
}

export function deleteRosterCustomField(key: string): RosterState {
  return updateRoster((current) => ({
    ...current,
    customFields: current.customFields.filter((field) => field.key !== key),
  }))
}

export function saveRosterFilter(filter: EmployeeFilterPreset): RosterState {
  return updateRoster((current) => {
    const exists = current.savedFilters.some((item) => item.id === filter.id)
    return {
      ...current,
      savedFilters: exists
        ? current.savedFilters.map((item) => (item.id === filter.id ? filter : item))
        : [...current.savedFilters, filter],
    }
  })
}

export function deleteRosterFilter(id: string): RosterState {
  return updateRoster((current) => ({
    ...current,
    savedFilters: current.savedFilters.filter((filter) => filter.id !== id),
  }))
}

export function setRosterSetup(setup: Partial<RosterSetup>): RosterState {
  return updateRoster((current) => ({
    ...current,
    setup: {
      ...current.setup,
      ...setup,
      folderName: setup.folderName?.trim() || current.setup.folderName,
    },
  }))
}

export function subscribeRoster(listener: (state: RosterState) => void): () => void {
  const notify = () => listener(getRosterState())
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === ROSTER_STORAGE_KEY) notify()
  }
  window.addEventListener(ROSTER_CHANGED_EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(ROSTER_CHANGED_EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}

export function useRosterStore() {
  const [state, setState] = useState<RosterState>(seedState)

  useEffect(() => {
    setState(getRosterState())
    return subscribeRoster(setState)
  }, [])

  return {
    ...state,
    setEmployees: setRosterEmployees,
    addEmployees: addRosterEmployees,
    patchEmployee: patchRosterEmployee,
    replaceEmployee: replaceRosterEmployee,
    removeEmployees: removeRosterEmployees,
    saveCustomField: saveRosterCustomField,
    setCustomFields: setRosterCustomFields,
    deleteCustomField: deleteRosterCustomField,
    saveFilter: saveRosterFilter,
    deleteFilter: deleteRosterFilter,
    setSetup: setRosterSetup,
  }
}
