import { CATEGORY_BASELINES, CATEGORY_KEYS } from '@/data/mock/categorySentimentData'
import {
  mockDriverAnalysisData,
  mockENPSData,
  mockHeatmapData,
  mockResponseRateData,
  mockScorecardData,
  mockTimeTrendData,
} from '@/data/mock/analyticsData'
import { assembleAiSummaryOrgContextPrompt, createEmptyAiSummaryOrgContext } from '@/lib/aiSummaryOrgContext/budget'
import {
  activeFiltersToLabels,
  findWeakestDepartmentCategoryCell,
  getFilteredCategorySentiment,
  getFilteredENPS,
  getFilteredResponseRate,
  getFilteredSentiment,
} from '@/lib/dashboardFilters'
import { getOrgContextText } from '@/lib/orgContext'
import { buildSummaryContent, normalizeActionsFromApi } from '@/lib/summaryContent'
import { getCurrentUser } from '@/lib/userContext'
import type { ActiveFilter, DashboardWidget, SummaryAction, SummaryContent, SummaryPriority } from '@/types'

export function buildDataContext(widgets: DashboardWidget[]): string {
  const lines: string[] = []

  for (const widget of widgets) {
    switch (widget.type) {
      case 'scorecard':
        lines.push('SCORECARD DATA:')
        lines.push('Overall favorability: 40% favorable, 20% neutral, 40% unfavorable')
        lines.push(
          `Key markers: ${mockScorecardData.markers
            .map((marker) => `${marker.name}: ${marker.favorable}%`)
            .join(', ')}`,
        )
        break
      case 'enps':
        lines.push('ENPS DATA:')
        lines.push(`eNPS Score: ${mockENPSData.score}`)
        lines.push(
          `Detractors: ${mockENPSData.detractors}%, Passives: ${mockENPSData.passives}%, Promoters: ${mockENPSData.promoters}%`,
        )
        break
      case 'heatmap':
        lines.push('HEATMAP DATA:')
        lines.push(`Survey: ${mockHeatmapData.surveyName}`)
        lines.push(`Metrics: ${mockHeatmapData.metrics.join(', ')}`)
        break
      case 'response_rate':
        lines.push('RESPONSE RATE:')
        lines.push(
          `Sent: ${mockResponseRateData.overview.sent}, Completed: ${mockResponseRateData.overview.completed}, Rate: ${mockResponseRateData.overview.rate}%`,
        )
        break
      case 'time_trend':
        lines.push('TIME TREND:')
        lines.push(
          `Showing trends for: ${mockTimeTrendData.series.map((series) => series.name).join(', ')}`,
        )
        break
      case 'driver_analysis':
        lines.push('DRIVER ANALYSIS:')
        lines.push(
          `Top drivers: ${mockDriverAnalysisData.drivers
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 3)
            .map((driver) => `${driver.name} (impact: ${driver.impact})`)
            .join(', ')}`,
        )
        break
      default:
        lines.push(`${widget.type.toUpperCase()}: ${widget.title}`)
        break
    }
  }

  return lines.join('\n')
}

