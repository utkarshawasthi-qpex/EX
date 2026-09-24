'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  DEFAULT_INITIATIVE_REMINDER_SETTINGS,
  describeNextReminderWindow,
  INITIATIVE_REMINDER_FREQUENCY_OPTIONS,
  resolveInitiativeReminderSettings,
} from '@/lib/actionPlans/initiativeReminders'
import { TASK_STATUS_OPTIONS } from '@/lib/empowerIntegration/helpers'
import type {
  EmpowerInitiativeRecord,
  InitiativeReminderFrequency,
  TaskStatus,
} from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

type Props = {
  initiative: EmpowerInitiativeRecord
  onSave: (next: EmpowerInitiativeRecord) => void
}

export function InitiativeReminderSettingsPanel({ initiative, onSave }: Props) {
  const resolved = resolveInitiativeReminderSettings(initiative)
  const [frequency, setFrequency] = useState<InitiativeReminderFrequency>(resolved.frequency)
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(resolved.taskStatuses)

  const frequencyOptions = useMemo(
    () =>
      INITIATIVE_REMINDER_FREQUENCY_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    [],
  )
  const frequencyValue =
    frequencyOptions.find((o) => o.value === frequency) ?? frequencyOptions[0]

  const selectedMeta = INITIATIVE_REMINDER_FREQUENCY_OPTIONS.find((o) => o.value === frequency)

  function toggleStatus(status: TaskStatus) {
    setTaskStatuses((prev) => {
      if (prev.includes(status)) {
        const next = prev.filter((s) => s !== status)
        return next.length > 0 ? next : prev
      }
      return [...prev, status]
    })
  }

  function handleSave() {
    onSave({
      ...initiative,
      reminderSettings: {
        ...DEFAULT_INITIATIVE_REMINDER_SETTINGS,
        ...initiative.reminderSettings,
        frequency,
        taskStatuses,
      },
    })
  }

  const previewPlan: EmpowerInitiativeRecord = {
    ...initiative,
    reminderSettings: { frequency, taskStatuses, lastReminderSentAt: resolved.lastReminderSentAt },
  }

  return (
    <div className="max-w-xl space-y-4">
      <WuText size="sm" as="p" className="text-gray-600">
        Set how often the portal sends in-app reminders for this initiative. The system picks
        which tasks to include from due dates and the statuses you select below.
      </WuText>

      <WuFormGroup
        Label="Reminder frequency"
        Input={
          <WuSelect
            data={frequencyOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={frequencyValue as SelectOption}
            onSelect={(v) => setFrequency((v as SelectOption).value as InitiativeReminderFrequency)}
            variant="outlined"
          />
        }
      />
      {selectedMeta ? (
        <p className="-mt-2 text-xs text-gray-500">{selectedMeta.description}</p>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-800">Include tasks with status</p>
        <div className="flex flex-wrap gap-4">
          {TASK_STATUS_OPTIONS.filter((o) => o.value !== 'completed').map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <WuCheckbox
                checked={taskStatuses.includes(option.value as TaskStatus)}
                onChange={() => toggleStatus(option.value as TaskStatus)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Completed tasks are never reminded.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</span>
        <p className="mt-1">{describeNextReminderWindow(previewPlan)}</p>
      </div>

      <WuButton variant="primary" onClick={handleSave}>
        Save reminder settings
      </WuButton>
    </div>
  )
}
