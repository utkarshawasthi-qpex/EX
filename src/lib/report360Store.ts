'use client'

import { useEffect, useState } from 'react'
import {
  cloneReport360Template,
  createDefaultReport360Template,
  migrateReport360Template,
  type Report360Template,
} from '@/data/mock-360-reports'

const STORAGE_KEY = 'pp_360_report_templates'
const LIBRARY_KEY = 'pp_360_report_template_library'
const CHANGED_EVENT = 'pp-360-report-templates-changed'
const LIBRARY_EVENT = 'pp-360-report-template-library-changed'

export type SavedReport360Template = {
  id: string
  name: string
  template: Report360Template
}

type TemplateMap = Record<string, Report360Template>

function readMap(): TemplateMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as TemplateMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(map: TemplateMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

export function getReport360Template(surveyId: string): Report360Template {
  const stored = readMap()[surveyId]
  if (stored?.blocks?.length) return cloneReport360Template(migrateReport360Template(stored))
  return createDefaultReport360Template()
}

export function saveReport360Template(surveyId: string, template: Report360Template): Report360Template {
  const next = cloneReport360Template(template)
  const map = readMap()
  map[surveyId] = next
  writeMap(map)
  return next
}

export function resetReport360Template(surveyId: string): Report360Template {
  const fresh = createDefaultReport360Template()
  return saveReport360Template(surveyId, fresh)
}

function readLibrary(): SavedReport360Template[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedReport360Template[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLibrary(library: SavedReport360Template[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
  window.dispatchEvent(new Event(LIBRARY_EVENT))
}

export function getSavedReport360Templates(): SavedReport360Template[] {
  return readLibrary().map((item) => ({
    ...item,
    template: cloneReport360Template(migrateReport360Template(item.template)),
  }))
}

export function saveReport360TemplateToLibrary(
  name: string,
  template: Report360Template,
): SavedReport360Template {
  const trimmed = name.trim()
  const library = readLibrary()
  const existing = library.find((item) => item.name.toLowerCase() === trimmed.toLowerCase())
  const saved: SavedReport360Template = {
    id: existing?.id ?? `tpl_${Date.now()}`,
    name: trimmed,
    template: cloneReport360Template(template),
  }
  const next = existing
    ? library.map((item) => (item.id === existing.id ? saved : item))
    : [...library, saved]
  writeLibrary(next)
  return saved
}

export function useSavedReport360Templates() {
  const [templates, setTemplates] = useState<SavedReport360Template[]>([])

  useEffect(() => {
    setTemplates(getSavedReport360Templates())
    const refresh = () => setTemplates(getSavedReport360Templates())
    window.addEventListener(LIBRARY_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LIBRARY_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return templates
}

export function useReport360Template(surveyId: string) {
  const [template, setTemplate] = useState<Report360Template>(createDefaultReport360Template)

  useEffect(() => {
    if (!surveyId) return
    setTemplate(getReport360Template(surveyId))
    const refresh = () => setTemplate(getReport360Template(surveyId))
    window.addEventListener(CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [surveyId])

  return {
    template,
    setTemplate,
    save: (next: Report360Template) => {
      const saved = saveReport360Template(surveyId, next)
      setTemplate(saved)
      return saved
    },
    reset: () => {
      const saved = resetReport360Template(surveyId)
      setTemplate(saved)
      return saved
    },
  }
}
