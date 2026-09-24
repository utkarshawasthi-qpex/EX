'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import { ActionPlanGuidedStepIndicator } from '@/components/modules/actionPlans/ActionPlanGuidedStepIndicator'

const SUMMARY_CREATE_STEPS = [
  { step: 1, label: 'Initiative details' },
  { step: 2, label: 'Tasks' },
] as const
import {
  initiativeRecommendationsForFocus,
  taskRecommendationsForInitiative,
} from '@/data/mock/actionSuggestions'
import { AiSparkleIcon } from '@/components/modules/actionPlans/AiSparkleIcon'
import { DEFAULT_INITIATIVE_REMINDER_SETTINGS } from '@/lib/actionPlans/initiativeReminders'
import { dataFocusFromSurveyLink } from '@/lib/actionPlans/buildDataFocus'
import { INITIATIVE_TYPE_OPTIONS, parseTimeframeDays } from '@/lib/empowerIntegration/helpers'
import { upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import type {
  ActionPlanDataFocus,
  InitiativeProvenance,
  InitiativeTask,
  InitiativeType,
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
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }
type SuccessKind = 'new'

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

  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [contributors, setContributors] = useState<SelectOption[]>([])
  const [goal, setGoal] = useState<SelectOption | null>(goalOptions[0] ?? null)
  const [type, setType] = useState<SelectOption>(INITIATIVE_TYPE_OPTIONS[0])
  const [dueDate, setDueDate] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const [createdId, setCreatedId] = useState<string | null>(null)
  const [successKind, setSuccessKind] = useState<SuccessKind | null>(null)
  const [confirmLinkStep, setConfirmLinkStep] = useState(linkCandidates.length > 1)
  const [selectedLink, setSelectedLink] = useState<SurveyLink | null>(initialLink)
  const [newGuidedStep, setNewGuidedStep] = useState<number | null>(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [selectedExtraTasks, setSelectedExtraTasks] = useState<Set<number>>(new Set([0]))
  const [newPlanTitle, setNewPlanTitle] = useState(action.action)
  const [taskDueDates, setTaskDueDates] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    setDescription(action.action)
    setOwner({ value: user.id, label: user.name })
    setContributors([])
    setGoal(goalOptions[0] ?? null)
    setType(INITIATIVE_TYPE_OPTIONS[0])
    setDueDate(format(addDays(new Date(), parseTimeframeDays(action.timeframe)), 'yyyy-MM-dd'))
    setValidationError(null)
    setCreatedId(null)
    setSuccessKind(null)
    setConfirmLinkStep(linkCandidates.length > 1)
    setSelectedLink(initialLink)
    setNewGuidedStep(linkCandidates.length > 1 ? null : 1)
    setSelectedSuggestionId(null)
    setSelectedExtraTasks(new Set([0]))
    setNewPlanTitle(action.action)
    setTaskDueDates([])
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

  const summaryDataFocus = useMemo((): ActionPlanDataFocus => {
    if (selectedLink) return dataFocusFromSurveyLink(selectedLink, 'summary')
    return {
      label: action.context?.split('·')[0]?.trim() || 'Summary recommendation',
      favorability: undefined,
      capturedAt: new Date().toISOString(),
      source: 'summary',
    }
  }, [selectedLink, action.context])

  const initiativeSuggestions = useMemo(
    () => initiativeRecommendationsForFocus(summaryDataFocus.label),
    [summaryDataFocus.label],
  )

  const activeSuggestion =
    initiativeSuggestions.find((s) => s.id === selectedSuggestionId) ?? initiativeSuggestions[0]

  const recommendedTaskOptions = useMemo(() => {
    if (!activeSuggestion) return []
    return taskRecommendationsForInitiative(activeSuggestion, summaryDataFocus.label)
  }, [activeSuggestion, summaryDataFocus.label])

  useEffect(() => {
    if (!open || !activeSuggestion) return
    setSelectedSuggestionId((prev) => prev ?? activeSuggestion.id)
    setNewPlanTitle((prev) => prev.trim() || activeSuggestion.title)
    setDescription((prev) => prev.trim() || action.action)
  }, [open, activeSuggestion, action.action])

  useEffect(() => {
    if (recommendedTaskOptions.length === 0) return
    setSelectedExtraTasks(new Set(recommendedTaskOptions.map((_, i) => i)))
  }, [recommendedTaskOptions])

  useEffect(() => {
    if (recommendedTaskOptions.length === 0) return
    const base = dueDate
      ? new Date(`${dueDate}T00:00:00`)
      : addDays(new Date(), parseTimeframeDays(action.timeframe))
    setTaskDueDates(
      recommendedTaskOptions.map((_, i) => format(addDays(base, i * 7), 'yyyy-MM-dd')),
    )
  }, [recommendedTaskOptions, dueDate, action.timeframe])

  useEffect(() => {
    if (!open || confirmLinkStep || createdId || newGuidedStep) return
    setNewGuidedStep(1)
  }, [open, confirmLinkStep, createdId, newGuidedStep])

  function validateGuidedStep1(): string | null {
    if (!newPlanTitle.trim()) return 'Action plan name is required.'
    if (!owner) return 'Owner is required.'
    if (!dueDate) return 'Due date is required.'
    if (!goal) return 'Goal is required.'
    return null
  }

  function handleCreateNewFromGuided() {
    if (!goal || !owner) return
    const stepError = validateGuidedStep1()
    if (stepError) {
      setValidationError(stepError)
      return
    }
    const now = new Date().toISOString()
    const id = `init_${Date.now()}`

    if (selectedExtraTasks.size === 0) {
      setValidationError('Select at least one task.')
      setNewGuidedStep(2)
      return
    }

    const extraTasks: InitiativeTask[] = recommendedTaskOptions
      .map((text, index) => ({ text, index }))
      .filter(({ index }) => selectedExtraTasks.has(index))
      .map(({ text, index }, order) => ({
        id: `task_${Date.now()}_extra_${order}`,
        text,
        ownerId: owner.value,
        contributorIds: contributorIds(),
        dueDate: taskDueDates[index] || dueDate,
        status: 'pending' as const,
        source: 'ai_recommendation' as const,
        provenance,
      }))

    upsertInitiative({
      id,
      title: newPlanTitle.trim() || activeSuggestion?.title || action.action,
      description: description.trim() || action.action || action.context || '',
      dueDate,
      goalId: goal.value,
      type: type.value as InitiativeType,
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: owner.value,
      contributors: contributorIds(),
      createdAt: now,
      tasks: extraTasks,
      provenance,
      surveyLink: null,
      dataFocus: summaryDataFocus,
      reminderSettings: { ...DEFAULT_INITIATIVE_REMINDER_SETTINGS },
      history: [{ at: now, event: 'Action plan created from summary recommendation' }],
    })

    setCreatedId(id)
    setSuccessKind('new')
    onCreated?.(id)
  }

  function toggleExtraTask(index: number) {
    setSelectedExtraTasks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function renderGuidedInitiativeForm() {
    return (
      <>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Recommended action
          </span>
          <p className="mt-1">{action.action}</p>
        </div>
        <WuFormGroup
          Label="Action plan name"
          Input={
            <WuInput value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} />
          }
        />
        <WuFormGroup
          Label="Description"
          Input={
            <WuTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          }
        />
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
        <WuFormGroup
          Label="Type"
          Input={
            <WuSelect
              data={INITIATIVE_TYPE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={type}
              onSelect={(v) => setType(v as SelectOption)}
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
          Label="Target due date"
          Input={
            <WuInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          }
        />
        <p className="text-xs text-gray-500">
          Task due dates on the next step default from this date. Change reminder frequency anytime
          on the initiative Reminders tab.
        </p>
      </>
    )
  }

  return (
    <WuModal
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      size={newGuidedStep ? 'lg' : 'md'}
      maxWidth={newGuidedStep ? '720px' : undefined}
      {...preventModalDismiss}
    >
      <WuModalHeader>Create Action Plan</WuModalHeader>
      <WuModalContent>
        {createdId && successKind ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <WuText size="sm" as="p" className="font-medium text-green-800">
              ✓ Initiative successfully created and assigned
            </WuText>
          </div>
        ) : confirmLinkStep && linkCandidates.length > 1 ? (
          <div className="space-y-3">
            <WuText size="sm" as="p" className="font-medium text-gray-800">
              Confirm data source
            </WuText>
            <WuText size="sm" as="p" className="text-xs text-gray-500">
              This recommendation uses multiple survey sources. Pick which data to base the plan on:
            </WuText>
            {linkCandidates.map((candidate) => (
              <button
                key={candidate.widgetId}
                type="button"
                onClick={() => {
                  setSelectedLink(candidate.link)
                  setConfirmLinkStep(false)
                  setNewGuidedStep(1)
                }}
                className="block w-full rounded border border-gray-200 px-3 py-2 text-left text-sm hover:border-blue-500 hover:bg-blue-50"
              >
                {candidate.label}
              </button>
            ))}
          </div>
        ) : newGuidedStep ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2.5">
              <AiSparkleIcon className="size-5" />
              <WuText size="sm" as="p" className="font-medium text-gray-900">
                AI-assisted action plan
              </WuText>
            </div>
            <ActionPlanGuidedStepIndicator
              steps={SUMMARY_CREATE_STEPS}
              current={newGuidedStep}
              onStepClick={(s) => s < newGuidedStep && setNewGuidedStep(s)}
            />

            {newGuidedStep === 1 && (
              <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto pr-1">
                {renderGuidedInitiativeForm()}
                {validationError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {validationError}
                  </p>
                ) : null}
              </div>
            )}

            {newGuidedStep === 2 && activeSuggestion && (
              <>
                <div className="flex items-center gap-2">
                  <AiSparkleIcon className="size-4" />
                  <WuText size="sm" as="p" className="text-gray-600">
                    Recommended tasks ({recommendedTaskOptions.length}). Edit due dates for each
                    task you keep.
                  </WuText>
                </div>
                {recommendedTaskOptions.map((text, index) => (
                  <div
                    key={`${text}-${index}`}
                    className="rounded border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      <WuCheckbox
                        checked={selectedExtraTasks.has(index)}
                        onChange={() => toggleExtraTask(index)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-sm text-gray-800">{text}</span>
                    </label>
                    {selectedExtraTasks.has(index) ? (
                      <div className="mt-2 pl-7">
                        <WuFormGroup
                          Label="Due date"
                          Input={
                            <WuInput
                              type="date"
                              value={taskDueDates[index] ?? ''}
                              onChange={(e) => {
                                const next = [...taskDueDates]
                                next[index] = e.target.value
                                setTaskDueDates(next)
                              }}
                            />
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-between gap-2">
          {createdId && successKind ? (
            <>
              <span />
              <div className="flex gap-2">
                <Link
                  href={`/lifecycle/analytics/action-plans/${createdId}`}
                  className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-gray-50"
                >
                  View action plan →
                </Link>
                <WuButton variant="primary" onClick={handleClose}>
                  Done
                </WuButton>
              </div>
            </>
          ) : confirmLinkStep && linkCandidates.length > 1 ? (
            <>
              <WuButton variant="secondary" onClick={handleClose}>
                Cancel
              </WuButton>
              <span />
            </>
          ) : newGuidedStep ? (
            <>
              <WuButton
                variant="secondary"
                onClick={() => {
                  if (newGuidedStep === 1) {
                    handleClose()
                    return
                  }
                  setNewGuidedStep(newGuidedStep - 1)
                }}
              >
                Back
              </WuButton>
              {newGuidedStep < 2 ? (
                <WuButton
                  variant="primary"
                  onClick={() => {
                    const err = validateGuidedStep1()
                    if (err) {
                      setValidationError(err)
                      return
                    }
                    setValidationError(null)
                    setNewGuidedStep(2)
                  }}
                >
                  Continue
                </WuButton>
              ) : (
                <WuButton variant="primary" onClick={handleCreateNewFromGuided}>
                  Create action plan
                </WuButton>
              )}
            </>
          ) : null}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
