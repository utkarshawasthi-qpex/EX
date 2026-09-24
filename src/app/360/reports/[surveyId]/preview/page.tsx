'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Feedback360ReportPreviewPage() {
  const params = useParams<{ surveyId: string }>()
  const router = useRouter()
  const surveyId = typeof params.surveyId === 'string' ? params.surveyId : ''

  useEffect(() => {
    if (!surveyId) return
    router.replace(
      `/360/surveys/${surveyId}/edit?tab=analytics&section=individualReports&view=preview`,
    )
  }, [router, surveyId])

  return null
}
