'use client'

import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import { listAccessibleExSurveys } from '@/lib/empowerIntegration/aggregate'
import {
  generateInitiativeRecommendations,
  overallFavorability,
  type RecommendedTask,
} from '@/lib/empowerIntegration/generateRecommendations'
import { INITIATIVE_TYPE_OPTIONS } from '@/lib/empowerIntegration/helpers'
import { upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type {
  EmpowerInitiativeRecord,
  InitiativeTask,
  InitiativeType,
  SurveyLink,
} from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuCheckbox = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })), { ssr: false })
const WuChip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })), { ssr: false })
const WuFormGroup = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })), { ssr: false })
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false })
const WuLoader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLoader })), { ssr: false })
const WuModal = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })), { ssr: false })
const WuModalContent = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })), { ssr: false })
const WuModalFooter = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })), { ssr: false })
const WuModalHeader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })), { ssr: false })
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false })
const WuTextarea = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })), { ssr: false })
const WuTooltip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })), { ssr: false })

type SelectOption = { value: string; label: string }
type Step = 1 | 2 | 3

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Details' },
  { step: 2, label: 'Link surveys' },
  { step: 3, label: 'Review tasks' },
]

type FormState = {
  name: string
  description: string
  goalId: string
  ownerId: string
  contributorIds: string[]
  type: InitiativeType
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  goalId: '',
  ownerId: '',
  contributorIds: [],
  type: 'none',
}

function daysFromNow(days: number): string {
  return format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd')
}

