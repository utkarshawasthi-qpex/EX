'use client'

import { isBefore, startOfToday } from 'date-fns'
import { GoalChip } from '@/components/empower/primitives/GoalChip'
import { StatusBadge } from '@/components/empower/primitives/StatusBadge'
import { getUserById } from '@/lib/empower/simulation'
import { cn } from '@/lib/utils'
import type { EmpowerInitiative } from '@/types/empower'

type InitiativeCardProps = {
  initiative: EmpowerInitiative
  onClick?: () => void
  compact?: boolean
}

export function InitiativeCard({ initiative, onClick, compact = false }: InitiativeCardProps) {
  const owner = getUserById(initiative.ownerId)
  const completedTasks = initiative.tasks.filter((task) => task.status === 'completed').length
  const progress =
    initiative.tasks.length > 0
      ? Math.round((completedTasks / initiative.tasks.length) * 100)
      : 0
  const hasOverdueTask = initiative.tasks.some(
    (task) =>
      task.status !== 'completed' &&
      isBefore(new Date(`${task.dueDate}T00:00:00`), startOfToday()),
  )
  const firstLink = initiative.surveyLinks[0]

  return (
    <article
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer hover:shadow-md',
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick()
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{initiative.name}</h3>
            {initiative.pinnedToHome && (
              <span
                className="wm-pin text-sm text-[#1B87E6]"
                title="Pinned to Home"
                aria-label="Pinned"
              />
            )}
          </div>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{initiative.description}</p>
          )}
        </div>
        <StatusBadge status={initiative.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GoalChip goalId={initiative.goalId} />
        {firstLink && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            Baseline {firstLink.baseline.favorability}%
          </span>
        )}
        {hasOverdueTask && (
          <span className="text-xs font-medium text-red-600">Overdue task</span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Task progress</span>
          <span>
            {completedTasks}/{initiative.tasks.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#1B87E6]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span className="flex size-6 items-center justify-center rounded-full bg-[#1B87E6] font-semibold text-white">
          {owner?.avatar ?? '?'}
        </span>
        <span>{owner?.name ?? 'Unknown owner'}</span>
      </div>
    </article>
  )
}
