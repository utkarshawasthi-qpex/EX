'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportPageStack } from '@/components/modules/feedback360/ReportPages'
import { getReport360Subjects } from '@/data/mock-360-reports'
import type { Survey360 } from '@/data/mock/surveys360'
import { useReport360Template } from '@/lib/report360Store'
import { cn } from '@/lib/utils'

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

type SelectOption = { value: string; label: string }

export function ReportPreview({ survey }: { survey: Survey360 }) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const { template } = useReport360Template(survey.id)
  const subjects = useMemo(() => getReport360Subjects(survey.id), [survey.id])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? '')
  const [commentTab, setCommentTab] = useState<'q1' | 'q2' | 'q3'>('q1')
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return subjects
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) || subject.role.toLowerCase().includes(query),
    )
  }, [search, subjects])

  const selected =
    subjects.find((subject) => subject.id === selectedId) ?? filtered[0] ?? subjects[0]

  const subjectOptions: SelectOption[] = subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }))
  const selectedOption = subjectOptions.find((item) => item.value === selected?.id) ?? null

  function handleDownload() {
    showToast({
      message: selected
        ? `Preparing PDF for ${selected.name}`
        : 'Select a subject to download a PDF',
      variant: 'success',
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <button
          type="button"
          className="text-sm text-blue-700 hover:underline"
          onClick={() => router.push(`/360/reports/${survey.id}`)}
        >
          ← Back to Builder
        </button>
        <div className="min-w-[220px]">
          <WuSelect
            data={subjectOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedOption}
            onSelect={(option) => setSelectedId((option as SelectOption | null)?.value ?? selectedId)}
            variant="outlined"
            placeholder="Select subject"
          />
        </div>
        <div className="flex items-center gap-2">
          <WuButton variant="secondary" onClick={() => setRegenerateOpen(true)}>
            Regenerate Report
          </WuButton>
          <WuButton onClick={handleDownload}>Download PDF</WuButton>
        </div>
      </header>

      {subjects.length === 0 ? (
        <div className="px-6 py-10">
          <EmptyState
            icon="wm-groups"
            title="No subjects yet"
            description="Add subjects on Distribute, then return here to preview individual reports."
            action={
              <WuButton
                variant="secondary"
                onClick={() => router.push(`/360/surveys/${survey.id}/edit?tab=distribute`)}
              >
                Go to Distribute
              </WuButton>
            }
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="w-[200px] shrink-0 border-r border-gray-200 bg-white">
            <div className="p-3">
              <WuInput
                variant="outlined"
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <ul className="max-h-[calc(100vh-160px)] overflow-y-auto px-2 pb-4">
              {filtered.map((subject) => (
                <li key={subject.id}>
                  <button
                    type="button"
                    className={cn(
                      'mb-1 w-full truncate rounded px-2 py-2 text-left text-sm',
                      subject.id === selected?.id
                        ? 'bg-blue-50 font-medium text-blue-800'
                        : 'text-gray-700 hover:bg-gray-50',
                    )}
                    onClick={() => setSelectedId(subject.id)}
                  >
                    {subject.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 overflow-y-auto bg-gray-200">
            {selected ? (
              <ReportPageStack
                survey={survey}
                subject={selected}
                template={template}
                commentTab={commentTab}
                onCommentTabChange={setCommentTab}
              />
            ) : (
              <p className="p-8 text-sm text-gray-500">Select a subject to preview the report.</p>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Regenerate Report?"
        description={
          selected
            ? `Rebuild the individual report for ${selected.name} using the current template.`
            : 'Select a subject first.'
        }
        confirmLabel="Regenerate"
        onConfirm={() => {
          if (!selected) return
          showToast({ message: `Report regenerated for ${selected.name}`, variant: 'success' })
        }}
      />
    </div>
  )
}
