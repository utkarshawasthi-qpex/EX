'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  getActionVersionIndex,
  getActiveActionVersion,
  getActiveActions,
  getActiveSummaryGeneratedAt,
  getActiveSummaryText,
  getSummaryVersionIndex,
  setActiveActionVersionId,
  setActiveSummaryVersionId,
  updateActionFeedback,
  updateSummaryFeedback,
} from '@/lib/summaryContent'
import { cn } from '@/lib/utils'
import type { ActionVersion, SummaryAction, SummaryContent, SummaryPriority } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

const FEEDBACK_REASONS = [
  "Doesn't reflect our data",
  'Ignores org context',
  'Too generic',
  'Incorrect facts',
] as const

type SummaryWidgetSectionsProps = {
  content: SummaryContent
  onContentChange: (content: SummaryContent) => void
  onCreateActionPlan: (action: SummaryAction) => void
  canSeeActions?: boolean
  canCreateActionPlan?: boolean
  showRestrictedNote?: boolean
  canShowFeedback?: boolean
  canRegenerate?: boolean
  onRegenerateSummary?: () => void
  onRegenerateAction?: (priority: SummaryPriority) => void
  regeneratingSummary?: boolean
  regeneratingActionPriority?: SummaryPriority | null
  showSummaryRegenerateConfirm?: boolean
  onToggleSummaryRegenerateConfirm?: () => void
}

function ActionRowSkeleton() {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

function FeedbackButtons({
  feedback,
  onUp,
  onDown,
}: {
  feedback: 'up' | 'down' | null
  onUp: () => void
  onDown: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Thumbs up"
        onClick={onUp}
        className={cn(
          'rounded px-1.5 py-0.5 text-sm transition-colors hover:bg-gray-100',
          feedback === 'up' ? 'text-blue-600' : 'text-gray-400',
        )}
      >
        👍
      </button>
      <button
        type="button"
        aria-label="Thumbs down"
        onClick={onDown}
        className={cn(
          'rounded px-1.5 py-0.5 text-sm transition-colors hover:bg-gray-100',
          feedback === 'down' ? 'text-red-500' : 'text-gray-400',
        )}
      >
        👎
      </button>
    </div>
  )
}

function VersionNavigator({
  currentIndex,
  total,
  onPrev,
  onNext,
  compact = false,
}: {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
  compact?: boolean
}) {
  if (total <= 1) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-gray-400',
        compact ? '' : 'mt-2',
      )}
    >
      <button
        type="button"
        disabled={currentIndex <= 0}
        onClick={onPrev}
        className="disabled:opacity-30"
        aria-label="Previous version"
      >
        ←
      </button>
      <span>
        {compact ? `v${currentIndex + 1}/${total}` : `Version ${currentIndex + 1} of ${total}`}
      </span>
      <button
        type="button"
        disabled={currentIndex >= total - 1}
        onClick={onNext}
        className="disabled:opacity-30"
        aria-label="Next version"
      >
        →
      </button>
    </div>
  )
}

