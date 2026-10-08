'use client'

import { useEffect, useState } from 'react'
import { MOCK_COLLECTOR_FORMS, type CollectorForm } from '@/data/mock-collector-forms'
import { WORKPLACE_COLLECTOR_HEADCOUNT, cloneCollectorHeadcount, type CollectorHeadcount } from '@/data/mock-headcount'

export const DISTRIBUTION_STORAGE_KEY = 'ex_survey_distribution_v3'
export const DISTRIBUTION_CHANGED_EVENT = 'ex_survey_distribution_changed'

const WORKPLACE_SURVEY_ID = 'surv_workplace_culture'
const Q1_PULSE_SURVEY_ID = 'surv_q1_pulse'

export type SurveyDistributionState = {
  collectorForms: CollectorForm[]
}

type DistributionMap = Record<string, SurveyDistributionState>

const Q1_COLLECTOR: CollectorForm = {
  id: 'cf_q1_pulse',
  name: 'Break room QR',
  link: 'https://ex.questionpro.com/c/q1-pulse',
  status: 'Active',
  responsesCollected: 0,
  responsesExpected: null,
  createdAt: '2026-10-01',
  modifiedAt: '2026-10-01',
  validateEmployee: true,
  validateByEmail: true,
  collectEmployeeData: true,
  employeeFields: [{ id: 'cf_q1_pulse_first', name: 'First Name', required: false, custom: false }],
}

function cloneForms(forms: CollectorForm[]): CollectorForm[] {
  return forms.map((form) => ({
    ...form,
    employeeFields: form.employeeFields.map((field) => ({ ...field })),
    headcount: form.headcount ? cloneCollectorHeadcount(form.headcount) : null,
  }))
}

export function seedSurveyDistribution(surveyId: string): SurveyDistributionState {
  if (surveyId === WORKPLACE_SURVEY_ID) {
    return {
      collectorForms: cloneForms(MOCK_COLLECTOR_FORMS).map((form) =>
        form.id === 'cf_workplace_email'
          ? { ...form, headcount: cloneCollectorHeadcount(WORKPLACE_COLLECTOR_HEADCOUNT) }
          : form,
      ),
    }
  }
  if (surveyId === Q1_PULSE_SURVEY_ID) {
    return { collectorForms: cloneForms([Q1_COLLECTOR]) }
  }
  return { collectorForms: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readMap(): DistributionMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DISTRIBUTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return {}
    const surveys: DistributionMap = {}
    for (const [surveyId, value] of Object.entries(parsed)) {
      const normalized = normalizeState(value)
      if (normalized) surveys[surveyId] = normalized
    }
    return surveys
  } catch {
    return {}
  }
}

function writeMap(map: DistributionMap): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DISTRIBUTION_STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event(DISTRIBUTION_CHANGED_EVENT))
}

function normalizeState(value: unknown): SurveyDistributionState | null {
  if (!isRecord(value) || !Array.isArray(value.collectorForms)) return null
  const forms = value.collectorForms.flatMap((form) => {
    const normalized = asCollectorForm(form)
    return normalized ? [normalized] : []
  })
  return { collectorForms: forms }
}

function asCollectorForm(value: unknown): CollectorForm | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.link !== 'string') {
    return null
  }
  const record = value as Partial<CollectorForm>
  return {
    id: record.id ?? '',
    name: record.name ?? '',
    link: record.link ?? '',
    status: record.status === 'Inactive' ? 'Inactive' : 'Active',
    responsesCollected: typeof record.responsesCollected === 'number' ? record.responsesCollected : 0,
    responsesExpected: typeof record.responsesExpected === 'number' ? record.responsesExpected : null,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    modifiedAt: typeof record.modifiedAt === 'string' ? record.modifiedAt : new Date().toISOString(),
    validateEmployee: record.validateEmployee !== false,
    validateByEmail: record.validateByEmail !== false,
    collectEmployeeData: record.collectEmployeeData !== false,
    employeeFields: Array.isArray(record.employeeFields) ? record.employeeFields : [],
    headcount: asHeadcount(record.headcount),
  }
}

