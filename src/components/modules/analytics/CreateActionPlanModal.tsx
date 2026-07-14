'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import { buildInheritedLinkBlock, parseTimeframeDays } from '@/lib/empowerIntegration/helpers'
import {
  countActiveTeamInitiativesForScope,
  getAllInitiativesRaw,
  getInitiativeById,
  getOrgSettings,
  upsertInitiative,
} from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import type {
  EmpowerInitiativeRecord,
  InitiativeProvenance,
  SurveyLink,
  SurveyLinkFocus,
  SurveyLinkScope,
} from '@/types/empowerIntegration'
import type { SummaryAction } from '@/types'

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

export type CreateActionPlanModalProps = {
  open: boolean
  onClose: () => void
  action: SummaryAction
  descriptionDetail?: string
  inheritedLink: SurveyLink
  scopeLabel: string
  provenance: InitiativeProvenance
  initiativeClass?: 'team' | 'development'
  lockOwner?: boolean
  visibilityNote?: string
  onCreated?: (initiativeId: string) => void
}

function toEmployeeOptions(): SelectOption[] {
  return mockEmployees.map((employee) => ({
    value: employee.id,
    label: `${employee.firstName} ${employee.lastName} (${employee.department})`,
  }))
}

function getDefaultOwnerId(ownerType: string): string {
  const user = getCurrentUser()
  if (ownerType === 'Manager' || ownerType === 'Leadership') {
    return user.id
  }
  return mockEmployees.find((employee) => employee.department === 'HR')?.id ?? user.id
}

