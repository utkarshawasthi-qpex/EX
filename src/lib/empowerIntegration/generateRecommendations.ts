import { getExCategoriesForScope, getSurveyDataset } from '@/lib/empowerIntegration/aggregate'

export type RecommendedTask = {
  id: string
  text: string
  category: string
  favorability: number
  priority: 'high' | 'medium' | 'low'
  selected: boolean
  surveyId: string
  surveyName: string
  categoryId: string
}

type CategoryTarget = {
  surveyId: string
  surveyName: string
  categoryId: string
  category: string
  favorability: number
}

function priorityForFavorability(favorability: number): RecommendedTask['priority'] {
  if (favorability < 60) return 'high'
  if (favorability < 75) return 'medium'
  return 'low'
}

function taskTextForCategory(category: string, favorability: number): string {
  const name = category.toLowerCase()

  if (name.includes('growth') || name.includes('development')) {
    return `Add a career-path conversation to every manager 1:1 this quarter and share a simple role-growth guide (${favorability}% favorable today).`
  }
  if (name.includes('communicat') || name.includes('transpar')) {
    return `Start a monthly all-hands with open Q&A and publish key decisions within two business days (${favorability}% favorable today).`
  }
  if (name.includes('wellbeing')) {
    return `Review wellbeing themes with affected managers and offer two concrete support options within 60 days (${favorability}% favorable today).`
  }
  if (name.includes('manager')) {
    return `Run a manager coaching clinic focused on weekly check-ins and clear expectations (${favorability}% favorable today).`
  }
  if (name.includes('inclusion')) {
    return `Ask managers to run one inclusion check-in in their next team meeting and capture one improvement idea per team (${favorability}% favorable today).`
  }
  if (name.includes('retention') || name.includes('recognition')) {
    return `Define recognition criteria with people managers and pilot a peer shout-out ritual for 30 days (${favorability}% favorable today).`
  }

  return `Run a leadership review on ${category}, name the top three root causes, and publish a 30-day fix plan (${favorability}% favorable today).`
}

function collectCategoryTargets(surveyIds: string[]): CategoryTarget[] {
  const targets: CategoryTarget[] = []
  const seen = new Set<string>()

  for (const surveyId of surveyIds) {
    const survey = getSurveyDataset(surveyId)
    if (!survey) continue
    const categories = getExCategoriesForScope(surveyId, { kind: 'org' })
    for (const category of categories) {
      const key = `${surveyId}:${category.id}`
      if (seen.has(key)) continue
      seen.add(key)
      targets.push({
        surveyId,
        surveyName: survey.name,
        categoryId: category.id,
        category: category.label,
        favorability: category.favorability,
      })
    }
  }

  return targets.sort((left, right) => left.favorability - right.favorability)
}

/**
 * Builds 4–6 recommended tasks from the lowest-scoring categories across
 * the selected EX surveys. Uses the same plain-language style as the
 * dashboard Summary recommendations.
 */
export function generateInitiativeRecommendations(surveyIds: string[]): RecommendedTask[] {
  const targets = collectCategoryTargets(surveyIds)
  if (targets.length === 0) return []

  const count = Math.min(6, Math.max(4, targets.length))
  const selected = targets.slice(0, count)

  // If we have fewer than 4 distinct categories, reuse the lowest ones with
  // alternate wording so the checklist still feels populated.
  while (selected.length < 4 && targets.length > 0) {
    const base = targets[selected.length % targets.length]!
    selected.push(base)
  }

  return selected.map((target, index) => {
    const isRepeat = selected.findIndex((item) => item === target) !== index
    const text = isRepeat
      ? `Check ${target.category} scores again after the first fixes ship, and share the before/after with employees.`
      : taskTextForCategory(target.category, target.favorability)

    return {
      id: `rec_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      category: target.category,
      favorability: target.favorability,
      priority: priorityForFavorability(target.favorability),
      selected: true,
      surveyId: target.surveyId,
      surveyName: target.surveyName,
      categoryId: target.categoryId,
    }
  })
}

export function overallFavorability(surveyId: string): number | undefined {
  const categories = getExCategoriesForScope(surveyId, { kind: 'org' })
  if (categories.length === 0) return undefined
  const total = categories.reduce((sum, category) => sum + category.favorability, 0)
  return Math.round(total / categories.length)
}
