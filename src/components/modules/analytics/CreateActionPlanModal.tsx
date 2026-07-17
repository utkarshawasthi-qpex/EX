'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import {
  buildInheritedLinkBlock,
} from '@/lib/empowerIntegration/dashboardLink'
import { parseTimeframeDays } from '@/lib/empowerIntegration/helpers'
import {
  getInitiativeById,
  upsertInitiative,
} from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import type {
  InitiativeProvenance,
  InitiativeTask,
  NewTaskFormInput,
  SurveyLink,
  SurveyLinkCandidate,
} from '@/types/empowerIntegration'
import type { SummaryAction } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }
type CreateMode = 'existing' | 'new'
type SuccessKind = 'existing' | 'new'

export type CreateActionPlanModalProps = {
  open: boolean
  onClose: () => void
  action: SummaryAction
  inheritedLink: SurveyLink | null
  linkCandidates?: SurveyLinkCandidate[]
  provenance: InitiativeProvenance
  activeTab: 'company' | 'team'
  onCreated?: (initiativeId: string) => void
}

function toEmployeeOptions(): SelectOption[] {
  return mockEmployees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.department})`,
  }))
}

function buildTaskFromInput(input: NewTaskFormInput, provenance: InitiativeProvenance): InitiativeTask {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text: input.text.trim(),
    description: input.description?.trim() || undefined,
    ownerId: input.ownerId,
    contributorIds: input.contributorIds,
    dueDate: input.dueDate,
    done: false,
    source: 'ai_recommendation',
    provenance,
  }
}

export function CreateActionPlanModal({
  open,
  onClose,
  action,
  inheritedLink: initialLink,
  linkCandidates = [],
  provenance,
  activeTab,
  onCreated,
}: CreateActionPlanModalProps) {
  const user = getCurrentUser()
  const isAdmin = isAdminContext()
  const employeeOptions = useMemo(() => toEmployeeOptions(), [])
  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((g) => ({ value: g.id, label: g.title })),
    [],
  )

  const [mode, setMode] = useState<CreateMode | null>(null)
  const [name, setName] = useState(action.action)
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [contributors, setContributors] = useState<SelectOption[]>([])
  const [goal, setGoal] = useState<SelectOption | null>(goalOptions[0] ?? null)
  const [dueDate, setDueDate] = useState('')
  const [initiativeSearch, setInitiativeSearch] = useState('')
  const [selectedInitiative, setSelectedInitiative] = useState<SelectOption | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [createdId, setCreatedId] = useState<string | null>(null)
  const [successKind, setSuccessKind] = useState<SuccessKind | null>(null)
  const [confirmLinkStep, setConfirmLinkStep] = useState(linkCandidates.length > 1)
  const [selectedLink, setSelectedLink] = useState<SurveyLink | null>(initialLink)

  const activeInitiatives = useMemo(() => {
    return getVisibleInitiatives(user).filter((initiative) => initiative.status === 'active')
  }, [user])

  const filteredInitiatives = useMemo(() => {
    const query = initiativeSearch.trim().toLowerCase()
    const list = query
      ? activeInitiatives.filter((initiative) => initiative.title.toLowerCase().includes(query))
      : activeInitiatives
    return list.map((initiative) => ({ value: initiative.id, label: initiative.title }))
  }, [activeInitiatives, initiativeSearch])

  useEffect(() => {
    if (!open) return

    setName(action.action)
    setDescription(action.context || '')
    setOwner({ value: user.id, label: user.name })
    setContributors([])
    setGoal(goalOptions[0] ?? null)
    setDueDate(format(addDays(new Date(), parseTimeframeDays(action.timeframe)), 'yyyy-MM-dd'))
    setInitiativeSearch('')
    setSelectedInitiative(null)
    setValidationError(null)
    setCreatedId(null)
    setSuccessKind(null)
    setConfirmLinkStep(linkCandidates.length > 1)
    setSelectedLink(initialLink)
    setMode(null)
  }, [
    open,
    action,
    goalOptions,
    user.id,
    user.name,
    initialLink,
    linkCandidates.length,
  ])

  function handleClose() {
    setCreatedId(null)
    setSuccessKind(null)
    onClose()
  }

  function contributorIds(): string[] {
    return contributors.map((option) => option.value)
  }

  function buildFormInput(): NewTaskFormInput {
    return {
      text: name,
      description: description.trim() || undefined,
      ownerId: owner?.value ?? '',
      contributorIds: contributorIds(),
      dueDate,
    }
  }

  function validateSharedFields(): string | null {
    if (!name.trim()) return 'Name is required.'
    if (!owner) return 'Owner is required.'
    if (!dueDate) return 'Due date is required.'
    return null
  }

  function handleSubmitExisting() {
    setValidationError(null)
    if (!selectedInitiative) {
      setValidationError('Select an initiative to add this task to.')
      return
    }
    const sharedError = validateSharedFields()
    if (sharedError) {
      setValidationError(sharedError)
      return
    }

    const existing = getInitiativeById(selectedInitiative.value)
    if (!existing) {
      setValidationError('Selected initiative is no longer available.')
      return
    }

    const now = new Date().toISOString()
    const task = buildTaskFromInput(buildFormInput(), provenance)
    upsertInitiative({
      ...existing,
      tasks: [...existing.tasks, task],
      history: [
        ...existing.history,
        { at: now, event: `Added AI recommendation as task (P${provenance.recommendationPriority})` },
      ],
    })

    setCreatedId(existing.id)
    setSuccessKind('existing')
    onCreated?.(existing.id)
  }

  function handleSubmitNew() {
    setValidationError(null)
    const sharedError = validateSharedFields()
    if (sharedError) {
      setValidationError(sharedError)
      return
    }
    if (!goal) {
      setValidationError('Goal is required.')
      return
    }

    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    const task = buildTaskFromInput(buildFormInput(), provenance)
    const contributorIdList = contributorIds()

    upsertInitiative({
      id,
      title: name.trim(),
      description: description.trim(),
      goalId: goal.value,
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: owner!.value,
      contributors: contributorIdList,
      dueDate,
      createdAt: now,
      tasks: [task],
      provenance,
      surveyLink: selectedLink,
      history: [{ at: now, event: 'Initiative created from AI recommendation' }],
    })

    setCreatedId(id)
    setSuccessKind('new')
    onCreated?.(id)
  }

  function handleSubmit() {
    if (!mode) {
      setValidationError('Choose whether to add to an existing initiative or create a new one.')
      return
    }
    if (mode === 'existing') {
      handleSubmitExisting()
    } else {
      handleSubmitNew()
    }
  }

  const inheritedBlock = selectedLink ? buildInheritedLinkBlock(selectedLink) : null

  function renderModeToggle() {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('existing')
            setValidationError(null)
          }}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm transition-colors',
            mode === 'existing'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300',
          )}
        >
          Add to an existing initiative
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('new')
            setValidationError(null)
          }}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm transition-colors',
            mode === 'new'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300',
          )}
        >
          Create a new initiative
        </button>
      </div>
    )
  }

  function renderSharedTaskFields(labelName: string) {
    return (
      <>
        <WuFormGroup
          Label={labelName}
          Input={<WuInput value={name} onChange={(e) => setName(e.target.value)} />}
        />
        <WuFormGroup
          Label="Description"
          Input={
            <WuTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          }
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
              disabled={!isAdmin}
            />
          }
        />
        <WuFormGroup
          Label="Contributor(s)"
          Input={
            <WuSelect
              data={employeeOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={contributors}
              onSelect={(v) =>
                setContributors((Array.isArray(v) ? v : v ? [v] : []) as SelectOption[])
              }
              multiple
              variant="outlined"
            />
          }
        />
        <WuFormGroup
          Label="Due date"
          Input={
            <WuInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          }
        />
      </>
    )
  }

  return (
    <WuModal open={open} onOpenChange={(v) => !v && handleClose()} size="md">
      <WuModalHeader>Create Action Plan</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {createdId && successKind ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <WuText size="sm" as="p" className="font-medium text-green-800">
              {successKind === 'existing'
                ? '✓ Task successfully created'
                : '✓ Initiative successfully created and assigned'}
            </WuText>
          </div>
        ) : confirmLinkStep && linkCandidates.length > 1 ? (
          <div className="space-y-3">
            <WuText size="sm" as="p" className="font-medium text-gray-800">
              Confirm source
            </WuText>
            <WuText size="sm" as="p" className="text-xs text-gray-500">
              This recommendation draws on multiple surveys. Select which source to link:
            </WuText>
            {linkCandidates.map((candidate) => (
              <button
                key={candidate.widgetId}
                type="button"
                onClick={() => {
                  setSelectedLink(candidate.link)
                  setConfirmLinkStep(false)
                }}
                className="block w-full rounded border border-gray-200 px-3 py-2 text-left text-sm hover:border-blue-500 hover:bg-blue-50"
              >
                {candidate.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {renderModeToggle()}

            {mode === 'existing' && (
              <>
                <WuFormGroup
                  Label="Initiative"
                  Input={
                    <div className="space-y-2">
                      <WuInput
                        value={initiativeSearch}
                        onChange={(e) => setInitiativeSearch(e.target.value)}
                        placeholder="Search initiatives..."
                        variant="outlined"
                      />
                      <WuSelect
                        data={filteredInitiatives}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={selectedInitiative}
                        onSelect={(v) => setSelectedInitiative(v as SelectOption)}
                        variant="outlined"
                        placeholder={
                          filteredInitiatives.length === 0
                            ? 'No active initiatives found'
                            : 'Select an initiative'
                        }
                      />
                    </div>
                  }
                />
                {selectedInitiative && renderSharedTaskFields('Task name')}
              </>
            )}

            {mode === 'new' && (
              <>
                {renderSharedTaskFields('Name')}
                <WuFormGroup
                  Label="Goal"
                  Input={
                    <WuSelect
                      data={goalOptions}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={goal}
                      onSelect={(v) => setGoal(v as SelectOption)}
                      variant="outlined"
                    />
                  }
                />
                {inheritedBlock && (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    {inheritedBlock}
                  </div>
                )}
              </>
            )}

            {validationError && (
              <p className="text-sm text-red-600" role="alert">
                {validationError}
              </p>
            )}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {createdId && successKind ? (
            <>
              <Link
                href={`/empower/initiatives/${createdId}`}
                className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-gray-50"
              >
                View in Empower →
              </Link>
              <WuButton variant="primary" onClick={handleClose}>
                Done
              </WuButton>
            </>
          ) : confirmLinkStep && linkCandidates.length > 1 ? (
            <WuButton variant="secondary" onClick={handleClose}>
              Cancel
            </WuButton>
          ) : (
            <>
              <WuButton variant="secondary" onClick={handleClose}>
                Cancel
              </WuButton>
              <WuButton variant="primary" onClick={handleSubmit}>
                {mode === 'existing' ? 'Add task' : mode === 'new' ? 'Create initiative' : 'Continue'}
              </WuButton>
            </>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
