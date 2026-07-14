'use client'

import { useEffect } from 'react'
import { seedEmpowerIntegrationIfNeeded } from '@/lib/empowerIntegration/storage'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'

export function AppInitialiser() {
  useEffect(() => {
    seedDefaultDashboardsIfNeeded()
    seedEmpowerIntegrationIfNeeded()
  }, [])

  return null
}
