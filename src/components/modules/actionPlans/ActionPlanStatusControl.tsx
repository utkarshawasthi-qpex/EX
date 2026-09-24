'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { InitiativeStatusDropdown } from '@/components/empower/InitiativeStatusDropdown'
import { ActionFeedbackModal } from '@/components/modules/actionPlans/ActionFeedbackModal'
import type { EmpowerInitiativeRecord, InitiativeLifecycleStatus } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

type Props = {
  plan: EmpowerInitiativeRecord
  onPersist: (next: EmpowerInitiativeRecord, event: string) => void
  /** When true, starts the complete + optional feedback flow once. */
  requestComplete?: boolean
  onRequestCompleteHandled?: () => void
}

export function ActionPlanStatusControl({
  plan,
  onPersist,
  requestComplete,
  onRequestCompleteHandled,
}: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<InitiativeLifecycleStatus | null>(null)

  useEffect(() => {
    if (!requestComplete) return
    setPendingStatus('completed')
    setFeedbackOpen(true)
    onRequestCompleteHandled?.()
  }, [requestComplete, onRequestCompleteHandled])

  function applyStatus(status: InitiativeLifecycleStatus) {
    if (status === 'completed' || status === 'closed') {
      setPendingStatus(status)
      setFeedbackOpen(true)
      return
    }
    onPersist(
      {
        ...plan,
        status,
        progress: status === 'cancelled' ? plan.progress : plan.progress,
      },
      `Status set to ${status}`,
    )
  }

  function finishClose(withFeedback: EmpowerInitiativeRecord['actionFeedback'] | undefined) {
    const status = pendingStatus ?? 'completed'
    onPersist(
      {
        ...plan,
        status,
        progress: 'done',
        actionFeedback: withFeedback ?? plan.actionFeedback ?? null,
      },
      withFeedback ? `Status set to ${status}; team feedback sent` : `Status set to ${status}`,
    )
    setFeedbackOpen(false)
    setPendingStatus(null)
  }

  return (
    <>
      <InitiativeStatusDropdown status={plan.status} onChange={applyStatus} />
      <ActionFeedbackModal
        open={feedbackOpen}
        planTitle={plan.title}
        onSkip={() => finishClose(undefined)}
        onSubmit={(feedback) => finishClose(feedback)}
      />
    </>
  )
}

export function ActionPlanCompleteBanner({
  plan,
  onMarkComplete,
}: {
  plan: EmpowerInitiativeRecord
  onMarkComplete: () => void
}) {
  if (plan.status === 'completed' || plan.status === 'closed') return null
  const open = plan.tasks.length > 0 && plan.tasks.every((t) => t.status === 'completed')
  if (!open) return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
      <span className="text-green-900">All tasks are complete. Mark this initiative as done?</span>
      <WuButton variant="primary" onClick={onMarkComplete}>
        Mark complete
      </WuButton>
    </div>
  )
}
