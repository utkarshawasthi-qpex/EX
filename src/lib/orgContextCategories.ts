import type { OrgContext, OrgContextCategory } from '@/types'

export const ORG_CONTEXT_CATEGORIES: {
  id: OrgContextCategory
  label: string
  badgeClass: string
  textClass: string
}[] = [
  {
    id: 'policy',
    label: 'Policy',
    badgeClass: 'bg-blue-100 text-blue-700',
    textClass: 'text-blue-700',
  },
  {
    id: 'initiative',
    label: 'Initiative',
    badgeClass: 'bg-green-100 text-green-700',
    textClass: 'text-green-700',
  },
  {
    id: 'to_do',
    label: 'To-Do',
    badgeClass: 'bg-amber-100 text-amber-700',
    textClass: 'text-amber-700',
  },
  {
    id: 'not_to_do',
    label: 'Not To-Do',
    badgeClass: 'bg-red-100 text-red-700',
    textClass: 'text-red-700',
  },
  {
    id: 'guideline',
    label: 'Guideline',
    badgeClass: 'bg-gray-100 text-gray-700',
    textClass: 'text-gray-700',
  },
  {
    id: 'kpi',
    label: 'KPI',
    badgeClass: 'bg-purple-100 text-purple-700',
    textClass: 'text-purple-700',
  },
]

export const ORG_CONTEXT_TAG_TOOLTIPS: Record<OrgContextCategory, string> = {
  policy:
    'A formal rule or constraint the AI must never recommend violating. Treated as a hard boundary.',
  initiative:
    'An active programme your organisation is running. AI will recommend actions that support and accelerate it.',
  to_do:
    'A priority action your org is committed to. AI recommendations will align with and build on these.',
  not_to_do:
    'An action the AI must never suggest, regardless of what the data shows. A hard block on recommendations.',
  guideline:
    'A soft preference that shapes tone and approach but is not a hard constraint. AI treats these as strong suggestions.',
  kpi:
    'A target metric with a current value and deadline. AI links recommendations to closing the gap.',
}

export function getCategoryMeta(category: OrgContextCategory) {
  return (
    ORG_CONTEXT_CATEGORIES.find((item) => item.id === category) ?? ORG_CONTEXT_CATEGORIES[0]
  )
}

export function getCategoryLabel(category: OrgContextCategory): string {
  return getCategoryMeta(category).label
}

export function countContextByCategory(context: OrgContext): Record<OrgContextCategory, number> {
  const counts: Record<OrgContextCategory, number> = {
    policy: 0,
    initiative: 0,
    to_do: 0,
    not_to_do: 0,
    guideline: 0,
    kpi: 0,
  }

  for (const file of context.files) {
    counts[file.category] += 1
  }
  for (const note of context.notes) {
    counts[note.category] += 1
  }
  counts.kpi += context.kpis?.length ?? 0

  return counts
}

export function formatOrgContextForPrompt(context: OrgContext): string {
  const parts: string[] = []

  for (const file of context.files) {
    parts.push(`[${getCategoryLabel(file.category)}] Document: ${file.name}`)
  }
  for (const note of context.notes) {
    parts.push(`[${getCategoryLabel(note.category)}] ${note.text}`)
  }

  if (context.kpis?.length) {
    parts.push('KPIs to address:')
    for (const kpi of context.kpis) {
      parts.push(
        `- ${kpi.metric}: currently ${kpi.currentValue}, target ${kpi.targetValue} by ${kpi.deadline}`,
      )
    }
  }

  return parts.join('\n')
}