export function SummaryWidgetSections({
  content,
  onContentChange,
  onCreateActionPlan,
  canSeeActions = true,
  canCreateActionPlan = true,
  showRestrictedNote = false,
  canShowFeedback = false,
  canRegenerate = false,
  onRegenerateSummary,
  onRegenerateAction,
  regeneratingSummary = false,
  regeneratingActionPriority = null,
  showSummaryRegenerateConfirm = false,
  onToggleSummaryRegenerateConfirm,
}: SummaryWidgetSectionsProps) {
  const { showToast } = useWuShowToast()
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set())
  const [otherReason, setOtherReason] = useState('')
  const [confirmActionPriority, setConfirmActionPriority] = useState<SummaryPriority | null>(null)

  const summaryText = getActiveSummaryText(content)
  const summaryGeneratedAt = getActiveSummaryGeneratedAt(content)
  const summaryVersionIndex = getSummaryVersionIndex(content)

  function persistContent(next: SummaryContent) {
    onContentChange(next)
  }

  function handleSummaryFeedbackUp() {
    persistContent(updateSummaryFeedback(content, 'up'))
    setShowReasonPicker(false)
    showToast({ variant: 'success', message: 'Thanks for the feedback' })
  }

  function handleSummaryFeedbackDown() {
    if (content.summaryFeedback === 'down') {
      setShowReasonPicker(true)
      return
    }
    persistContent(updateSummaryFeedback(content, 'down'))
    setShowReasonPicker(true)
  }

  function submitSummaryFeedbackReason() {
    const reasons = [...selectedReasons]
    if (otherReason.trim()) reasons.push(otherReason.trim())
    persistContent(updateSummaryFeedback(content, 'down', reasons.join('; ') || null))
    setShowReasonPicker(false)
    showToast({ variant: 'success', message: 'Thanks — this helps us improve' })
  }

  function resetSummaryFeedback() {
    persistContent(updateSummaryFeedback(content, null))
    setShowReasonPicker(false)
    setSelectedReasons(new Set())
    setOtherReason('')
  }

  function handleActionFeedback(priority: SummaryPriority, value: 'up' | 'down') {
    const current = content.actionFeedback[priority]
    const next = current === value ? null : value
    persistContent(updateActionFeedback(content, priority, next))
    if (next) {
      showToast({ variant: 'success', message: 'Thanks for the feedback' })
    }
  }

  function prevSummaryVersion() {
    const index = getSummaryVersionIndex(content)
    if (index > 0) {
      persistContent(
        setActiveSummaryVersionId(content, content.summaryVersions[index - 1].versionId),
      )
    }
  }

  function nextSummaryVersion() {
    const index = getSummaryVersionIndex(content)
    if (index < content.summaryVersions.length - 1) {
      persistContent(
        setActiveSummaryVersionId(content, content.summaryVersions[index + 1].versionId),
      )
    }
  }

  function prevActionVersion(priority: SummaryPriority) {
    const index = getActionVersionIndex(content, priority)
    if (index > 0) {
      persistContent(
        setActiveActionVersionId(
          content,
          priority,
          content.actionVersions[priority][index - 1].versionId,
        ),
      )
    }
  }

  function nextActionVersion(priority: SummaryPriority) {
    const index = getActionVersionIndex(content, priority)
    const versions = content.actionVersions[priority]
    if (index < versions.length - 1) {
      persistContent(
        setActiveActionVersionId(content, priority, versions[index + 1].versionId),
      )
    }
  }

  function renderActionRow(priority: SummaryPriority) {
    const version = getActiveActionVersion(content, priority)
    if (!version && regeneratingActionPriority !== priority) return null

    if (regeneratingActionPriority === priority) {
      return <ActionRowSkeleton key={`action-skeleton-${priority}`} />
    }

    if (!version) return null

    const actionIndex = getActionVersionIndex(content, priority)
    const actionVersionsCount = content.actionVersions[priority].length

    return (
      <div
        key={`action-${priority}-${version.versionId}`}
        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
      >
        {confirmActionPriority === priority && (
          <div className="mb-2 rounded border border-blue-100 bg-blue-50 p-2 text-xs text-gray-700">
            Regenerate P{priority} recommendation? This won&apos;t affect other recommendations.
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setConfirmActionPriority(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-700"
                onClick={() => {
                  setConfirmActionPriority(null)
                  onRegenerateAction?.(priority)
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {canRegenerate && (
              <button
                type="button"
                title="Regenerate this recommendation"
                aria-label={`Regenerate P${priority} recommendation`}
                onClick={() => setConfirmActionPriority(priority)}
                className="mt-0.5 flex-shrink-0 text-xs text-gray-300 transition-colors hover:text-blue-600"
              >
                ↺
              </button>
            )}
            <span
              className={cn(
                'mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-bold',
                priority === 1
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 text-gray-500',
              )}
            >
              P{priority}
            </span>

            <div className="min-w-0 flex-1">
              <WuText size="sm" as="p" className="font-medium leading-snug text-gray-800">
                {version.action}
              </WuText>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <WuText size="sm" as="span" className="text-gray-400">
                  {version.timeframe}
                </WuText>
                <span className="text-xs text-gray-200">·</span>
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      version.owner === 'HR'
                        ? 'bg-amber-400'
                        : version.owner === 'Leadership'
                          ? 'bg-purple-400'
                          : 'bg-blue-400',
                    )}
                  />
                  <WuText size="sm" as="span" className="text-gray-400">
                    {version.owner}
                  </WuText>
                </span>
                {version.context && (
                  <>
                    <span className="text-xs text-gray-200">·</span>
                    <WuText size="sm" as="span" className="italic text-gray-400">
                      {version.context}
                    </WuText>
                  </>
                )}
                <VersionNavigator
                  compact
                  currentIndex={actionIndex}
                  total={actionVersionsCount}
                  onPrev={() => prevActionVersion(priority)}
                  onNext={() => nextActionVersion(priority)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {canShowFeedback && (
              <FeedbackButtons
                feedback={content.actionFeedback[priority]}
                onUp={() => handleActionFeedback(priority, 'up')}
                onDown={() => handleActionFeedback(priority, 'down')}
              />
            )}
            {canCreateActionPlan && (
              <button
                type="button"
                onClick={() =>
                  onCreateActionPlan({
                    id: `action_${priority}_${version.versionId}`,
                    action: version.action,
                    timeframe: version.timeframe,
                    owner: version.owner,
                    priority: version.priority,
                    context: version.context,
                  })
                }
                className={cn(
                  'text-xs font-medium',
                  priority === 1
                    ? 'rounded bg-blue-600 px-2.5 py-1 text-white transition-colors hover:bg-blue-700'
                    : 'text-blue-600 hover:underline',
                )}
              >
                Create action plan →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-3">
      {regeneratingSummary ? (
        <div className="mb-3 space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <WuText size="sm" as="p" className="mb-3 flex-shrink-0 leading-relaxed text-gray-700">
          {summaryText}
        </WuText>
      )}

      <VersionNavigator
        currentIndex={summaryVersionIndex}
        total={content.summaryVersions.length}
        onPrev={prevSummaryVersion}
        onNext={nextSummaryVersion}
      />

      {canShowFeedback && (
        <div className="mt-2 flex flex-shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Was this summary helpful?</span>
            <FeedbackButtons
              feedback={content.summaryFeedback}
              onUp={handleSummaryFeedbackUp}
              onDown={handleSummaryFeedbackDown}
            />
            {content.summaryFeedback !== null && (
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={resetSummaryFeedback}
              >
                Change feedback
              </button>
            )}
          </div>

          {showReasonPicker && content.summaryFeedback === 'down' && (
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm">
              <p className="mb-2 text-xs font-medium text-gray-700">What could be better?</p>
              <div className="space-y-1.5">
                {FEEDBACK_REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedReasons.has(reason)}
                      onChange={(event) => {
                        setSelectedReasons((current) => {
                          const next = new Set(current)
                          if (event.target.checked) next.add(reason)
                          else next.delete(reason)
                          return next
                        })
                      }}
                    />
                    {reason}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedReasons.has('other')}
                    onChange={(event) => {
                      setSelectedReasons((current) => {
                        const next = new Set(current)
                        if (event.target.checked) next.add('other')
                        else next.delete('other')
                        return next
                      })
                    }}
                  />
                  Other:
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(event) => setOtherReason(event.target.value)}
                    className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs"
                    placeholder="Tell us more"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <WuButton variant="primary" size="sm" onClick={submitSummaryFeedbackReason}>
                  Submit feedback
                </WuButton>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-3 flex-shrink-0 border-t border-gray-100" />

      {canSeeActions && (
        <>
          <div className="mb-2 flex flex-shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 rounded-full bg-green-500" />
              <WuText
                size="sm"
                as="span"
                className="font-semibold uppercase tracking-wide text-gray-400"
              >
                Recommended actions
              </WuText>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                4
              </span>
            </div>
            <WuText size="sm" as="span" className="text-gray-400">
              Sorted by priority
            </WuText>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {([1, 2, 3, 4] as SummaryPriority[]).map((priority) => renderActionRow(priority))}
          </div>
        </>
      )}

      {showRestrictedNote && (
        <WuText size="sm" as="p" className="mt-3 text-center text-gray-400">
          Recommended actions are visible to HR Admins only
        </WuText>
      )}

      <div className="mt-2 flex flex-shrink-0 items-center justify-between border-t border-gray-50 pt-2">
        <WuText size="sm" as="span" className="text-gray-400">
          Generated {format(new Date(summaryGeneratedAt), 'MMM d, yyyy')}
        </WuText>
        {canRegenerate && onRegenerateSummary && (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleSummaryRegenerateConfirm}
              className="text-xs text-gray-400 transition-colors hover:text-blue-600"
            >
              ↺ Regenerate summary
            </button>
            {showSummaryRegenerateConfirm && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <p className="text-sm text-gray-700">
                  This will regenerate the summary paragraph only. Your 4 recommendations will not
                  change.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <WuButton variant="secondary" size="sm" onClick={onToggleSummaryRegenerateConfirm}>
                    Cancel
                  </WuButton>
                  <WuButton variant="primary" size="sm" onClick={onRegenerateSummary}>
                    Regenerate
                  </WuButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
