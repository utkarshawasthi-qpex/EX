'use client'

import { useEffect } from 'react'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'

export function AppInitialiser() {
  useEffect(() => {
    seedDefaultDashboardsIfNeeded()
  }, [])

  return null
}
