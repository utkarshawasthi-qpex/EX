'use client'

import { cn } from '@/lib/utils'

export const GUIDED_WIZARD_STEPS = [
  { step: 1 as const, label: 'Source' },
  { step: 2 as const, label: 'Focus topic' },
  { step: 3 as const, label: 'Choose initiative' },
  { step: 4 as const, label: 'Tasks' },
]

export const GUIDED_DASHBOARD_STEPS = [
  { step: 1 as const, label: 'Choose initiative' },
  { step: 2 as const, label: 'Tasks' },
]

export type GuidedWizardStep = 1 | 2 | 3 | 4
export type GuidedDashboardStep = 1 | 2
export type GuidedCreateStep = GuidedWizardStep | GuidedDashboardStep

type Props = {
  steps: readonly { step: number; label: string }[]
  current: number
  onStepClick?: (step: number) => void
}

export function ActionPlanGuidedStepIndicator({ steps, current, onStepClick }: Props) {
  return (
    <ol className="mb-6 flex items-center gap-2">
      {steps.map((item, index) => {
        const isActive = item.step === current
        const isComplete = item.step < current
        const canJump = onStepClick && isComplete

        return (
          <li key={item.step} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!canJump}
              onClick={() => canJump && onStepClick?.(item.step)}
              className={cn(
                'flex min-w-0 items-center gap-2 text-left',
                canJump && 'cursor-pointer hover:opacity-90',
                !canJump && 'cursor-default',
              )}
            >
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
                  'truncate text-sm',
                  isActive
                    ? 'font-medium text-[rgb(var(--wu-blue-p))]'
                    : 'text-[rgb(var(--wu-gray-lead))]',
                )}
              >
                {item.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span className="mx-1 h-px flex-1 bg-[rgb(var(--wu-gray-25))]" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
