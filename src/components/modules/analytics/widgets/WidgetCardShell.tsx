'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { WidgetKebabMenu } from '@/components/modules/analytics/widgets/WidgetKebabMenu'
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

export const widgetSurfaceClassName =
  'relative flex h-full flex-col overflow-hidden rounded-lg bg-white border border-gray-200'

type WidgetCardShellProps = {
  title: string
  subtitle?: React.ReactNode
  showInfo?: boolean
  headerExtra?: React.ReactNode
  onRefresh?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  flushContent?: boolean
  children: React.ReactNode
}

export function WidgetCardShell({
  title,
  subtitle,
  showInfo = false,
  headerExtra,
  onRefresh,
  onEdit,
  onDuplicate,
  onDelete,
  flushContent = false,
  children,
}: WidgetCardShellProps) {
  const { capabilities, onExportPpt, reportWidgetHeight } = useDashboardWidgetContext()
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useReportWidgetHeight(
    reportWidgetHeight,
    {
      headerRef,
      contentRef,
      extraPx: flushContent ? 0 : 16,
    },
    [title, subtitle, children, flushContent],
  )

  return (
    <article className={widgetSurfaceClassName}>
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
          <div className="min-w-0 flex-1">
            <WuHeading size="md" className="text-gray-900">
              {title}
            </WuHeading>
            {subtitle && (
              <WuText size="sm" as="p" className="mt-0.5 text-gray-500">
                {subtitle}
              </WuText>
            )}
            {showInfo && (
              <span className="sr-only" aria-label="More information">
                More information available
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          {onRefresh && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={onRefresh}
              aria-label="Refresh widget"
            >
              ↻
            </button>
          )}
          <WidgetKebabMenu
            title={title}
            canEdit={capabilities.canEdit}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onExportPpt={onExportPpt}
          />
        </div>
      </div>
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', !flushContent && 'px-4 pb-4')}>
        <div ref={contentRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </article>
  )
}
