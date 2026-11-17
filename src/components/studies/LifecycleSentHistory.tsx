'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import {
  deploymentChannelLabel,
  deploymentProgress,
  type LifecycleDeployment,
  type LifecycleDeploymentSource,
  type LifecycleMailBatch,
} from '@/data/mock/lifecycleMail'

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuItem })),
  { ssr: false },
)
const WuMenuSeparatorItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuSeparatorItem })),
  { ssr: false },
)

const MODE_FILTERS: { value: 'all' | LifecycleDeploymentSource; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'import', label: 'Import' },
  { value: 'slack', label: 'Slack' },
  { value: 'sms', label: 'SMS' },
]

function parseStamp(stamp: string) {
  const parsed = new Date(stamp.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatHistoryDate(stamp: string) {
  const parsed = parseStamp(stamp)
  return parsed ? format(parsed, 'MMM d, yyyy') : stamp
}

function formatHistoryTime(stamp: string) {
  const parsed = parseStamp(stamp)
  return parsed ? format(parsed, 'h:mm a') : ''
}

function ModeChip({ mode }: { mode: LifecycleDeploymentSource }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        mode === 'email' && 'bg-blue-50 text-blue-700',
        mode === 'import' && 'bg-gray-100 text-gray-700',
        mode === 'slack' && 'bg-violet-50 text-violet-700',
        mode === 'sms' && 'bg-teal-50 text-teal-700',
      )}
    >
      {deploymentChannelLabel(mode)}
    </span>
  )
}

function ProgressBar({ deployment }: { deployment: LifecycleDeployment }) {
  const { invited, completed, remaining, completedPct, remainingPct } = deploymentProgress(deployment)
  if (invited === 0) {
    return <div className="h-5 w-full rounded-full bg-gray-100" />
  }
  return (
    <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100">
      {remainingPct > 0 ? (
        <div className="h-full min-w-0" style={{ width: `${remainingPct}%` }}>
          <WuTooltip content={`${remaining} No response`} position="top" showArrow>
            <button
              type="button"
              className="flex h-full w-full items-center justify-center bg-gray-300 text-[11px] font-medium text-gray-700"
            >
              {remainingPct >= 18 ? `${remainingPct}%` : <span className="sr-only">{remainingPct}%</span>}
            </button>
          </WuTooltip>
        </div>
      ) : null}
      {completedPct > 0 ? (
        <div className="h-full min-w-0" style={{ width: `${completedPct}%` }}>
          <WuTooltip content={`${completed} Completed`} position="top" showArrow>
            <button
              type="button"
              className="flex h-full w-full items-center justify-center bg-emerald-500 text-[11px] font-medium text-white"
            >
              {completedPct >= 18 ? `${completedPct}%` : <span className="sr-only">{completedPct}%</span>}
            </button>
          </WuTooltip>
        </div>
      ) : null}
    </div>
  )
}

function RemindersAction({
  deployment,
  reminders,
  onSend,
  onHistory,
}: {
  deployment: LifecycleDeployment
  reminders: LifecycleMailBatch[]
  onSend: (deployment: LifecycleDeployment) => void
  onHistory: (reminders: LifecycleMailBatch[]) => void
}) {
  const label = (
    <>
      <span className="wm-notifications text-base" aria-hidden />
      Reminders
    </>
  )

  if (reminders.length === 0) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
        onClick={(event) => {
          event.stopPropagation()
          onSend(deployment)
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          onClick={(event) => event.stopPropagation()}
        >
          {label}
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => onHistory(reminders)}>Reminder history</WuMenuItem>
      <WuMenuItem onSelect={() => onSend(deployment)}>Send</WuMenuItem>
    </WuMenu>
  )
}

function RowKebab({
  deployment,
  onDelete,
  onSettings,
  onGenerateLinks,
  onDownloadLinks,
}: {
  deployment: LifecycleDeployment
  onDelete: (deployment: LifecycleDeployment) => void
  onSettings: (deployment: LifecycleDeployment) => void
  onGenerateLinks: (deployment: LifecycleDeployment) => void
  onDownloadLinks: (deployment: LifecycleDeployment) => void
}) {
  const invited = deployment.invitedEmployeeIds.length
  const isImport = deployment.deliveryMode === 'import' || invited === 0
  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="More actions"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="wm-more-vert text-base leading-none" aria-hidden />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => onSettings(deployment)}>Settings</WuMenuItem>
      <WuMenuItem onSelect={() => (isImport ? onGenerateLinks(deployment) : onDownloadLinks(deployment))}>
        {isImport ? 'Generate survey links' : 'Download batch links'}
      </WuMenuItem>
      <WuMenuSeparatorItem />
      <WuMenuItem onSelect={() => onDelete(deployment)}>Delete</WuMenuItem>
    </WuMenu>
  )
}

