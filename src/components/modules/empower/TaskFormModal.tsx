'use client'

import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { mockEmployees } from '@/data/mock/employees'
import { TASK_STATUS_OPTIONS } from '@/lib/empowerIntegration/helpers'
import {
  addTaskToInitiative,
  updateTaskInInitiative,
  withTaskStatus,
} from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import type { InitiativeTask, TaskStatus } from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuDatePicker = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })), { ssr: false })
const WuFormGroup = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })), { ssr: false })
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false })
const WuModal = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })), { ssr: false })
const WuModalContent = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })), { ssr: false })
const WuModalFooter = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })), { ssr: false })
const WuModalHeader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })), { ssr: false })
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false })
const WuTextarea = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })), { ssr: false })

type SelectOption = { value: string; label: string }

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initiativeId: string
  /** Present when editing an existing task; absent when creating one. */
  task?: InitiativeTask | null
  onSaved: () => void
}

export function TaskFormModal({
  open,
  onOpenChange,
  initiativeId,
  task,
  onSaved,
}: TaskFormModalProps) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [contributors, setContributors] = useState<SelectOption[]>([])
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<SelectOption>(TASK_STATUS_OPTIONS[0])

  const employeeOptions = useMemo<SelectOption[]>(
    () => mockEmployees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
    [],
  )

  useEffect(() => {
    if (!open) return
    setText(task?.text ?? '')
    setDescription(task?.description ?? '')
    setOwner(employeeOptions.find((option) => option.value === task?.ownerId) ?? null)
    setContributors(
      employeeOptions.filter((option) => (task?.contributorIds ?? []).includes(option.value)),
    )
    setDueDate(task?.dueDate ?? '')
    setStatus(
      TASK_STATUS_OPTIONS.find((option) => option.value === task?.status) ?? TASK_STATUS_OPTIONS[0],
    )
  }, [open, task, employeeOptions])

  function handleSubmit() {
    if (!text.trim()) return

    const base: InitiativeTask = {
      id: task?.id ?? `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      description: description.trim() || undefined,
      ownerId: owner?.value,
      contributorIds: contributors.map((option) => option.value),
      dueDate: dueDate || undefined,
      status: task?.status ?? 'pending',
      completedAt: task?.completedAt,
      source: task?.source ?? 'manual',
      provenance: task?.provenance ?? null,
    }
    const next = withTaskStatus(base, status.value as TaskStatus)

    if (task) updateTaskInInitiative(initiativeId, next)
    else addTaskToInitiative(initiativeId, next)

    onSaved()
    onOpenChange(false)
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>{task ? 'Edit task' : 'Create task'}</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="space-y-4">
          <WuFormGroup
            Label="Task name"
            Input={<WuInput value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs to happen?" />}
          />
          <WuFormGroup
            Label="Description"
            Input={<WuTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
          />
          <WuFormGroup
            Label="Owner"
            Input={
              <WuSelect
                data={employeeOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={owner}
                onSelect={(v) => setOwner(v as SelectOption)}
                variant="outlined"
                placeholder="Unassigned"
              />
            }
          />
          <WuFormGroup
            Label="Contributors"
            Input={
              <WuSelect
                data={employeeOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={contributors}
                onSelect={(v) => setContributors(v as SelectOption[])}
                multiple
                variant="outlined"
                placeholder="No contributors"
              />
            }
          />
          <WuFormGroup
            Label="Due date"
            Input={
              <WuDatePicker
                value={dueDate ? new Date(`${dueDate}T00:00:00`) : undefined}
                onChange={(date) => setDueDate(date ? format(date, 'yyyy-MM-dd') : '')}
                onReset={() => setDueDate('')}
                showResetButton
                variant="outlined"
                placeholder="No due date"
              />
            }
          />
          <WuFormGroup
            Label="Status"
            Input={
              <WuSelect
                data={TASK_STATUS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={status}
                onSelect={(v) => setStatus(v as SelectOption)}
                variant="outlined"
              />
            }
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleSubmit} disabled={!text.trim()}>
            {task ? 'Save task' : 'Create task'}
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
