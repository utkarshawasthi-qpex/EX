'use client'

import dynamic from 'next/dynamic'
import { Fragment, useMemo, useState } from 'react'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { FilteredWidgetGuard } from '@/components/modules/analytics/widgets/FilteredWidgetGuard'
import { DenominatorEmptyState, QrResponseRatePanel } from '@/components/modules/analytics/widgets/QrResponseRatePanel'
import { headcountHasDenominator } from '@/data/mock-headcount'
import { getFilteredResponseRate } from '@/lib/dashboardFilters'
import { useSurveyDistribution } from '@/lib/distributionStore'
import { getSurveyById } from '@/lib/mockDb'
import { cn } from '@/lib/utils'
import type { ActiveFilter, DashboardWidget } from '@/types'

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

const SEGMENT_LABELS: Record<string, string> = {
  department: 'Department',
  location: 'Location',
  level: 'Level',
  status: 'Status',
}

const SEGMENT_VALUES: Record<string, string[]> = {
  department: ['Engineering', 'Product', 'Sales', 'HR', 'Marketing', 'Finance', 'Operations'],
  location: ['Mumbai', 'Bangalore', 'Delhi', 'Remote', 'US'],
  level: ['IC', 'Manager', 'Senior Manager', 'Director', 'VP', 'C-Suite'],
  status: ['Active', 'Inactive', 'On leave', 'Terminated'],
}

type RateCounts = {
  label: string
  sent: number
  completed: number
  pending: number
  rate: number
}

type CriteriaSelection = {
  dimension: string
  values: string[]
}

type GroupRow = RateCounts & {
  children: RateCounts[]
}

type SortKey = 'label' | 'sent' | 'completed' | 'pending' | 'rate'

function toRate(sent: number, completed: number): Pick<RateCounts, 'pending' | 'rate'> {
  const safeCompleted = Math.min(sent, Math.max(0, completed))
  const pending = sent - safeCompleted
  const rate = sent === 0 ? 0 : Math.round((safeCompleted / sent) * 100)
  return { pending, rate }
}

function countsForLabel(label: string, index: number): { sent: number; completed: number } {
  const sent = 24 + ((label.length * 11 + index * 17) % 70)
  const completed = Math.min(sent, Math.round(sent * (0.7 + ((label.charCodeAt(0) + index) % 30) / 100)))
  return { sent, completed }
}

function asRateRow(label: string, sent: number, completed: number): RateCounts {
  return { label, sent, completed, ...toRate(sent, completed) }
}

function sumRows(rows: RateCounts[]): RateCounts {
  const sent = rows.reduce((total, row) => total + row.sent, 0)
  const completed = rows.reduce((total, row) => total + row.completed, 0)
  return asRateRow('Total sum', sent, completed)
}

function buildGroups(criteriaLabels: string[], segmentLabels: string[]): GroupRow[] {
  return criteriaLabels.map((criteriaName, criteriaIndex) => {
    const children = segmentLabels.map((segmentName, segmentIndex) => {
      const counts = countsForLabel(`${criteriaName}|${segmentName}`, criteriaIndex * 20 + segmentIndex)
      return asRateRow(segmentName, counts.sent, counts.completed)
    })
    const total = sumRows(children)
    return { ...asRateRow(criteriaName, total.sent, total.completed), children }
  })
}

function scaleGroups(groups: GroupRow[], sent: number, completed: number): GroupRow[] {
  const leaves = groups.flatMap((group) => group.children)
  const scaled = scaleRows(leaves, sent, completed)
  let cursor = 0
  return groups.map((group) => {
    const children = scaled.slice(cursor, cursor + group.children.length)
    cursor += group.children.length
    const total = sumRows(children)
    return { ...asRateRow(group.label, total.sent, total.completed), children }
  })
}

