'use client'

import { useEffect, useState } from 'react'
import { MOCK_STUDIES, type Study } from '@/data/mock-studies'

export const STUDIES_STORAGE_KEY = 'pp_studies'
export const STUDIES_CHANGED_EVENT = 'pp_studies_changed'

export type StudiesState = {
  studies: Study[]
  recycleBin: Study[]
}

function seedState(): StudiesState {
  return {
    studies: MOCK_STUDIES.map((study) => ({ ...study })),
    recycleBin: [],
  }
}

function normalizeState(raw: unknown): StudiesState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (!Array.isArray(value.studies)) return null
  return {
    studies: value.studies as Study[],
    recycleBin: Array.isArray(value.recycleBin) ? (value.recycleBin as Study[]) : [],
  }
}

function readStored(): StudiesState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STUDIES_STORAGE_KEY)
    if (!raw) return null
    return normalizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeStored(state: StudiesState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STUDIES_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(STUDIES_CHANGED_EVENT))
}

export function getStudiesState(): StudiesState {
  const stored = readStored()
  if (stored) return stored
  const seeded = seedState()
  writeStored(seeded)
  return seeded
}

function updateStudies(updater: (current: StudiesState) => StudiesState): StudiesState {
  const next = updater(getStudiesState())
  writeStored(next)
  return next
}

export function setStudiesList(studies: Study[]): StudiesState {
  return updateStudies((current) => ({ ...current, studies }))
}

export function setStudiesRecycleBin(recycleBin: Study[]): StudiesState {
  return updateStudies((current) => ({ ...current, recycleBin }))
}

export function setStudiesState(next: StudiesState): StudiesState {
  writeStored(next)
  return next
}

export function subscribeStudies(listener: (state: StudiesState) => void): () => void {
  const notify = () => listener(getStudiesState())
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === STUDIES_STORAGE_KEY) notify()
  }
  window.addEventListener(STUDIES_CHANGED_EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(STUDIES_CHANGED_EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}

export function useStudiesStore() {
  const [state, setState] = useState<StudiesState>(seedState)

  useEffect(() => {
    setState(getStudiesState())
    return subscribeStudies(setState)
  }, [])

  return {
    ...state,
    setStudies: setStudiesList,
    setRecycleBin: setStudiesRecycleBin,
    setState: setStudiesState,
  }
}
