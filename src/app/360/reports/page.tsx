'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { countGeneratedReports, getReport360Subjects } from '@/data/mock-360-reports'
import type { Survey360, Survey360Status } from '@/data/mock/surveys360'
import { getSurveys360 } from '@/lib/surveys360Storage'
import { isEmployeeContext } from '@/lib/userContext'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function statusChip(status: Survey360Status) {
  if (status === 'active') return { color: 'success' as const, label: 'Active' }
  if (status === 'closed') return { color: 'danger' as const, label: 'Closed' }
  if (status === 'archived') return { color: 'warning' as const, label: 'Archived' }
  return { color: 'warning' as const, label: 'Draft' }
}

export default function Feedback360ReportsPage() {
  const router = useRouter()
  const [surveys, setSurveys] = useState<Survey360[]>([])
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (isEmployeeContext()) {
      router.replace('/lifecycle/analytics')
      return
    }
    setSurveys(getSurveys360())
    setLoaded(true)
  }, [router])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return surveys
    return surveys.filter(
      (survey) =>
        survey.title.toLowerCase().includes(query) ||
        survey.framework.toLowerCase().includes(query),
    )
  }, [search, surveys])

  function openBuilder(surveyId: string) {
    router.push(`/360/surveys/${surveyId}/edit?tab=analytics&section=individualReports`)
  }

  const columns: IWuTableColumnDef<Survey360>[] = [
    {
      accessorKey: 'title',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium text-blue-700 hover:underline"
          onClick={() => openBuilder(row.original.id)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: 'framework',
      header: 'Framework',
    },
    {
      accessorKey: 'subjectCount',
      header: 'Subjects',
      cell: ({ row }) => getReport360Subjects(row.original.id).length || row.original.subjectCount,
    },
    {
      accessorKey: 'id',
      id: 'reportsGenerated',
      header: 'Reports generated',
      cell: ({ row }) => countGeneratedReports(row.original.id),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const chip = statusChip(row.original.status)
        return (
          <WuChip size="sm" color={chip.color}>
            {chip.label}
          </WuChip>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.original.updatedAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'id',
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => openBuilder(row.original.id)}
        >
          Reports
        </button>
      ),
    },
  ]

  if (!loaded) {
    return (
      <PageShell>
        <PageHeader title="Reports" description="Configure template blocks and preview" />
        <PageContent>
          <WuText size="sm" as="p" className="text-gray-400">
            Loading…
          </WuText>
        </PageContent>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Reports"
        description="Configure individual report templates and preview subject reports."
      />
      <PageContent>
        <div className="mb-4 max-w-sm">
          <WuInput
            variant="outlined"
            placeholder="Search programs..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="wc-analytics"
            title="No 360 programs"
            description="Create a 360 survey first, then configure its individual report template here."
            action={
              <WuButton variant="primary" onClick={() => router.push('/360/surveys')}>
                Go to Surveys
              </WuButton>
            }
          />
        ) : (
          <WuDataTable
            data={filtered as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            size="default"
            variant="striped"
            tableLayout="auto"
          />
        )}
      </PageContent>
    </PageShell>
  )
}
