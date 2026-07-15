'use client'

import dynamic from 'next/dynamic'
import { mockTextAnalysisData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { respondentCount } from '@/lib/dashboardFilters'
import type { ActiveFilter } from '@/types'

const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
  { ssr: false },
)

function sentimentChipProps(sentiment: 'positive' | 'neutral' | 'negative') {
  if (sentiment === 'positive') return { variant: 'primary' as const, color: 'success' as const }
  if (sentiment === 'negative') return { variant: 'primary' as const, color: 'danger' as const }
  return { variant: 'secondary' as const }
}

export function TextAnalysisWidget({
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: {
  activeFilters?: ActiveFilter[]
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const baseThemes = [...mockTextAnalysisData.themes].sort((a, b) => b.count - a.count)
  const total = activeFilters.length > 0 ? respondentCount(activeFilters) : null
  const themes =
    total !== null
      ? baseThemes.map((theme) => ({
          ...theme,
          count: Math.max(1, Math.round((theme.count / 38) * total)),
        }))
      : baseThemes

  return (
    <WidgetCardShell title="Text analysis" onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <FilteredWidgetGuard activeFilters={activeFilters}>
      <div className="shrink-0">
        <div className="flex flex-col gap-3">
        {themes.map((theme) => (
          <div
            key={theme.theme}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div>
              <div className="font-medium text-gray-900">{theme.theme}</div>
              <div className="text-sm text-gray-500">{theme.count} responses</div>
            </div>
            <WuChip {...sentimentChipProps(theme.sentiment)}>
              {theme.sentiment}
            </WuChip>
          </div>
        ))}
        </div>
      </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}
