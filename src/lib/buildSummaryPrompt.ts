import {
  mockDriverAnalysisData,
  mockENPSData,
  mockHeatmapData,
  mockResponseRateData,
  mockScorecardData,
  mockTimeTrendData,
} from '@/data/mock/analyticsData'
import { assembleAiSummaryOrgContextPrompt, createEmptyAiSummaryOrgContext } from '@/lib/aiSummaryOrgContext/budget'
import { getOrgContextText } from '@/lib/orgContext'
import {
  appendActionVersion,
  appendSummaryVersion,
  buildSummaryContent,
  getActiveActions,
  normalizeActionsFromApi,
} from '@/lib/summaryContent'
import { getCurrentUser } from '@/lib/userContext'
import type { DashboardWidget, SummaryAction, SummaryContent, SummaryPriority } from '@/types'

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

export function buildSummaryPrompt(
  dataContext: string,
  orgContext: string,
  filters: string[],
  personalContext?: string,
  viewType: 'company' | 'team' = 'company',
  summaryOnly = false,
): string {
  const actionBlock = summaryOnly
    ? ''
    : `
  "actions": [
    exactly 4 items, one per priority level 1–4, sorted ascending by priority,
    each with action, timeframe, owner, priority, context
  ]`

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
  "summary": "Single flowing narrative paragraph combining what the data shows and why. Written as prose, not bullet points. Minimum 100 words. Plain language, no jargon."${actionBlock}
}

Rules:
- summary: minimum 100 words, narrative prose not bullets
${
  summaryOnly
    ? '- Return ONLY the summary field. Do not include actions.'
    : `- actions: exactly 4 items, sorted by priority (1 = highest)
- priority: 1, 2, 3, or 4 (integer) — one action per priority level
- timeframe: "30 days", "60 days", or "90 days" only
- owner: "Manager", "HR", or "Leadership" only
- context: max 6 words (e.g. "Targets transparency (54)")`
}
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
): string {
  return `
Generate ONLY the summary paragraph (100–150 words). Do not include actions.
Use the same dashboard data and org context as the original summary.

ORGANIZATION CONTEXT:
${orgContext}

ACTIVE FILTERS:
${filters.length > 0 ? filters.join(', ') : 'None'}

DASHBOARD DATA:
${dataContext}

Return ONLY valid JSON (no markdown):
{ "summary": "..." }
`.trim()
}

export function buildSingleActionPrompt(
  priority: SummaryPriority,
  existingActions: SummaryAction[],
  dashboardData: string,
  orgContext: string,
): string {
  const others = existingActions
    .filter((action) => action.priority !== priority)
    .sort((a, b) => a.priority - b.priority)

  const otherLines = others
    .map((action) => `- P${action.priority}: ${action.action}`)
    .join('\n')

  return `
Generate ONE recommended action for priority level ${priority}.
This action must be distinct from these existing actions:
${otherLines}

Use the same dashboard data and org context as the original summary.

ORGANIZATION CONTEXT:
${orgContext}

DASHBOARD DATA:
${dashboardData}

Return ONLY valid JSON (no markdown):
{
  "action": "string starting with a strong verb",
  "timeframe": "30 days | 60 days | 90 days",
  "owner": "Manager | HR | Leadership",
  "priority": ${priority},
  "context": "max 6 words linking to a data point"
}
`.trim()
}

function readOrgContextText(): string {
  if (typeof window === 'undefined') {
    return assembleAiSummaryOrgContextPrompt(createEmptyAiSummaryOrgContext())
  }

  return getOrgContextText()
}

function mockTeamActions(hasFilters: boolean): SummaryAction[] {
  return normalizeActionsFromApi([
    {
      action: 'Hold a team huddle to clarify priorities and assign owners for top blockers.',
      timeframe: '30 days',
      owner: 'Manager',
      context: 'Targets team transparency',
    },
    {
      action: 'Review open feedback themes with direct reports and publish a two-week action plan.',
      timeframe: '30 days',
      owner: 'Manager',
      context: 'Supports manager follow-through',
    },
    {
      action: 'Partner with HR on enablement fixes affecting your team’s lowest markers.',
      timeframe: '60 days',
      owner: 'Manager',
      context: hasFilters ? 'Addresses enablement (58)' : 'Addresses enablement gaps',
    },
    {
      action: 'Schedule monthly check-ins to track progress on transparency and collaboration themes.',
      timeframe: '90 days',
      owner: 'Manager',
      context: 'Sustains team improvement',
    },
  ])
}