function scaleRows(rows: RateCounts[], sent: number, completed: number): RateCounts[] {
  const baseSent = rows.reduce((total, row) => total + row.sent, 0)
  const baseCompleted = rows.reduce((total, row) => total + row.completed, 0)
  if (baseSent === 0) return rows.map((row) => asRateRow(row.label, 0, 0))

  let sentLeft = sent
  let completedLeft = completed
  return rows.map((row, index) => {
    if (index === rows.length - 1) return asRateRow(row.label, sentLeft, completedLeft)
    const nextSent = Math.round((row.sent / baseSent) * sent)
    const nextCompleted = Math.min(
      nextSent,
      Math.round((row.completed / Math.max(baseCompleted, 1)) * completed),
    )
    sentLeft -= nextSent
    completedLeft -= nextCompleted
    return asRateRow(row.label, nextSent, Math.max(0, nextCompleted))
  })
}

function Donut({ rate }: { rate: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, rate)) / 100) * circumference

  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90" aria-hidden>
      <circle cx={36} cy={36} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={10} />
      <circle
        cx={36}
        cy={36}
        r={radius}
        fill="none"
        stroke="#1D4ED8"
        strokeWidth={10}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function CountCells({ row }: { row: RateCounts }) {
  return (
    <>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{row.sent}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{row.completed}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{row.pending}</td>
      <td className="px-3 py-2.5">
        <RateBar rate={row.rate} />
      </td>
    </>
  )
}

function RateBar({ rate, emphasis }: { rate: number; emphasis?: boolean }) {
  return (
    <div className="flex min-w-[140px] items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-gray-200">
        <div
          className={cn('h-full', emphasis ? 'bg-[#1E3A8A]' : 'bg-[#1D4ED8]')}
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm text-gray-800">{rate}%</span>
    </div>
  )
}