export function buildFullPrompt(
  dataContext: string,
  orgContext: string,
  filters: string[],
  personalContext?: string,
  viewType: 'company' | 'team' = 'company',
  guidance?: string,
): string {
  return `
You are an HR analytics expert analyzing employee experience survey data for ${
    viewType === 'team' ? 'a specific team or department' : 'the entire organization'
  }.

ORGANIZATION CONTEXT:
${orgContext}${
    personalContext
      ? `

TEAM-SPECIFIC CONTEXT (from the manager):
${personalContext}`
      : ''
  }

ACTIVE FILTERS:
${
  filters.length > 0
    ? filters.join(', ')
    : `None — ${viewType === 'team' ? 'showing team data' : 'showing all data'}`
}

DASHBOARD DATA:
${dataContext}

Provide a ${viewType === 'team' ? 'team-level' : 'organization-level'} analysis.
Return ONLY valid JSON, no markdown:
{
  "summary": "Single flowing narrative paragraph combining what the data shows and why. Written as prose, not bullet points. Minimum 100 words. Plain language, no jargon.",
  "actions": [
    exactly 4 items, one per priority level 1–4, sorted ascending by priority,
    each with action, timeframe, owner, priority, context
  ]
}

Rules:
- summary: minimum 100 words, narrative prose not bullets
- actions: exactly 4 items, sorted by priority (1 = highest)
- priority: 1, 2, 3, or 4 (integer) — one action per priority level
- timeframe: "30 days", "60 days", or "90 days" only
- owner: "Manager", "HR", or "Leadership" only
- context: max 6 words (e.g. "Targets transparency (54)")
${guidance ? `- User guidance: ${guidance}` : ''}
- For team view: make recommendations manager-actionable
- For company view: recommendations can involve HR/Leadership
- Ground everything in the data provided
`.trim()
}

export function buildSummaryOnlyPrompt(
  dataContext: string,
  orgContext: string,
  filters: string[],
  viewType: 'company' | 'team' = 'company',
  guidance?: string,
): string {
  return `
You are an expert HR analyst.

Generate ONLY the summary paragraph for this dashboard.
Do NOT include recommendations.

Requirements:
- 100 to 150 words exactly
- Single narrative paragraph combining what the data shows AND why. No bullet points. Present tense.
- Grounded strictly in the data provided.
${guidance ? `User guidance: ${guidance}` : ''}

ORGANIZATION CONTEXT:
${orgContext}

ACTIVE FILTERS:
${filters.length > 0 ? filters.join(', ') : 'None'}

DASHBOARD DATA:
${dataContext}

View: ${viewType === 'team' ? 'team-level' : 'organization-level'}

Return ONLY valid JSON, no markdown:
{ "summary": "..." }
`.trim()
}

export function buildRecommendationsOnlyPrompt(
  dataContext: string,
  orgContext: string,
  currentSummary: string,
  filters: string[],
  guidance?: string,
): string {
  return `
Generate exactly 4 recommended actions for this dashboard.

The current summary paragraph is:
'${currentSummary.replace(/'/g, "\\'")}'

Your recommendations should be consistent with this summary.

ORGANIZATION CONTEXT:
${orgContext}

ACTIVE FILTERS:
${filters.length > 0 ? filters.join(', ') : 'None'}

DASHBOARD DATA:
${dataContext}

Requirements:
- Exactly 4 actions, priority 1–4
- Each starts with a strong verb
- No action starts with 'Consider' or 'Look into'
- timeframe: '30 days' | '60 days' | '90 days' only
- owner: 'Manager' | 'HR' | 'Leadership' only
- context: max 6 words referencing a specific data point
- Never violate any NOT TO-DO in org context
${guidance ? `User guidance: ${guidance}` : ''}

Return ONLY valid JSON, no markdown:
{ "actions": [ ...exactly 4 items... ] }
`.trim()
}

const TEAM_FAVORABILITY_OFFSET = 8

const BANNED_SUMMARY_WORDS = [
  'leverage',
  'synergy',
  'holistic',
  'paradigm',
  'bandwidth',
  'utilize',
  'facilitate',
  'ecosystem',
  'deliverable',
  'actionable',
  'disruptive',
  'optimize',
  'streamline',
  'stakeholder',
  'north star',
  'move the needle',
  'circle back',
  'double down',
  'low-hanging fruit',
]

function summaryHash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickSummaryVariant<T>(variants: T[], seed: string, slot: string): T {
  return variants[summaryHash(`${seed}:${slot}`) % variants.length]!
}

function assertPlainLanguage(text: string): string {
  const lower = text.toLowerCase()
  for (const word of BANNED_SUMMARY_WORDS) {
    if (lower.includes(word)) {
      throw new Error(`Summary contains banned word: ${word}`)
    }
  }
  return text
}

