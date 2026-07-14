'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import {
  classBadgeLabel,
  formatDueDate,
  getGoalTitle,
  progressLabel,
} from '@/lib/empowerIntegration/helpers'
import { formatScopeLabel } from '@/lib/empowerIntegration/aggregate'
import { getSurveyDataStore, getInitiativeById, upsertInitiative } from '@/lib/empowerIntegration/storage'
import { canSeeInitiative } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function LinkedSurveyPanel({
  initiative,
  onUnlink,
}: {
  initiative: EmpowerInitiativeRecord
  onUnlink: () => void
}) {
  const link = initiative.surveyLink
  if (!link) return null

  const store = getSurveyDataStore()
  const exSurvey = store.ex[link.surveyId]
  const survey360 = store.surveys360[link.surveyId]
  const sourceMissing = link.surveyType === 'ex' ? !exSurvey : !survey360

  const latestCycleLabel =
    link.latest?.sourceSurveyId === 'surv_engagement_2027'
      ? 'Engagement 2027'
      : link.surveyName

  const focusMissingInLatest =
    link.latest === null &&
    link.surveyType === 'ex' &&
    exSurvey &&
    !exSurvey.categories.some((cat) => cat.id === link.focus.id)

  const user = getCurrentUser()
  const canUnlink = user.id === initiative.createdBy || user.id === initiative.ownerId

  const baseline = link.baseline
  const latest = link.latest
  const delta =
    link.surveyType === 'ex' && latest?.favorability !== undefined && baseline.favorability !== undefined
      ? latest.favorability - baseline.favorability
      : link.surveyType === '360' && latest?.gap !== undefined && baseline.gap !== undefined
        ? latest.gap - baseline.gap
        : null

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
        Linked Survey Data
      </WuText>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{link.surveyName}</span>
        <WuChip size="sm" variant="secondary">
          {formatScopeLabel(link.scope)}
        </WuChip>
        <span className="text-gray-600">{link.focus.label}</span>
      </div>

      {sourceMissing && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Source survey no longer available
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-gray-100 bg-gray-50 p-3">
          <WuText size="sm" as="p" className="text-xs font-medium uppercase text-gray-500">
            Baseline
          </WuText>
          {link.surveyType === '360' ? (
            <p className="mt-1 text-sm">
              Self {baseline.selfScore?.toFixed(1) ?? '—'} / Others {baseline.othersAvg?.toFixed(1) ?? '—'} / Gap{' '}
              {baseline.gap?.toFixed(1) ?? '—'} · {baseline.respondentCount} raters
            </p>
          ) : (
            <p className="mt-1 text-sm">
              {baseline.favorability}% · {baseline.respondentCount} respondents ·{' '}
              {new Date(baseline.capturedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="rounded border border-gray-100 bg-gray-50 p-3">
          <WuText size="sm" as="p" className="text-xs font-medium uppercase text-gray-500">
            Latest
          </WuText>
          {focusMissingInLatest ? (
            <p className="mt-1 text-sm text-gray-600">
              This question was not asked in {latestCycleLabel}
            </p>
          ) : latest ? (
            <p className="mt-1 text-sm">
              {link.surveyType === '360'
                ? `Gap ${latest.gap?.toFixed(1) ?? '—'} · ${latest.respondentCount} raters`
                : `${latest.favorability}% · ${latest.respondentCount} respondents · ${new Date(latest.computedAt).toLocaleDateString()}`}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              Next measurement: when the next {link.surveyName} cycle closes
            </p>
          )}
        </div>
      </div>

      {delta !== null && latest && (
        <div className="mt-3">
          <WuChip size="sm" color={delta >= 0 ? 'success' : 'danger'}>
            Delta {delta >= 0 ? '+' : ''}
            {delta}
            {link.surveyType === 'ex' ? '%' : ''}
          </WuChip>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {!sourceMissing && link.surveyType === 'ex' && (
          <Link href="/lifecycle/analytics/list" className="text-sm text-blue-600 hover:underline">
            View in dashboard →
          </Link>
        )}
        {canUnlink && (
          <WuButton variant="secondary" size="sm" onClick={onUnlink}>
            Unlink
          </WuButton>
        )}
      </div>
    </section>
  )
}

export default function InitiativeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const initiative = useMemo(() => {
    void refreshKey
    return getInitiativeById(params.id)
  }, [params.id, refreshKey])

  if (!initiative || !canSeeInitiative(user, initiative)) {
    return (
      <PageShell>
        <PageContent>
          <p className="text-gray-500">Initiative not found</p>
          <Link href="/empower/initiatives" className="mt-2 inline-block text-blue-600 hover:underline">
            Back to initiatives
          </Link>
        </PageContent>
      </PageShell>
    )
  }

  function handleUnlink() {
    const current = getInitiativeById(params.id)
    if (!current) return
    const now = new Date().toISOString()
    upsertInitiative({
      ...current,
      surveyLink: null,
      history: [...current.history, { at: now, event: 'Survey link removed' }],
    })
    showToast({ variant: 'success', message: 'Survey link removed' })
    setConfirmUnlink(false)
    setRefreshKey((key) => key + 1)
  }

  return (
    <PageShell>
      <PageHeader
        title={initiative.title}
        description={`${classBadgeLabel(initiative.class)} · ${getGoalTitle(initiative.goalId)} · Due ${formatDueDate(initiative.dueDate)}`}
        actions={
          <WuChip size="sm" color={initiative.progress === 'stuck' ? 'warning' : 'success'}>
            {progressLabel(initiative.progress)}
          </WuChip>
        }
      />
      <PageContent>
        <Link href="/empower/initiatives" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
          ← Back to initiatives
        </Link>

        <p className="mb-6 text-sm text-gray-700">{initiative.description}</p>

        {initiative.surveyLink && (
          <LinkedSurveyPanel initiative={initiative} onUnlink={() => setConfirmUnlink(true)} />
        )}

        <section className="mt-6">
          <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
            Tasks
          </WuText>
          <ul className="space-y-2">
            {initiative.tasks.length === 0 ? (
              <li className="text-sm text-gray-400">No tasks yet</li>
            ) : (
              initiative.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 rounded border border-gray-100 px-3 py-2 text-sm">
                  <input type="checkbox" checked={task.done} readOnly className="rounded" />
                  <span className={task.done ? 'text-gray-400 line-through' : ''}>{task.text}</span>
                  {task.source === 'ai_recommendation' && (
                    <WuChip size="sm" variant="secondary">
                      AI
                    </WuChip>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </PageContent>

      <ConfirmModal
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title="Unlink survey data?"
        description="Baseline history will remain in the initiative history, but the linked survey panel will be removed."
        confirmLabel="Unlink"
        variant="critical"
        onConfirm={handleUnlink}
      />
    </PageShell>
  )
}
