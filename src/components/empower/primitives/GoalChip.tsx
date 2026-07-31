'use client'

import { EMPOWER_GOALS, type InitiativeGoal } from '@/types/empower'

type GoalChipProps = {
  goalId: InitiativeGoal
}

export function GoalChip({ goalId }: GoalChipProps) {
  const goal = EMPOWER_GOALS.find((item) => item.id === goalId)

  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: goal?.color ?? '#6B7280' }}
    >
      {goal?.label ?? 'Custom'}
    </span>
  )
}