export type DashboardFacts = {
  lowestCategory: { name: string; favorable: number; respondents: number }
  highestCategory: { name: string; favorable: number; respondents: number }
  worstHeatmapCell: { category: string; department: string; favorable: number } | null
  enps: number | null
  responseRate: number | null
  filterDescription: string | null
  rankedCategories: { name: string; favorable: number; respondents: number }[]
}

function readOrgContextText(): string {
  if (typeof window === 'undefined') {
    return assembleAiSummaryOrgContextPrompt(createEmptyAiSummaryOrgContext())
  }
  return getOrgContextText()
}

function filterLabels(activeFilters: ActiveFilter[]): string[] {
  return activeFiltersToLabels(activeFilters)
}

function buildFilterDescription(activeFilters: ActiveFilter[]): string | null {
  if (activeFilters.length === 0) return null
  return `${activeFilters.map((filter) => filter.value).join(', ')} respondents`
}

function getScorecardCategories(
  activeFilters: ActiveFilter[],
  viewType: 'company' | 'team',
): Array<{ name: string; favorable: number; respondents: number }> {
  if (activeFilters.length > 0) {
    return CATEGORY_KEYS.map((key) => {
      const sentiment = getFilteredCategorySentiment(activeFilters, key)
      let favorable = sentiment.favorable
      if (viewType === 'team') {
        favorable = Math.max(0, favorable - TEAM_FAVORABILITY_OFFSET)
      }
      return {
        name: CATEGORY_BASELINES[key].label,
        favorable,
        respondents: sentiment.count,
      }
    })
  }

  return mockScorecardData.markers
    .filter((marker) => marker.name !== 'Company Overall')
    .map((marker) => {
      let favorable = marker.favorable
      if (viewType === 'team') {
        favorable = Math.max(0, favorable - TEAM_FAVORABILITY_OFFSET)
      }

      return {
        name: marker.name,
        favorable,
        respondents: marker.respondents,
      }
    })
}

function sortCategoriesByFavorability(
  categories: Array<{ name: string; favorable: number; respondents: number }>,
): Array<{ name: string; favorable: number; respondents: number }> {
  return [...categories].sort((a, b) => {
    if (a.favorable !== b.favorable) return a.favorable - b.favorable
    return a.name.localeCompare(b.name)
  })
}

export function computeDashboardFacts(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  viewType: 'company' | 'team' = 'company',
): DashboardFacts {
  const categories = getScorecardCategories(activeFilters, viewType)
  const rankedCategories = sortCategoriesByFavorability(categories)
  const lowestCategory = rankedCategories[0] ?? {
    name: 'Unknown',
    favorable: 0,
    respondents: 0,
  }
  const highestCategory = rankedCategories[rankedCategories.length - 1] ?? lowestCategory

  const hasHeatmap = dataWidgets.some((widget) => widget.type === 'heatmap')
  const hasEnps = dataWidgets.some((widget) => widget.type === 'enps')
  const hasResponseRate = dataWidgets.some((widget) => widget.type === 'response_rate')

  const enps = hasEnps
    ? activeFilters.length > 0
      ? getFilteredENPS(activeFilters).score
      : mockENPSData.score
    : null

  const responseRate = hasResponseRate
    ? activeFilters.length > 0
      ? getFilteredResponseRate(activeFilters).rate
      : mockResponseRateData.overview.rate
    : null

  return {
    lowestCategory,
    highestCategory,
    worstHeatmapCell: hasHeatmap ? findWeakestDepartmentCategoryCell(activeFilters) : null,
    enps,
    responseRate,
    filterDescription: buildFilterDescription(activeFilters),
    rankedCategories,
  }
}

