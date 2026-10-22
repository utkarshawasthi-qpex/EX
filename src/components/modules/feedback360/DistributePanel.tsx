'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { DeploymentDetail } from '@/components/modules/feedback360/DeploymentDetail'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  mockSurvey360Deployments,
  type Survey360Deployment,
  type Survey360DeploymentList,
} from '@/data/mock/survey360Deployments'
import { formatDate } from '@/data/mock-utils'
import type { Survey360 } from '@/data/mock/surveys360'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'

const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
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
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDatePicker })),
  { ssr: false },
)
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export type DistributeSection = 'deployments' | 'send' | 'reportOptions' | 'portal'

type DistributePanelProps = {
  survey: Survey360
  section: DistributeSection
  onSectionChange?: (section: DistributeSection) => void
}

const LIST_TABS: { id: Survey360DeploymentList; label: string }[] = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
]

const SECTION_COPY: Record<Exclude<DistributeSection, 'deployments' | 'send'>, { title: string; description: string }> = {
  reportOptions: {
    title: 'Report Options',
    description: 'Choose when individual 360 reports unlock and who can see them.',
  },
  portal: {
    title: 'Portal',
    description: 'Control how this 360 survey appears in the employee portal.',
  },
}

function formatStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function DistributePanel({ survey, section, onSectionChange }: DistributePanelProps) {
  const { showToast } = useWuShowToast()
  const [list, setList] = useState<Survey360DeploymentList>('ongoing')
  const [deployments, setDeployments] = useState<Survey360Deployment[]>(mockSurvey360Deployments)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openDeploymentId, setOpenDeploymentId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deploymentName, setDeploymentName] = useState('')
  const [deploymentDueDate, setDeploymentDueDate] = useState('')
  const [nameError, setNameError] = useState('')

  const visible = useMemo(
    () => deployments.filter((deployment) => deployment.list === list),
    [deployments, list],
  )
  const openDeployment = deployments.find((deployment) => deployment.id === openDeploymentId) ?? null

  function openDeploymentWorkspace(id: string) {
    setOpenDeploymentId(id)
    onSectionChange?.('send')
  }

  function leaveDeploymentWorkspace() {
    setOpenDeploymentId(null)
    onSectionChange?.('deployments')
  }

  const allSelected = visible.length > 0 && visible.every((row) => selectedIds.has(row.id))
  const someSelected = visible.some((row) => selectedIds.has(row.id))

  function toggleAll(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      visible.forEach((row) => {
        if (checked) next.add(row.id)
        else next.delete(row.id)
      })
      return next
    })
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function openAddModal() {
    setDeploymentName('')
    setDeploymentDueDate('')
    setNameError('')
    setAddOpen(true)
  }

  function addDeployment() {
    const name = deploymentName.trim()
    if (!name) {
      setNameError('Name is required.')
      return
    }

    const created: Survey360Deployment = {
      id: `dep_${Date.now()}`,
      name,
      status: 'Draft',
      responses: 0,
      invited: 0,
      date: formatStamp(new Date()),
      dueDate: deploymentDueDate.trim() || null,
      responseRate: 0,
      list: 'ongoing',
    }
    setDeployments((current) => [created, ...current])
    setList('ongoing')
    setAddOpen(false)
    showToast({ variant: 'success', message: 'Deployment added' })
  }

  const columns = useMemo<IWuTableColumnDef<Survey360Deployment>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => (
          <WuCheckbox checked={allSelected} partial={someSelected && !allSelected} onChange={toggleAll} />
        ),
        size: 48,
        enableSorting: false,
        cell: ({ row }) => (
          <WuCheckbox
            checked={selectedIds.has(row.original.id)}
            onChange={(checked) => toggleRow(row.original.id, checked)}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Deployment Name',
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-blue-700 hover:underline"
            onClick={() => openDeploymentWorkspace(row.original.id)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'responses',
        header: 'Responses',
        cell: ({ row }) => `${row.original.responses}/${row.original.invited}`,
      },
      {
        accessorKey: 'date',
        header: 'Date',
      },
      {
        accessorKey: 'dueDate',
        header: 'Due date',
        cell: ({ row }) =>
          row.original.dueDate ? formatDate(`${row.original.dueDate}T00:00:00`) : '—',
      },
      {
        accessorKey: 'responseRate',
        header: 'Response Rate',
        cell: ({ row }) => (
          <div className="w-36">
            <WuText size="sm" as="p" className="text-right text-gray-600">
              {row.original.responseRate.toFixed(1)}%
            </WuText>
            <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-gray-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${Math.min(100, row.original.responseRate)}%` }}
              />
            </div>
          </div>
        ),
      },
    ],
    [allSelected, onSectionChange, selectedIds, someSelected, showToast],
  )

  if (section === 'send') {
    if (openDeployment) {
      return (
        <div className="h-full min-h-0 overflow-hidden">
          <DeploymentDetail
            deployment={openDeployment}
            onBack={leaveDeploymentWorkspace}
            onUpdate={(next) =>
              setDeployments((current) => current.map((deployment) => (deployment.id === next.id ? next : deployment)))
            }
          />
        </div>
      )
    }

    return (
      <div className="h-full min-h-0 overflow-y-auto bg-white px-6 py-6">
        {deployments.length === 0 ? (
          <EmptyState
            icon="wm-mail"
            title="Send"
            description="Add a deployment first, then open it to invite subjects and evaluators."
            action={
              <WuButton variant="primary" onClick={() => onSectionChange?.('deployments')}>
                Go to Deployments
              </WuButton>
            }
          />
        ) : (
          <div className="mx-auto max-w-lg">
            <WuHeading size="sm" className="text-gray-900">
              Send
            </WuHeading>
            <WuText size="sm" as="p" className="mt-1 text-gray-500">
              Choose a deployment to select participants, compose messages, and send invitations.
            </WuText>
            <ul className="mt-5 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {deployments.map((deployment) => (
                <li key={deployment.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    onClick={() => openDeploymentWorkspace(deployment.id)}
                  >
                    <span>
                      <span className="block text-sm font-medium text-blue-700">{deployment.name}</span>
                      <span className="block text-xs text-gray-500">
                        {deployment.status} · {deployment.responses}/{deployment.invited} responses
                      </span>
                    </span>
                    <span className="text-gray-400" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (section !== 'deployments') {
    const copy = SECTION_COPY[section]
    return (
      <div className="min-h-full bg-white">
        <EmptyState icon="wm-inbox" title={copy.title} description={copy.description} />
      </div>
    )
  }

  const listLabel = list === 'ongoing' ? 'Ongoing' : 'Completed'

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <aside className="w-52 shrink-0 border-r border-gray-200 bg-white py-3">
        {LIST_TABS.map((item) => {
          const isActive = list === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setList(item.id)}
              className={cn(
                'flex w-full items-center border-l-2 px-4 py-2.5 text-left text-sm',
                isActive
                  ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </aside>

      <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WuHeading size="sm">{listLabel} deployments</WuHeading>
            <button
              type="button"
              className="wm-help text-lg leading-none text-blue-600"
              aria-label="About deployments"
              onClick={() =>
                showToast({
                  variant: 'info',
                  message: 'A deployment sends this 360 survey to subjects and their evaluators.',
                })
              }
            />
          </div>
          <WuButton variant="primary" size="sm" onClick={openAddModal}>
            + Add new deployment
          </WuButton>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon="wm-send"
            title={`No ${list} deployments`}
            description="Add a deployment to invite subjects and their evaluators."
            action={
              <WuButton variant="primary" onClick={openAddModal}>
                + Add new deployment
              </WuButton>
            }
          />
        ) : (
          <WuTable
            data={visible as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="default"
            sort={{ enabled: true }}
          />
        )}
      </section>

      <WuModal
        open={addOpen}
        onOpenChange={setAddOpen}
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>Add new deployment</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuFormGroup
              Label="Name"
              Error={nameError || undefined}
              Input={
                <WuInput
                  variant="outlined"
                  value={deploymentName}
                  invalid={Boolean(nameError)}
                  onChange={(event) => {
                    setDeploymentName(event.target.value)
                    if (nameError) setNameError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addDeployment()
                  }}
                />
              }
            />
            <WuFormGroup
              Label="Due date (optional)"
              Input={
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <WuDatePicker
                      value={deploymentDueDate ? new Date(`${deploymentDueDate}T00:00:00`) : undefined}
                      onChange={(date) => setDeploymentDueDate(date ? format(date, 'yyyy-MM-dd') : '')}
                      variant="outlined"
                      placeholder="Select due date"
                    />
                  </div>
                  {deploymentDueDate ? (
                    <WuButton variant="link" onClick={() => setDeploymentDueDate('')}>
                      Clear
                    </WuButton>
                  ) : null}
                </div>
              }
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" onClick={addDeployment}>
            Add
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}
