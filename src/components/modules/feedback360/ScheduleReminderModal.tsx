'use client'

import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { MailComposeCard, toEditorHtml } from '@/components/modules/feedback360/MailComposeCard'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import {
  type ReminderAudience,
  type ReminderEndKind,
  type ReminderInterval,
  type ReminderMode,
  type ReminderWeekday,
  type Survey360ReminderRule,
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
  DEFAULT_SURVEY_REMINDER_BODY,
  DEFAULT_SURVEY_REMINDER_SUBJECT,
  REMINDER_AUDIENCE_OPTIONS,
  REMINDER_FROM_OPTIONS,
  WEEKDAY_BUTTONS,
  formatReminderDate,
  reminderTemplateId,
  reminderToLabel,
  summarizeReminderRule,
  todayStamp,
  validateReminderRule,
} from '@/data/mock/survey360ReminderRules'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDatePicker })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

export type ReminderMailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

const MODE_OPTIONS: SelectOption[] = [
  { value: 'one_time', label: 'One-time — fires once' },
  { value: 'recurring', label: 'Recurring — fires on a schedule' },
]

const INTERVAL_OPTIONS: SelectOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_n_days', label: 'Every N days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every_n_weeks', label: 'Every N weeks' },
  { value: 'monthly', label: 'Monthly' },
]

const REMINDER_STEPS = [
  { icon: '📅', label: 'When' },
  { icon: '✉️', label: 'Email' },
] as const

type ScheduleReminderModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dueDate: string | null
  initial: Survey360ReminderRule | null
  templates: ReminderMailTemplate[]
  subjectCount: number
  evaluatorCount: number
  employeeCount?: number
  audienceOptions?: { value: ReminderAudience; label: string }[]
  defaultAudience?: ReminderAudience
  onSave: (rule: Survey360ReminderRule) => void
}

function option(list: SelectOption[], value: string) {
  return list.find((item) => item.value === value) ?? list[0]
}

function emptyRule(audience: ReminderAudience = 'subject'): Survey360ReminderRule {
  const survey = audience === 'employee'
  return {
    id: '',
    deploymentId: '',
    mode: 'one_time',
    time: '',
    audience,
    from: REMINDER_FROM_OPTIONS[0].value,
    templateId: reminderTemplateId(audience),
    subject: survey ? DEFAULT_SURVEY_REMINDER_SUBJECT : DEFAULT_REMINDER_SUBJECT,
    body: toEditorHtml(survey ? DEFAULT_SURVEY_REMINDER_BODY : DEFAULT_REMINDER_BODY),
  }
}

function fallbackBody(audience: ReminderAudience) {
  return audience === 'employee' ? DEFAULT_SURVEY_REMINDER_BODY : DEFAULT_REMINDER_BODY
}

function earliestAllowedDate(current?: string) {
  const today = todayStamp()
  if (current && current < today) return current
  return today
}

