'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ReportPreview } from '@/components/modules/feedback360/ReportPreview'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import type { Survey360 } from '@/data/mock/surveys360'
import { getSurvey360ById } from '@/lib/surveys360Storage'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export default function Feedback360ReportPreviewPage() {
  const params = useParams<{ surveyId: string }>()
  const router = useRouter()
  const surveyId = typeof params.surveyId === 'string' ? params.surveyId : ''
  const [survey, setSurvey] = useState<Survey360 | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSurvey(getSurvey360ById(surveyId) ?? null)
    setLoading(false)
  }, [surveyId])

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Individual Report Preview" />
        <PageContent>
          <WuText size="sm" className="text-gray-400">
            Loading…
          </WuText>
        </PageContent>
      </PageShell>
    )
  }

  if (!survey) {
    return (
      <PageShell>
        <PageHeader title="Individual Report Preview" />
        <PageContent>
          <EmptyState
            icon="wc-analytics"
            title="Program not found"
            description="This 360 program is not in the list. Pick another program from Reports."
            action={
              <WuButton variant="secondary" onClick={() => router.push('/360/reports')}>
                Back to Reports
              </WuButton>
            }
          />
        </PageContent>
      </PageShell>
    )
  }

  return <ReportPreview key={survey.id} survey={survey} />
}
