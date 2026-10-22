import {
  addDays,
  differenceInCalendarDays,
  format,
  getDate,
  getDay,
  lastDayOfMonth,
  parseISO,
} from 'date-fns'

export type ReminderWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type ReminderMode = 'one_time' | 'recurring'
export type ReminderInterval = 'daily' | 'every_n_days' | 'weekly' | 'every_n_weeks' | 'monthly'
export type ReminderEndKind = 'on_date' | 'after_n' | 'until_due_date'
export type ReminderAudience = 'subject' | 'evaluator'

export type Survey360ReminderRule = {
  id: string
  deploymentId: string
  mode: ReminderMode
  time: string
  date?: string
  interval?: ReminderInterval
  intervalCount?: number
  weekdays?: ReminderWeekday[]
  startDate?: string
  endKind?: ReminderEndKind
  endDate?: string
  occurrenceCount?: number
  audience: ReminderAudience
  from: string
  templateId: string
  subject: string
  body: string
}

export const DEFAULT_REMINDER_SUBJECT = 'Reminder: complete your 360 feedback'
export const DEFAULT_REMINDER_BODY = `Dear {FIRST_NAME},

This is a reminder to finish your 360 feedback for [COMPANY_NAME]. It only takes a few minutes.

Thank you,
[COMPANY_NAME]`

export const REMINDER_AUDIENCE_OPTIONS: { value: ReminderAudience; label: string }[] = [
  { value: 'subject', label: 'Subject Reminder' },
  { value: 'evaluator', label: 'Evaluator Reminder' },
]

export const REMINDER_FROM_OPTIONS: { value: string; label: string }[] = [
  { value: 'survey@qp-mail.com', label: 'QuestionPro Survey (survey@qp-mail.com)' },
]

export function reminderAudienceLabel(audience: ReminderAudience) {
  return audience === 'evaluator' ? 'Evaluator Reminder' : 'Subject Reminder'
}

export function reminderTemplateId(audience: ReminderAudience) {
  return audience === 'evaluator' ? 'tpl_evaluator_reminder' : 'tpl_subject_reminder'
}

function composeFields(audience: ReminderAudience): Pick<
  Survey360ReminderRule,
  'audience' | 'from' | 'templateId' | 'subject' | 'body'
> {
  return {
    audience,
    from: REMINDER_FROM_OPTIONS[0].value,
    templateId: reminderTemplateId(audience),
    subject: DEFAULT_REMINDER_SUBJECT,
    body: DEFAULT_REMINDER_BODY,
  }
}

export const WEEKDAY_BUTTONS: { value: ReminderWeekday; short: string; label: string }[] = [
  { value: 1, short: 'M', label: 'Monday' },
  { value: 2, short: 'T', label: 'Tuesday' },
  { value: 3, short: 'W', label: 'Wednesday' },
  { value: 4, short: 'T', label: 'Thursday' },
  { value: 5, short: 'F', label: 'Friday' },
  { value: 6, short: 'S', label: 'Saturday' },
  { value: 0, short: 'S', label: 'Sunday' },
]

export function todayStamp(date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}

export function formatReminderTime(time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time
  return format(new Date(2000, 0, 1, hours, minutes), 'h:mm a')
}

export function formatReminderDate(date: string) {
  return format(parseISO(`${date}T00:00:00`), 'MMM d, yyyy')
}

function addDaysStamp(date: string, amount: number) {
  return format(addDays(parseISO(`${date}T00:00:00`), amount), 'yyyy-MM-dd')
}

function monthOccurrence(startDate: string, monthsToAdd: number) {
  const start = parseISO(`${startDate}T00:00:00`)
  const day = getDate(start)
  const cursor = new Date(start.getFullYear(), start.getMonth() + monthsToAdd, 1)
  const last = getDate(lastDayOfMonth(cursor))
  cursor.setDate(Math.min(day, last))
  return format(cursor, 'yyyy-MM-dd')
}

