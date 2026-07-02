'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { PageCard } from '@/components/shared/PageCard'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { CreateSurveyModal } from '@/components/modules/lifecycle/CreateSurveyModal'
import { getSurveys } from '@/lib/mockDb'
import { isEmployeeContext } from '@/lib/userContext'
import type { LifecycleSurvey, SurveyStatus, SurveyType } from '@/types'

type StatusFilterOption = {
  value: SurveyStatus | 'all'
  label: string
}

type ChipStyle = Partial<{
  variant: 'primary' | 'secondary'
  color: 'success' | 'warning' | 'danger'
}>

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
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
const WuLoader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuLoader })),
  { ssr: false },
)
const WuPagination = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuPagination })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

const PAGE_SIZE = 10

const STATUS_OPTIONS: StatusFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

function TypeChip({ type }: { type: SurveyType }) {
  const chipStyles = {
    onboarding: { variant: 'primary' },
    exit: { variant: 'primary', color: 'danger' },
    pulse: { variant: 'secondary' },
    engagement: { variant: 'primary', color: 'success' },
    lifecycle: { variant: 'primary' },
    '360': { variant: 'secondary' },
  } satisfies Record<SurveyType, ChipStyle>
  const chipProps = chipStyles[type]

  return (
    <WuChip size="sm" shape="rounded" {...chipProps}>
      {type}
    </WuChip>
  )
}

function StatusChip({ status }: { status: SurveyStatus }) {
  const chipStyles = {
    active: { variant: 'primary', color: 'success' },
    draft: { variant: 'secondary' },
    paused: { variant: 'primary', color: 'warning' },
    closed: { variant: 'primary', color: 'success' },
    archived: { variant: 'secondary' },
  } satisfies Record<SurveyStatus, ChipStyle>
  const chipProps = chipStyles[status]

  return (
    <WuChip size="sm" shape="rounded" {...chipProps}>
      {status}
    </WuChip>
  )
}

function ResponseRate({ rate }: { rate?: number }) {
  const value = rate ?? 0

  return (
    <div className="flex min-w-32 items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} />
      </div>
      <WuText size="sm" as="span" className="min-w-10 text-right text-gray-700">
        {value}%
      </WuText>
    </div>
  )
}

function SurveyActions({ survey }: { survey: LifecycleSurvey }) {
  function logAction(action: string) {
    console.log(`${action} survey`, survey.id)
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          aria-label={`Actions for ${survey.title}`}
        >
          ...
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => logAction('Edit')}>Edit</WuMenuItem>
      <WuMenuItem onSelect={() => logAction('Duplicate')}>Duplicate</WuMenuItem>
      <WuMenuItem onSelect={() => logAction('Archive')}>Archive</WuMenuItem>
    </WuMenu>
  )
}

export default function LifecycleSurveysPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(STATUS_OPTIONS[0])
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [surveys, setSurveys] = useState<LifecycleSurvey[]>(() => getSurveys())

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 300)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isEmployeeContext()) {
      router.replace('/lifecycle/analytics')
    }
  }, [router])

  const filteredSurveys = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return surveys.filter((survey) => {
      const matchesSearch =
        normalizedSearch.length === 0 || survey.title.toLowerCase().includes(normalizedSearch)
      const matchesStatus =
        statusFilter.value === 'all' || survey.status === statusFilter.value

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter.value, surveys])

  const pagedSurveys = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredSurveys.slice(start, start + PAGE_SIZE)
  }, [filteredSurveys, page])

  const columns: IWuTableColumnDef<LifecycleSurvey>[] = [
    {
      accessorKey: 'title',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-blue-700 hover:underline"
          onClick={() => router.push(`/lifecycle/surveys/${row.original.id}/edit`)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <TypeChip type={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusChip status={row.original.status} />,
    },
    {
      accessorKey: 'responseCount',
      header: 'Responses',
      cellAlign: 'right',
      headerAlign: 'right',
      cell: ({ row }) => row.original.responseCount.toLocaleString(),
    },
    {
      accessorKey: 'responseRate',
      header: 'Response Rate',
      cell: ({ row }) => <ResponseRate rate={row.original.responseRate} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'id',
      id: 'actions',
      header: 'Actions',
      cellAlign: 'right',
      headerAlign: 'right',
      cell: ({ row }) => <SurveyActions survey={row.original} />,
    },
  ]

  function handleStatusSelect(value: unknown) {
    const selected = value as StatusFilterOption | StatusFilterOption[]
    const nextValue = Array.isArray(selected) ? selected[0] : selected
    setStatusFilter(nextValue ?? STATUS_OPTIONS[0])
    setPage(1)
  }

  function handleCreateSurvey(survey: LifecycleSurvey) {
    setSurveys((currentSurveys) => [survey, ...currentSurveys])
    setPage(1)
    setStatusFilter(STATUS_OPTIONS[0])
    setSearch('')
  }

  return (
    <PageShell>
      <PageHeader
        title="Surveys"
        description="Manage your lifecycle survey instruments"
        actions={
          <WuButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            Create Survey
          </WuButton>
        }
      />

      <PageContent>
        <CreateSurveyModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateSurvey={handleCreateSurvey}
        />

        <PageCard className="flex flex-wrap items-center gap-4">
          <WuInput
            type="search"
            variant="outlined"
            placeholder="Search surveys..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="min-w-80"
          />
          <WuSelect
            data={STATUS_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={statusFilter}
            onSelect={handleStatusSelect}
            variant="outlined"
            className="min-w-40"
          />
        </PageCard>

        <PageCard>
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <WuLoader size="lg" message="Loading surveys..." />
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
              <WuHeading size="md" className="text-gray-900">
                No surveys found
              </WuHeading>
              <WuText size="sm" as="p" className="text-gray-500">
                Try clearing your search or changing the status filter.
              </WuText>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <WuDataTable
                data={pagedSurveys as unknown[]}
                columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                variant="striped"
                size="default"
                tableLayout="auto"
              />
              <WuPagination
                totalRows={filteredSurveys.length}
                initialPage={page}
                initialPageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </PageCard>
      </PageContent>
    </PageShell>
  )
}
