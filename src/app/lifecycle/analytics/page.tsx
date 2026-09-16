'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthChecking } from '@/components/shared/AuthChecking'

export default function LifecycleAnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/lifecycle/analytics/list')
  }, [router])

  return <AuthChecking />
}
