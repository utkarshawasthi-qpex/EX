'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Fragment, useMemo, useState } from 'react'
import {
  buildHeadcountTree,
  companyOverallTotals,
  fieldsForSet,
  rowsForViewer,
  type CollectorHeadcount,
  type HeadcountChannel,
  type HeadcountNode,
} from '@/data/mock-headcount'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

export type HeadcountSource = {
  id: string
  name: string
  responsesCollected: number
  headcount: CollectorHeadcount
}

type QrResponseRatePanelProps = {
  sources: HeadcountSource[]
  anonymityThreshold: number
  surveyName: string
}

type SortKey = 'label' | 'sent' | 'completed' | 'pending' | 'rate'

type Section = {
  id: string
  heading: string
  column: string
  nodes: HeadcountNode[]
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'rate', label: 'Response rate' },
]

export function QrResponseRatePanel({ sources, anonymityThreshold, surveyName }: QrResponseRatePanelProps) {
  const [companyOverall, setCompanyOverall] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const sections = useMemo(() => buildSections(sources, anonymityThreshold), [anonymityThreshold, sources])
  const tableTotal = sumNodes(sections.flatMap((section) => section.nodes))
  const overall = companyOverallTotals(sources, 'admin')
  const overview = companyOverall ? counts(overall.expected, overall.responses) : tableTotal

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'label' ? 'asc' : 'desc')
  }

  function toggleNode(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="px-4 pb-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">{surveyName}</span>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          Company overall
          <WuToggle checked={companyOverall} onChange={setCompanyOverall} />
        </label>
      </div>

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
              <div className={cn('text-xl font-semibold', overview.over ? 'text-amber-700' : 'text-gray-800')}>{overview.rate}%</div>
              <div className="text-xs text-gray-500">Response rate</div>
            </div>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const nodes = sortNodes(section.nodes, sortKey, sortDirection)
        const sectionTotal = sumNodes(section.nodes)
        const groupsOpen = nodes.some((node) => node.children.length > 0) && nodes.every((node) => node.children.length === 0 || !collapsed.has(node.key))
        return (
          <div key={section.id} className="mt-4">
            {sections.length > 1 ? <p className="mb-3 text-sm text-gray-700">{section.heading}</p> : null}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-600">
                    <th className="px-3 py-2 text-left font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {nodes.some((node) => node.children.length > 0) ? (
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-900"
                            aria-label={groupsOpen ? 'Collapse all' : 'Expand all'}
                            onClick={() => {
                              const keys = nodes.filter((node) => node.children.length > 0).map((node) => node.key)
                              setCollapsed(groupsOpen ? new Set(keys) : new Set())
                            }}
                          >
                            <span className="wm-unfold-more text-base leading-none" aria-hidden />
                          </button>
                        ) : (
                          <span className="wm-unfold-more text-base leading-none text-gray-400" aria-hidden />
                        )}
                        <button type="button" className="inline-flex items-center gap-1 hover:text-gray-900" onClick={() => toggleSort('label')}>
                          {section.column}
                          <span className="text-[10px] text-gray-400" aria-hidden>
                            {sortKey === 'label' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </button>
                      </span>
                    </th>
                    {COLUMNS.map((column) => (
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
                  <NodeRows nodes={nodes} depth={0} collapsed={collapsed} onToggle={toggleNode} />
                  <tr className="bg-gray-100">
                    <td className="px-3 py-2.5 font-medium text-gray-800">Total sum</td>
                    <CountCells counts={sectionTotal} emphasis />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DenominatorEmptyState({ surveyId }: { surveyId: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <p className="text-sm font-medium text-gray-800">Expected responses needed</p>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Enter the total expected responses for a collector form, or upload a segment file. The total is used for the company overall response rate.
      </p>
      <div className="mt-4">
        <WuButton onClick={() => router.push(`/lifecycle/surveys/${surveyId}/edit?tab=distribute&section=headcount`)}>
          Go to deployment settings
        </WuButton>
      </div>
    </div>
  )
}

function buildSections(sources: HeadcountSource[], anonymityThreshold: number): Section[] {
  return sources.flatMap((source) =>
    source.headcount.sets.flatMap((set) => {
      const fields = fieldsForSet(set)
      const rows = rowsForViewer(
        source.headcount.rows.filter((row) => row.setId === set.id),
        'admin',
      )
      if (fields.length === 0 || rows.length === 0) return []
      return [
        {
          id: `${source.id}-${set.id}`,
          heading: source.name,
          column: fields[0]?.title ?? 'Segment',
          nodes: buildHeadcountTree(rows, fields, 'combined' satisfies HeadcountChannel, anonymityThreshold),
        },
      ]
    }),
  )
}

function NodeRows({
  nodes,
  depth,
  collapsed,
  onToggle,
}: {
  nodes: HeadcountNode[]
  depth: number
  collapsed: Set<string>
  onToggle: (key: string) => void
}) {
  return nodes.map((node) => {
    const open = node.children.length > 0 && !collapsed.has(node.key)
    const values = counts(node.expected, node.responses, node.hidden)
    return (
      <Fragment key={node.key}>
        <tr className="border-b border-gray-100">
          <td className="px-3 py-2.5 text-gray-800" style={{ paddingLeft: depth === 0 ? 12 : 40 + (depth - 1) * 16 }}>
            {node.children.length > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 uppercase"
                aria-expanded={open}
                onClick={() => onToggle(node.key)}
              >
                <span className={cn(open ? 'wm-expand-more' : 'wm-chevron-right', 'text-base leading-none text-gray-500')} aria-hidden />
                {node.label}
              </button>
            ) : (
              <span className={depth === 0 ? 'uppercase' : undefined}>{node.label}</span>
            )}
          </td>
          <CountCells counts={values} />
        </tr>
        {open ? <NodeRows nodes={node.children} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} /> : null}
      </Fragment>
    )
  })
}

function CountCells({ counts: values, emphasis }: { counts: DisplayCounts; emphasis?: boolean }) {
  if (values.hidden) {
    return (
      <>
        <td className="px-3 py-2.5 text-right text-gray-400">Hidden</td>
        <td className="px-3 py-2.5 text-right text-gray-400">Hidden</td>
        <td className="px-3 py-2.5 text-right text-gray-400">Hidden</td>
        <td className="px-3 py-2.5 text-gray-400">Hidden</td>
      </>
    )
  }
  return (
    <>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{values.sent}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{values.completed}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{values.pending}</td>
      <td className="px-3 py-2.5">
        <RateBar rate={values.rate} over={values.over} emphasis={emphasis} />
      </td>
    </>
  )
}

function Stat({ value, icon, label }: { value: number; icon: string; label: string }) {
  return (
    <div className="min-w-[72px] text-center">
      <div className="text-2xl font-semibold text-gray-600">{value.toLocaleString()}</div>
      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
        <span className={cn(icon, 'text-sm leading-none')} aria-hidden />
        {label}
      </div>
    </div>
  )
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
        stroke={rate > 100 ? '#D97706' : '#1D4ED8'}
        strokeWidth={10}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function RateBar({ rate, over, emphasis }: { rate: number; over: boolean; emphasis?: boolean }) {
  const bar = (
    <div className="flex min-w-[140px] items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-gray-200">
        <div
          className={cn('h-full', over ? 'bg-amber-500' : emphasis ? 'bg-[#1E3A8A]' : 'bg-[#1D4ED8]')}
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </div>
      <span className={cn('w-10 text-right text-sm', over ? 'font-medium text-amber-700' : 'text-gray-800')}>{rate}%</span>
    </div>
  )
  if (!over) return bar
  return (
    <WuTooltip content="Actual responses exceed the expected count. The denominator may need updating." position="top" showArrow>
      {bar}
    </WuTooltip>
  )
}

type DisplayCounts = {
  sent: number
  completed: number
  pending: number
  rate: number
  hidden: boolean
  over: boolean
}

function counts(sent: number, completed: number, hidden = false): DisplayCounts {
  const pending = Math.max(0, sent - completed)
  const rate = sent <= 0 ? 0 : Math.round((completed / sent) * 100)
  return { sent, completed, pending, rate, hidden, over: !hidden && sent > 0 && completed > sent }
}

function sumNodes(nodes: HeadcountNode[]): DisplayCounts {
  const sent = nodes.reduce((total, node) => total + node.expected, 0)
  const completed = nodes.reduce((total, node) => total + node.responses, 0)
  return counts(sent, completed)
}

function sortNodes(nodes: HeadcountNode[], key: SortKey, direction: 'asc' | 'desc'): HeadcountNode[] {
  const sorted = [...nodes].sort((left, right) => {
    const leftValue = sortValue(left, key)
    const rightValue = sortValue(right, key)
    const result = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue))
    return direction === 'asc' ? result : -result
  })
  return sorted.map((node) => ({ ...node, children: sortNodes(node.children, key, direction) }))
}

function sortValue(node: HeadcountNode, key: SortKey): string | number {
  if (key === 'label') return node.label
  if (key === 'sent') return node.expected
  if (key === 'completed') return node.responses
  if (key === 'pending') return Math.max(0, node.expected - node.responses)
  return node.rate
}
