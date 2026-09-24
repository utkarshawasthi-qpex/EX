'use client'

import dynamic from 'next/dynamic'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

export default function PortalSettingsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Portal preferences and notification defaults."
        className="bg-white"
      />
      <PageContent>
        <section className="max-w-lg space-y-4">
          <WuText size="sm" as="div" className="font-semibold text-gray-800">
            Action planning nudges
          </WuText>
          <p className="text-sm text-gray-600">
            Each initiative has its own reminder frequency on the initiative{' '}
            <span className="font-medium">Reminders</span> tab (due-date windows, weekly, overdue).
            The portal still shows at most one in-app nudge per week; dismiss three to pause.
            Email and Teams are planned — not in this prototype.
          </p>
          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" disabled checked readOnly />
              In-app nudges (enabled)
            </label>
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" disabled />
              Email reminders (coming soon)
            </label>
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" disabled />
              Teams notifications (coming soon)
            </label>
          </div>
        </section>
      </PageContent>
    </PageShell>
  )
}