function mockCompanyActions(): SummaryAction[] {
  return normalizeActionsFromApi([
    {
      action: 'Launch a leadership communication cadence explaining priorities, decisions, and progress.',
      timeframe: '30 days',
      owner: 'Leadership',
      context: 'Targets transparency (54)',
    },
    {
      action: 'Identify the top three technology blockers and assign owners for resolution.',
      timeframe: '60 days',
      owner: 'HR',
      context: 'Addresses enablement (58)',
    },
    {
      action: 'Publish a dashboard action tracker tied to the lowest-scoring markers.',
      timeframe: '60 days',
      owner: 'Manager',
      context: 'Tracks progress over time',
    },
    {
      action: 'Re-measure transparency and enablement after action plans have been communicated.',
      timeframe: '90 days',
      owner: 'Leadership',
      context: 'Validates improvement impact',
    },
  ])
}

export async function generateDashboardSummary(
  dataWidgets: DashboardWidget[],
  activeFilters: string[],
  options?: {
    personalContext?: string
    viewType?: 'company' | 'team'
  },
): Promise<SummaryContent> {
  const viewType = options?.viewType ?? 'company'
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildSummaryPrompt(
    dataContext,
    orgContext,
    activeFilters,
    options?.personalContext,
    viewType,
  )

  await new Promise((resolve) => setTimeout(resolve, 1500))

  const hasFilters = activeFilters.length > 0
  const generatedBy = getCurrentUser().id
  const snapshot = dataContext.slice(0, 200)

  if (viewType === 'team') {
    const summary = hasFilters
      ? 'Your filtered team view shows softer favorability on enablement and communication markers, with direct reports reporting higher friction with tools and process clarity than the broader organization. Compared to company benchmarks, this cohort scores meaningfully lower on transparency and collaboration, suggesting employees may not see priorities translated into day-to-day expectations or consistent follow-through after prior pulse cycles. Organization context and team notes indicate recent change has outpaced manager-led communication, limiting visible progress on themes raised in earlier feedback. Response patterns within the filtered group remain sufficient to treat findings as actionable, though participation varies by location. Time-trend data hints at gradual recovery on inclusion markers, yet enablement gaps persist and likely suppress eNPS improvement until managers publish clearer accountability for technology fixes and workflow blockers identified in this view.'
      : 'Team-level scores trail the organization on transparency and collaboration, while enablement markers remain the weakest signals in this view. Employees appear to lack visibility into team priorities and face localized workload spikes that reduce time for coaching and feedback loops. Compared with company-wide heatmap patterns, this group reports sharper declines in agility and solutions markers, suggesting process bottlenecks are concentrated within the team rather than reflected uniformly across the enterprise. eNPS commentary highlights frustration with unclear decision ownership and uneven access to resources needed to execute on agreed priorities. Organization context notes reinforce that recent restructuring may have diluted manager bandwidth, making it harder to close loops on prior survey themes. Sustained improvement will likely require clearer weekly communication, explicit ownership for top blockers, and targeted enablement support from HR partners.'

    return buildSummaryContent(summary, mockTeamActions(hasFilters), generatedBy, snapshot, {
      scope: `team:${generatedBy}`,
      createdBy: generatedBy,
      visibility: 'private',
    })
  }

  return buildSummaryContent(
    'Organization-wide favorability remains soft at 40%, with transparency and technology among the lowest-performing markers while eNPS continues to reflect a detractor-heavy profile compared to prior cycles. Employees appear to lack consistent visibility into organizational priorities, and survey commentary repeatedly points to friction in systems, process clarity, and follow-through after prior feedback cycles. Heatmap results show uneven performance across departments, with enablement and agility lagging collaboration improvements that emerged in the most recent quarter. Response rates remain healthy enough to treat these patterns as representative, but localized teams report sharper declines in manager communication cadence. Organization context suggests recent structural changes have outpaced leadership messaging rhythms, leaving managers without sufficient support to translate employee input into visible action plans that rebuild trust and demonstrate measurable progress.',
    mockCompanyActions(),
    generatedBy,
    snapshot,
    {
      scope: 'company',
      createdBy: generatedBy,
      visibility: 'everyone',
    },
  )
}