export function ResponseRateWidget({
  widget,
  activeFilters = [],
  onEdit,
  onDuplicate,
  onDelete,
}: {
  widget?: DashboardWidget
  activeFilters?: ActiveFilter[]
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const config = widget?.config ?? {}
  const segment = typeof config.segment === 'string' ? config.segment : ''
  const selectedValues = Array.isArray(config.segmentValues)
    ? config.segmentValues.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : []
  const segmentLabel = SEGMENT_LABELS[segment]
  const catalog = SEGMENT_VALUES[segment] ?? []
  const criteria = (Array.isArray(config.segmentCriteria) ? config.segmentCriteria : []).flatMap(
    (item): CriteriaSelection[] => {
      if (!item || typeof item !== 'object') return []
      const record = item as { dimension?: unknown; values?: unknown }
      const dimension = typeof record.dimension === 'string' ? record.dimension : ''
      if (!SEGMENT_VALUES[dimension] || dimension === segment) return []
      const values = Array.isArray(record.values)
        ? record.values.filter((value): value is string => typeof value === 'string' && value.length > 0)
        : []
      return [{ dimension, values }]
    },
  )
  const primaryCriteria = criteria[0]
  const criteriaLabel = primaryCriteria ? SEGMENT_LABELS[primaryCriteria.dimension] : ''
  const criteriaCatalog = primaryCriteria ? SEGMENT_VALUES[primaryCriteria.dimension] ?? [] : []
  const surveyId = typeof widget?.surveyId === 'string' ? widget.surveyId : ''
  const distribution = useSurveyDistribution(surveyId)
  const surveyRecord = surveyId ? getSurveyById(surveyId) : undefined
  const surveyName = surveyRecord?.title ?? 'Survey'
  const hasCollectorForms = surveyId.length > 0 && distribution.collectorForms.length > 0
  const uploadedForms = distribution.collectorForms.filter((form) => headcountHasDenominator(form.headcount))

  const [companyOverall, setCompanyOverall] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const allRows = useMemo(() => {
    const base = catalog.map((label, index) => {
      const counts = countsForLabel(label, index)
      return asRateRow(label, counts.sent, counts.completed)
    })
    if (activeFilters.length === 0) return base
    const filtered = getFilteredResponseRate(activeFilters)
    return scaleRows(base, filtered.sent, filtered.completed)
  }, [activeFilters, catalog])

  const grouped = useMemo(() => {
    if (!primaryCriteria || criteriaCatalog.length === 0 || catalog.length === 0) return null
    const visibleCriteria = primaryCriteria.values.length > 0 ? primaryCriteria.values : criteriaCatalog
    const visibleSegments = selectedValues.length > 0 ? selectedValues : catalog
    let companyGroups = buildGroups(criteriaCatalog, catalog)
    if (activeFilters.length > 0) {
      const filtered = getFilteredResponseRate(activeFilters)
      companyGroups = scaleGroups(companyGroups, filtered.sent, filtered.completed)
    }
    const visibleGroups = companyGroups
      .filter((group) => visibleCriteria.includes(group.label))
      .map((group) => {
        const children = group.children.filter((child) => visibleSegments.includes(child.label))
        const total = sumRows(children)
        return { ...asRateRow(group.label, total.sent, total.completed), children }
      })
    return { companyGroups, visibleGroups }
  }, [activeFilters, catalog, criteriaCatalog, primaryCriteria, selectedValues])

  const visibleRows = selectedValues.length
    ? allRows.filter((row) => selectedValues.includes(row.label))
    : allRows
  const flatTableTotal = sumRows(visibleRows)
  const flatCompanyTotal = sumRows(allRows)
  const groupedTableTotal = sumRows(grouped?.visibleGroups ?? [])
  const groupedCompanyTotal = sumRows(grouped?.companyGroups ?? [])
  const tableTotal = grouped ? groupedTableTotal : flatTableTotal
  const companyTotal = grouped ? groupedCompanyTotal : flatCompanyTotal
  const filteredOverview = activeFilters.length > 0 ? getFilteredResponseRate(activeFilters) : null
  const overview = segment
    ? companyOverall
      ? companyTotal
      : tableTotal
    : filteredOverview ?? { sent: 500, completed: 434, pending: 66, rate: 87, label: 'Total sum' }

  function compareRows(a: RateCounts, b: RateCounts) {
    const left = a[sortKey]
    const right = b[sortKey]
    const result =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))
    return sortDirection === 'asc' ? result : -result
  }

  const sortedRows = [...visibleRows].sort(compareRows)
  const sortedGroups = [...(grouped?.visibleGroups ?? [])]
    .sort(compareRows)
    .map((group) => ({ ...group, children: [...group.children].sort(compareRows) }))
  const groupsOpen = sortedGroups.length > 0 && sortedGroups.every((group) => !collapsedGroups.has(group.label))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'label' ? 'asc' : 'desc')
  }

  const columns: { key: SortKey; label: string; }[] = [
    { key: 'sent', label: 'Sent' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'rate', label: 'Response rate' },
  ]

  if (hasCollectorForms) {
    return (
      <WidgetCardShell
        title={widget?.title?.trim() || 'Response rate'}
        flushContent
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      >
        <FilteredWidgetGuard activeFilters={activeFilters}>
          {uploadedForms.length > 0 ? (
            <QrResponseRatePanel
              sources={uploadedForms.flatMap((form) =>
                form.headcount
                  ? [{ id: form.id, name: form.name, responsesCollected: form.responsesCollected, headcount: form.headcount }]
                  : [],
              )}
              anonymityThreshold={surveyRecord?.anonymityThreshold ?? 5}
              surveyName={surveyName}
            />
          ) : (
            <DenominatorEmptyState surveyId={surveyId} />
          )}
        </FilteredWidgetGuard>
      </WidgetCardShell>
    )
  }

  return (
    <WidgetCardShell
      title={widget?.title?.trim() || 'Response rate'}
      flushContent
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    >
      <FilteredWidgetGuard activeFilters={activeFilters}>
        <div className="px-4 pb-4">
          {segmentLabel ? (
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="inline-flex rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                {segmentLabel}
              </span>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                Company overall
                <WuToggle checked={companyOverall} onChange={setCompanyOverall} />
              </label>
            </div>
          ) : null}

          <div className="rounded border border-gray-200 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-gray-800">Response rate overview</p>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-1 flex-wrap items-start justify-around gap-6">
                <Stat value={overview.sent} icon="wm-send" label="Sent" />
                <Stat value={overview.completed} icon="wm-check-circle" label="Completed" />
                <Stat value={overview.pending} icon="wm-history" label="Pending" />
              </div>
              <div className="flex items-center gap-3">
                <Donut rate={overview.rate} />
                <div>
                  <div className="text-xl font-semibold text-gray-800">{overview.rate}%</div>
                  <div className="text-xs text-gray-500">Response rate</div>
                </div>
              </div>
            </div>
          </div>

          {segmentLabel ? (
            <>
              <p className="mb-3 mt-4 text-sm text-gray-700">{surveyName}</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-gray-600">
                      <th className="px-3 py-2 text-left font-medium">
                        {grouped ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 hover:text-gray-900"
                            aria-label={groupsOpen ? 'Collapse all' : 'Expand all'}
                            onClick={() =>
                              setCollapsedGroups(
                                groupsOpen ? new Set(sortedGroups.map((group) => group.label)) : new Set(),
                              )
                            }
                          >
                            <span className="wm-unfold-more text-base leading-none text-gray-400" aria-hidden />
                            {criteriaLabel}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="wm-unfold-more text-base leading-none text-gray-400" aria-hidden />
                            {segmentLabel}
                          </span>
                        )}
                      </th>
                      {columns.map((column) => (
                        <th key={column.key} className="px-3 py-2 text-right font-medium">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-gray-900"
                            onClick={() => toggleSort(column.key)}
                          >
                            {column.label}
                            <span className="text-[10px] text-gray-400" aria-hidden>
                              {sortKey === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped
                      ? sortedGroups.map((group) => {
                          const open = !collapsedGroups.has(group.label)
                          return (
                            <Fragment key={group.label}>
                              <tr className="border-b border-gray-100">
                                <td className="px-3 py-2.5 text-gray-800">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 uppercase"
                                    aria-expanded={open}
                                    onClick={() =>
                                      setCollapsedGroups((current) => {
                                        const next = new Set(current)
                                        if (next.has(group.label)) next.delete(group.label)
                                        else next.add(group.label)
                                        return next
                                      })
                                    }
                                  >
                                    <span
                                      className={cn(
                                        open ? 'wm-expand-more' : 'wm-chevron-right',
                                        'text-base leading-none text-gray-500',
                                      )}
                                      aria-hidden
                                    />
                                    {group.label}
                                  </button>
                                </td>
                                <CountCells row={group} />
                              </tr>
                              {open
                                ? group.children.map((child) => (
                                    <tr key={`${group.label}-${child.label}`} className="border-b border-gray-100">
                                      <td className="py-2.5 pl-10 pr-3 text-gray-700">{child.label}</td>
                                      <CountCells row={child} />
                                    </tr>
                                  ))
                                : null}
                            </Fragment>
                          )
                        })
                      : sortedRows.map((row) => (
                          <tr key={row.label} className="border-b border-gray-100">
                            <td className="px-3 py-2.5 uppercase text-gray-800">{row.label}</td>
                            <CountCells row={row} />
                          </tr>
                        ))}
                    <tr className="bg-gray-100">
                      <td className="px-3 py-2.5 font-medium text-gray-800">Total sum</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-800">{tableTotal.sent}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-800">{tableTotal.completed}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-800">{tableTotal.pending}</td>
                      <td className="px-3 py-2.5">
                        <RateBar rate={tableTotal.rate} emphasis />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-700">{surveyName}</p>
          )}
        </div>
      </FilteredWidgetGuard>
    </WidgetCardShell>
  )
}

function Stat({ value, icon, label }: { value: number; icon: string; label: string }) {
  return (
    <div className="min-w-[72px] text-center">
      <div className="text-2xl font-semibold text-gray-600">{value}</div>
      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
        <span className={cn(icon, 'text-sm leading-none')} aria-hidden />
        {label}
      </div>
    </div>
  )
}
