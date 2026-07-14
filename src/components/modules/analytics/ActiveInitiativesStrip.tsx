'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { classBadgeLabel, formatDueDate, progressLabel } from '@/lib/empowerIntegration/helpers'
import { getInitiativeById, upsertInitiative } from '@/lib/empowerIntegration/storage'
import { canSeeInitiative, getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type { EmpowerInitiativeRecord, InitiativeProgress, SurveyLinkScope } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type ActiveInitiativesStripProps = {
  scope: SurveyLinkScope
  canEdit?: boolean
  refreshKey?: number
  onUpdated?: () => void
}

function truncateTitle(title: string, max = 42): string {
  return title.length > max ? `${title.slice(0, max)}…` : title
}

export function ActiveInitiativesStrip({
  scope,
  canEdit = true,
  refreshKey = 0,
  onUpdated,
}: ActiveInitiativesStripProps) {
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()
  const [initiatives, setInitiatives] = useState<EmpowerInitiativeRecord[]>([])
  const [confirmDoneId, setConfirmDoneId] = useState<string | null>(null)

  const load = useCallback(() => {
    const visible = getVisibleInitiatives(user).filter(
      (item) =>
        item.class === 'team' &&
        item.status === 'active' &&
        canSeeInitiative(user, item),
    )

    const scoped = visible.filter((item) => {
      if (!item.surveyLink) return true
      if (scope.kind === 'org') return item.surveyLink.scope.kind === 'org' || true
      if (scope.kind === 'team' && scope.managerId) {
        if (item.surveyLink.scope.kind === 'team') {
          return item.surveyLink.scope.managerId === scope.managerId
        }
        return item.ownerId === scope.managerId
      }
      return true
    })

    setInitiatives(scoped.slice(0, 3))
  }, [user, scope])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  function updateProgress(id: string, progress: InitiativeProgress) {
    const initiative = getInitiativeById(id)
    if (!initiative) return

    const now = new Date().toISOString()
    const updated: EmpowerInitiativeRecord = {
      ...initiative,
      progress,
      status: progress === 'done' ? 'completed' : initiative.status,
      history: [
        ...initiative.history,
        { at: now, event: `Progress updated to ${progressLabel(progress)} from dashboard strip` },
      ],
    }

    upsertInitiative(updated)
    showToast({ variant: 'success', message: 'Initiative progress updated' })
    load()
    onUpdated?.()
  }

  function handleDoneConfirm() {
    if (!confirmDoneId) return
    updateProgress(confirmDoneId, 'done')
    setConfirmDoneId(null)
  }

  if (initiatives.length === 0) {
    return (
      <div className="mx-4 mb-4 rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3">
        <WuText size="sm" as="p" className="text-gray-500">
          No active initiatives yet — create one from a recommendation above.
        </WuText>
      </div>
    )
  }

  return (
    <>
      <div className="mx-4 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <WuText size="sm" as="p" className="font-medium text-gray-700">
            Active Initiatives
          </WuText>
          <Link href="/empower/initiatives" className="text-xs font-medium text-blue-600 hover:underline">
            View all in Empower →
          </Link>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/empower/initiatives/${initiative.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  title={initiative.title}
                >
                  {truncateTitle(initiative.title)}
                </Link>
                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                  {classBadgeLabel(initiative.class)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-medium',
                    initiative.progress === 'on_track' && 'bg-green-50 text-green-700',
                    initiative.progress === 'stuck' && 'bg-amber-50 text-amber-700',
                    initiative.progress === 'done' && 'bg-gray-100 text-gray-600',
                  )}
                >
                  {progressLabel(initiative.progress)}
                </span>
                <span>Due {formatDueDate(initiative.dueDate)}</span>
              </div>
              {canEdit && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(['on_track', 'stuck', 'done'] as InitiativeProgress[]).map((progress) => (
                    <button
                      key={progress}
                      type="button"
                      onClick={() =>
                        progress === 'done'
                          ? setConfirmDoneId(initiative.id)
                          : updateProgress(initiative.id, progress)
                      }
                      className={cn(
                        'rounded border px-2 py-0.5 text-[11px] font-medium transition-colors',
                        initiative.progress === progress
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {progressLabel(progress)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmDoneId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDoneId(null)
        }}
        title="Mark initiative as done?"
        description="This will set the initiative status to completed."
        confirmLabel="Mark done"
        onConfirm={handleDoneConfirm}
      />
    </>
  )
}
