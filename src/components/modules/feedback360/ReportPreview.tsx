'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportPageStack, getReportPagePlan } from '@/components/modules/feedback360/ReportPages'
import { getReport360Subjects, type Report360Template } from '@/data/mock-360-reports'
import type { Survey360 } from '@/data/mock/surveys360'
import {
  computeOverallScore,
  resolvePerformanceCategory,
  type Report360Audience,
} from '@/lib/report360Scoring'
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

const AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Admin view' },
  { value: 'manager', label: 'Manager view' },
  { value: 'subject', label: 'Subject view' },
]

export function ReportPreview({
  survey,
  template,
  onBack,
  onGoToDistribute,
  backLabel = 'Back to builder',
}: {
  survey: Survey360
  template: Report360Template
  onBack: () => void
  onGoToDistribute: () => void
  backLabel?: string
}) {
  const { showToast } = useWuShowToast()
  const subjects = useMemo(() => getReport360Subjects(survey.id), [survey.id])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(subjects[0]?.id ?? '')
  const [audience, setAudience] = useState<Report360Audience>('admin')
  const [skippedOpen, setSkippedOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return subjects
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) || subject.role.toLowerCase().includes(query),
    )
  }, [search, subjects])

  const selected = subjects.find((subject) => subject.id === selectedId) ?? filtered[0] ?? subjects[0]

  const subjectOptions: SelectOption[] = subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }))
  const selectedOption = subjectOptions.find((item) => item.value === selected?.id) ?? null
  const audienceOption = AUDIENCE_OPTIONS.find((item) => item.value === audience) ?? AUDIENCE_OPTIONS[0]

  const plan = selected ? getReportPagePlan(selected, template, audience) : null
  const overall = selected ? computeOverallScore(selected, template) : null
  const category = resolvePerformanceCategory(overall, template.masterDesign.performanceCategories)

  function handleDownload() {
    showToast({
      message: selected ? `Preparing PDF for ${selected.name}` : 'Select a subject to download a PDF',
      variant: 'success',
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <button
          type="button"
          className="text-sm text-blue-700 hover:underline"
          onClick={onBack}
        >
          ← {backLabel}
        </button>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="min-w-[160px]">
            <WuSelect
              data={AUDIENCE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={audienceOption}
              onSelect={(option) =>
                setAudience(((option as SelectOption | null)?.value as Report360Audience) ?? audience)
              }
              variant="outlined"
            />
          </div>
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
                onClick={onGoToDistribute}
              >
                Go to Distribute
              </WuButton>
            }
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="w-[220px] shrink-0 border-r border-gray-200 bg-white">
            <div className="p-3">
              <WuInput
                variant="outlined"
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <ul className="max-h-[calc(100vh-160px)] overflow-y-auto px-2 pb-4">
              {filtered.map((subject) => {
                const subjectScore = computeOverallScore(subject, template)
                return (
                  <li key={subject.id}>
                    <button
                      type="button"
                      className={cn(
                        'mb-1 flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm',
                        subject.id === selected?.id
                          ? 'bg-blue-50 font-medium text-blue-800'
                          : 'text-gray-700 hover:bg-gray-50',
                      )}
                      onClick={() => setSelectedId(subject.id)}
                    >
                      <span className="truncate">{subject.name}</span>
                      <span className="shrink-0 tabular-nums text-xs text-gray-500">
                        {subjectScore == null ? '—' : `${subjectScore}%`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 overflow-y-auto bg-gray-200">
            {selected ? (
              <>
                <div className="mx-auto mt-6 w-full max-w-[816px] rounded border border-gray-300 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{selected.name}</span>
                      <span className="text-gray-400"> · </span>
                      <span>
                        Overall {overall == null ? '—' : `${overall}%`}
                        {category ? ` · ${category.label}` : ''}
                      </span>
                      <span className="text-gray-400"> · </span>
                      <span>{plan?.blocks.length ?? 0} blocks rendered</span>
                    </div>
                    {plan && plan.skipped.length > 0 ? (
                      <button
                        type="button"
                        className="text-sm text-blue-700 hover:underline"
                        onClick={() => setSkippedOpen((open) => !open)}
                      >
                        {plan.skipped.length} block{plan.skipped.length === 1 ? '' : 's'} skipped for
                        this subject {skippedOpen ? '▾' : '▸'}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">No blocks skipped</span>
                    )}
                  </div>
                  {skippedOpen && plan ? (
                    <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-600">
                      {plan.skipped.map((item) => (
                        <li key={item.blockId} className="flex flex-wrap gap-2">
                          <span className="font-medium text-gray-800">{item.title}</span>
                          <span className="text-gray-400">—</span>
                          <span>{item.reason}</span>
                        </li>
                      ))}
                      <li className="pt-2 text-xs text-gray-400">
                        Skipped blocks are not printed to PDF, so the report contains no blank pages.
                      </li>
                    </ul>
                  ) : null}
                </div>
                <ReportPageStack
                  survey={survey}
                  subject={selected}
                  template={template}
                  audience={audience}
                />
              </>
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
