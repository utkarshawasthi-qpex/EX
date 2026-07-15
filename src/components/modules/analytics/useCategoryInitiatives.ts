'use client'

import { useMemo } from 'react'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'

export function useActiveInitiativesByCategory(categoryIds: string[]) {
  const user = getCurrentUser()
  return useMemo(() => {
    const visible = getVisibleInitiatives(user).filter(
      (i) => i.status === 'active' && i.surveyLink,
    )
    const map: Record<string, string[]> = {}
    for (const id of categoryIds) {
      map[id] = visible.filter((i) => i.surveyLink?.focus.id === id).map((i) => i.id)
    }
    return map
  }, [user, categoryIds.join(',')])
}
