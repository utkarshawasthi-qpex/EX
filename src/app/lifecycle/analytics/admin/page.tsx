'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib'
import { DownloadCenterTab } from '@/components/modules/analytics/admin/DownloadCenterTab'
import { TextAnalysisTaxonomyTab } from '@/components/modules/analytics/admin/TextAnalysisTaxonomyTab'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { mockDownloadJobs, type DownloadJob } from '@/data/mock/adminDownloads'
import { mockTextAnalysisTaxonomy, type TaxonomyIndustry } from '@/data/mock/textAnalysisTaxonomy'
import { isAdminContext } from '@/lib/userContext'

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTab })),
  { ssr: false },
)

export default function PortalAdminPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<DownloadJob[]>(mockDownloadJobs)
  const [industries, setIndustries] = useState<TaxonomyIndustry[]>(mockTextAnalysisTaxonomy)
  const [tab, setTab] = useState('download-center')

  useEffect(() => {
    if (!isAdminContext()) {
      router.replace('/lifecycle/analytics/list')
    }
  }, [router])

  const tabs = useMemo<IWuTabItem[]>(
    () => [
      {
        value: 'download-center',
        Trigger: 'Download Center',
        Content: (
          <div className="pt-4">
            <DownloadCenterTab jobs={jobs} onChange={setJobs} />
          </div>
        ),
      },
      {
        value: 'text-analysis',
        Trigger: 'Text analysis',
        Content: (
          <div className="pt-4">
            <TextAnalysisTaxonomyTab industries={industries} onChange={setIndustries} />
          </div>
        ),
      },
    ],
    [industries, jobs],
  )

  if (!isAdminContext()) {
    return null
  }

  return (
    <PageShell>
      <PageHeader title="Admin" className="bg-white" />
      <PageContent>
        <WuTab items={tabs} value={tab} onValueChange={setTab} />
      </PageContent>
    </PageShell>
  )
}
