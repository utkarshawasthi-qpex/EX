'use client'

import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'

export default function BenchmarkingPage() {
  return (
    <PageShell>
      <PageHeader
        title="Benchmarking"
        description="Benchmark engagement scores against internal and external references."
        className="bg-white"
      />
      <PageContent>
        <EmptyState
          icon="wc-analytics"
          title="Benchmarking"
          description="This view is coming soon in the prototype."
        />
      </PageContent>
    </PageShell>
  )
}
