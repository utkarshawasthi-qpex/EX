'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import {
  listInitiativeTemplates,
  taskRecommendationsForInitiative,
  type ActionSuggestion,
} from '@/data/mock/actionSuggestions'
import { INITIATIVE_TYPE_OPTIONS } from '@/lib/empowerIntegration/helpers'
import { DEFAULT_INITIATIVE_REMINDER_SETTINGS } from '@/lib/actionPlans/initiativeReminders'
import { actionPlanDetailPath } from '@/lib/actionPlans/paths'
import { upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import type {
  EmpowerInitiativeRecord,
  InitiativeTask,
  InitiativeType,
} from '@/types/empowerIntegration'

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

type HubFlow = 'pick' | 'custom-form' | 'templates'

type SelectOption = { value: string; label: string }

type CustomFormState = {
  name: string
  description: string
  goalId: string
  ownerId: string
  contributorIds: string[]
  type: InitiativeType
}

type Props = {
  open: boolean
  onClose: () => void
}

function defaultCustomForm(ownerId: string): CustomFormState {
  return {
    name: '',
    description: '',
    goalId: EMPOWER_GOALS[0]?.id ?? 'goal_engagement',
    ownerId,
    contributorIds: [],
    type: 'none',
  }
}

export function HubCreateInitiativeModal({ open, onClose }: Props) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()
  const isAdmin = isAdminContext()
  const initiativeTemplates = useMemo(() => listInitiativeTemplates(), [])

  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((goal) => ({ value: goal.id, label: goal.title })),
    [],
  )
  const employeeOptions = useMemo(
    () =>
      mockEmployees.map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName} (${e.department})`,
      })),
    [],
  )

  const [flow, setFlow] = useState<HubFlow>('pick')
  const [customForm, setCustomForm] = useState<CustomFormState>(() => defaultCustomForm(user.id))
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const contributorOptions = useMemo(
    () => employeeOptions.filter((option) => option.value !== customForm.ownerId),
    [employeeOptions, customForm.ownerId],
  )

  const goalValue = goalOptions.find((option) => option.value === customForm.goalId) ?? null
  const ownerValue = employeeOptions.find((option) => option.value === customForm.ownerId) ?? null
  const contributorValues = contributorOptions.filter((option) =>
    customForm.contributorIds.includes(option.value),
  )
  const typeValue =
    INITIATIVE_TYPE_OPTIONS.find((option) => option.value === customForm.type) ??
    INITIATIVE_TYPE_OPTIONS[0]

  const canCreateCustom = Boolean(
    customForm.name.trim() &&
      customForm.goalId &&
      customForm.ownerId &&
      customForm.contributorIds.length > 0,
  )

  useEffect(() => {
    if (!open) return
    setFlow('pick')
    setCustomForm(defaultCustomForm(user.id))
    setSelectedTemplateId(null)
  }, [open, user.id])

  function setOwner(ownerId: string) {
    setCustomForm((current) => ({
      ...current,
      ownerId,
      contributorIds: current.contributorIds.filter((id) => id !== ownerId),
    }))
  }

  function goBack() {
    if (flow === 'pick') {
      onClose()
      return
    }
    setFlow('pick')
  }

  function buildTasks(texts: string[], source: InitiativeTask['source']): InitiativeTask[] {
    if (!user) return []
    const dueBase = addDays(new Date(), 14)
    return texts.map((text, index) => ({
      id: `task_${Date.now()}_${index}`,
      text,
      ownerId: customForm.ownerId,
      contributorIds: [],
      dueDate: format(addDays(dueBase, index * 7), 'yyyy-MM-dd'),
      status: 'pending',
      source,
      provenance: null,
    }))
  }

  function persistInitiative(
    record: Omit<EmpowerInitiativeRecord, 'id' | 'createdAt' | 'history'>,
    options?: { toastMessage?: string },
  ) {
    if (!user) return
    const id = `init_${Date.now()}`
    const full: EmpowerInitiativeRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
      reminderSettings: record.reminderSettings ?? { ...DEFAULT_INITIATIVE_REMINDER_SETTINGS },
      history: [{ at: new Date().toISOString(), event: 'Created from Action planning home' }],
    }
    upsertInitiative(full)
    showToast({ variant: 'success', message: options?.toastMessage ?? 'Initiative created' })
    onClose()
    router.push(actionPlanDetailPath(id))
  }

  function createCustomInitiative() {
    if (!canCreateCustom) {
      showToast({
        variant: 'error',
        message: 'Complete all required fields, including at least one contributor.',
      })
      return
    }
    persistInitiative(
      {
        title: customForm.name.trim(),
        description:
          customForm.description.trim() ||
          'Custom initiative (not tied to survey or dashboard source).',
        goalId: customForm.goalId,
        type: customForm.type,
        status: 'active',
        progress: 'on_track',
        createdBy: user.id,
        ownerId: customForm.ownerId,
        contributors: customForm.contributorIds,
        tasks: [],
        provenance: null,
        surveyLink: null,
        dataFocus: null,
      },
      { toastMessage: 'Initiative created — add tasks on the detail page.' },
    )
  }

  function createFromTemplate(template: ActionSuggestion) {
    const tasks = taskRecommendationsForInitiative(template, template.title)
    persistInitiative({
      title: template.title,
      description: template.description,
      goalId: EMPOWER_GOALS[0]?.id ?? 'goal_engagement',
      type: 'none',
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: user.id,
      contributors: [user.id],
      tasks: buildTasks(tasks, 'manual'),
      provenance: null,
      surveyLink: null,
      dataFocus: null,
    })
  }

  if (!open) return null

  const backLabel = flow === 'pick' ? 'Cancel' : 'Back'
  const modalSize = flow === 'custom-form' ? 'lg' : 'md'

  return (
    <WuModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      size={modalSize}
      maxWidth={flow === 'custom-form' ? '720px' : undefined}
      {...preventModalDismiss}
    >
      <WuModalHeader>Create initiative</WuModalHeader>
      <WuModalContent>
        {flow === 'pick' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setCustomForm(defaultCustomForm(user.id))
                  setFlow('custom-form')
                }}
                className="flex min-h-[100px] flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
              >
                <span className="text-sm font-semibold text-gray-900">Custom</span>
                <p className="mt-2 flex-1 text-xs text-gray-600">
                  Full initiative details — add tasks later on the detail page.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId(null)
                  setFlow('templates')
                }}
                className="flex min-h-[100px] flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
              >
                <span className="text-sm font-semibold text-gray-900">Use template</span>
                <p className="mt-2 flex-1 text-xs text-gray-600">
                  Pick a curated playbook — the initiative is created with recommended tasks.
                </p>
              </button>
            </div>
          </div>
        )}

        {flow === 'custom-form' && (
          <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto pr-1">
            <WuFormGroup
              Label="Initiative name"
              Input={
                <WuInput
                  variant="outlined"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="e.g. Improve manager communication cadence"
                />
              }
            />
            <WuFormGroup
              Label="Description"
              Input={
                <WuTextarea
                  rows={3}
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
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
                    setCustomForm({
                      ...customForm,
                      goalId: (v as SelectOption | null)?.value ?? '',
                    })
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
                  disabled={!isAdmin}
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
                      setCustomForm({
                        ...customForm,
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
              <p className="-mt-2 text-xs text-gray-500">At least one contributor is required.</p>
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
                      setCustomForm({
                        ...customForm,
                        type: ((v as SelectOption | null)?.value ?? 'none') as InitiativeType,
                      })
                    }
                    variant="outlined"
                  />
                }
              />
              <p className="-mt-2 text-xs text-gray-500">
                Upstream: other initiatives depend on this one. Downstream: this initiative depends
                on another.
              </p>
            </div>
          </div>
        )}

        {flow === 'templates' && (
          <div className="space-y-3">
            <WuText size="sm" as="p" className="text-gray-600">
              Each template includes a full set of recommended tasks.
            </WuText>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {initiativeTemplates.map((template) => {
                const selected = selectedTemplateId === template.id
                const taskCount = taskRecommendationsForInitiative(template, template.title).length
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={cn(
                      'block w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <span className="font-medium text-gray-900">{template.title}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{template.description}</span>
                    <span className="mt-1 inline-block text-xs text-gray-500">{taskCount} tasks</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-between gap-2">
          <WuButton variant="secondary" onClick={goBack}>
            {backLabel}
          </WuButton>
          {flow === 'custom-form' ? (
            <WuButton variant="primary" disabled={!canCreateCustom} onClick={createCustomInitiative}>
              Create initiative
            </WuButton>
          ) : flow === 'templates' ? (
            <WuButton
              variant="primary"
              disabled={!selectedTemplateId}
              onClick={() => {
                const template = initiativeTemplates.find((t) => t.id === selectedTemplateId)
                if (template) createFromTemplate(template)
              }}
            >
              Create from template
            </WuButton>
          ) : null}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
