import type { AiSummaryOrgContext, AiSummaryOrgContextBudgetSegment, AiSummaryOrgContextInputKey } from '@/types'
import {
  AI_SUMMARY_FILE_SLOTS,
  AI_SUMMARY_MAX_TOKENS,
  AI_SUMMARY_TEXT_FIELDS,
  estimateTokensFromText,
} from '@/lib/aiSummaryOrgContext/constants'

export function createEmptyAiSummaryOrgContext(): AiSummaryOrgContext {
  return {
    files: {
      policy: null,
      guidelines: null,
      initiative: null,
    },
    textFields: {
      todo: '',
      notToDo: '',
      kpis: '',
    },
    updatedAt: new Date().toISOString(),
  }
}

export function getCombinedFileBytes(context: AiSummaryOrgContext): number {
  return Object.values(context.files).reduce(
    (total, file) => total + (file?.sizeBytes ?? 0),
    0,
  )
}

export function getInputLabel(key: AiSummaryOrgContextInputKey): string {
  const fileSlot = AI_SUMMARY_FILE_SLOTS.find((slot) => slot.key === key)
  if (fileSlot) return fileSlot.label
  const textField = AI_SUMMARY_TEXT_FIELDS.find((field) => field.key === key)
  return textField?.label ?? key
}

export function getBudgetSegments(context: AiSummaryOrgContext): AiSummaryOrgContextBudgetSegment[] {
  const segments: AiSummaryOrgContextBudgetSegment[] = []

  for (const slot of AI_SUMMARY_FILE_SLOTS) {
    const file = context.files[slot.key]
    segments.push({
      key: slot.key,
      label: slot.label,
      tokens: file?.tokenEstimate ?? 0,
    })
  }

  for (const field of AI_SUMMARY_TEXT_FIELDS) {
    segments.push({
      key: field.key,
      label: field.label,
      tokens: estimateTokensFromText(context.textFields[field.key]),
    })
  }

  return segments
}

export function getTotalTokenUsage(context: AiSummaryOrgContext): number {
  return getBudgetSegments(context).reduce((total, segment) => total + segment.tokens, 0)
}

export function getBudgetUsagePercent(context: AiSummaryOrgContext): number {
  return Math.min(100, (getTotalTokenUsage(context) / AI_SUMMARY_MAX_TOKENS) * 100)
}

export type BudgetMeterState = 'default' | 'warning' | 'critical'

export function getBudgetMeterState(context: AiSummaryOrgContext): BudgetMeterState {
  const percent = getBudgetUsagePercent(context)
  if (percent > 95) return 'critical'
  if (percent >= 70) return 'warning'
  return 'default'
}

export function wouldExceedTokenBudget(
  context: AiSummaryOrgContext,
  nextTokensByKey: Partial<Record<AiSummaryOrgContextInputKey, number>>,
): boolean {
  const segments = getBudgetSegments(context)
  let total = 0

  for (const segment of segments) {
    total += nextTokensByKey[segment.key] ?? segment.tokens
  }

  return total > AI_SUMMARY_MAX_TOKENS
}

export function assembleAiSummaryOrgContextPrompt(context: AiSummaryOrgContext): string {
  const sections: Array<{ header: string; text: string; truncateOrder?: number }> = []

  const policy = context.files.policy?.extractedText.trim()
  if (policy) sections.push({ header: '[POLICY]', text: policy, truncateOrder: 2 })

  const guidelines = context.files.guidelines?.extractedText.trim()
  if (guidelines) sections.push({ header: '[GUIDELINES]', text: guidelines, truncateOrder: 1 })

  const initiative = context.files.initiative?.extractedText.trim()
  if (initiative) sections.push({ header: '[CURRENT INITIATIVES]', text: initiative, truncateOrder: 3 })

  const kpis = context.textFields.kpis.trim()
  if (kpis) sections.push({ header: '[KPIS AND TARGETS]', text: kpis })

  const todo = context.textFields.todo.trim()
  if (todo) sections.push({ header: '[MUST DO]', text: todo })

  const notToDo = context.textFields.notToDo.trim()
  if (notToDo) sections.push({ header: '[MUST NOT DO]', text: notToDo })

  let totalTokens = sections.reduce(
    (sum, section) => sum + estimateTokensFromText(section.text),
    0,
  )

  if (totalTokens <= AI_SUMMARY_MAX_TOKENS) {
    return sections.map((section) => `${section.header}\n${section.text}`).join('\n\n')
  }

  const truncatable = sections
    .filter((section) => section.truncateOrder !== undefined)
    .sort((a, b) => (a.truncateOrder ?? 0) - (b.truncateOrder ?? 0))

  const truncatedKeys = new Set<string>()

  for (const section of truncatable) {
    if (totalTokens <= AI_SUMMARY_MAX_TOKENS) break
    totalTokens -= estimateTokensFromText(section.text)
    truncatedKeys.add(section.header)
  }

  if (truncatedKeys.size > 0) {
    console.warn(
      '[aiSummaryOrgContext] Generation-time truncation applied to:',
      [...truncatedKeys].join(', '),
    )
  }

  return sections
    .filter((section) => !truncatedKeys.has(section.header))
    .map((section) => `${section.header}\n${section.text}`)
    .join('\n\n')
}
