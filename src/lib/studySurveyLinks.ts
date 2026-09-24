import { STUDY_FOLDERS, type Study } from '@/data/mock-studies'
import { getSurveys } from '@/lib/mockDb'

export function getSurveyIdForStudy(study: Study): string {
  if (study.surveyId) return study.surveyId
  const match = getSurveys().find((survey) => survey.title === study.name)
  if (match) return match.id
  return `study_survey_${study.id}`
}

export function getStudyEditHref(study: Study): string {
  if (study.type === '360 Review') {
    return study.surveyId ? `/360/surveys/${study.surveyId}/edit` : '/lifecycle'
  }
  const surveyId = getSurveyIdForStudy(study)
  const params = new URLSearchParams()
  if (!study.surveyId && !getSurveys().some((s) => s.title === study.name)) {
    params.set('title', study.name)
  }
  params.set('folder', study.folderId)
  const query = params.toString()
  return `/lifecycle/surveys/${surveyId}/edit${query ? `?${query}` : ''}`
}

export function getFolderLabel(folderId: string): string {
  return STUDY_FOLDERS.find((folder) => folder.value === folderId)?.label ?? folderId
}
