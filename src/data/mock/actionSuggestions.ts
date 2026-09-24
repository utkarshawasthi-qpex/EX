/** Admin-curated style suggestions (Qualtrics guidance library pattern) for guided create. */

export type ActionSuggestion = {
  id: string
  focusKeywords: string[]
  title: string
  description: string
  taskTemplates: string[]
}

export const ACTION_SUGGESTIONS: ActionSuggestion[] = [
  {
    id: 'comm_1',
    focusKeywords: ['communicat', 'transpar', 'update', 'information'],
    title: 'Improve team communication cadence',
    description: 'Structured updates and open forums to close information gaps.',
    taskTemplates: [
      'Publish a weekly team update template and use it for 4 weeks.',
      'Hold a 30-minute open Q&A in the next team meeting.',
      'Identify three recurring questions and answer them in writing for the team.',
      'Assign a rotating owner for weekly highlights and blockers.',
      'Survey the team on communication clarity after two update cycles.',
      'Adjust meeting norms based on feedback (async vs live).',
    ],
  },
  {
    id: 'mgr_1',
    focusKeywords: ['manager', 'coach', 'enablement', 'leadership'],
    title: 'Strengthen manager check-ins',
    description: 'Clear expectations and consistent 1:1 conversations.',
    taskTemplates: [
      'Add a standing 1:1 agenda item on priorities and blockers.',
      'Share one concrete expectation change with the team in writing.',
      'Review manager enablement resources with HR and pick one to pilot.',
      'Track completion of follow-ups from the last two 1:1 cycles.',
      'Run a 15-minute team retro on what support they need from managers.',
      'Document one team norm change and communicate effective date.',
    ],
  },
  {
    id: 'well_1',
    focusKeywords: ['wellbeing', 'balance', 'work-life', 'burnout', 'stress'],
    title: 'Address wellbeing signals',
    description: 'Workload and boundaries aligned with sustainable performance.',
    taskTemplates: [
      'Review workload spikes with HR partner and adjust one team norm.',
      'Pilot no-meeting blocks for two weeks and gather feedback.',
      'List top three workload pain points and assign owners to test fixes.',
      'Share wellbeing resources in team channel and host a 20-minute discussion.',
      'Revisit on-call or after-hours expectations with the team.',
      'Check in on utilization trends and flag risks to leadership.',
    ],
  },
  {
    id: 'growth_1',
    focusKeywords: ['growth', 'develop', 'career', 'learning', 'skill'],
    title: 'Boost growth and development',
    description: 'Visible paths for learning and career conversations.',
    taskTemplates: [
      'Schedule growth conversations in the next 1:1 cycle for each direct report.',
      'Map one skill gap to a learning resource or stretch assignment.',
      'Share internal mobility or mentorship options with the team.',
      'Set a team learning goal for the quarter and track progress monthly.',
      'Celebrate one development win in a team meeting.',
      'Partner with L&D on a micro-learning series relevant to your focus area.',
    ],
  },
  {
    id: 'engage_1',
    focusKeywords: ['engage', 'belong', 'recognition', 'motivation'],
    title: 'Re-energize team engagement',
    description: 'Recognition, purpose, and connection in day-to-day work.',
    taskTemplates: [
      'Run a short pulse on what would most improve day-to-day engagement.',
      'Introduce a lightweight peer recognition ritual for four weeks.',
      'Connect current work to customer or company impact in the next team meeting.',
      'Remove or simplify one low-value process identified by the team.',
      'Follow up on prior survey comments with a written action summary.',
      'Plan one inclusive team activity tied to a shared goal.',
    ],
  },
  {
    id: 'generic_1',
    focusKeywords: [],
    title: 'Run a focused improvement sprint',
    description: 'Time-boxed plan with clear owners and follow-up.',
    taskTemplates: [
      'Name the top three root causes with your team in a working session.',
      'Assign an owner and due date for each agreed action.',
      'Define success metrics and baseline for your focus area.',
      'Communicate the sprint plan and timeline to stakeholders.',
      'Hold a mid-sprint check-in and adjust scope if needed.',
      'Review outcomes at 30 days and decide what to sustain.',
    ],
  },
]

export function suggestionsForFocusLabel(label: string): ActionSuggestion[] {
  const lower = label.toLowerCase()
  const matched = ACTION_SUGGESTIONS.filter(
    (s) => s.focusKeywords.length > 0 && s.focusKeywords.some((k) => lower.includes(k)),
  )
  if (matched.length > 0) return matched
  return ACTION_SUGGESTIONS.filter((s) => s.id === 'generic_1')
}

/** At least two initiative options for the dashboard guided flow. */
export function initiativeRecommendationsForFocus(label: string): ActionSuggestion[] {
  const primary = suggestionsForFocusLabel(label)
  const seen = new Set(primary.map((s) => s.id))
  const extras = ACTION_SUGGESTIONS.filter((s) => !seen.has(s.id) && s.id !== 'generic_1')
  const merged = [...primary]
  for (const extra of extras) {
    if (merged.length >= 2) break
    merged.push(extra)
    seen.add(extra.id)
  }
  if (merged.length < 2) {
    const generic = ACTION_SUGGESTIONS.find((s) => s.id === 'generic_1')
    if (generic && !seen.has(generic.id)) merged.push(generic)
  }
  return merged.slice(0, 4)
}

const FOCUS_TASK_SUFFIXES = [
  'Capture baseline scores for {focus} before changes go live.',
  'Review progress on {focus} in a 30-minute team sync.',
  'Share a short update with leadership on actions taken for {focus}.',
  'Gather anonymous feedback on whether {focus} feels improved.',
]

/** Four to eight task recommendations for the tasks step. */
export function taskRecommendationsForInitiative(
  suggestion: ActionSuggestion,
  focusLabel: string,
): string[] {
  const focus = focusLabel.trim() || 'this focus area'
  const base = [...suggestion.taskTemplates]
  for (const template of FOCUS_TASK_SUFFIXES) {
    if (base.length >= 8) break
    const text = template.replace(/\{focus\}/g, focus)
    if (!base.includes(text)) base.push(text)
  }
  while (base.length < 4) {
    base.push(`Define the next milestone for improving ${focus}.`)
  }
  return base.slice(0, 8)
}

/** Full library for “Use template” (custom path). */
export function listInitiativeTemplates(): ActionSuggestion[] {
  return ACTION_SUGGESTIONS.filter((s) => s.id !== 'generic_1').concat(
    ACTION_SUGGESTIONS.filter((s) => s.id === 'generic_1'),
  )
}