export function composeSummary(
  facts: DashboardFacts,
  viewType: 'company' | 'team',
  variantSeed?: string,
): string {
  const seed = variantSeed ?? `${Date.now()}`
  const audience = viewType === 'team' ? 'employees on your team' : 'employees'
  const { lowestCategory, highestCategory } = facts
  const sentences: string[] = []

  const headlineVariants = [
    () =>
      facts.filterDescription
        ? `Looking at ${facts.filterDescription}: ${lowestCategory.name} is the clearest problem area, with only ${lowestCategory.favorable}% of ${audience} responding favorably.`
        : `${lowestCategory.name} is the clearest problem area, with only ${lowestCategory.favorable}% of ${audience} responding favorably.`,
    () =>
      facts.filterDescription
        ? `Looking at ${facts.filterDescription}: ${lowestCategory.name} stands out as the most pressing concern — just ${lowestCategory.favorable}% responded favorably.`
        : `${lowestCategory.name} stands out as the most pressing concern — just ${lowestCategory.favorable}% of ${audience} responded favorably.`,
    () =>
      facts.filterDescription
        ? `Looking at ${facts.filterDescription}: ${lowestCategory.name} needs the most attention, with favorable responses at only ${lowestCategory.favorable}%.`
        : `${lowestCategory.name} needs the most attention, with favorable responses at only ${lowestCategory.favorable}%.`,
  ]
  sentences.push(pickSummaryVariant(headlineVariants, seed, 'headline')())

  const contrastVariants = [
    () =>
      `By contrast, ${highestCategory.name} is a genuine strength at ${highestCategory.favorable}%.`,
    () =>
      `${highestCategory.name} is a bright spot by comparison, with ${highestCategory.favorable}% favorable responses.`,
    () =>
      `On the positive side, ${highestCategory.name} leads at ${highestCategory.favorable}% favorable — a clear area of strength.`,
  ]
  sentences.push(pickSummaryVariant(contrastVariants, seed, 'contrast')())

  if (facts.worstHeatmapCell) {
    const cell = facts.worstHeatmapCell
    const heatmapVariants = [
      () =>
        `This shows up again at the department level — ${cell.department} scores lowest on ${cell.category} at ${cell.favorable}%, suggesting the issue may be sharper in that team than company-wide.`,
      () =>
        `The pattern deepens within teams: ${cell.department} rates ${cell.category} lowest at ${cell.favorable}%, which points to a sharper gap there than across the company.`,
      () =>
        `Drilling into departments, ${cell.department} is the weakest on ${cell.category} at ${cell.favorable}%, hinting the problem may be concentrated in that group.`,
    ]
    sentences.push(pickSummaryVariant(heatmapVariants, seed, 'heatmap')())
  }

  if (facts.enps !== null) {
    const enpsVariants =
      facts.enps >= 0
        ? [
            () =>
              `eNPS sits at ${facts.enps}, meaning more employees are recommending the company than discouraging others from joining.`,
            () =>
              `With an eNPS of ${facts.enps}, more people would recommend working here than warn others away.`,
          ]
        : [
            () =>
              `eNPS sits at ${facts.enps}, meaning more employees are actively discouraging others from joining than recommending it.`,
            () =>
              `An eNPS of ${facts.enps} shows more detractors than promoters — employees are more likely to warn others away than recommend the company.`,
          ]
    sentences.push(pickSummaryVariant(enpsVariants, seed, 'enps')())
  } else if (facts.responseRate !== null) {
    const responseRateVariants = [
      () =>
        `Survey participation reached ${facts.responseRate}%, giving these results a solid sample to act on.`,
      () =>
        `With a ${facts.responseRate}% response rate, the data reflects a broad enough share of the group to trust these patterns.`,
    ]
    sentences.push(pickSummaryVariant(responseRateVariants, seed, 'response-rate')())
  }

  const closingVariants =
    viewType === 'team'
      ? [
          () =>
            `Prioritizing ${lowestCategory.name} with your direct reports over the next quarter is likely to have the broadest impact on engagement.`,
          () =>
            `Focusing on ${lowestCategory.name} with your team in the next quarter should yield the widest gains in how people feel about work.`,
        ]
      : [
          () =>
            `Prioritizing ${lowestCategory.name} over the next quarter is likely to have the broadest impact on engagement.`,
          () =>
            `Addressing ${lowestCategory.name} first in the next quarter is the most direct path to improving how employees experience work here.`,
        ]
  sentences.push(pickSummaryVariant(closingVariants, seed, 'closing')())

  return assertPlainLanguage(sentences.join(' '))
}

