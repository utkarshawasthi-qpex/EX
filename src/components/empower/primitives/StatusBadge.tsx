'use client'

import { cn } from '@/lib/utils'
import type { InitiativeStatus, TaskStatus } from '@/types/empower'

type StatusBadgeProps = {
  status: InitiativeStatus | TaskStatus
}

const STATUS_STYLES: Record<InitiativeStatus | TaskStatus, string> = {
  new: 'border-gray-200 bg-gray-100 text-gray-600',
  active: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-green-200 bg-green-50 text-green-700',
  closed: 'border-gray-200 bg-gray-50 text-gray-400',
  todo: 'border-gray-200 bg-gray-100 text-gray-600',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
