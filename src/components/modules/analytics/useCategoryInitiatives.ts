'use client'

import { useMemo } from 'react'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'

export function useActiveInitiativesByCategory(categoryIds: string[]) {
  const user = getCurrentUser()

  return useMemo(() => {
    const visible = getVisibleInitiatives(user).filter(
      (item) => item.class === 'team' && item.status === 'active' && item.surveyLink,
    )

    const map: Record<string, string[]> = {}
    for (const categoryId of categoryIds) {
      map[categoryId] = visible
        .filter((item) => item.surveyLink?.focus.id === categoryId)
        .map((item) => item.id)
    }
    return map
  }, [user, categoryIds.join(',')])
}
