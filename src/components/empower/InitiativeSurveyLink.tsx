'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { formatScopeLabel } from '@/lib/empowerIntegration/aggregate'
import { getSurveyDataStore } from '@/lib/empowerIntegration/storage'
import type { SurveyLink } from '@/types/empowerIntegration'

const WuChip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })), { ssr: false })

interface InitiativeSurveyLinkProps {
  link: SurveyLink
  canUnlink: boolean
  onUnlink: () => void
}

export function InitiativeSurveyLink({ link, canUnlink, onUnlink }: InitiativeSurveyLinkProps) {
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const sourceMissing = !getSurveyDataStore().ex[link.surveyId]
  const delta =
    link.latest?.favorability !== undefined && link.baseline.favorability !== undefined
      ? link.latest.favorability - link.baseline.favorability
      : null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs text-[#374151]">
      <span className="font-medium">{link.surveyName}</span>
      <WuChip size="sm" variant="secondary">
        {formatScopeLabel(link.scope)}
      </WuChip>
      <span>{link.focus.label}</span>
      <span className="text-[#6B7280]">
        Baseline {link.baseline.favorability ?? '—'}%
        {link.latest ? ` → ${link.latest.favorability}%` : ' · awaiting next cycle'}
      </span>
      {delta !== null && (
        <WuChip size="sm" color={delta >= 0 ? 'success' : 'danger'}>
          {delta >= 0 ? '+' : ''}
          {delta}%
        </WuChip>
      )}
      {sourceMissing && <span className="text-[#B45309]">Source survey no longer available</span>}

      <div className="ml-auto flex items-center gap-3">
        {!sourceMissing && (
          <Link href="/lifecycle/analytics/list" className="text-[#1B87E6] hover:underline">
            View in dashboard →
          </Link>
        )}
        {canUnlink && (
          <button
            type="button"
            className="text-[#6B7280] hover:text-[#DC2626]"
            onClick={() => setConfirmUnlink(true)}
          >
            Unlink
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title="Unlink survey data?"
        description="The initiative will remain; only the linked survey panel is removed."
        confirmLabel="Unlink"
        variant="critical"
        onConfirm={onUnlink}
      />
    </div>
  )
}
