'use client'

import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'

export default function SurveyComparisonPage() {
  return (
    <PageShell>
      <PageHeader
        title="Survey comparison"
        description="Compare survey results across time periods or cohorts."
        className="bg-white"
      />
      <PageContent>
        <EmptyState
          icon="wc-balancing"
          title="Survey comparison"
          description="This view is coming soon in the prototype."
        />
      </PageContent>
    </PageShell>
  )
}