function categoryFromActionContext(context: string): string | null {
  const match = context.match(/^Targets (.+?) \(\d+%\)$/)
  return match ? match[1] : null
}

function usedCategoriesFromActions(
  actions: SummaryAction[],
  excludePriority?: SummaryPriority,
): Set<string> {
  const categories = actions
    .filter((action) => action.priority !== excludePriority)
    .map((action) => categoryFromActionContext(action.context))
    .filter((category): category is string => Boolean(category))
  return new Set(categories)
}

function recommendationActionForCategory(
  category: { name: string; favorable: number },
  priority: 1 | 2 | 3 | 4,
  viewType: 'company' | 'team',
  variantSeed?: string,
): { action: string; timeframe: SummaryAction['timeframe']; owner: SummaryAction['owner'] } {
  const seed = variantSeed ?? `${category.name}:${priority}`
  const base = recommendationActionTemplate(category, priority, viewType)

  if (!variantSeed) return base

  const variantSuffix = pickSummaryVariant(
    ['', ' with clear milestones', ' and visible follow-through', ' tied to survey feedback'],
    seed,
    'suffix',
  )
  if (!variantSuffix) return base

  return {
    ...base,
    action: base.action.replace(/\.$/, '') + variantSuffix + '.',
  }
}

function recommendationActionTemplate(
  category: { name: string; favorable: number },
  priority: 1 | 2 | 3 | 4,
  viewType: 'company' | 'team',
): { action: string; timeframe: SummaryAction['timeframe']; owner: SummaryAction['owner'] } {
  if (viewType === 'team') {
    switch (priority) {
      case 1:
        return {
          action: `Meet with your team on ${category.name} and assign one owner for fixes.`,
          timeframe: '30 days',
          owner: 'Manager',
        }
      case 2:
        return {
          action: `Review ${category.name} feedback with direct reports and set two-week targets.`,
          timeframe: '30 days',
          owner: 'Manager',
        }
      case 3:
        return {
          action: `Ask HR for help on ${category.name} blockers your team flagged in the survey.`,
          timeframe: '60 days',
          owner: 'Manager',
        }
      case 4:
        return {
          action: `Check ${category.name} scores again after your team completes the action plan.`,
          timeframe: '90 days',
          owner: 'Manager',
        }
    }
  }

  switch (priority) {
    case 1:
      return {
        action: `Run a leadership review on ${category.name} and publish a 30-day plan.`,
        timeframe: '30 days',
        owner: 'Leadership',
      }
    case 2:
      return {
        action: `Work with HR to fix ${category.name} issues employees raised in the survey.`,
        timeframe: '60 days',
        owner: 'HR',
      }
    case 3:
      return {
        action: `Have managers track ${category.name} progress in weekly team meetings.`,
        timeframe: '60 days',
        owner: 'Manager',
      }
    case 4:
      return {
        action: `Re-run the survey to see if ${category.name} scores improved.`,
        timeframe: '90 days',
        owner: 'Leadership',
      }
  }
}

export function composeRecommendations(
  facts: DashboardFacts,
  viewType: 'company' | 'team' = 'company',
): SummaryAction[] {
  const categories = facts.rankedCategories.slice(0, 4)
  const priorities: SummaryPriority[] = [1, 2, 3, 4]

  return normalizeActionsFromApi(
    categories.map((category, index) => {
      const priority = priorities[index]
      const template = recommendationActionForCategory(category, priority, viewType)
      return {
        action: template.action,
        timeframe: template.timeframe,
        owner: template.owner,
        context: `Targets ${category.name} (${category.favorable}%)`,
        regenerationsUsed: 0,
      }
    }),
  )
}

