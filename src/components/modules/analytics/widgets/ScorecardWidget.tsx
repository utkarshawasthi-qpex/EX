'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { InitiativeCategoryChip } from '@/components/modules/analytics/InitiativeCategoryChip'
import { useActiveInitiativesByCategory } from '@/components/modules/analytics/useCategoryInitiatives'
import { mockScorecardData } from '@/data/mock/analyticsData'
import { WidgetKebabMenu } from '@/components/modules/analytics/widgets/WidgetKebabMenu'
import { widgetSurfaceClassName } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { useDashboardWidgetContext } from '@/components/modules/analytics/DashboardWidgetContext'
import { useReportWidgetHeight } from '@/components/modules/analytics/useReportWidgetHeight'
import { cn } from '@/lib/utils'

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function SortIcon() {
  return <span className="ml-1 text-gray-400">⇅</span>
}

function SentimentLegend() {
  return (
    <div className="flex items-center justify-center gap-5 text-xs font-medium uppercase text-gray-500">
      <span className="inline-flex items-center">
        <span className="mr-1 inline-block size-2 rounded-full bg-red-500" />
        Unfavorable
        <SortIcon />
      </span>
      <span className="inline-flex items-center">
        <span className="mr-1 inline-block size-2 rounded-full bg-yellow-500" />
        Neutral
        <SortIcon />
      </span>
      <span className="inline-flex items-center">
        <span className="mr-1 inline-block size-2 rounded-full bg-green-500" />
        Favorable
        <SortIcon />
      </span>
    </div>
  )
}

function SentimentBar({
  unfavorable,
  neutral,
  favorable,
}: {
  unfavorable: number
  neutral: number
  favorable: number
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex h-2 overflow-hidden">
        <div className="bg-red-400" style={{ width: `${unfavorable}%` }} />
        <div className="bg-amber-400" style={{ width: `${neutral}%` }} />
        <div className="bg-green-400" style={{ width: `${favorable}%` }} />
      </div>
      <div className="mt-0.5 flex justify-between">
        <WuText size="sm" as="span" className="text-[11px] text-gray-500">
          {unfavorable}%
        </WuText>
        <WuText size="sm" as="span" className="text-[11px] text-gray-500">
          {neutral}%
        </WuText>
        <WuText size="sm" as="span" className="text-[11px] text-gray-500">
          {favorable}%
        </WuText>
      </div>
    </div>
  )
}

function ComparisonCell({
  isOverall,
  comparison,
  trend,
}: {
  isOverall: boolean
  comparison: number | null
  trend?: 'up' | 'down'
}) {
  if (isOverall || comparison === null) {
    return (
      <WuText size="sm" as="span" className="text-gray-400">
        –
      </WuText>
    )
  }

  return (
    <WuText
      size="sm"
      as="span"
      className={cn(
        'inline-flex items-center gap-0.5',
        trend === 'down' ? 'text-red-500' : 'text-green-500',
      )}
    >
      <span className="text-[10px]" aria-hidden>
        {trend === 'down' ? '▼' : '▲'}
      </span>
      {comparison}
    </WuText>
  )
}

const MARKER_CATEGORY_MAP: Record<string, string> = {
  Technologies: 'cat_growth_dev',
  Solutions: 'cat_communication',
  Transparency: 'cat_communication',
  'Growth & Development': 'cat_growth_dev',
  Wellbeing: 'cat_wellbeing',
}

export function ScorecardWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveyName, markers } = mockScorecardData
  const categoryInitiatives = useActiveInitiativesByCategory([
    'cat_growth_dev',
    'cat_manager_rel',
    'cat_wellbeing',
    'cat_communication',
  ])
  const { capabilities, onExportPpt, reportWidgetHeight } = useDashboardWidgetContext()
  const rootRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useReportWidgetHeight(
    reportWidgetHeight,
    { rootRef, headerRef, contentRef, extraPx: 0 },
    [surveyName, markers],
  )

  return (
    <article ref={rootRef} className={widgetSurfaceClassName}>
      <div ref={headerRef} className="flex shrink-0 items-start justify-between px-4 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {capabilities.canEdit && (
            <div
              className="widget-drag-handle mr-1 mt-0.5 shrink-0 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
              aria-label="Drag widget"
            >
              ⠿
            </div>
          )}
          <div>
            <WuHeading size="md" className="text-gray-900">
              Scorecard
            </WuHeading>
            <WuText size="sm" as="p" className="mt-0.5 text-gray-500">
              {surveyName}
            </WuText>
          </div>
        </div>
        <WidgetKebabMenu
          title="Scorecard"
          canEdit={capabilities.canEdit}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onExportPpt={onExportPpt}
        />
      </div>

      <div ref={contentRef} className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-[200px] py-2 pl-4 pr-3 text-left text-xs font-medium uppercase text-gray-500">
                  Key Metric
                  <SortIcon />
                </th>
                <th className="w-[100px] px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                  Respondents
                  <SortIcon />
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                  <SentimentLegend />
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                  Mean
                  <SortIcon />
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                  Comparison
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody>
              {markers.map((marker) => {
                const isOverall = marker.name === 'Company Overall'
                const categoryId = MARKER_CATEGORY_MAP[marker.name]
                const initiativeIds = categoryId ? categoryInitiatives[categoryId] ?? [] : []
                return (
                  <tr key={marker.name} className="border-b border-gray-100">
                    <td
                      className={cn(
                        'py-3 pl-4 pr-3 text-sm',
                        isOverall ? 'font-normal text-gray-900' : 'text-gray-700',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          {!isOverall && (
                            <span className="text-xs text-gray-400" aria-hidden>
                              &gt;
                            </span>
                          )}
                          {marker.name}
                        </span>
                        {initiativeIds.length > 0 && (
                          <InitiativeCategoryChip count={initiativeIds.length} initiativeIds={initiativeIds} />
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-700">
                      {marker.respondents}
                    </td>
                    <td className="px-3 py-3">
                      <SentimentBar
                        unfavorable={marker.unfavorable}
                        neutral={marker.neutral}
                        favorable={marker.favorable}
                      />
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-700">{marker.mean}</td>
                    <td className="px-3 py-3 text-center">
                      <ComparisonCell
                        isOverall={isOverall}
                        comparison={marker.comparison}
                        trend={marker.trend}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
      </div>
    </article>
  )
}
