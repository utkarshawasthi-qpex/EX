'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  clearSummaryFeedback,
  getSummaryFeedback,
  saveSummaryFeedback,
} from '@/lib/summaryFeedbackStorage'
import {
  getActiveActionVersion,
  getActiveSummaryGeneratedAt,
  getActiveSummaryText,
  getSummaryVersionsNewestFirst,
  getVersionDisplayLabel,
  publishSummaryVersion,
  setActiveSummaryVersionId,
} from '@/lib/summaryContent'
import { cn } from '@/lib/utils'
import type { SummaryAction, SummaryContent, SummaryPriority } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SummaryWidgetSectionsProps = {
  content: SummaryContent
  onContentChange: (content: SummaryContent) => void
  onCreateActionPlan: (action: SummaryAction) => void
  canShowFeedback?: boolean
  canSeeActions?: boolean
  canCreateActionPlan?: boolean
  showRestrictedNote?: boolean
  canManageVersions?: boolean
  canRegenerate?: boolean
  canPublishVersion?: boolean
  publishedVersionMissing?: boolean
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

export function SummaryWidgetSections({
  content,
  onContentChange,
  onCreateActionPlan,
  canShowFeedback = false,
  canSeeActions = true,
  canCreateActionPlan = true,
  showRestrictedNote = false,
  canManageVersions = false,
  canRegenerate = false,
  canPublishVersion = false,
  publishedVersionMissing = false,
  onRegenerateSummary,
  onRegenerateAction,
  regeneratingSummary = false,
  regeneratingActionPriority = null,
  showSummaryRegenerateConfirm = false,
  onToggleSummaryRegenerateConfirm,
}: SummaryWidgetSectionsProps) {
  const { showToast } = useWuShowToast()
  const [confirmActionPriority, setConfirmActionPriority] = useState<SummaryPriority | null>(null)
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const summaryText = getActiveSummaryText(content)
  const summaryGeneratedAt = getActiveSummaryGeneratedAt(content)
  const activeVersionId = content.activeSummaryVersionId
  const versionsNewestFirst = getSummaryVersionsNewestFirst(content)
  const totalVersions = content.summaryVersions.length
  const isPublishedVersion = content.publishedVersionId === activeVersionId

  useEffect(() => {
    if (!canShowFeedback) {
      setFeedbackRating(null)
      setFeedbackComment('')
      setFeedbackSubmitted(false)
      setShowCommentInput(false)
      return
    }

    const existing = getSummaryFeedback(content.id, activeVersionId, content.createdBy)
    if (existing) {
      setFeedbackRating(existing.rating)
      setFeedbackComment(existing.comment ?? '')
      setFeedbackSubmitted(true)
      setShowCommentInput(false)
      return
    }
    setFeedbackRating(null)
    setFeedbackComment('')
    setFeedbackSubmitted(false)
    setShowCommentInput(false)
  }, [canShowFeedback, content.id, content.createdBy, activeVersionId])

  function persistContent(next: SummaryContent) {
    onContentChange(next)
  }

  function handleVersionSelect(versionId: string) {
    persistContent(setActiveSummaryVersionId(content, versionId))
  }

  function handlePublishVersion() {
    const next = publishSummaryVersion(content, activeVersionId)
    persistContent(next)
    showToast({ variant: 'success', message: 'This version is now shared with dashboard viewers' })
  }

  function handleFeedbackUp() {
    setFeedbackRating('up')
    setShowCommentInput(false)
    setFeedbackSubmitted(false)
  }

  function handleFeedbackDown() {
    setFeedbackRating('down')
    setShowCommentInput(true)
    setFeedbackSubmitted(false)
  }

  function submitFeedback(skipComment = false) {
    if (!feedbackRating) return

    saveSummaryFeedback({
      summaryId: content.id,
      versionId: activeVersionId,
      userId: content.createdBy,
      rating: feedbackRating,
      comment:
        feedbackRating === 'down' && !skipComment && feedbackComment.trim()
          ? feedbackComment.trim().slice(0, 200)
          : undefined,
      createdAt: new Date().toISOString(),
    })
    setFeedbackSubmitted(true)
    setShowCommentInput(false)
    showToast({ variant: 'success', message: 'Thanks — feedback recorded' })
  }

  function resetFeedback() {
    clearSummaryFeedback(content.id, activeVersionId, content.createdBy)
    setFeedbackRating(null)
    setFeedbackComment('')
    setFeedbackSubmitted(false)
    setShowCommentInput(false)
  }

  function renderActionRow(priority: SummaryPriority) {
    const displayVersion = getActiveActionVersion(content, priority)

    if (!displayVersion && regeneratingActionPriority !== priority) return null

    if (regeneratingActionPriority === priority) {
      return <ActionRowSkeleton key={`action-skeleton-${priority}`} />
    }

    if (!displayVersion) return null

    return (
      <div
        key={`action-${priority}-${displayVersion.versionId}`}
        className="min-h-[48px] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
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

        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
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
              <p className="text-xs font-medium leading-snug break-words text-gray-800">
                {displayVersion.action}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{displayVersion.timeframe}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      displayVersion.owner === 'HR'
                        ? 'bg-amber-400'
                        : displayVersion.owner === 'Leadership'
                          ? 'bg-purple-400'
                          : 'bg-blue-400',
                    )}
                  />
                  {displayVersion.owner}
                </span>
                {displayVersion.context && (
                  <>
                    <span>·</span>
                    <span className="italic">{displayVersion.context}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-0.5 flex flex-shrink-0 items-center gap-2">
            {canRegenerate && (
              <button
                type="button"
                title="Regenerate this recommendation"
                aria-label={`Regenerate P${priority} recommendation`}
                onClick={() => setConfirmActionPriority(priority)}
                className="text-xs text-gray-300 transition-colors hover:text-blue-600"
              >
                ↺
              </button>
            )}
            {displayVersion.linkedInitiativeId ? (
              <Link
                href={`/empower/initiatives/${displayVersion.linkedInitiativeId}`}
                className="whitespace-nowrap text-xs font-medium text-green-700 hover:underline"
              >
                ✓ Action plan created — View in Empower →
              </Link>
            ) : canCreateActionPlan ? (
              <button
                type="button"
                onClick={() =>
                  onCreateActionPlan({
                    id: `action_${priority}_${displayVersion.versionId}`,
                    action: displayVersion.action,
                    timeframe: displayVersion.timeframe,
                    owner: displayVersion.owner,
                    priority: displayVersion.priority,
                    context: displayVersion.context,
                  })
                }
                className={cn(
                  'whitespace-nowrap text-xs font-medium',
                  priority === 1
                    ? 'rounded bg-blue-600 px-2.5 py-1 text-white transition-colors hover:bg-blue-700'
                    : 'text-blue-600 hover:underline',
                )}
              >
                + Create action plan
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {publishedVersionMissing && canManageVersions && (
        <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The published version is no longer available. Share a version to restore dashboard access.
        </div>
      )}

      <div className="flex-shrink-0">
        {canManageVersions && totalVersions > 1 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label htmlFor={`summary-version-${content.id}`} className="text-xs text-gray-500">
              Version
            </label>
            <select
              id={`summary-version-${content.id}`}
              value={activeVersionId}
              onChange={(event) => handleVersionSelect(event.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            >
              {versionsNewestFirst.map((version, index) => {
                const versionNumber = totalVersions - index
                return (
                  <option key={version.versionId} value={version.versionId}>
                    {getVersionDisplayLabel(version, versionNumber)}
                  </option>
                )
              })}
            </select>
            {canPublishVersion && !isPublishedVersion && (
              <button
                type="button"
                onClick={handlePublishVersion}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Share this version
              </button>
            )}
            {canPublishVersion && isPublishedVersion && (
              <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                Shared
              </span>
            )}
          </div>
        )}

        {regeneratingSummary ? (
          <div className="mb-3 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          </div>
        ) : (
          <WuText size="sm" as="p" className="leading-relaxed text-gray-700">
            {summaryText}
          </WuText>
        )}
      </div>

      {canSeeActions && (
        <>
          <div className="my-2 flex-shrink-0 border-t border-gray-100" />

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
        <WuText size="sm" as="p" className="mt-3 flex-shrink-0 text-center text-gray-400">
          Recommended actions are visible to HR Admins only
        </WuText>
      )}

      <div className="mt-2 flex flex-shrink-0 flex-col gap-2 border-t border-gray-50 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <WuButton
                      variant="secondary"
                      size="sm"
                      onClick={onToggleSummaryRegenerateConfirm}
                    >
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

        <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          {canShowFeedback && (
            <>
              {feedbackSubmitted ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>Thanks — feedback recorded</span>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={resetFeedback}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>Rate this summary</span>
                  <FeedbackButtons
                    feedback={feedbackRating}
                    onUp={handleFeedbackUp}
                    onDown={handleFeedbackDown}
                  />
                </div>
              )}

              {showCommentInput && !feedbackSubmitted && feedbackRating === 'down' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={(event) => setFeedbackComment(event.target.value.slice(0, 200))}
                    placeholder="What could be better?"
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                    maxLength={200}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => submitFeedback(true)}
                    >
                      Skip
                    </button>
                    <WuButton variant="primary" size="sm" onClick={() => submitFeedback(false)}>
                      Submit
                    </WuButton>
                  </div>
                </div>
              )}

              {feedbackRating === 'up' && !feedbackSubmitted && (
                <div className="flex justify-end">
                  <WuButton variant="primary" size="sm" onClick={() => submitFeedback(true)}>
                    Submit
                  </WuButton>
                </div>
              )}
            </>
          )}

          <WuText size="sm" as="p" className="text-[11px] text-gray-400">
            AI-generated — verify before acting
          </WuText>
        </div>
      </div>
    </div>
  )
}
