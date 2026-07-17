'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { SCORECARD_HARD_GATE_MESSAGE, STALE_MESSAGES } from '@/lib/summaryContent'
import { cn } from '@/lib/utils'
import type { RegenerateModalContext } from '@/components/modules/analytics/SummaryRegenerateModal'
import type { SummaryAction, SummaryContent, SummaryPriority } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export const MAX_REGENERATIONS = 3

type SummaryWidgetSectionsProps = {
  content: SummaryContent
  onContentChange: (content: SummaryContent) => void
  onCreateActionPlan: (action: SummaryAction) => void
  canShowFeedback?: boolean
  canSeeActions?: boolean
  canCreateActionPlan?: boolean
  showRestrictedNote?: boolean
  canRegenerate?: boolean
  hardGateActive?: boolean
  hardGateMessage?: string
  isRecipientView?: boolean
  sharedAt?: string | null
  onOpenRegenerateModal: (context: RegenerateModalContext) => void
  onStaleUpdate?: () => void
  onRegenerateAction?: (action: SummaryAction) => void
  regeneratingSummary?: boolean
  regeneratingActionPriority?: SummaryPriority | null
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
  canRegenerate = false,
  hardGateActive = false,
  hardGateMessage = SCORECARD_HARD_GATE_MESSAGE,
  isRecipientView = false,
  sharedAt = null,
  onOpenRegenerateModal,
  onStaleUpdate,
  onRegenerateAction,
  regeneratingSummary = false,
  regeneratingActionPriority = null,
}: SummaryWidgetSectionsProps) {
  const { showToast } = useWuShowToast()
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')
  const feedbackGiven = content.summaryFeedback !== null

  const summaryLimitReached = content.summaryRegenerationsUsed >= MAX_REGENERATIONS

  function persistContent(next: SummaryContent) {
    onContentChange(next)
  }

  function handleFeedbackUp() {
    persistContent({
      ...content,
      summaryFeedback: 'up',
      summaryFeedbackReason: null,
    })
    setShowCommentInput(false)
    showToast({ variant: 'success', message: 'Thanks — feedback recorded' })
  }

  function handleFeedbackDown() {
    persistContent({
      ...content,
      summaryFeedback: 'down',
    })
    setShowCommentInput(true)
  }

  function submitFeedback(skipComment = false) {
    persistContent({
      ...content,
      summaryFeedback: 'down',
      summaryFeedbackReason:
        !skipComment && feedbackComment.trim() ? feedbackComment.trim().slice(0, 200) : null,
    })
    setShowCommentInput(false)
    showToast({ variant: 'success', message: 'Thanks — feedback recorded' })
  }

  function resetFeedback() {
    persistContent({
      ...content,
      summaryFeedback: null,
      summaryFeedbackReason: null,
    })
    setFeedbackComment('')
    setShowCommentInput(false)
  }

  function renderActionRow(action: SummaryAction) {
    const priority = action.priority
    const isRegeneratingRow = regeneratingActionPriority === priority
    const rowLimitReached = action.regenerationsUsed >= MAX_REGENERATIONS
    const showRegenerateButton =
      canRegenerate &&
      !isRecipientView &&
      !content.isStale &&
      !action.linkedInitiativeId

    if (isRegeneratingRow) {
      return (
        <div
          key={action.id}
          className="min-h-[48px] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
        >
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      )
    }

    return (
      <div
        key={action.id}
        className="min-h-[48px] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
      >
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
              <p className="break-words text-xs font-medium leading-snug text-gray-800">
                {action.action}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{action.timeframe}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      action.owner === 'HR'
                        ? 'bg-amber-400'
                        : action.owner === 'Leadership'
                          ? 'bg-purple-400'
                          : 'bg-blue-400',
                    )}
                  />
                  {action.owner}
                </span>
                {action.context && (
                  <>
                    <span>·</span>
                    <span className="italic">{action.context}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-0.5 flex flex-shrink-0 items-center gap-2">
            {showRegenerateButton && (
              <button
                type="button"
                aria-label={`Regenerate recommendation P${priority}`}
                disabled={rowLimitReached}
                title={rowLimitReached ? 'Regeneration limit reached (3/3)' : undefined}
                onClick={() => !rowLimitReached && onRegenerateAction?.(action)}
                className={cn(
                  'rounded px-1 py-0.5 text-xs transition-colors',
                  rowLimitReached
                    ? 'cursor-not-allowed text-gray-300'
                    : 'cursor-pointer text-gray-400 hover:text-blue-600',
                )}
              >
                ↺
              </button>
            )}
            {action.linkedInitiativeId ? (
              <Link
                href={`/empower/initiatives/${action.linkedInitiativeId}`}
                className="whitespace-nowrap text-xs font-medium text-green-700 hover:underline"
              >
                ✓ Action plan created — View in Empower →
              </Link>
            ) : canCreateActionPlan ? (
              <button
                type="button"
                onClick={() => onCreateActionPlan(action)}
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
      {hardGateActive && !isRecipientView && (
        <div className="mb-3 flex flex-shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span>⚠</span>
          <span>{hardGateMessage}</span>
        </div>
      )}

      {!hardGateActive && content.stalenessReason && !isRecipientView && (
        <div className="mb-3 flex flex-shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span>⚠</span>
          <span>{STALE_MESSAGES[content.stalenessReason]}</span>
          {canRegenerate && (
            <button
              type="button"
              disabled={regeneratingSummary || regeneratingActionPriority !== null}
              onClick={() => onStaleUpdate?.()}
              className={cn(
                'ml-auto whitespace-nowrap font-medium text-amber-700 underline',
                (regeneratingSummary || regeneratingActionPriority !== null) &&
                  'cursor-not-allowed opacity-50',
              )}
            >
              Update
            </button>
          )}
        </div>
      )}

      <div className="flex-shrink-0">
        {regeneratingSummary ? (
          <div className="mb-3 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          </div>
        ) : (
          <WuText size="sm" as="p" className="leading-relaxed text-gray-700">
            {content.summary}
          </WuText>
        )}

        {canRegenerate && !isRecipientView && !content.isStale && (
          <button
            type="button"
            onClick={() => !summaryLimitReached && onOpenRegenerateModal('summary')}
            disabled={summaryLimitReached}
            className={cn(
              'mt-2 flex items-center gap-1 text-xs transition-colors',
              summaryLimitReached
                ? 'cursor-not-allowed text-gray-300'
                : 'cursor-pointer text-gray-400 hover:text-blue-600',
            )}
            title={summaryLimitReached ? 'Regeneration limit reached (3/3)' : undefined}
          >
            ↺ Regenerate summary
            {summaryLimitReached && (
              <span className="ml-1 text-gray-300">(3/3 used)</span>
            )}
          </button>
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

          {content.summaryOnlyUpdateNote && (
            <WuText size="sm" as="p" className="mb-2 text-xs text-gray-400">
              All recommendations already have action plans — only the summary was updated.
            </WuText>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {[...content.actions]
              .sort((a, b) => a.priority - b.priority)
              .map((action) => renderActionRow(action))}
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
          {isRecipientView && sharedAt ? (
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
              Shared • Last updated {format(new Date(sharedAt), 'MMM d, yyyy')}
            </span>
          ) : (
            <WuText size="sm" as="span" className="text-gray-400">
              Generated {format(new Date(content.generatedAt), 'MMM d, yyyy')}
            </WuText>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          {canShowFeedback && (
            <>
              {feedbackGiven ? (
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
                    feedback={content.summaryFeedback}
                    onUp={handleFeedbackUp}
                    onDown={handleFeedbackDown}
                  />
                </div>
              )}

              {showCommentInput &&
                content.summaryFeedback === 'down' &&
                !content.summaryFeedbackReason && (
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
