'use client'

import { cn } from '@/lib/utils'

type ExpandableSectionProps = {
  title: string
  description?: string
  badge?: string
  /** Shown on the right when collapsed (e.g. "Configure"). */
  expandActionLabel?: string
  /** Shown on the right when expanded (e.g. "Hide"). */
  collapseActionLabel?: string
  /** Leading chevron; omit for link-style headers (e.g. Configure only). */
  showLeadingIcon?: boolean
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: React.ReactNode
  className?: string
}

export function ExpandableSection({
  title,
  description,
  badge,
  expandActionLabel,
  collapseActionLabel,
  showLeadingIcon = true,
  expanded,
  onExpandedChange,
  children,
  className,
}: ExpandableSectionProps) {
  const actionLabel = expanded ? collapseActionLabel : expandActionLabel

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-colors',
        expanded ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50/60 hover:border-blue-200 hover:bg-blue-50/40',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'flex w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          expanded ? 'bg-gray-50' : 'bg-transparent',
        )}
        onClick={() => onExpandedChange(!expanded)}
        aria-expanded={expanded}
      >
        {showLeadingIcon ? (
          <span
            className={cn(
              'mt-0.5 shrink-0 text-base leading-none text-blue-600',
              expanded ? 'wm-expand-more' : 'wm-chevron-right',
            )}
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {badge ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {badge}
            </span>
          ) : null}
          {actionLabel ? (
            <span className="text-xs font-medium text-blue-600">{actionLabel}</span>
          ) : null}
        </span>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-200 bg-white px-3 py-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