function toDate(stamp?: string) {
  if (!stamp) return undefined
  const date = new Date(`${stamp}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toStamp(date?: Date) {
  return date ? format(date, 'yyyy-MM-dd') : ''
}

function validateReminderEmail(rule: Survey360ReminderRule) {
  if (!rule.audience) return 'Choose who this reminder is for.'
  if (!rule.subject.trim()) return 'Add a subject.'
  if (!rule.body.replace(/<[^>]+>/g, ' ').trim()) return 'Add a message.'
  return null
}

function ReminderStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {REMINDER_STEPS.map((stepItem, index) => (
        <span key={stepItem.label} className="flex items-center gap-2">
          {index < currentStep ? (
            <span className="text-sm font-medium text-blue-400" aria-hidden>
              ✓
            </span>
          ) : null}
          <span
            className={cn(
              'flex items-center gap-1 text-sm',
              index === currentStep && 'font-semibold text-blue-600',
              index < currentStep && 'text-blue-400',
              index > currentStep && 'text-gray-400',
            )}
          >
            <span aria-hidden>{stepItem.icon}</span>
            {stepItem.label}
          </span>
          {index < REMINDER_STEPS.length - 1 ? (
            <span className="text-gray-300" aria-hidden>
              &gt;
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

function ReminderDatePicker({
  value,
  onChange,
  min,
  max,
}: {
  value?: string
  onChange: (next: string) => void
  min?: string
  max?: string | null
}) {
  return (
    <WuDatePicker
      value={toDate(value)}
      onChange={(date) => onChange(toStamp(date))}
      minDate={toDate(min)}
      maxDate={toDate(max ?? undefined)}
      variant="outlined"
      placeholder="Select date"
    />
  )
}

export function ScheduleReminderModal({
  open,
  onOpenChange,
  dueDate,
  initial,
  templates,
  subjectCount,
  evaluatorCount,
  employeeCount,
  audienceOptions = REMINDER_AUDIENCE_OPTIONS,
  defaultAudience = 'subject',
  onSave,
}: ScheduleReminderModalProps) {
  const [draft, setDraft] = useState<Survey360ReminderRule>(emptyRule(defaultAudience))
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [editEmail, setEditEmail] = useState(true)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    if (!open) return
    const next = initial
      ? {
          ...emptyRule(initial.audience ?? defaultAudience),
          ...initial,
          body: toEditorHtml(initial.body || fallbackBody(initial.audience ?? defaultAudience)),
        }
      : emptyRule(defaultAudience)
    setDraft(next)
    setError('')
    setStep(0)
    setEditEmail(true)
    setEditorKey((current) => current + 1)
  }, [open, initial, defaultAudience])

  const isEdit = Boolean(initial?.id)
  const endOptions = useMemo(() => {
    const options: SelectOption[] = [
      { value: 'on_date', label: 'On a specific end date' },
      { value: 'after_n', label: 'After N occurrences' },
    ]
    if (dueDate) {
      options.unshift({
        value: 'until_due_date',
        label: `Until rater due date (${formatReminderDate(dueDate)})`,
      })
    }
    return options
  }, [dueDate])

  const usesWeekdays = draft.interval === 'weekly' || draft.interval === 'every_n_weeks'
  const usesCount = draft.interval === 'every_n_days' || draft.interval === 'every_n_weeks'
  const summary = useMemo(() => {
    if (!draft.time) return ''
    if (draft.mode === 'one_time' && !draft.date) return ''
    if (draft.mode === 'recurring' && !draft.startDate) return ''
    return summarizeReminderRule(draft, dueDate)
  }, [draft, dueDate])

  const templateOptions = templates.map((template) => ({ value: template.id, label: template.name }))
  const selectedTemplate =
    templateOptions.find((item) => item.value === draft.templateId) ?? templateOptions[0]
  const toOptions = [
    {
      value: 'all',
      label: reminderToLabel(draft.audience, {
        subjectCount,
        evaluatorCount,
        employeeCount,
      }),
    },
  ]
  const canContinueWhen =
    Boolean(draft.time) && (draft.mode === 'one_time' ? Boolean(draft.date) : Boolean(draft.startDate))

  function patch(next: Partial<Survey360ReminderRule>) {
    setDraft((current) => ({ ...current, ...next }))
    setError('')
  }

  function toggleWeekday(day: ReminderWeekday) {
    const current = draft.weekdays ?? []
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    patch({ weekdays: next })
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId)
    patch({
      templateId,
      subject: template?.subject ?? draft.subject,
      body: toEditorHtml(template?.body ?? draft.body),
    })
    setEditorKey((current) => current + 1)
  }

  function changeAudience(audience: ReminderAudience) {
    const template = templates.find((item) => item.id === reminderTemplateId(audience))
    patch({
      audience,
      templateId: template?.id ?? reminderTemplateId(audience),
      subject: template?.subject ?? draft.subject,
      body: toEditorHtml(template?.body ?? draft.body),
    })
    setEditorKey((current) => current + 1)
  }

  function goToEmail() {
    const message = validateReminderRule(draft, dueDate)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep(1)
  }

  function save() {
    const scheduleError = validateReminderRule(draft, dueDate)
    if (scheduleError) {
      setError(scheduleError)
      setStep(0)
      return
    }
    const emailError = validateReminderEmail(draft)
    if (emailError) {
      setError(emailError)
      setStep(1)
      return
    }
    onSave({
      ...draft,
      id: draft.id || `rem_${Date.now()}`,
      body: toEditorHtml(draft.body),
    })
    onOpenChange(false)
  }

  return (
    <WuModal
      open={open}
      onOpenChange={onOpenChange}
      variant="action"
      size="lg"
      maxHeight="90vh"
      allowExternalPortals
      {...preventModalDismiss}
    >
      <WuModalHeader>{isEdit ? 'Edit reminder' : 'Add reminder'}</WuModalHeader>
      <WuModalContent>
        {step === 0 ? (
          <div className="space-y-4">
            <WuFormGroup
              Label="When"
              Input={
                <WuSelect
                  data={MODE_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={option(MODE_OPTIONS, draft.mode)}
                  onSelect={(next) => {
                    const mode = (next as SelectOption).value as ReminderMode
                    patch(
                      mode === 'recurring'
                        ? { mode, interval: draft.interval ?? 'weekly', weekdays: draft.weekdays ?? [1] }
                        : { mode },
                    )
                  }}
                  variant="outlined"
                />
              }
            />

            {draft.mode === 'one_time' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <WuFormGroup
                  Label="Date"
                  Input={
                    <ReminderDatePicker
                      value={draft.date}
                      min={earliestAllowedDate(draft.date)}
                      max={dueDate}
                      onChange={(date) => patch({ date })}
                    />
                  }
                />
                <WuFormGroup
                  Label="Time"
                  Input={
                    <WuInput
                      type="time"
                      variant="outlined"
                      value={draft.time}
                      onChange={(event) => patch({ time: event.target.value })}
                    />
                  }
                />
              </div>
            ) : (
              <>
                <WuFormGroup
                  Label="Repeat"
                  Input={
                    <WuSelect
                      data={INTERVAL_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={option(INTERVAL_OPTIONS, draft.interval ?? 'weekly')}
                      onSelect={(next) =>
                        patch({ interval: (next as SelectOption).value as ReminderInterval })
                      }
                      variant="outlined"
                    />
                  }
                />
                {usesCount ? (
                  <WuFormGroup
                    Label={draft.interval === 'every_n_weeks' ? 'Every N weeks' : 'Every N days'}
                    Input={
                      <WuInput
                        type="number"
                        min={1}
                        variant="outlined"
                        value={String(draft.intervalCount ?? 1)}
                        onChange={(event) =>
                          patch({ intervalCount: Math.max(1, Number(event.target.value) || 1) })
                        }
                      />
                    }
                  />
                ) : null}
                {usesWeekdays ? (
                  <div>
                    <p className="mb-2 text-sm text-gray-700">On</p>
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAY_BUTTONS.map((day) => {
                        const selected = draft.weekdays?.includes(day.value)
                        return (
                          <button
                            key={`${day.value}-${day.label}`}
                            type="button"
                            aria-label={day.label}
                            aria-pressed={selected}
                            className={cn(
                              'size-8 rounded-full text-xs font-medium',
                              selected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                            )}
                            onClick={() => toggleWeekday(day.value)}
                          >
                            {day.short}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <WuFormGroup
                    Label="Starts"
                    Input={
                      <ReminderDatePicker
                        value={draft.startDate}
                        min={earliestAllowedDate(draft.startDate)}
                        max={dueDate}
                        onChange={(date) => patch({ startDate: date })}
                      />
                    }
                  />
                  <WuFormGroup
                    Label="Time"
                    Input={
                      <WuInput
                        type="time"
                        variant="outlined"
                        value={draft.time}
                        onChange={(event) => patch({ time: event.target.value })}
                      />
                    }
                  />
                </div>
                <WuFormGroup
                  Label="Ends (required)"
                  Input={
                    <WuSelect
                      data={endOptions}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={
                        draft.endKind
                          ? option(endOptions, draft.endKind)
                          : { value: '', label: 'Choose an end condition' }
                      }
                      onSelect={(next) =>
                        patch({ endKind: (next as SelectOption).value as ReminderEndKind })
                      }
                      variant="outlined"
                      placeholder="Choose an end condition"
                    />
                  }
                />
                {draft.endKind === 'on_date' ? (
                  <WuFormGroup
                    Label="End date"
                    Input={
                      <ReminderDatePicker
                        value={draft.endDate}
                        min={draft.startDate || earliestAllowedDate(draft.endDate)}
                        max={dueDate}
                        onChange={(date) => patch({ endDate: date })}
                      />
                    }
                  />
                ) : null}
                {draft.endKind === 'after_n' ? (
                  <WuFormGroup
                    Label="Number of occurrences"
                    Input={
                      <WuInput
                        type="number"
                        min={1}
                        variant="outlined"
                        value={String(draft.occurrenceCount ?? '')}
                        onChange={(event) =>
                          patch({ occurrenceCount: Math.max(1, Number(event.target.value) || 1) })
                        }
                      />
                    }
                  />
                ) : null}
              </>
            )}

            {summary ? <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{summary}</p> : null}
          </div>
        ) : (
          <div className="flex min-h-[28rem] flex-col">
            <MailComposeCard
              typeOptions={[...audienceOptions]}
              inviteType={option(audienceOptions, draft.audience)}
              onTypeChange={(next) => changeAudience(next.value as ReminderAudience)}
              toOptions={toOptions}
              fromOptions={[...REMINDER_FROM_OPTIONS]}
              mailFrom={option(REMINDER_FROM_OPTIONS, draft.from)}
              onFromChange={(next) => patch({ from: next.value })}
              templateOptions={templateOptions}
              selectedTemplate={selectedTemplate}
              onTemplateChange={applyTemplate}
              emailSubject={draft.subject}
              onSubjectChange={(value) => patch({ subject: value })}
              emailBody={toEditorHtml(draft.body)}
              onBodyChange={(value) => patch({ body: value })}
              editEmail={editEmail}
              onEditEmailChange={(value) => {
                setEditEmail(value)
                if (value) setEditorKey((current) => current + 1)
              }}
              editorKey={editorKey}
            />
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-between gap-4">
          <ReminderStepIndicator currentStep={step} />
          <div className="flex items-center gap-3">
            {step === 0 ? (
              <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </WuButton>
            ) : (
              <WuButton variant="secondary" onClick={() => setStep(0)}>
                Back
              </WuButton>
            )}
            {step === 0 ? (
              <WuButton disabled={!canContinueWhen} onClick={goToEmail}>
                Next
              </WuButton>
            ) : (
              <WuButton onClick={save}>{isEdit ? 'Save reminder' : 'Add reminder'}</WuButton>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
