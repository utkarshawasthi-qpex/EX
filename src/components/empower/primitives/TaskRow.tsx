'use client'

import { differenceInCalendarDays, format, startOfToday } from 'date-fns'
import { cn } from '@/lib/utils'
import type { EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

type TaskRowProps = {
  task: InitiativeTask
  initiative: EmpowerInitiativeRecord
  onToggle?: () => void
}

type DueState = {
  label: string
  className: string
}

function describeDueDate(dueDate: string | undefined): DueState | null {
  if (!dueDate) return null

  const due = new Date(`${dueDate}T00:00:00`)
  if (Number.isNaN(due.getTime())) return null

  const daysUntilDue = differenceInCalendarDays(due, startOfToday())
  const formatted = format(due, 'MMM d, yyyy')

  if (daysUntilDue < 0) {
    return { label: `Overdue · ${formatted}`, className: 'text-[#DC2626] font-medium' }
  }
  if (daysUntilDue <= 3) {
    return { label: `Due soon · ${formatted}`, className: 'text-[#B45309] font-medium' }
  }
  return { label: `Due ${formatted}`, className: 'text-[#6B7280]' }
}

export function TaskRow({ task, initiative, onToggle }: TaskRowProps) {
  const due = describeDueDate(task.dueDate)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-[#1B87E6]"
        checked={task.done}
        onChange={() => onToggle?.()}
        disabled={!onToggle}
        aria-label={`Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm text-[#1B2E4A]',
            task.done && 'text-[#9CA3AF] line-through',
          )}
        >
          {task.text}
        </p>
        <p className="truncate text-xs text-[#6B7280]">{initiative.title}</p>
      </div>

      {due && <span className={cn('shrink-0 text-xs', due.className)}>{due.label}</span>}
    </div>
  )
}