export function LifecycleSentHistory({
  deployments,
  history,
  onOpenInvitations,
  onOpenDelivered,
  onReminders,
  onDelete,
  onSettings,
  onGenerateLinks,
  onDownloadLinks,
  onReminderHistory,
}: {
  deployments: LifecycleDeployment[]
  history: LifecycleMailBatch[]
  onOpenInvitations: (deployment: LifecycleDeployment) => void
  onOpenDelivered: (deployment: LifecycleDeployment) => void
  onReminders: (deployment: LifecycleDeployment) => void
  onDelete: (deployment: LifecycleDeployment) => void
  onSettings: (deployment: LifecycleDeployment) => void
  onGenerateLinks: (deployment: LifecycleDeployment) => void
  onDownloadLinks: (deployment: LifecycleDeployment) => void
  onReminderHistory: (reminders: LifecycleMailBatch[]) => void
}) {
  const [query, setQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<(typeof MODE_FILTERS)[number]>(MODE_FILTERS[0])

  const filteredDeployments = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...deployments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((deployment) => {
        if (modeFilter.value !== 'all' && deployment.deliveryMode !== modeFilter.value) return false
        if (!needle) return true
        return [
          formatHistoryDate(deployment.date),
          formatHistoryTime(deployment.date),
          deploymentChannelLabel(deployment.deliveryMode),
          deployment.sentTo,
          deployment.status,
          String(deployment.invitedEmployeeIds.length),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
  }, [deployments, modeFilter.value, query])

  function remindersFor(deploymentId: string) {
    return history
      .filter(
        (batch) =>
          batch.tab === 'sent' && batch.kind === 'reminder' && batch.deploymentId === deploymentId,
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  const columns = useMemo<IWuTableColumnDef<LifecycleDeployment>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        size: 160,
        minSize: 140,
        cell: ({ row }) => {
          const time = formatHistoryTime(row.original.date)
          return (
            <div>
              <div className="font-medium text-gray-900">{formatHistoryDate(row.original.date)}</div>
              <div className="text-xs text-gray-500">
                {time ? `${time} · ` : ''}
                {row.original.sentTo}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'id',
        id: 'invitations',
        header: 'Invitations',
        size: 100,
        minSize: 90,
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
            onClick={() => onOpenInvitations(row.original)}
          >
            {row.original.invitedEmployeeIds.length}
          </button>
        ),
      },
      {
        accessorKey: 'deliveryMode',
        header: 'Delivery Mode',
        size: 120,
        minSize: 110,
        cell: ({ row }) => <ModeChip mode={row.original.deliveryMode} />,
      },
      {
        accessorKey: 'completedCount',
        id: 'progress',
        header: 'Deployment Progress',
        size: 170,
        minSize: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0 py-1">
            <ProgressBar deployment={row.original} />
          </div>
        ),
      },
      {
        accessorKey: 'deliveredCount',
        header: 'Delivered',
        size: 90,
        minSize: 80,
        cell: ({ row }) => {
          const { deliveredPct } = deploymentProgress(row.original)
          return (
            <button
              type="button"
              className="font-medium tabular-nums text-blue-600 hover:underline"
              onClick={() => onOpenDelivered(row.original)}
            >
              {deliveredPct}%
            </button>
          )
        },
      },
      {
        accessorKey: 'id',
        id: 'rowActions',
        header: ' ',
        size: 150,
        minSize: 150,
        maxSize: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const invited = row.original.invitedEmployeeIds.length
          const reminders = remindersFor(row.original.id)
          return (
            <div className="flex items-center justify-end gap-1">
              {invited > 0 ? (
                <RemindersAction
                  deployment={row.original}
                  reminders={reminders}
                  onSend={onReminders}
                  onHistory={onReminderHistory}
                />
              ) : null}
              <RowKebab
                deployment={row.original}
                onDelete={onDelete}
                onSettings={onSettings}
                onGenerateLinks={onGenerateLinks}
                onDownloadLinks={onDownloadLinks}
              />
            </div>
          )
        },
      },
    ],
    [
      history,
      onDelete,
      onDownloadLinks,
      onGenerateLinks,
      onOpenDelivered,
      onOpenInvitations,
      onReminderHistory,
      onReminders,
      onSettings,
    ],
  )

  const hasFilter = Boolean(query.trim()) || modeFilter.value !== 'all'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="mb-8 flex items-center gap-4">
        <div className="ml-auto flex items-center gap-3">
          <div className="w-52">
            <WuInput
              variant="outlined"
              placeholder="Search"
              Icon={<span className="wm-search" />}
              iconPosition="left"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="w-44">
            <WuSelect
              data={MODE_FILTERS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={modeFilter}
              onSelect={(next) => {
                const option = (Array.isArray(next) ? next[0] : next) as
                  | (typeof MODE_FILTERS)[number]
                  | null
                if (option) setModeFilter(option)
              }}
              variant="outlined"
            />
          </div>
        </div>
      </div>

      {deployments.length === 0 ? (
        <EmptyState
          icon="wm-mail"
          title="No sent history yet"
          description="Invitations you send will appear here with progress, reminders, and survey links."
        />
      ) : (
        <div className="w-full min-w-0 [&_table]:w-full [&_th:last-child]:w-[150px] [&_th:last-child]:min-w-[150px] [&_td:last-child]:w-[150px] [&_td:last-child]:min-w-[150px]">
          <WuTable
            data={filteredDeployments as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="default"
            tableLayout="fixed"
            sort={{ enabled: true }}
            className="w-full"
            NoDataContent={
              <EmptyState
                icon="wm-search-off"
                title={hasFilter ? 'No deployments match this filter' : 'No sent history yet'}
                description={
                  hasFilter
                    ? 'Try another search or delivery mode.'
                    : 'Invitations you send will appear here with progress, reminders, and survey links.'
                }
              />
            }
          />
        </div>
      )}
    </div>
  )
}
