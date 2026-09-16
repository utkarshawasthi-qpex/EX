'use client'

import { Suspense } from 'react'
import { StudyDistributionPage } from '@/components/studies/StudyDistributionPage'

export default function LifecycleDistributionPage() {
  return (
    <Suspense fallback={null}>
      <StudyDistributionPage />
    </Suspense>
  )
}
