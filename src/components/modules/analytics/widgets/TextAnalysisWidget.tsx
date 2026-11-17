'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  mockTextAnalysisComments,
  mockTextAnalysisData,
  type TextAnalysisComment,
  type TextAnalysisCommentSentiment,
  type TextAnalysisSentimentMix,
  type TextAnalysisTopic,
} from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { preventModalDismiss } from '@/lib/modalProps'
import { respondentCount } from '@/lib/dashboardFilters'
import { cn } from '@/lib/utils'
import type { ActiveFilter, DashboardWidget } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

const UNFILTERED_MENTIONS = mockTextAnalysisData.topics.reduce(
  (sum, topic) => sum + topic.mentions,
  0,
)

const SENTIMENT_BAR: Record<
  TextAnalysisCommentSentiment,
  { barClass: string; chipClass: string; textClass: string; label: string }
> = {
  negative: {
    barClass: 'bg-red-400',
    chipClass: 'bg-red-50 text-red-800',
    textClass: 'text-white',
    label: 'Negative',
  },
  neutral: {
    barClass: 'bg-amber-400',
    chipClass: 'bg-amber-50 text-amber-900',
    textClass: 'text-gray-900',
    label: 'Neutral',
  },
  positive: {
    barClass: 'bg-green-400',
    chipClass: 'bg-green-50 text-green-800',
    textClass: 'text-white',
    label: 'Positive',
  },
}

type SentimentFilterValue = 'all' | TextAnalysisCommentSentiment

type ResponseDialog = {
  title: string
  comments: TextAnalysisComment[]
  showSentimentFilters: boolean
  filter: SentimentFilterValue
}

function scaleCount(count: number, factor: number) {
  return Math.max(0, Math.round(count * factor))
}

function scaleSentiment(sentiment: TextAnalysisSentimentMix, factor: number): TextAnalysisSentimentMix {
  return {
    negative: scaleCount(sentiment.negative, factor),
    neutral: scaleCount(sentiment.neutral, factor),
    positive: scaleCount(sentiment.positive, factor),
  }
}

function scaleTopic(topic: TextAnalysisTopic, factor: number): TextAnalysisTopic {
  const sentiment = scaleSentiment(topic.sentiment, factor)
  return {
    ...topic,
    sentiment,
    mentions: sentiment.negative + sentiment.neutral + sentiment.positive,
    subTopics: topic.subTopics?.map((subTopic) => {
      const subSentiment = scaleSentiment(subTopic.sentiment, factor)
      return {
        ...subTopic,
        sentiment: subSentiment,
        mentions: subSentiment.negative + subSentiment.neutral + subSentiment.positive,
      }
    }),
  }
}

function volumeBarClass(ratio: number) {
  if (ratio >= 0.75) return 'bg-[#0F3A6E]'
  if (ratio >= 0.45) return 'bg-[#185FA5]'
  return 'bg-[#2F9BBF]'
}

function commentsFor(topicId: string, subTopicId?: string) {
  return mockTextAnalysisComments.filter((comment) => {
    if (comment.topicId !== topicId) return false
    if (subTopicId && comment.subTopicId !== subTopicId) return false
    return true
  })
}

function countBySentiment(comments: TextAnalysisComment[]): TextAnalysisSentimentMix {
  return comments.reduce<TextAnalysisSentimentMix>(
    (counts, comment) => {
      counts[comment.sentiment] += 1
      return counts
    },
    { negative: 0, neutral: 0, positive: 0 },
  )
}

function responseLabel(count: number) {
  return `${count} ${count === 1 ? 'response' : 'responses'}`
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight) return <>{text}</>
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5 text-gray-900">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}

function VolumeBar({
  mentions,
  maxMentions,
}: {
  mentions: number
  maxMentions: number
}) {
  const ratio = maxMentions > 0 ? mentions / maxMentions : 0
  const widthPct = Math.max(mentions > 0 ? 10 : 0, Math.round(ratio * 100))
  return (
    <span className="flex min-w-0 flex-1 items-center">
      <span className="relative h-6 min-w-0 flex-1 overflow-hidden rounded bg-gray-100">
        <span
          className={cn(
            'flex h-full min-w-[2rem] items-center justify-end px-2 text-[11px] font-medium text-white',
            volumeBarClass(ratio),
          )}
          style={{ width: `${widthPct}%` }}
        >
          {mentions}
        </span>
      </span>
    </span>
  )
}