export function CreateActionPlanModal({
  open,
  onClose,
  action,
  descriptionDetail,
  inheritedLink,
  scopeLabel,
  provenance,
  initiativeClass = 'team',
  lockOwner = false,
  visibilityNote,
  onCreated,
}: CreateActionPlanModalProps) {
  const { showToast } = useWuShowToast()
  const currentUser = getCurrentUser()
  const isAdmin = isAdminContext()
  const employeeOptions = useMemo(() => toEmployeeOptions(), [])
  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((goal) => ({ value: goal.id, label: goal.title })),
    [],
  )

  const [title, setTitle] = useState(action.action)
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [goal, setGoal] = useState<SelectOption | null>(goalOptions[0] ?? null)
  const [dueDate, setDueDate] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [capMode, setCapMode] = useState(false)
  const [selectedCapInitiative, setSelectedCapInitiative] = useState<SelectOption | null>(null)
  const [activeCapInitiatives, setActiveCapInitiatives] = useState<EmpowerInitiativeRecord[]>([])

  const scopeManagerId =
    inheritedLink.scope.kind === 'team' ? inheritedLink.scope.managerId : currentUser.id

  useEffect(() => {
    if (!open) return

    const defaultOwnerId = lockOwner ? currentUser.id : getDefaultOwnerId(action.owner)
    const defaultOwner =
      employeeOptions.find((option) => option.value === defaultOwnerId) ?? employeeOptions[0]

    setTitle(action.action)
    setDescription(
      descriptionDetail ??
        `${action.context}\n\nRecommended timeframe: ${action.timeframe}. Suggested owner: ${action.owner}.`,
    )
    setOwner(defaultOwner ?? null)
    setGoal(goalOptions[0] ?? null)
    setDueDate(format(addDays(new Date(), parseTimeframeDays(action.timeframe)), 'yyyy-MM-dd'))
    setCreatedId(null)
    setSelectedCapInitiative(null)

    const settings = getOrgSettings()
    const activeCount = countActiveTeamInitiativesForScope(currentUser.id, scopeManagerId)
    const atCap = initiativeClass === 'team' && activeCount >= settings.activeInitiativeCap
    setCapMode(atCap)

    if (atCap) {
      const capInitiatives = getAllInitiativesRaw().filter(
        (item) =>
          item.class === 'team' &&
          item.status === 'active' &&
          item.ownerId === currentUser.id,
      )
      setActiveCapInitiatives(capInitiatives)
      setSelectedCapInitiative(
        capInitiatives[0]
          ? { value: capInitiatives[0].id, label: capInitiatives[0].title }
          : null,
      )
    }
  }, [open, action, descriptionDetail, employeeOptions, goalOptions, lockOwner, currentUser.id, initiativeClass, scopeManagerId])

  function handleClose() {
    setCreatedId(null)
    onClose()
  }

  function handleCreateInitiative() {
    if (!title.trim() || !owner || !goal) {
      showToast({ variant: 'error', message: 'Title, owner, and goal are required' })
      return
    }

    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    const initiative: EmpowerInitiativeRecord = {
      id,
      title: title.trim(),
      description,
      goalId: goal.value,
      class: initiativeClass,
      status: 'active',
      progress: 'on_track',
      createdBy: currentUser.id,
      ownerId: owner.value,
      contributors: [],
      dueDate,
      createdAt: now,
      tasks: [
        {
          id: `task_${Date.now()}`,
          text: action.action,
          done: false,
          source: 'ai_recommendation',
        },
      ],
      provenance,
      surveyLink: inheritedLink,
      history: [{ at: now, event: 'Created from AI recommendation' }],
    }

    upsertInitiative(initiative)
    setCreatedId(id)
    onCreated?.(id)
    showToast({
      variant: 'success',
      message: 'Initiative created — View in Empower →',
    })
  }

  function handleAddAsTask() {
    if (!selectedCapInitiative) {
      showToast({ variant: 'error', message: 'Select an initiative' })
      return
    }

    const existing = getInitiativeById(selectedCapInitiative.value)
    if (!existing) return

    const now = new Date().toISOString()
    upsertInitiative({
      ...existing,
      tasks: [
        ...existing.tasks,
        {
          id: `task_${Date.now()}`,
          text: action.action,
          done: false,
          source: 'ai_recommendation',
        },
      ],
      history: [
        ...existing.history,
        { at: now, event: `Added AI recommendation as task (P${provenance.recommendationPriority})` },
      ],
    })

    setCreatedId(existing.id)
    onCreated?.(existing.id)
    showToast({ variant: 'success', message: 'Task added to existing initiative' })
  }

  const inheritedBlock = buildInheritedLinkBlock(inheritedLink, scopeLabel)
  const cap = getOrgSettings().activeInitiativeCap

  return (
    <WuModal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()} size="md">
      <WuModalHeader>
        <div>
          <div>{initiativeClass === 'development' ? 'Create Development Plan' : 'Create Action Plan'}</div>
          <WuText size="sm" as="p" className="mt-1 font-normal text-gray-500">
            From Summary &amp; Recommendations
          </WuText>
        </div>
      </WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {createdId ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <WuText size="sm" as="p" className="font-medium text-green-800">
              {capMode ? 'Task added successfully.' : 'Initiative created successfully.'}
            </WuText>
            <Link
              href={`/empower/initiatives/${createdId}`}
              className="mt-3 inline-block text-sm font-medium text-purple-600 hover:underline"
              onClick={handleClose}
            >
              View in Empower →
            </Link>
          </div>
        ) : capMode ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Your team has {cap} active initiatives. Complete one, or add this as a task:
            </div>
            <WuFormGroup
              Label="Add to initiative"
              Input={
                <WuSelect
                  data={activeCapInitiatives.map((item) => ({
                    value: item.id,
                    label: item.title,
                  }))}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedCapInitiative}
                  onSelect={(value) => setSelectedCapInitiative(value as SelectOption)}
                  variant="outlined"
                />
              }
            />
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              {action.action}
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              {inheritedBlock}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibilityNote && (
              <div className="rounded border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                {visibilityNote}
              </div>
            )}
            <WuFormGroup
              Label="Initiative Title"
              Input={<WuInput value={title} onChange={(event) => setTitle(event.target.value)} />}
            />
            <WuFormGroup
              Label="Goal"
              Input={
                <WuSelect
                  data={goalOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={goal}
                  onSelect={(value) => setGoal(value as SelectOption)}
                  variant="outlined"
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
                  disabled={lockOwner || (!isAdmin && initiativeClass === 'team')}
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
              Label="Description"
              Input={
                <WuTextarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              }
            />
            <div className="rounded border border-gray-200 bg-gray-50 p-3">
              <WuText size="sm" as="p" className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Inherited link
              </WuText>
              <WuText size="sm" as="p" className="mt-1 text-sm text-gray-700">
                {inheritedBlock}
              </WuText>
            </div>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {createdId ? (
            <WuButton variant="primary" onClick={handleClose}>
              Done
            </WuButton>
          ) : capMode ? (
            <>
              <WuButton variant="secondary" onClick={handleClose}>
                Cancel
              </WuButton>
              <WuButton variant="primary" onClick={handleAddAsTask}>
                Add as task
              </WuButton>
            </>
          ) : (
            <>
              <WuButton variant="secondary" onClick={handleClose}>
                Cancel
              </WuButton>
              <WuButton variant="primary" onClick={handleCreateInitiative}>
                Create in Empower
              </WuButton>
            </>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}

export function buildExInheritedLink(
  surveyId: string,
  surveyName: string,
  cycleLabel: string,
  scope: SurveyLinkScope,
  focus: SurveyLinkFocus,
  baseline: SurveyLink['baseline'],
): SurveyLink {
  return {
    surveyId,
    surveyName,
    surveyType: 'ex',
    cycleLabel,
    scope,
    focus,
    baseline,
    latest: null,
  }
}

export function build360InheritedLink(
  surveyId: string,
  surveyName: string,
  cycleLabel: string,
  focus: SurveyLinkFocus,
  baseline: SurveyLink['baseline'],
): SurveyLink {
  return {
    surveyId,
    surveyName,
    surveyType: '360',
    cycleLabel,
    scope: { kind: 'org' },
    focus,
    baseline,
    latest: null,
  }
}
