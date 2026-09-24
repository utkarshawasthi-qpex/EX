import { getExCategoriesForScope, listAccessibleExSurveys } from '@/lib/empowerIntegration/aggregate'

export type SurveyFocusOption = {
  id: string
  surveyId: string
  surveyName: string
  cycleLabel: string
  categoryId: string
  label: string
  favorability: number
}

export function listFocusAreasForSurvey(surveyId: string, limit = 8): SurveyFocusOption[] {
  const survey = listAccessibleExSurveys(true).find((s) => s.id === surveyId)
  if (!survey) return []

  const categories = getExCategoriesForScope(surveyId, { kind: 'org' })
  return categories
    .map((category) => ({
      id: `${surveyId}:${category.id}`,
      surveyId,
      surveyName: survey.name,
      cycleLabel: survey.cycleLabel,
      categoryId: category.id,
      label: category.label,
      favorability: category.favorability,
    }))
    .sort((a, b) => a.favorability - b.favorability)
    .slice(0, limit)
}

/** Lowest-scoring EX categories across accessible surveys — drives initiative suggestions. */
export function listFocusAreasFromSurveyData(limit = 12): SurveyFocusOption[] {
  const surveys = listAccessibleExSurveys(true)
  const options: SurveyFocusOption[] = []

  for (const survey of surveys) {
    const categories = getExCategoriesForScope(survey.id, { kind: 'org' })
    for (const category of categories) {
      options.push({
        id: `${survey.id}:${category.id}`,
        surveyId: survey.id,
        surveyName: survey.name,
        cycleLabel: survey.cycleLabel,
        categoryId: category.id,
        label: category.label,
        favorability: category.favorability,
      })
    }
  }

  return options.sort((a, b) => a.favorability - b.favorability).slice(0, limit)
}