function SentimentBar({
  sentiment,
  mentions,
}: {
  sentiment: TextAnalysisSentimentMix
  mentions: number
}) {
  const segments = (['negative', 'neutral', 'positive'] as const)
    .map((key) => ({ key, count: sentiment[key], ...SENTIMENT_BAR[key] }))
    .filter((segment) => segment.count > 0)

  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span className="flex h-6 min-w-0 flex-1 overflow-hidden rounded bg-gray-100">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={cn(
              'flex h-full min-w-0 items-center justify-center px-1 text-[11px] font-medium',
              segment.barClass,
              segment.textClass,
            )}
            style={{ flexGrow: segment.count, flexBasis: 0 }}
          >
            {segment.count}
          </span>
        ))}
      </span>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-gray-600">{mentions}</span>
    </span>
  )
}

function ThemeRow({
  name,
  mentions,
  maxMentions,
  sentiment,
  showSentiment,
  nested,
  expandable,
  expanded,
  onToggle,
  onOpen,
}: {
  name: string
  mentions: number
  maxMentions: number
  sentiment: TextAnalysisSentimentMix
  showSentiment: boolean
  nested?: boolean
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  onOpen: () => void
}) {
  return (
    <div className="flex min-w-0 w-full items-center gap-1 rounded-md py-1 pr-1 hover:bg-slate-50">
      <div className={cn('flex w-[200px] shrink-0 items-center gap-1', nested && 'pl-4')}>
        {expandable && onToggle ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${name}`}
          >
            <span
              className={cn('text-base leading-none', expanded ? 'wm-expand-more' : 'wm-chevron-right')}
              aria-hidden
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={cn(
            'min-w-0 truncate text-left text-sm hover:text-blue-700',
            nested ? 'font-normal text-gray-600' : 'font-medium text-gray-800',
          )}
          title={name}
          onClick={onOpen}
        >
          {name}
        </button>
      </div>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        onClick={onOpen}
        aria-label={`${responseLabel(mentions)} for ${name}`}
      >
        {showSentiment ? (
          <SentimentBar sentiment={sentiment} mentions={mentions} />
        ) : (
          <VolumeBar mentions={mentions} maxMentions={maxMentions} />
        )}
      </button>
    </div>
  )
}

function SummaryStats({ comments, topics }: { comments: number; topics: number }) {
  return (
    <div className="sticky top-0 z-10 mb-3 flex gap-3 bg-white pb-1">
      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-slate-50 px-4 py-2.5">
        <p className="text-2xl font-semibold leading-none tabular-nums text-gray-900">{comments}</p>
        <WuText size="sm" as="p" className="mt-1 text-gray-500">
          Total comments
        </WuText>
      </div>
      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-slate-50 px-4 py-2.5">
        <p className="text-2xl font-semibold leading-none tabular-nums text-gray-900">{topics}</p>
        <WuText size="sm" as="p" className="mt-1 text-gray-500">
          Topics identified
        </WuText>
      </div>
    </div>
  )
}

function SentimentSwitcher({
  value,
  counts,
  onChange,
}: {
  value: SentimentFilterValue
  counts: { all: number } & TextAnalysisSentimentMix
  onChange: (value: SentimentFilterValue) => void
}) {
  const options: Array<{ key: SentimentFilterValue; label: string; count: number }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'negative', label: 'Negative', count: counts.negative },
    { key: 'neutral', label: 'Neutral', count: counts.neutral },
    { key: 'positive', label: 'Positive', count: counts.positive },
  ]

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by sentiment">
      {options.map((option) => {
        const selected = value === option.key
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              selected
                ? option.key === 'negative'
                  ? 'border-red-400 bg-red-50 text-red-800'
                  : option.key === 'neutral'
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : option.key === 'positive'
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {option.key !== 'all' ? (
              <span className={cn('size-1.5 rounded-full', SENTIMENT_BAR[option.key].barClass)} aria-hidden />
            ) : null}
            {option.label}
            <span className="tabular-nums text-gray-500">{option.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function TextAnalysisWidget({
  widget,
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: {
  widget?: DashboardWidget
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  activeFilters?: ActiveFilter[]
}) {
  const showSentiment = (widget?.config?.showSentiment as boolean | undefined) ?? true
  const total = activeFilters.length > 0 ? respondentCount(activeFilters) : null
  const topics = useMemo(() => {
    const factor = total !== null && UNFILTERED_MENTIONS > 0 ? total / UNFILTERED_MENTIONS : 1
    return [...mockTextAnalysisData.topics]
      .map((topic) => (factor === 1 ? topic : scaleTopic(topic, factor)))
      .sort((left, right) => right.mentions - left.mentions)
  }, [total])
  const maxMentions = topics[0]?.mentions ?? 1
  const topicsIdentified = topics.filter((topic) => topic.mentions > 0).length
  const totalComments = useMemo(() => {
    const factor = total !== null && UNFILTERED_MENTIONS > 0 ? total / UNFILTERED_MENTIONS : 1
    return factor === 1
      ? mockTextAnalysisComments.length
      : scaleCount(mockTextAnalysisComments.length, factor)
  }, [total])

  const defaultOpenId = topics.find((topic) => (topic.subTopics?.length ?? 0) > 0)?.id
  const [openIds, setOpenIds] = useState<string[] | null>(null)
  const expandedIds = openIds ?? (defaultOpenId ? [defaultOpenId] : [])
  const [dialog, setDialog] = useState<ResponseDialog | null>(null)

  function toggleTopic(id: string) {
    setOpenIds(
      expandedIds.includes(id) ? expandedIds.filter((item) => item !== id) : [...expandedIds, id],
    )
  }

  function openResponses(title: string, topicId: string, subTopicId?: string) {
    setDialog({
      title,
      comments: commentsFor(topicId, subTopicId),
      showSentimentFilters: showSentiment,
      filter: 'all',
    })
  }

  const visibleComments =
    dialog && dialog.filter !== 'all'
      ? dialog.comments.filter((comment) => comment.sentiment === dialog.filter)
      : (dialog?.comments ?? [])
  const sentimentCounts = dialog ? countBySentiment(dialog.comments) : null

  return (
    <WidgetCardShell title="Text analysis" onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
        <div className="flex min-w-0 flex-col overflow-x-hidden pr-1">
          <SummaryStats comments={totalComments} topics={topicsIdentified} />
          <div className="mb-2 shrink-0">
            <WuText size="sm" as="span" className="text-gray-400">
              Click a bar to read responses
            </WuText>
          </div>
          {topics.map((topic) => {
            const subTopics = topic.subTopics ?? []
            const expandable = subTopics.length > 0
            const expanded = expandable && expandedIds.includes(topic.id)
            return (
              <div key={topic.id} className="border-b border-gray-100 last:border-b-0">
                <ThemeRow
                  name={topic.name}
                  mentions={topic.mentions}
                  maxMentions={maxMentions}
                  sentiment={topic.sentiment}
                  showSentiment={showSentiment}
                  expandable={expandable}
                  expanded={expanded}
                  onToggle={expandable ? () => toggleTopic(topic.id) : undefined}
                  onOpen={() => openResponses(topic.name, topic.id)}
                />
                {expanded
                  ? subTopics.map((subTopic) => (
                      <ThemeRow
                        key={subTopic.id}
                        name={subTopic.name}
                        mentions={subTopic.mentions}
                        maxMentions={maxMentions}
                        sentiment={subTopic.sentiment}
                        showSentiment={showSentiment}
                        nested
                        onOpen={() => openResponses(subTopic.name, topic.id, subTopic.id)}
                      />
                    ))
                  : null}
              </div>
            )
          })}
        </div>
      </FilteredWidgetGuard>

      <WuModal
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>{dialog?.title ?? 'Responses'}</WuModalHeader>
        <WuModalContent>
          {dialog ? (
            <div className="flex max-h-[460px] flex-col gap-3">
              {dialog.showSentimentFilters && sentimentCounts ? (
                <SentimentSwitcher
                  value={dialog.filter}
                  counts={{ all: dialog.comments.length, ...sentimentCounts }}
                  onChange={(filter) => setDialog({ ...dialog, filter })}
                />
              ) : null}
              <WuText size="sm" as="p" className="text-gray-500">
                {responseLabel(visibleComments.length)}
              </WuText>
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {visibleComments.length === 0 ? (
                  <WuText size="sm" as="p" className="py-8 text-center text-gray-500">
                    No responses for this selection.
                  </WuText>
                ) : (
                  visibleComments.map((comment) => (
                    <blockquote
                      key={comment.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                            SENTIMENT_BAR[comment.sentiment].chipClass,
                          )}
                        >
                          <span
                            className={cn('size-1.5 rounded-full', SENTIMENT_BAR[comment.sentiment].barClass)}
                            aria-hidden
                          />
                          {SENTIMENT_BAR[comment.sentiment].label}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">
                        &ldquo;
                        <HighlightedText text={comment.text} highlight={comment.highlight} />
                        &rdquo;
                      </p>
                    </blockquote>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setDialog(null)}>
            Close
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </WidgetCardShell>
  )
}