function priorityChipColor(priority: RecommendedTask['priority']): 'danger' | 'warning' | undefined {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return undefined
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <ol className="mb-6 flex items-center gap-2">
      {STEPS.map((item, index) => {
        const isActive = item.step === current
        const isComplete = item.step < current
        return (
          <li key={item.step} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isActive || isComplete
                    ? 'bg-[rgb(var(--wu-blue-p))] text-white'
                    : 'bg-[rgb(var(--wu-gray-25))] text-[rgb(var(--wu-gray-lead))]',
                )}
              >
                {isComplete ? (
                  <span className="wm-check text-sm leading-none" aria-hidden />
                ) : (
                  item.step
                )}
              </span>
              <span
                className={cn(
                  'text-sm',
                  isActive
                    ? 'font-medium text-[rgb(var(--wu-blue-p))]'
                    : 'text-[rgb(var(--wu-gray-lead))]',
                )}
              >
                {item.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className="mx-1 h-px flex-1 bg-[rgb(var(--wu-gray-25))]" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

interface CreateInitiativeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}

export function CreateInitiativeModal({
  open,
  onOpenChange,
  onCreated,
}: CreateInitiativeModalProps) {
  const user = getCurrentUser()
  const { showToast } = useWuShowToast()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<RecommendedTask[] | null>(null)

  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((goal) => ({ value: goal.id, label: goal.title })),
    [],
  )
  const employeeOptions = useMemo(
    () => mockEmployees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
    [],
  )
  const contributorOptions = useMemo(
    () => employeeOptions.filter((option) => option.value !== form.ownerId),
    [employeeOptions, form.ownerId],
  )
  const surveys = useMemo(() => listAccessibleExSurveys(true), [])

  const selectedSurveys = useMemo(
    () => surveys.filter((survey) => selectedSurveyIds.includes(survey.id)),
    [surveys, selectedSurveyIds],
  )

  const goalValue = goalOptions.find((option) => option.value === form.goalId) ?? null
  const ownerValue = employeeOptions.find((option) => option.value === form.ownerId) ?? null
  const contributorValues = contributorOptions.filter((option) =>
    form.contributorIds.includes(option.value),
  )
  const typeValue =
    INITIATIVE_TYPE_OPTIONS.find((option) => option.value === form.type) ?? INITIATIVE_TYPE_OPTIONS[0]

  const selectedCount = generatedTasks?.filter((task) => task.selected).length ?? 0
  const canProceedStep1 = Boolean(
    form.name.trim() && form.goalId && form.ownerId && form.contributorIds.length > 0,
  )

  useEffect(() => {
    if (!open) return
    setStep(1)
    setForm({ ...EMPTY_FORM, ownerId: user.id })
    setSelectedSurveyIds([])
    setIsGenerating(false)
    setGeneratedTasks(null)
  }, [open, user.id])

  function resetAndClose() {
    setStep(1)
    setForm(EMPTY_FORM)
    setSelectedSurveyIds([])
    setIsGenerating(false)
    setGeneratedTasks(null)
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetAndClose()
      return
    }
    onOpenChange(next)
  }

  function setOwner(ownerId: string) {
    setForm((current) => ({
      ...current,
      ownerId,
      contributorIds: current.contributorIds.filter((id) => id !== ownerId),
    }))
  }

  function toggleSurvey(surveyId: string) {
    setSelectedSurveyIds((current) =>
      current.includes(surveyId)
        ? current.filter((id) => id !== surveyId)
        : [...current, surveyId],
    )
    setGeneratedTasks(null)
  }

  function handleGenerate() {
    if (selectedSurveyIds.length === 0 || isGenerating) return
    setIsGenerating(true)
    window.setTimeout(() => {
      const tasks = generateInitiativeRecommendations(selectedSurveyIds)
      setGeneratedTasks(tasks)
      setIsGenerating(false)
      setStep(3)
    }, 1500)
  }

  function toggleTask(taskId: string) {
    setGeneratedTasks((current) =>
      current
        ? current.map((task) =>
            task.id === taskId ? { ...task, selected: !task.selected } : task,
          )
        : current,
    )
  }

  function setAllTasksSelected(selected: boolean) {
    setGeneratedTasks((current) =>
      current ? current.map((task) => ({ ...task, selected })) : current,
    )
  }

  function buildSurveyLinks(): SurveyLink[] {
    return selectedSurveys.map((survey) => ({
      surveyId: survey.id,
      surveyName: survey.name,
      cycleLabel: survey.cycleLabel,
      scope: { kind: 'org' },
      focus: { kind: 'category', id: 'overall', label: 'Overall' },
      baseline: {
        favorability: overallFavorability(survey.id),
        respondentCount: survey.orgRespondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: survey.status,
      },
      latest: null,
    }))
  }

  function createInitiative(tasks: InitiativeTask[], surveyLinks: SurveyLink[]) {
    if (!canProceedStep1) return

    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    const record: EmpowerInitiativeRecord = {
      id,
      title: form.name.trim(),
      description: form.description.trim(),
      goalId: form.goalId,
      type: form.type,
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: form.ownerId,
      contributors: form.contributorIds,
      createdAt: now,
      tasks,
      provenance: null,
      surveyLink: surveyLinks[0] ?? null,
      history: [
        {
          at: now,
          event:
            surveyLinks.length > 0
              ? `Initiative created with ${surveyLinks.length} survey link${surveyLinks.length === 1 ? '' : 's'} and ${tasks.length} task${tasks.length === 1 ? '' : 's'}`
              : 'Initiative created manually',
        },
      ],
    }

    upsertInitiative(record)
    showToast({
      variant: 'success',
      message:
        tasks.length > 0
          ? `Initiative created with ${tasks.length} task${tasks.length === 1 ? '' : 's'}`
          : 'Initiative created',
    })
    onCreated?.(id)
    resetAndClose()
  }

  function handleCreateNoSurvey() {
    createInitiative([], [])
  }

  function handleCreateWithTasks() {
    const selectedTasks = (generatedTasks ?? [])
      .filter((task) => task.selected)
      .map(
        (task): InitiativeTask => ({
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: task.text,
          description: `Targets ${task.category} (${task.favorability}% favorable)`,
          ownerId: form.ownerId,
          contributorIds: [],
          dueDate: daysFromNow(60),
          status: 'pending',
          source: 'ai_recommendation',
        }),
      )

    createInitiative(selectedTasks, buildSurveyLinks())
  }

  const createLabel =
    selectedCount > 0
      ? `Create initiative with ${selectedCount} task${selectedCount === 1 ? '' : 's'}`
      : 'Create initiative'

  return (
    <WuModal
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      preventClickOutside
      maxWidth="720px"
    >
      <WuModalHeader>New initiative</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <StepIndicator current={step} />

        {step === 1 && (
          <div className="space-y-4">
            <WuFormGroup
              Label="Initiative name"
              Input={
                <WuInput
                  variant="outlined"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Improve manager communication cadence"
                />
              }
            />
            <WuFormGroup
              Label="Description"
              Input={
                <WuTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this initiative trying to achieve?"
                />
              }
            />
            <WuFormGroup
              Label="Goal"
              Input={
                <WuSelect
                  data={goalOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={goalValue}
                  onSelect={(v) =>
                    setForm({ ...form, goalId: (v as SelectOption | null)?.value ?? '' })
                  }
                  variant="outlined"
                  placeholder="Select a goal"
                />
              }
            />
            <WuFormGroup
              Label="Owner"
              Input={
                <WuSelect
                  data={employeeOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={ownerValue}
                  onSelect={(v) => setOwner((v as SelectOption | null)?.value ?? '')}
                  variant="outlined"
                  placeholder="Select owner"
                />
              }
            />
            <div>
              <WuFormGroup
                Label="Contributor(s)"
                Input={
                  <WuSelect
                    data={contributorOptions}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={contributorValues}
                    onSelect={(v) =>
                      setForm({
                        ...form,
                        contributorIds: (Array.isArray(v) ? v : v ? [v] : []).map(
                          (option) => (option as SelectOption).value,
                        ),
                      })
                    }
                    multiple
                    variant="outlined"
                    placeholder="Select contributors"
                  />
                }
              />
              <p className="-mt-2 text-xs text-[rgb(var(--wu-gray-lead))]">
                At least one contributor is required
              </p>
            </div>
            <div>
              <WuFormGroup
                Label="Type"
                Input={
                  <WuSelect
                    data={INITIATIVE_TYPE_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={typeValue}
                    onSelect={(v) =>
                      setForm({
                        ...form,
                        type: ((v as SelectOption | null)?.value ?? 'none') as InitiativeType,
                      })
                    }
                    variant="outlined"
                  />
                }
              />
              <p className="-mt-2 text-xs text-[rgb(var(--wu-gray-lead))]">
                Upstream: other initiatives depend on this one. Downstream: this initiative depends
                on another.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-1 text-sm font-medium text-[rgb(var(--wu-blue-q))]">
              Link survey data (optional)
            </p>
            <p className="mb-4 text-sm text-[rgb(var(--wu-gray-lead))]">
              Select one or more EX surveys to ground this initiative in real data. The AI will
              suggest tasks based on the surveys you select.
            </p>

            {selectedSurveyIds.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedSurveys.map((survey) => (
                  <WuChip key={survey.id} size="sm" selected onClose={() => toggleSurvey(survey.id)}>
                    {survey.name}
                  </WuChip>
                ))}
              </div>
            )}

            <div
              className={cn(
                'max-h-60 space-y-2 overflow-y-auto rounded-lg border border-[rgb(var(--wu-gray-25))] p-2',
                isGenerating && 'pointer-events-none opacity-60',
              )}
            >
              {surveys.map((survey) => {
                const checked = selectedSurveyIds.includes(survey.id)
                return (
                  <div
                    key={survey.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSurvey(survey.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSurvey(survey.id)
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                      checked
                        ? 'border-[rgb(var(--wu-blue-p))] bg-[#EFF6FF]'
                        : 'border-transparent bg-white hover:bg-[rgb(var(--wu-gray-10))]',
                    )}
                  >
                    <WuCheckbox
                      checked={checked}
                      onChange={() => toggleSurvey(survey.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[rgb(var(--wu-blue-q))]">
                        {survey.name}
                      </p>
                      <p className="text-xs text-[rgb(var(--wu-gray-lead))]">
                        {survey.cycleLabel} · {survey.orgRespondentCount} respondents
                        {survey.status === 'live' && (
                          <WuChip size="sm" color="warning" className="ml-2">
                            Collecting
                          </WuChip>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <WuTooltip
                content={
                  selectedSurveyIds.length === 0
                    ? 'Select at least one survey to generate recommendations'
                    : 'Generate AI task recommendations from selected surveys'
                }
              >
                <span className="block w-full">
                  <WuButton
                    variant="secondary"
                    disabled={selectedSurveyIds.length === 0 || isGenerating}
                    onClick={handleGenerate}
                    className="w-full"
                    Icon={
                      isGenerating ? (
                        <WuLoader size="sm" variant="spinner" />
                      ) : (
                        <span className="wm-add text-base leading-none" aria-hidden />
                      )
                    }
                  >
                    {isGenerating ? 'Generating recommendations…' : 'Generate recommendations'}
                  </WuButton>
                </span>
              </WuTooltip>
            </div>
          </div>
        )}

        {step === 3 && generatedTasks && (
          <div>
            <p className="text-sm font-medium text-[rgb(var(--wu-blue-q))]">
              Review recommended tasks
            </p>
            <p className="mb-4 text-sm text-[rgb(var(--wu-gray-lead))]">
              {selectedSurveys.map((survey) => survey.name).join(', ')} · {generatedTasks.length}{' '}
              recommendations
            </p>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {generatedTasks.map((task) => (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTask(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleTask(task.id)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                    task.selected
                      ? 'border-[rgb(var(--wu-blue-p))] bg-[#EFF6FF]'
                      : 'border-[rgb(var(--wu-gray-25))] bg-white hover:bg-[rgb(var(--wu-gray-10))]',
                  )}
                >
                  <WuCheckbox
                    checked={task.selected}
                    onChange={() => toggleTask(task.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        task.selected
                          ? 'text-[rgb(var(--wu-blue-q))]'
                          : 'text-[rgb(var(--wu-gray-lead))]',
                      )}
                    >
                      {task.text}
                    </p>
                    <p className="mt-0.5 text-xs text-[rgb(var(--wu-gray-lead))]">
                      Targets {task.category} ({task.favorability}% favorable)
                    </p>
                  </div>
                  <WuChip size="sm" color={priorityChipColor(task.priority)}>
                    {task.priority}
                  </WuChip>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[rgb(var(--wu-gray-lead))]">
                {selectedCount} of {generatedTasks.length} tasks selected
                {selectedCount === 0 && ' — you can add tasks manually after creating'}
              </p>
              <div className="flex gap-2">
                <WuButton variant="link" size="sm" onClick={() => setAllTasksSelected(true)}>
                  Select all
                </WuButton>
                <WuButton variant="link" size="sm" onClick={() => setAllTasksSelected(false)}>
                  Deselect all
                </WuButton>
              </div>
            </div>
          </div>
        )}
      </WuModalContent>

      <WuModalFooter>
        <div className="flex w-full items-center justify-between gap-2">
          <WuButton variant="secondary" onClick={resetAndClose}>
            Cancel
          </WuButton>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <WuButton
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Next: Link surveys
              </WuButton>
            )}

            {step === 2 && (
              <>
                <WuButton variant="secondary" onClick={() => setStep(1)} disabled={isGenerating}>
                  Back
                </WuButton>
                <WuButton
                  variant="primary"
                  disabled={
                    isGenerating ||
                    (selectedSurveyIds.length > 0 && generatedTasks === null)
                  }
                  onClick={
                    selectedSurveyIds.length === 0
                      ? handleCreateNoSurvey
                      : () => setStep(3)
                  }
                >
                  {selectedSurveyIds.length === 0
                    ? 'Create initiative'
                    : 'Next: Review tasks'}
                </WuButton>
              </>
            )}

            {step === 3 && (
              <>
                <WuButton variant="secondary" onClick={() => setStep(2)}>
                  Back
                </WuButton>
                <WuButton variant="primary" onClick={handleCreateWithTasks}>
                  {createLabel}
                </WuButton>
              </>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