function weekdayNames(days: ReminderWeekday[]) {
  const labels = WEEKDAY_BUTTONS.filter((day) => days.includes(day.value)).map((day) => day.label)
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function endBound(rule: Survey360ReminderRule, dueDate: string | null) {
  const dates = [dueDate, rule.endKind === 'on_date' ? rule.endDate : null, rule.endKind === 'until_due_date' ? dueDate : null]
  return dates.filter((value): value is string => Boolean(value)).sort()[0] ?? null
}

export function generateOccurrences(
  rule: Survey360ReminderRule,
  dueDate: string | null,
  options?: { max?: number },
) {
  const max = options?.max ?? 200
  if (rule.mode === 'one_time') {
    return rule.date ? [rule.date] : []
  }

  const startDate = rule.startDate
  const timeOk = Boolean(startDate && rule.time)
  if (!timeOk || !startDate) return []

  const limit = endBound(rule, dueDate)
  const needed = rule.endKind === 'after_n' ? Math.max(1, rule.occurrenceCount ?? 1) : max
  const dates: string[] = []
  const horizon = addDaysStamp(startDate, 800)

  if (rule.interval === 'monthly') {
    for (let index = 0; index < 36 && dates.length < Math.min(max, needed); index += 1) {
      const next = monthOccurrence(startDate, index)
      if (limit && next > limit) break
      if (next > horizon) break
      dates.push(next)
    }
    return dates
  }

  if (rule.interval === 'weekly' || rule.interval === 'every_n_weeks') {
    const selected = rule.weekdays ?? []
    const every = rule.interval === 'every_n_weeks' ? Math.max(1, rule.intervalCount ?? 1) : 1
    let cursor = startDate
    while (dates.length < Math.min(max, needed) && cursor <= horizon) {
      if (limit && cursor > limit) break
      const weekday = getDay(parseISO(`${cursor}T00:00:00`)) as ReminderWeekday
      const weekIndex = Math.floor(
        differenceInCalendarDays(parseISO(`${cursor}T00:00:00`), parseISO(`${startDate}T00:00:00`)) / 7,
      )
      if (selected.includes(weekday) && weekIndex % every === 0) dates.push(cursor)
      cursor = addDaysStamp(cursor, 1)
    }
    return dates
  }

  const step = rule.interval === 'every_n_days' ? Math.max(1, rule.intervalCount ?? 1) : 1
  let cursor = startDate
  while (dates.length < Math.min(max, needed) && cursor <= horizon) {
    if (limit && cursor > limit) break
    dates.push(cursor)
    cursor = addDaysStamp(cursor, step)
  }
  return dates
}

export function nextFiring(rule: Survey360ReminderRule, dueDate: string | null, from = todayStamp()) {
  return generateOccurrences(rule, dueDate).find((date) => date >= from) ?? null
}

export function ruleFiresOnDate(rule: Survey360ReminderRule, date: string, dueDate: string | null) {
  return generateOccurrences(rule, dueDate).includes(date)
}

export function validateReminderRule(rule: Survey360ReminderRule, dueDate: string | null) {
  if (!rule.time) return 'Pick a time.'

  if (rule.mode === 'one_time') {
    if (!rule.date) return 'Pick a date.'
    if (rule.date < todayStamp()) return 'Choose a date that is not in the past.'
    if (dueDate && rule.date > dueDate) return 'This schedule extends past the rater due date.'
    return null
  }

  if (!rule.startDate) return 'Pick a start date.'
  if ((rule.interval === 'weekly' || rule.interval === 'every_n_weeks') && (rule.weekdays?.length ?? 0) === 0) {
    return 'Select at least one day.'
  }
  if ((rule.interval === 'every_n_days' || rule.interval === 'every_n_weeks') && (rule.intervalCount ?? 0) < 1) {
    return 'Enter how often this reminder repeats.'
  }
  if (!rule.endKind) return 'Choose when this reminder ends.'
  if (rule.endKind === 'until_due_date' && !dueDate) {
    return 'Set a rater due date to end on the deadline.'
  }
  if (rule.endKind === 'on_date') {
    if (!rule.endDate) return 'Pick an end date.'
    if (rule.endDate < rule.startDate) return 'The end date must be on or after the start date.'
    if (dueDate && rule.endDate > dueDate) return 'This schedule extends past the rater due date.'
  }
  if (rule.endKind === 'after_n' && (rule.occurrenceCount ?? 0) < 1) {
    return 'Enter how many times this reminder should send.'
  }

  const occurrences = generateOccurrences(rule, dueDate)
  if (occurrences.length === 0) return 'This schedule does not produce any reminder dates.'
  if (dueDate && occurrences.some((date) => date > dueDate)) {
    return 'This schedule extends past the rater due date.'
  }
  if (rule.endKind === 'after_n' && occurrences.length < (rule.occurrenceCount ?? 1)) {
    return 'This schedule extends past the rater due date.'
  }
  return null
}

export function summarizeReminderRule(rule: Survey360ReminderRule, dueDate: string | null) {
  const time = formatReminderTime(rule.time)
  if (rule.mode === 'one_time' && rule.date) {
    return `${formatReminderDate(rule.date)} at ${time}`
  }

  const count = generateOccurrences(rule, dueDate).length
  const start = rule.startDate ? formatReminderDate(rule.startDate) : 'the start date'
  let cadence = 'Repeats'
  if (rule.interval === 'daily') cadence = 'Every day'
  if (rule.interval === 'every_n_days') {
    const n = rule.intervalCount ?? 1
    cadence = n === 1 ? 'Every day' : `Every ${n} days`
  }
  if (rule.interval === 'weekly' || rule.interval === 'every_n_weeks') {
    const names = weekdayNames(rule.weekdays ?? [])
    const n = rule.interval === 'every_n_weeks' ? Math.max(1, rule.intervalCount ?? 1) : 1
    cadence = n === 1 ? `Every ${names}` : `Every ${n} weeks on ${names}`
  }
  if (rule.interval === 'monthly') cadence = 'Monthly'

  let ending = ''
  if (rule.endKind === 'until_due_date' && dueDate) {
    ending = `until ${formatReminderDate(dueDate)} (due date)`
  } else if (rule.endKind === 'on_date' && rule.endDate) {
    ending = `until ${formatReminderDate(rule.endDate)}`
  } else if (rule.endKind === 'after_n') {
    ending = `for ${rule.occurrenceCount} occurrence${rule.occurrenceCount === 1 ? '' : 's'}`
  }

  return `${cadence} at ${time}, starting ${start}${ending ? `, ${ending}` : ''}. ${count} occurrence${count === 1 ? '' : 's'}.`
}

const today = todayStamp()

export const mockSurvey360ReminderRules: Survey360ReminderRule[] = [
  {
    id: 'rem_thankyou_today',
    deploymentId: 'dep_thank_you',
    mode: 'one_time',
    date: today <= '2026-10-31' ? today : '2026-10-31',
    time: '09:00',
    ...composeFields('evaluator'),
  },
  {
    id: 'rem_thankyou_weekly',
    deploymentId: 'dep_thank_you',
    mode: 'recurring',
    interval: 'weekly',
    weekdays: [1],
    startDate: '2026-10-20',
    time: '09:00',
    endKind: 'until_due_date',
    ...composeFields('subject'),
  },
  {
    id: 'rem_thankyou_every_3',
    deploymentId: 'dep_thank_you',
    mode: 'recurring',
    interval: 'every_n_days',
    intervalCount: 3,
    startDate: '2026-10-22',
    time: '10:00',
    endKind: 'on_date',
    endDate: '2026-10-31',
    ...composeFields('evaluator'),
  },
  {
    id: 'rem_thankyou_final',
    deploymentId: 'dep_thank_you',
    mode: 'one_time',
    date: '2026-10-30',
    time: '16:00',
    ...composeFields('subject'),
  },
  {
    id: 'rem_thankyou_mw',
    deploymentId: 'dep_thank_you',
    mode: 'recurring',
    interval: 'weekly',
    weekdays: [1, 3],
    startDate: '2026-10-20',
    time: '08:30',
    endKind: 'after_n',
    occurrenceCount: 4,
    ...composeFields('evaluator'),
  },
  {
    id: 'rem_q1_weekly',
    deploymentId: 'dep_q1_leadership',
    mode: 'recurring',
    interval: 'weekly',
    weekdays: [2],
    startDate: '2026-03-03',
    time: '09:00',
    endKind: 'on_date',
    endDate: '2026-03-31',
    ...composeFields('subject'),
  },
  {
    id: 'rem_q1_once',
    deploymentId: 'dep_q1_leadership',
    mode: 'one_time',
    date: '2026-03-28',
    time: '11:00',
    ...composeFields('evaluator'),
  },
  {
    id: 'rem_mgr_n',
    deploymentId: 'dep_manager_2025',
    mode: 'recurring',
    interval: 'every_n_weeks',
    intervalCount: 2,
    weekdays: [4],
    startDate: '2025-10-02',
    time: '09:00',
    endKind: 'after_n',
    occurrenceCount: 6,
    ...composeFields('subject'),
  },
  {
    id: 'rem_mgr_monthly',
    deploymentId: 'dep_manager_2025',
    mode: 'recurring',
    interval: 'monthly',
    startDate: '2025-10-15',
    time: '08:00',
    endKind: 'on_date',
    endDate: '2025-12-01',
    ...composeFields('evaluator'),
  },
  {
    id: 'rem_mgr_once',
    deploymentId: 'dep_manager_2025',
    mode: 'one_time',
    date: '2025-11-20',
    time: '14:00',
    ...composeFields('subject'),
  },
]
