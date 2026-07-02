'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { mockEmployees } from '@/data/mock/employees'
import { saveCreatedInitiative } from '@/lib/mockDb'
import { preventModalDismiss } from '@/lib/modalProps'
import type { Initiative, Priority } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

export interface CreateActionPlanModalProps {
  open: boolean
  onClose: () => void
  prefill: {
    title: string
    timeframe: string
    owner: string
    surveyName: string
  }
}

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function parseTimeframeDays(timeframe: string): number {
  const match = timeframe.match(/(\d+)/)
  return match ? Number(match[1]) : 30
}

function getDefaultOwnerId(ownerType: string): string {
  if (ownerType === 'HR') {
    return mockEmployees.find((employee) => employee.department === 'HR')?.id ?? 'emp_017'
  }
  if (ownerType === 'Leadership') {
    return (
      mockEmployees.find((employee) => employee.jobTitle.startsWith('Chief'))?.id ?? 'emp_007'
    )
  }
  return (
    mockEmployees.find((employee) => employee.jobTitle.includes('Manager'))?.id ?? 'emp_002'
  )
}

function toEmployeeOptions(): SelectOption[] {
  return mockEmployees.map((employee) => ({
    value: employee.id,
    label: `${employee.firstName} ${employee.lastName} (${employee.department})`,
  }))
}

export function CreateActionPlanModal({ open, onClose, prefill }: CreateActionPlanModalProps) {
  const { showToast } = useWuShowToast()
  const employeeOptions = useMemo(() => toEmployeeOptions(), [])

  const [title, setTitle] = useState(prefill.title)
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<SelectOption | null>(PRIORITY_OPTIONS[1])
  const [created, setCreated] = useState(false)

  useEffect(() => {
    if (!open) return

    const defaultOwnerId = getDefaultOwnerId(prefill.owner)
    const defaultOwner =
      employeeOptions.find((option) => option.value === defaultOwnerId) ?? employeeOptions[0]

    setTitle(prefill.title)
    setDescription(
      `Generated from AI analysis of ${prefill.surveyName} survey data. Recommended timeframe: ${prefill.timeframe}. Suggested owner: ${prefill.owner}.`,
    )
    setOwner(defaultOwner ?? null)
    setDueDate(format(addDays(new Date(), parseTimeframeDays(prefill.timeframe)), 'yyyy-MM-dd'))
    setPriority(PRIORITY_OPTIONS[1])
    setCreated(false)
  }, [open, prefill, employeeOptions])

  function handleClose() {
    setCreated(false)
    onClose()
  }

  function handleCreate() {
    if (!title.trim() || !owner) {
      showToast({ variant: 'error', message: 'Title and owner are required' })
      return
    }

    const now = new Date().toISOString()
    const initiative: Initiative = {
      id: `init_created_${Date.now()}`,
      title: title.trim(),
      description,
      status: 'open',
      priority: (priority?.value as Priority) ?? 'high',
      ownerId: owner.value,
      linkedSurveyId: 'surv_annual_engagement_2025',
      dueDate,
      createdAt: now,
      updatedAt: now,
      upstreamIds: [],
      downstreamIds: [],
      goalIds: [],
      taskIds: [],
    }

    saveCreatedInitiative(initiative)
    setCreated(true)
    showToast({ variant: 'success', message: 'Action plan created in Empower ✓' })
  }

  return (
    <WuModal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()} size="md">
      <WuModalHeader>
        <div>
          <div>Create Action Plan</div>
          <WuText size="sm" as="p" className="mt-1 font-normal text-gray-500">
            From Summary &amp; Recommendations
          </WuText>
        </div>
      </WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {created ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <WuText size="sm" as="p" className="font-medium text-green-800">
              Action plan created successfully.
            </WuText>
            <Link
              href="/empower/initiatives"
              className="mt-3 inline-block text-sm font-medium text-purple-600 hover:underline"
              onClick={handleClose}
            >
              View in Empower →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <WuFormGroup
              Label="Initiative Title"
              Input={<WuInput value={title} onChange={(event) => setTitle(event.target.value)} />}
            />
            <WuFormGroup
              Label="Description"
              Input={
                <WuTextarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              }
            />
            <WuFormGroup
              Label="Owner"
              Input={
                <WuSelect
                  data={employeeOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={owner}
                  onSelect={(value) => setOwner(value as SelectOption)}
                  variant="outlined"
                  placeholder="Select owner"
                />
              }
            />
            <WuFormGroup
              Label="Due Date"
              Input={
                <WuInput
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              }
            />
            <WuFormGroup
              Label="Priority"
              Input={
                <WuSelect
                  data={PRIORITY_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={priority}
                  onSelect={(value) => setPriority(value as SelectOption)}
                  variant="outlined"
                />
              }
            />
            <WuFormGroup
              Label="Linked Survey"
              Input={
                <WuSelect
                  data={[{ value: prefill.surveyName, label: prefill.surveyName }]}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={{ value: prefill.surveyName, label: prefill.surveyName }}
                  onSelect={() => undefined}
                  variant="outlined"
                  disabled
                />
              }
            />
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {created ? (
            <WuButton variant="primary" onClick={handleClose}>
              Done
            </WuButton>
          ) : (
            <>
              <WuButton variant="secondary" onClick={handleClose}>
                Cancel
              </WuButton>
              <WuButton variant="primary" onClick={handleCreate}>
                Create in Empower
              </WuButton>
            </>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
