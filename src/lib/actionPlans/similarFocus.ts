import { getAllInitiativesRaw } from '@/lib/empowerIntegration/storage'

export type SimilarFocusRow = {
  focusLabel: string
  managerCount: number
  planIds: string[]
}

/** Glint-style: managers working on the same focus area (admin insight). */
export function getSimilarFocusClusters(): SimilarFocusRow[] {
  const byFocus = new Map<string, { managers: Set<string>; planIds: string[] }>()

  for (const plan of getAllInitiativesRaw()) {
    if (plan.status === 'cancelled') continue
    const label = plan.dataFocus?.label ?? plan.surveyLink?.focus.label ?? 'Unlinked'
    const entry = byFocus.get(label) ?? { managers: new Set<string>(), planIds: [] }
    entry.managers.add(plan.ownerId)
    entry.planIds.push(plan.id)
    byFocus.set(label, entry)
  }

  return [...byFocus.entries()]
    .map(([focusLabel, data]) => ({
      focusLabel,
      managerCount: data.managers.size,
      planIds: data.planIds,
    }))
    .filter((row) => row.managerCount >= 1)
    .sort((a, b) => b.managerCount - a.managerCount)
}