function asHeadcount(value: unknown): CollectorHeadcount | null {
  if (!isRecord(value) || !Array.isArray(value.sets) || !Array.isArray(value.rows)) return null
  const sets = value.sets.flatMap((set) => {
    if (!isRecord(set) || typeof set.id !== 'string' || typeof set.segment !== 'string' || !Array.isArray(set.segmentValues)) {
      return []
    }
    const criteria = Array.isArray(set.criteria)
      ? set.criteria.flatMap((item) => {
          if (!isRecord(item) || typeof item.dimension !== 'string' || !Array.isArray(item.values)) return []
          return [{ dimension: item.dimension, values: item.values.filter((option) => typeof option === 'string') }]
        })
      : []
    return [
      {
        id: set.id,
        segment: set.segment,
        segmentValues: set.segmentValues.filter((option) => typeof option === 'string'),
        criteria,
      },
    ]
  })
  const rows = value.rows.flatMap((item) => {
    if (!isRecord(item) || typeof item.setId !== 'string' || !isRecord(item.values) || typeof item.expectedHeadcount !== 'number') {
      return []
    }
    const values: Record<string, string> = {}
    for (const [key, option] of Object.entries(item.values)) {
      if (typeof option === 'string') values[key] = option
    }
    return [
      {
        setId: item.setId,
        values,
        expectedHeadcount: item.expectedHeadcount,
        managerEmail: typeof item.managerEmail === 'string' ? item.managerEmail : '',
        qrResponses: typeof item.qrResponses === 'number' ? item.qrResponses : 0,
        emailExpected: typeof item.emailExpected === 'number' ? item.emailExpected : 0,
        emailResponses: typeof item.emailResponses === 'number' ? item.emailResponses : 0,
      },
    ]
  })
  const totalExpected = typeof value.totalExpected === 'number' && value.totalExpected >= 0 ? value.totalExpected : null
  if (sets.length === 0 && rows.length === 0 && totalExpected == null) return null
  return {
    sets,
    rows,
    totalExpected,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  }
}

export function getSurveyDistribution(surveyId: string): SurveyDistributionState {
  const stored = readMap()[surveyId]
  return stored ?? seedSurveyDistribution(surveyId)
}

function updateSurvey(
  surveyId: string,
  updater: (current: SurveyDistributionState) => SurveyDistributionState,
): SurveyDistributionState {
  const map = readMap()
  const next = updater(map[surveyId] ?? seedSurveyDistribution(surveyId))
  writeMap({ ...map, [surveyId]: next })
  return next
}

export function updateCollectorForms(
  surveyId: string,
  updater: (current: CollectorForm[]) => CollectorForm[],
): SurveyDistributionState {
  return updateSurvey(surveyId, (current) => ({
    ...current,
    collectorForms: updater(current.collectorForms),
  }))
}

export function saveFormHeadcount(surveyId: string, formId: string, headcount: CollectorHeadcount): SurveyDistributionState {
  return updateCollectorForms(surveyId, (forms) =>
    forms.map((form) => (form.id === formId ? { ...form, headcount: cloneCollectorHeadcount(headcount) } : form)),
  )
}

export function subscribeDistribution(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === DISTRIBUTION_STORAGE_KEY) listener()
  }
  window.addEventListener(DISTRIBUTION_CHANGED_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(DISTRIBUTION_CHANGED_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSurveyDistribution(surveyId: string) {
  const [state, setState] = useState<SurveyDistributionState>(() => seedSurveyDistribution(surveyId))

  useEffect(() => {
    setState(getSurveyDistribution(surveyId))
    return subscribeDistribution(() => setState(getSurveyDistribution(surveyId)))
  }, [surveyId])

  return {
    ...state,
    setCollectorForms: (updater: (current: CollectorForm[]) => CollectorForm[]) =>
      updateCollectorForms(surveyId, updater),
    saveFormHeadcount: (formId: string, headcount: CollectorHeadcount) => saveFormHeadcount(surveyId, formId, headcount),
  }
}
