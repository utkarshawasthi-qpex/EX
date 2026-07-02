'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthChecking } from '@/components/shared/AuthChecking'
import { loadDashboards } from '@/lib/mockDb'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'

export default function LifecycleAnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    seedDefaultDashboardsIfNeeded()
    const dashboards = loadDashboards()
    const first =
      dashboards.find((dashboard) => dashboard.access === 'global') ?? dashboards[0]

    if (first) {
      router.replace(`/lifecycle/analytics/${first.id}`)
      return
    }

    router.replace('/lifecycle/analytics/list')
  }, [router])

  return <AuthChecking />
}
