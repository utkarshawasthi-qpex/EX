'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { simulateEngagement2027Close } from '@/lib/empowerIntegration/simulateCycleClose'
import { getOrgSettings, saveOrgSettings } from '@/lib/empowerIntegration/storage'
import { isAdminContext } from '@/lib/userContext'
import { redirect } from 'next/navigation'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export default function EmpowerSettingsPage() {
  if (!isAdminContext()) {
    redirect('/empower/initiatives')
  }

  return <EmpowerSettingsContent />
}

function EmpowerSettingsContent() {
  const { showToast } = useWuShowToast()
  const [settings, setSettings] = useState(getOrgSettings)

  function toggleShareWithManager() {
    const next = { ...settings, shareDevelopmentWithManager: !settings.shareDevelopmentWithManager }
    saveOrgSettings(next)
    setSettings(next)
    showToast({ variant: 'success', message: 'Org settings updated' })
  }

  function handleSimulateClose() {
    const result = simulateEngagement2027Close()
    setSettings(getOrgSettings())
    showToast({
      variant: result.ok ? 'success' : 'error',
      message: result.message,
    })
  }

  return (
    <PageShell>
      <PageHeader title="Empower Settings" description="Portal configuration and demo controls" />
      <PageContent>
        <section className="mb-8 max-w-xl rounded-lg border border-gray-200 bg-white p-4">
          <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
            Development plan privacy
          </WuText>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={settings.shareDevelopmentWithManager}
              onChange={toggleShareWithManager}
              className="rounded"
            />
            Share development plans with subject&apos;s manager
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Active initiative cap: {settings.activeInitiativeCap} per team scope
          </p>
        </section>

        <section className="max-w-xl rounded-lg border border-gray-200 bg-white p-4">
          <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
            Demo controls
          </WuText>
          <WuButton
            variant="primary"
            onClick={handleSimulateClose}
            disabled={settings.engagement2027Closed}
          >
            ▶ Simulate: Engagement 2027 closes
          </WuButton>
          {settings.engagement2027Closed && (
            <p className="mt-2 text-xs text-gray-500">2027 already closed</p>
          )}
        </section>
      </PageContent>
    </PageShell>
  )
}
