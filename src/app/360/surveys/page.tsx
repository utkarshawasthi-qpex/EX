'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { Create360SurveyModal } from '@/components/modules/feedback360/Create360SurveyModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import type { Survey360, Survey360Source, Survey360Status } from '@/data/mock/surveys360'
import { createAndSaveSurvey360, getSurveys360 } from '@/lib/surveys360Storage'
import { isEmployeeContext } from '@/lib/userContext'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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

export default function ThreeSixtySurveysPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [surveys, setSurveys] = useState<Survey360[]>([])
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
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

  function openEditor(surveyId: string) {
    router.push(`/360/surveys/${surveyId}/edit`)
  }

  function handleCreate(source: Survey360Source) {
    const created = createAndSaveSurvey360(source)
    setSurveys(getSurveys360())
    setCreateOpen(false)
    showToast({
      variant: 'success',
      message:
        source === 'template'
          ? '360 template survey created'
          : 'Custom survey created',
    })
    openEditor(created.id)
  }

  const columns: IWuTableColumnDef<Survey360>[] = [
    {
      accessorKey: 'title',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium text-blue-700 hover:underline"
          onClick={() => openEditor(row.original.id)}
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
      cell: ({ row }) => row.original.subjectCount,
    },
    {
      accessorKey: 'evaluatorCount',
      header: 'Evaluators',
      cell: ({ row }) => row.original.evaluatorCount,
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
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => openEditor(row.original.id)}
          >
            Setup
          </button>
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => router.push(`/360/surveys/${row.original.id}/edit?tab=distribute`)}
          >
            Distribute
          </button>
        </div>
      ),
    },
  ]

  if (!loaded) {
    return (
      <PageShell>
        <PageHeader title="Surveys" description="360 feedback programs" />
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
        title="Surveys"
        description="Create and manage 360 feedback surveys."
        actions={
          <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
            + Create survey
          </WuButton>
        }
      />
      <PageContent>
        <div className="mb-4 max-w-sm">
          <WuInput
            variant="outlined"
            placeholder="Search surveys..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <WuText size="sm" as="p" className="mb-3 text-gray-500">
              No surveys yet. Create a custom survey or start from a 360 template.
            </WuText>
            <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
              + Create survey
            </WuButton>
          </div>
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

      <Create360SurveyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSelect={handleCreate}
      />
    </PageShell>
  )
}
