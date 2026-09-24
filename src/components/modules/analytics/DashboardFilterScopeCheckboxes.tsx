'use client'

import dynamic from 'next/dynamic'
import { ExpandableSection } from '@/components/ui/ExpandableSection'
import { DASHBOARD_FILTER_FIELDS } from '@/lib/dashboardFilters'
import { ALL_DASHBOARD_FILTER_IDS } from '@/lib/portalAccess'

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type DashboardFilterScopeCheckboxesProps = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string
  /** When false, omit section title (used inside optional disclosure). */
  showHeading?: boolean
}

function isFullDashboardFilterScope(selectedIds: string[]): boolean {
  return (
    selectedIds.length === ALL_DASHBOARD_FILTER_IDS.length &&
    ALL_DASHBOARD_FILTER_IDS.every((id) => selectedIds.includes(id))
  )
}

export function defaultDashboardFilterScopeIds(): string[] {
  return [...ALL_DASHBOARD_FILTER_IDS]
}

export function filterScopeIdsFromDashboard(
  filterScope: { allowedFilterIds?: string[] } | undefined,
): string[] {
  const ids = filterScope?.allowedFilterIds
  if (!ids || ids.length === 0) return defaultDashboardFilterScopeIds()
  return ids.filter((id) => ALL_DASHBOARD_FILTER_IDS.includes(id))
}

export function DashboardFilterScopeCheckboxes({
  selectedIds,
  onChange,
  error,
  showHeading = true,
}: DashboardFilterScopeCheckboxesProps) {
  function toggle(id: string, checked: boolean) {
    if (checked) {
      onChange([...new Set([...selectedIds, id])])
      return
    }
    onChange(selectedIds.filter((item) => item !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      {showHeading && (
        <>
          <WuText size="sm" as="span" className="text-gray-700">
            Allowed filters
          </WuText>
          <WuText size="sm" as="p" className="text-gray-500">
            Choose which filters viewers can use on this dashboard.
          </WuText>
        </>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {DASHBOARD_FILTER_FIELDS.map((field) => (
          <label
            key={field.id}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <WuCheckbox
              checked={selectedIds.includes(field.id)}
              onChange={(checked) => toggle(field.id, checked)}
            />
            <span>{field.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <WuText size="sm" as="span" className="text-red-600">
          {error}
        </WuText>
      )}
    </div>
  )
}

type DashboardFilterScopeOptionalSectionProps = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

/** Collapsed by default — not part of the primary create-dashboard flow. */
export function DashboardFilterScopeOptionalSection({
  selectedIds,
  onChange,
  error,
  expanded,
  onExpandedChange,
}: DashboardFilterScopeOptionalSectionProps) {
  const custom = !isFullDashboardFilterScope(selectedIds)

  return (
    <ExpandableSection
      title="Allowed filters"
      description={
        expanded
          ? undefined
          : custom
            ? 'Custom selection configured.'
            : 'All filter dimensions are available by default.'
      }
      badge={custom && !expanded ? 'Custom' : undefined}
      expandActionLabel="Configure"
      collapseActionLabel="Hide"
      showLeadingIcon={expanded}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      {expanded ? (
        <WuText size="sm" as="p" className="mb-3 text-gray-500">
          Uncheck any filters to hide them from the filter menu on this dashboard.
        </WuText>
      ) : null}
      <DashboardFilterScopeCheckboxes
        selectedIds={selectedIds}
        onChange={onChange}
        error={error}
        showHeading={false}
      />
    </ExpandableSection>
  )
}

export { isFullDashboardFilterScope }
