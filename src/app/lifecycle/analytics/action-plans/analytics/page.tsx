import Link from 'next/link'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { ACTION_PLANS_OVERVIEW } from '@/lib/actionPlans/paths'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'

export default function ActionPlansAnalyticsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Action planning analytics"
        description="Same as Empower."
        className="bg-white"
      />
      <PageContent>
        <Link href={ACTION_PLANS_OVERVIEW} className="text-sm text-blue-600 hover:underline">
          ← {t.moduleHome}
        </Link>
        <p className="mt-8 text-sm text-gray-500">Same as Empower</p>
      </PageContent>
    </PageShell>
  )
}
