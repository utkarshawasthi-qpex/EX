'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { formatScopeLabel } from '@/lib/empowerIntegration/aggregate'
import { formatDueDate, getGoalTitle, progressLabel } from '@/lib/empowerIntegration/helpers'
import { getInitiativeById, getSurveyDataStore, upsertInitiative } from '@/lib/empowerIntegration/storage'
import { canSeeInitiative } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type { InitiativeProgress } from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuChip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })), { ssr: false })
const WuText = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })), { ssr: false })

export default function InitiativeDetailPage() {
  const params = useParams<{ id: string }>()
  const user = getCurrentUser()
  const { showToast } = useWuShowToast()
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const [confirmDone, setConfirmDone] = useState(false)
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
          <Link href="/empower/initiatives" className="mt-2 inline-block text-blue-600 hover:underline">← Back</Link>
        </PageContent>
      </PageShell>
    )
  }

  const link = initiative.surveyLink
  const sourceMissing = link ? !getSurveyDataStore().ex[link.surveyId] : false
  const canUnlink = user.id === initiative.createdBy || user.id === initiative.ownerId
  const canUpdateProgress =
    initiative.status === 'active' &&
    (user.id === initiative.createdBy ||
      user.id === initiative.ownerId ||
      initiative.contributors.includes(user.id))
  const delta =
    link?.latest?.favorability !== undefined && link.baseline.favorability !== undefined
      ? link.latest.favorability - link.baseline.favorability
      : null

  function handleUnlink() {
    const current = getInitiativeById(params.id)
    if (!current) return
    upsertInitiative({
      ...current,
      surveyLink: null,
      history: [...current.history, { at: new Date().toISOString(), event: 'Survey link removed' }],
    })
    showToast({ variant: 'success', message: 'Survey link removed' })
    setConfirmUnlink(false)
    setRefreshKey((k) => k + 1)
  }

  function updateProgress(progress: InitiativeProgress) {
    const current = getInitiativeById(params.id)
    if (!current) return
    const now = new Date().toISOString()
    upsertInitiative({
      ...current,
      progress,
      status: progress === 'done' ? 'completed' : current.status,
      history: [
        ...current.history,
        { at: now, event: `Progress set to ${progressLabel(progress)} from initiative detail` },
      ],
    })
    showToast({ variant: 'success', message: 'Initiative progress updated' })
    setRefreshKey((k) => k + 1)
  }

  return (
    <PageShell>
      <PageHeader title={initiative.title} description={`${getGoalTitle(initiative.goalId)} · Due ${formatDueDate(initiative.dueDate)}`} actions={<WuChip size="sm">{progressLabel(initiative.progress)}</WuChip>} />
      <PageContent>
        <Link href="/empower/initiatives" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">← Back to initiatives</Link>
        <p className="mb-6 text-sm text-gray-700">{initiative.description}</p>

        {link && (
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">Linked Survey Data</WuText>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{link.surveyName}</span>
              <WuChip size="sm" variant="secondary">{formatScopeLabel(link.scope)}</WuChip>
              <span>{link.focus.label}</span>
            </div>
            {sourceMissing && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Source survey no longer available</div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase text-gray-500">Baseline</p>
                <p className="mt-1">{link.baseline.favorability}% · {link.baseline.respondentCount} respondents · {new Date(link.baseline.capturedAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="text-xs font-medium uppercase text-gray-500">Latest</p>
                {link.latest ? (
                  <p className="mt-1">{link.latest.favorability}% · {link.latest.respondentCount} respondents · {new Date(link.latest.computedAt).toLocaleDateString()}</p>
                ) : (
                  <p className="mt-1 text-gray-600">Next measurement: when the next {link.surveyName} cycle closes</p>
                )}
              </div>
            </div>
            {delta !== null && link.latest && (
              <WuChip size="sm" color={delta >= 0 ? 'success' : 'danger'} className="mt-3">
                Delta {delta >= 0 ? '+' : ''}{delta}%
              </WuChip>
            )}
            <div className="mt-4 flex gap-3">
              {!sourceMissing && (
                <Link href="/lifecycle/analytics/list" className="text-sm text-blue-600 hover:underline">View in dashboard →</Link>
              )}
              {canUnlink && <WuButton variant="secondary" size="sm" onClick={() => setConfirmUnlink(true)}>Unlink</WuButton>}
            </div>
          </section>
        )}

        {canUpdateProgress && (
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
              Status
            </WuText>
            <div className="flex flex-wrap gap-2">
              {(['on_track', 'stuck', 'done'] as InitiativeProgress[]).map((progress) => (
                <WuButton
                  key={progress}
                  variant={initiative.progress === progress ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => (progress === 'done' ? setConfirmDone(true) : updateProgress(progress))}
                >
                  {progressLabel(progress)}
                </WuButton>
              ))}
            </div>
          </section>
        )}

        <section>
          <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">Tasks</WuText>
          <ul className="space-y-2">
            {initiative.tasks.length === 0 ? (
              <li className="text-sm text-gray-400">No tasks yet</li>
            ) : (
              initiative.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 rounded border border-gray-100 px-3 py-2 text-sm">
                  <input type="checkbox" checked={task.done} readOnly />
                  <span className={task.done ? 'text-gray-400 line-through' : ''}>{task.text}</span>
                  {task.source === 'ai_recommendation' && <WuChip size="sm" variant="secondary">AI</WuChip>}
                </li>
              ))
            )}
          </ul>
        </section>
      </PageContent>
      <ConfirmModal open={confirmUnlink} onOpenChange={setConfirmUnlink} title="Unlink survey data?" description="The initiative will remain; only the linked survey panel is removed." confirmLabel="Unlink" variant="critical" onConfirm={handleUnlink} />
      <ConfirmModal open={confirmDone} onOpenChange={setConfirmDone} title="Mark initiative as done?" description="This will set the initiative status to completed." confirmLabel="Mark done" onConfirm={() => { updateProgress('done'); setConfirmDone(false) }} />
    </PageShell>
  )
}
