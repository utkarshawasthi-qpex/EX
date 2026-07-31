'use client'

import { differenceInCalendarDays, format, isBefore, startOfToday } from 'date-fns'
import { StatusBadge } from '@/components/empower/primitives/StatusBadge'
import { getUserById } from '@/lib/empower/simulation'
import { cn } from '@/lib/utils'
import type { EmpowerInitiative, EmpowerTask, TaskStatus } from '@/types/empower'

type TaskRowProps = {
  task: EmpowerTask
  initiative?: EmpowerInitiative
  onStatusChange?: (status: TaskStatus) => void
  showInitiative?: boolean
}

export function TaskRow({
  task,
  initiative,
  onStatusChange,
  showInitiative = false,
}: TaskRowProps) {
  const owner = getUserById(task.ownerId)
  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  const today = startOfToday()
  const daysUntilDue = differenceInCalendarDays(dueDate, today)
  const isOverdue = task.status !== 'completed' && isBefore(dueDate, today)
  const isUrgent = task.status !== 'completed' && !isOverdue && daysUntilDue <= 3

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2">
      <input
        type="checkbox"
        checked={task.status === 'completed'}
        onChange={(event) =>
          onStatusChange?.(event.target.checked ? 'completed' : 'todo')
        }
        disabled={!onStatusChange}
        aria-label={`Complete ${task.text}`}
        className="size-4 accent-[#1B87E6]"
      />

      <div className="min-w-0 flex-1">
        {showInitiative && initiative && (
          <p className="mb-0.5 text-xs font-medium text-blue-600">{initiative.name}</p>
        )}
        <p
          className={cn(
            'text-sm text-gray-800',
            task.status === 'completed' && 'text-gray-400 line-through',
          )}
        >
          {task.text}
        </p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex size-6 items-center justify-center rounded-full bg-[#1B87E6] text-[10px] font-semibold text-white">
          {owner?.avatar ?? '?'}
        </span>
        <span
          className={cn(
            'text-xs',
            isOverdue ? 'font-medium text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-400',
          )}
        >
          {isOverdue ? 'Overdue · ' : isUrgent ? 'Due soon · ' : ''}
          {format(dueDate, 'MMM d')}
        </span>
        <StatusBadge status={task.status} />
      </div>
    </div>
  )
}