export function composeSingleRecommendation(
  facts: DashboardFacts,
  priority: SummaryPriority,
  viewType: 'company' | 'team',
  currentActions: SummaryAction[],
  variantSeed?: string,
): SummaryAction {
  const usedCategories = usedCategoriesFromActions(currentActions, priority)
  const available = facts.rankedCategories.filter((category) => !usedCategories.has(category.name))
  const category =
    available[0] ??
    facts.rankedCategories.find((item) => !usedCategories.has(item.name)) ??
    facts.rankedCategories[priority - 1] ??
    facts.lowestCategory

  const template = recommendationActionForCategory(
    category,
    priority,
    viewType,
    variantSeed ?? `${Date.now()}-${priority}`,
  )

  return {
    id: currentActions.find((action) => action.priority === priority)?.id ?? `action_${priority}`,
    action: template.action,
    timeframe: template.timeframe,
    owner: template.owner,
    priority,
    context: `Targets ${category.name} (${category.favorable}%)`,
    linkedInitiativeId: undefined,
    regenerationsUsed: 0,
  }
}

export function mergeRecommendationsForFullUpdate(
  existingActions: SummaryAction[],
  facts: DashboardFacts,
  viewType: 'company' | 'team',
): { actions: SummaryAction[]; allRecommendationsLocked: boolean } {
  const sorted = [...existingActions].sort((a, b) => a.priority - b.priority)
  const allRecommendationsLocked = sorted.every((action) => Boolean(action.linkedInitiativeId))

  if (allRecommendationsLocked) {
    return { actions: sorted, allRecommendationsLocked: true }
  }

  const lockedCategories = usedCategoriesFromActions(
    sorted.filter((action) => action.linkedInitiativeId),
  )
  const available = facts.rankedCategories.filter((category) => !lockedCategories.has(category.name))
  let categoryIndex = 0

  const merged = sorted.map((existing) => {
    if (existing.linkedInitiativeId) {
      return existing
    }

    const category =
      available[categoryIndex] ??
      facts.rankedCategories.find(
        (item) =>
          !lockedCategories.has(item.name) &&
          !sorted.some(
            (action) =>
              !action.linkedInitiativeId &&
              action.priority !== existing.priority &&
              categoryFromActionContext(action.context) === item.name,
          ),
      ) ??
      facts.rankedCategories[(existing.priority - 1) % facts.rankedCategories.length]

    categoryIndex += 1

    const template = recommendationActionForCategory(category, existing.priority, viewType)
    return {
      id: existing.id,
      action: template.action,
      timeframe: template.timeframe,
      owner: template.owner,
      priority: existing.priority,
      context: `Targets ${category.name} (${category.favorable}%)`,
      linkedInitiativeId: undefined,
      regenerationsUsed: 0,
    }
  })

  return { actions: merged, allRecommendationsLocked: false }
}

function mockTeamActions(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
): SummaryAction[] {
  return composeRecommendations(
    computeDashboardFacts(dataWidgets, activeFilters, 'team'),
    'team',
  )
}

function mockCompanyActions(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
): SummaryAction[] {
  return composeRecommendations(
    computeDashboardFacts(dataWidgets, activeFilters, 'company'),
    'company',
  )
}

export async function generateDashboardSummary(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  options?: {
    personalContext?: string
    viewType?: 'company' | 'team'
  },
): Promise<SummaryContent> {
  const viewType = options?.viewType ?? 'company'
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildFullPrompt(
    dataContext,
    orgContext,
    filterLabels(activeFilters),
    options?.personalContext,
    viewType,
  )

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const generatedBy = getCurrentUser().id
  const facts = computeDashboardFacts(dataWidgets, activeFilters, viewType)
  const summary = composeSummary(facts, viewType, `${Date.now()}-${Math.random()}`)
  const actions =
    viewType === 'team'
      ? mockTeamActions(dataWidgets, activeFilters)
      : mockCompanyActions(dataWidgets, activeFilters)

  return buildSummaryContent(
    summary,
    actions,
    generatedBy,
    activeFilters,
    dataWidgets.map((widget) => widget.id),
  )
}

