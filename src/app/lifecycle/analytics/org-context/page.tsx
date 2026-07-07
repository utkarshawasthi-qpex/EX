'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SummaryOrgContextPanel } from '@/components/modules/analytics/SummaryOrgContextPanel'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { isAdminContext } from '@/lib/userContext'

export default function OrganizationContextPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAdminContext()) {
      router.replace('/lifecycle/analytics')
    }
  }, [router])

  if (!isAdminContext()) {
    return null
  }

  return (
    <PageShell>
      <PageHeader
        title="Org Context"
        description="Provide the six inputs your AI summary uses — three documents and three text fields. All limits are enforced by the token budget meter."
      />

      <PageContent>
        <SummaryOrgContextPanel />
      </PageContent>
    </PageShell>
  )
}