export async function generateSummaryParagraphOnly(
  dataWidgets: DashboardWidget[],
  activeFilters: string[],
  viewType: 'company' | 'team' = 'company',
): Promise<string> {
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildSummaryOnlyPrompt(dataContext, orgContext, activeFilters, viewType)

  await new Promise((resolve) => setTimeout(resolve, 1200))

  if (viewType === 'team') {
    return 'Updated team summary: filtered cohort data continues to show enablement and transparency as the primary drag on engagement, with managers needing clearer weekly communication rhythms and visible follow-through on prior pulse themes. Direct reports report uneven access to tools and decision clarity compared with company benchmarks, suggesting localized process bottlenecks rather than enterprise-wide decline. eNPS patterns within this view remain detractor-heavy, though inclusion markers show early signs of recovery when managers publish short action plans tied to specific survey themes.'
  }

  return 'Updated organization summary: enterprise favorability remains constrained by transparency and technology markers, with employees seeking more consistent leadership messaging on priorities and progress. Heatmap variance across departments indicates enablement investments should be targeted rather than uniform, while collaboration scores offer a foundation to build on. Response rates support treating these findings as representative, and organization context reinforces the need to align HR and leadership action plans with KPI targets already in flight.'
}

export async function generateSingleAction(
  priority: SummaryPriority,
  existingActions: SummaryAction[],
  dataWidgets: DashboardWidget[],
  activeFilters: string[],
): Promise<Omit<import('@/types').ActionVersion, 'versionId' | 'generatedAt'>> {
  const dataContext = buildDataContext(dataWidgets)
  const orgContext = readOrgContextText()
  void buildSingleActionPrompt(priority, existingActions, dataContext, orgContext)
  void activeFilters

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const alternatives: Record<
    SummaryPriority,
    { action: string; timeframe: '30 days' | '60 days' | '90 days'; owner: 'Manager' | 'HR' | 'Leadership'; context: string }
  > = {
    1: {
      action: 'Convene a cross-functional working session to address the top transparency gap identified in survey data.',
      timeframe: '30 days',
      owner: 'Leadership',
      context: 'Closes transparency gap',
    },
    2: {
      action: 'Deploy a manager toolkit for weekly team updates tied to lowest-scoring markers.',
      timeframe: '60 days',
      owner: 'HR',
      context: 'Supports manager cadence',
    },
    3: {
      action: 'Audit technology workflows cited in open-text feedback and publish a fix roadmap.',
      timeframe: '60 days',
      owner: 'Manager',
      context: 'Targets enablement friction',
    },
    4: {
      action: 'Run a follow-up pulse on transparency and enablement after action plans launch.',
      timeframe: '90 days',
      owner: 'Leadership',
      context: 'Measures improvement impact',
    },
  }

  const alt = alternatives[priority]
  return {
    action: alt.action,
    timeframe: alt.timeframe,
    owner: alt.owner,
    priority,
    context: alt.context,
  }
}

export async function regenerateSummaryParagraph(
  content: SummaryContent,
  dataWidgets: DashboardWidget[],
  activeFilters: string[],
  viewType: 'company' | 'team' = 'company',
): Promise<SummaryContent> {
  const summary = await generateSummaryParagraphOnly(dataWidgets, activeFilters, viewType)
  return appendSummaryVersion(content, summary)
}

export async function regenerateSingleAction(
  content: SummaryContent,
  priority: SummaryPriority,
  dataWidgets: DashboardWidget[],
  activeFilters: string[],
): Promise<SummaryContent> {
  const existingActions = getActiveActions(content)
  const newAction = await generateSingleAction(priority, existingActions, dataWidgets, activeFilters)
  return appendActionVersion(content, priority, newAction)
}
