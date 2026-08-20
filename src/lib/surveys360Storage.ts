import {
  createSurvey360Draft,
  mockSurveys360,
  type Survey360,
  type Survey360Source,
} from '@/data/mock/surveys360'

const STORAGE_KEY = 'pp_surveys_360'

function readStored(): Survey360[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Survey360[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStored(surveys: Survey360[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys))
}

export function getSurveys360(): Survey360[] {
  const stored = readStored()
  if (stored && stored.length > 0) return stored
  writeStored(mockSurveys360)
  return mockSurveys360.map((survey) => ({
    ...survey,
    sections: survey.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({ ...question })),
    })),
  }))
}

export function getSurvey360ById(id: string): Survey360 | undefined {
  return getSurveys360().find((survey) => survey.id === id)
}

export function saveSurvey360(survey: Survey360): Survey360[] {
  const all = getSurveys360()
  const exists = all.some((item) => item.id === survey.id)
  const next = exists
    ? all.map((item) => (item.id === survey.id ? { ...survey, updatedAt: new Date().toISOString() } : item))
    : [{ ...survey, updatedAt: new Date().toISOString() }, ...all]
  writeStored(next)
  return next
}

export function createAndSaveSurvey360(source: Survey360Source): Survey360 {
  const draft = createSurvey360Draft(source)
  saveSurvey360(draft)
  return draft
}
