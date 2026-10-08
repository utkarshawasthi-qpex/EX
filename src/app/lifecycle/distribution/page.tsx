'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudyDistributeHref, MOCK_STUDIES } from '@/data/mock-studies'

function DistributionRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const name = searchParams.get('study')?.trim()
    const study = MOCK_STUDIES.find((item) => item.type === 'Survey' && item.name === name)
    router.replace(study ? getStudyDistributeHref(study) : '/lifecycle/surveys')
  }, [router, searchParams])

  return null
}

export default function LifecycleDistributionPage() {
  return (
    <Suspense fallback={null}>
      <DistributionRedirect />
    </Suspense>
  )
}
