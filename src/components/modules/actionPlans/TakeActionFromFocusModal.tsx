'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  ActionPlanGuidedStepIndicator,
  GUIDED_DASHBOARD_STEPS,
} from '@/components/modules/actionPlans/ActionPlanGuidedStepIndicator'
import { AiSparkleIcon } from '@/components/modules/actionPlans/AiSparkleIcon'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import {
  initiativeRecommendationsForFocus,
  taskRecommendationsForInitiative,
} from '@/data/mock/actionSuggestions'
import { dataFocusFromTakeAction } from '@/lib/actionPlans/buildDataFocus'
import { DEFAULT_INITIATIVE_REMINDER_SETTINGS } from '@/lib/actionPlans/initiativeReminders'
import { actionPlanDetailPath } from '@/lib/actionPlans/paths'
import type { TakeActionFocus } from '@/lib/actionPlans/takeAction'
import { upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { getCurrentUser } from '@/lib/userContext'
import type { ActionPlanDataFocus, EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

type Props = {
  open: boolean
  onClose: () => void
  focus: TakeActionFocus | null
}

/** Guided create from dashboard widget Take action (2 steps). */
export function TakeActionFromFocusModal({ open, onClose, focus: dashboardFocus }: Props) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()

  const [step, setStep] = useState(1)
  const [dataFocus, setDataFocus] = useState<ActionPlanDataFocus | null>(null)
  const [planTitle, setPlanTitle] = useState('')
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())

  const suggestions = useMemo(() => {
    const label = dataFocus?.label ?? ''
    return label ? initiativeRecommendationsForFocus(label) : []
  }, [dataFocus])

  const activeSuggestion = suggestions.find((s) => s.id === selectedSuggestionId) ?? suggestions[0]

  const taskOptions = useMemo(() => {
    if (!activeSuggestion) return []
    return taskRecommendationsForInitiative(
      activeSuggestion,
      dataFocus?.label ?? (planTitle.trim() || 'your focus'),
    )
  }, [activeSuggestion, dataFocus?.label, planTitle])

  useEffect(() => {
    if (!open) return
    setStep(1)
    if (dashboardFocus) {
      setDataFocus(dataFocusFromTakeAction(dashboardFocus, 'dashboard'))
      setPlanTitle(`Improve ${dashboardFocus.label}`)
    } else {
      setDataFocus(null)
      setPlanTitle('')
    }
    setSelectedSuggestionId(null)
    setSelectedTasks(new Set())
  }, [open, dashboardFocus])

  useEffect(() => {
    if (!dataFocus?.label) return
    const list = initiativeRecommendationsForFocus(dataFocus.label)
    setSelectedSuggestionId(list[0]?.id ?? null)
    setPlanTitle((prev) => prev.trim() || list[0]?.title || `Improve ${dataFocus.label}`)
  }, [dataFocus])

  useEffect(() => {
    if (taskOptions.length === 0) return
    setSelectedTasks(new Set(taskOptions.map((_, i) => i)))
  }, [taskOptions])

  function toggleTask(index: number) {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function goBack() {
    if (step === 1) {
      onClose()
      return
    }
    setStep(1)
  }

  function canContinue(): boolean {
    if (step === 1) return Boolean(selectedSuggestionId && planTitle.trim())
    return true
  }

  function createPlan() {
    if (!user || !activeSuggestion || !dataFocus) return
    const taskTexts = taskOptions.filter((_, i) => selectedTasks.has(i))
    if (taskTexts.length === 0) {
      showToast({ variant: 'error', message: 'Select at least one task.' })
      return
    }
    if (!planTitle.trim()) {
      showToast({ variant: 'error', message: 'Enter an initiative name.' })
      return
    }

    const dueBase = addDays(new Date(), 14)
    const tasks: InitiativeTask[] = taskTexts.map((text, index) => ({
      id: `task_${Date.now()}_${index}`,
      text,
      ownerId: user.id,
      contributorIds: [],
      dueDate: format(addDays(dueBase, index * 7), 'yyyy-MM-dd'),
      status: 'pending',
      source: 'ai_recommendation',
      provenance: null,
    }))

    const record: EmpowerInitiativeRecord = {
      id: `init_${Date.now()}`,
      title: planTitle.trim(),
      description: `Focused on ${dataFocus.label}${dataFocus.favorability != null ? ` (${dataFocus.favorability}% favorable in source data)` : ''}.`,
      goalId: EMPOWER_GOALS[0]?.id ?? 'goal_engagement',
      type: 'none',
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: user.id,
      contributors: [user.id],
      createdAt: new Date().toISOString(),
      tasks,
      provenance: null,
      surveyLink: null,
      dataFocus,
      reminderSettings: { ...DEFAULT_INITIATIVE_REMINDER_SETTINGS },
      history: [{ at: new Date().toISOString(), event: 'Created from dashboard Take action' }],
    }

    upsertInitiative(record)
    showToast({ variant: 'success', message: 'Initiative created' })
    onClose()
    router.push(actionPlanDetailPath(record.id))
  }

  if (!open || !dashboardFocus) return null

  return (
    <WuModal open={open} onOpenChange={(v) => !v && onClose()} size="md" {...preventModalDismiss}>
      <WuModalHeader>Create initiative</WuModalHeader>
      <WuModalContent>
        <ActionPlanGuidedStepIndicator
          steps={GUIDED_DASHBOARD_STEPS}
          current={step}
          onStepClick={(s) => s < step && setStep(s)}
        />

        {step === 1 && dataFocus && (
          <>
            <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-gray-800">
              <span className="text-xs font-medium uppercase text-gray-500">From dashboard</span>
              <p className="mt-1 font-medium">{dataFocus.label}</p>
              {dataFocus.dashboardName ? (
                <p className="text-xs text-gray-500">{dataFocus.dashboardName}</p>
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AiSparkleIcon className="size-4" />
                <WuText size="sm" as="p" className="text-gray-600">
                  Suggested initiatives for{' '}
                  <span className="font-medium">{dataFocus.label}</span>.
                </WuText>
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSuggestionId(s.id)
                    setPlanTitle(s.title)
                  }}
                  className={cn(
                    'block w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                    selectedSuggestionId === s.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <span className="font-medium text-gray-900">{s.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{s.description}</span>
                </button>
              ))}
              <WuFormGroup
                Label="Initiative name"
                Input={
                  <WuInput variant="outlined" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
                }
              />
            </div>
          </>
        )}

        {step === 2 && activeSuggestion && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AiSparkleIcon className="size-4" />
              <WuText size="sm" as="p" className="text-gray-600">
                Recommended tasks ({taskOptions.length})
              </WuText>
            </div>
            {taskOptions.map((text, index) => (
              <label
                key={`${text}-${index}`}
                className="flex cursor-pointer items-start gap-2 rounded border border-gray-100 px-3 py-2 hover:bg-gray-50"
              >
                <WuCheckbox
                  checked={selectedTasks.has(index)}
                  onChange={() => toggleTask(index)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm text-gray-800">{text}</span>
              </label>
            ))}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-between gap-2">
          <WuButton variant="secondary" onClick={goBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </WuButton>
          {step === 1 ? (
            <WuButton variant="primary" disabled={!canContinue()} onClick={() => setStep(2)}>
              Continue
            </WuButton>
          ) : (
            <WuButton variant="primary" onClick={createPlan}>
              Create initiative
            </WuButton>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