export async function generateFullUpdate(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  currentActions: SummaryAction[],
  options?: { viewType?: 'company' | 'team'; guidance?: string },
): Promise<{ summary: string; actions: SummaryAction[]; allRecommendationsLocked: boolean }> {
  const viewType = options?.viewType ?? 'company'
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildFullPrompt(
    dataContext,
    orgContext,
    filterLabels(activeFilters),
    undefined,
    viewType,
    options?.guidance,
  )

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const facts = computeDashboardFacts(dataWidgets, activeFilters, viewType)
  const summary = composeSummary(facts, viewType, `${Date.now()}-${Math.random()}`)
  const { actions, allRecommendationsLocked } = mergeRecommendationsForFullUpdate(
    currentActions,
    facts,
    viewType,
  )

  return { summary, actions, allRecommendationsLocked }
}

export async function generateSummaryOnlyRegeneration(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  viewType: 'company' | 'team' = 'company',
  guidance?: string,
): Promise<string> {
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildSummaryOnlyPrompt(dataContext, orgContext, filterLabels(activeFilters), viewType, guidance)

  await new Promise((resolve) => setTimeout(resolve, 1200))

  const facts = computeDashboardFacts(dataWidgets, activeFilters, viewType)
  return composeSummary(facts, viewType, `${Date.now()}-${Math.random()}`)
}

export async function generateSingleRecommendation(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  slotIndex: number,
  currentActions: SummaryAction[],
  viewType: 'company' | 'team' = 'company',
): Promise<SummaryAction> {
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildRecommendationsOnlyPrompt(
    dataContext,
    orgContext,
    '',
    filterLabels(activeFilters),
  )

  await new Promise((resolve) => setTimeout(resolve, 1200))

  const facts = computeDashboardFacts(dataWidgets, activeFilters, viewType)
  const priority = (slotIndex + 1) as SummaryPriority
  return composeSingleRecommendation(
    facts,
    priority,
    viewType,
    currentActions,
    `${Date.now()}-${Math.random()}-${priority}`,
  )
}

/** @deprecated batch recommendation regeneration removed — use generateSingleRecommendation */
export async function generateRecommendationsOnlyRegeneration(
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  currentSummary: string,
  guidance?: string,
  viewType: 'company' | 'team' = 'company',
): Promise<SummaryAction[]> {
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildRecommendationsOnlyPrompt(
    dataContext,
    orgContext,
    currentSummary,
    filterLabels(activeFilters),
    guidance,
  )

  await new Promise((resolve) => setTimeout(resolve, 1200))

  const facts = computeDashboardFacts(dataWidgets, activeFilters, viewType)
  const actions = composeRecommendations(facts, viewType)

  if (actions.length !== 4) {
    throw new Error('E-03: Expected exactly 4 recommendations')
  }

  void guidance
  return actions
}

/** @deprecated use generateSummaryOnlyRegeneration */
export async function regenerateSummaryParagraph(
  content: SummaryContent,
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
  viewType: 'company' | 'team' = 'company',
): Promise<SummaryContent> {
  void content
  const summary = await generateSummaryOnlyRegeneration(dataWidgets, activeFilters, viewType)
  return { ...content, summary }
}

/** @deprecated use generateRecommendationsOnlyRegeneration */
export async function regenerateSingleAction(
  content: SummaryContent,
  priority: SummaryPriority,
  dataWidgets: DashboardWidget[],
  activeFilters: ActiveFilter[],
): Promise<SummaryContent> {
  void priority
  void dataWidgets
  void activeFilters
  return content
}
