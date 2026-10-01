'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { format, parse } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReportPageStack, getReportPagePlan } from '@/components/modules/feedback360/ReportPages'
import { getReport360Subjects, type Report360Template } from '@/data/mock-360-reports'
import { buildSurvey360ExportRows } from '@/data/mock-360-export'
import { mockSurvey360Deployments } from '@/data/mock/survey360Deployments'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

function deploymentLabel(date: string) {
  return format(parse(date, 'yyyy-MM-dd HH:mm:ss', new Date()), 'MMM dd, yyyy')
}

export function ReportPreview({
  survey,
  template,
  onBack,
  onGoToDistribute,
}: {
  survey: Survey360
  template: Report360Template
  onBack: () => void
  onGoToDistribute: () => void
}) {
  const subjects = useMemo(() => getReport360Subjects(survey.id), [survey.id])
  const rows = useMemo(() => buildSurvey360ExportRows(survey.id, []), [survey.id])
  const [deploymentId, setDeploymentId] = useState(mockSurvey360Deployments[0]?.id ?? '')
  const [selectedId, setSelectedId] = useState('')
  const [skippedOpen, setSkippedOpen] = useState(false)
  const [selectorsOpen, setSelectorsOpen] = useState(false)

  const deploymentOptions: SelectOption[] = mockSurvey360Deployments.map((deployment) => ({
    value: deployment.id,
    label: deployment.name,
  }))
  const selectedDeployment =
    mockSurvey360Deployments.find((deployment) => deployment.id === deploymentId) ??
    mockSurvey360Deployments[0]
  const deploymentDate = selectedDeployment ? deploymentLabel(selectedDeployment.date) : undefined

  const available = useMemo(() => {
    if (!selectedDeployment) return subjects
    const ids = new Set(
      rows.filter((row) => row.deploymentId === selectedDeployment.id).map((row) => row.subjectId),
    )
    return subjects.filter((subject) => ids.has(subject.id))
  }, [rows, selectedDeployment, subjects])

  useEffect(() => {
    if (available.length === 0) {
      setSelectedId('')
      return
    }
    if (!available.some((subject) => subject.id === selectedId)) {
      setSelectedId(available[0].id)
    }
  }, [available, selectedId])

  const selected = available.find((subject) => subject.id === selectedId) ?? available[0]
  const subjectOptions: SelectOption[] = available.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }))
  const selectedOption = subjectOptions.find((item) => item.value === selected?.id) ?? null
  const deploymentOption =
    deploymentOptions.find((item) => item.value === selectedDeployment?.id) ?? null

  const plan = selected ? getReportPagePlan(selected, template) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
          <WuButton variant="secondary" size="sm" onClick={onBack}>
            Close
          </WuButton>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full min-w-0 items-center gap-2 text-left text-xs text-gray-600"
          onClick={() => setSelectorsOpen((open) => !open)}
          aria-expanded={selectorsOpen}
        >
          <span className="shrink-0 text-gray-400" aria-hidden>
            {selectorsOpen ? '▾' : '▸'}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {deploymentOption?.label ?? 'Deployment'}
            <span className="text-gray-400"> · </span>
            {selected?.name ?? 'Subject'}
          </span>
        </button>
        {selectorsOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <label className="block min-w-0 text-[11px] text-gray-500">
              Deployment
              <div className="mt-1 min-w-0 [&_button]:w-full [&_button]:min-w-0">
                <WuSelect
                  data={deploymentOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={deploymentOption}
                  onSelect={(option) => {
                    const next = (option as SelectOption | null)?.value
                    if (next) setDeploymentId(next)
                  }}
                  variant="outlined"
                  placeholder="Select a deployment"
                />
              </div>
            </label>
            <label className="block min-w-0 text-[11px] text-gray-500">
              Subject
              <div className="mt-1 min-w-0 [&_button]:w-full [&_button]:min-w-0">
                <WuSelect
                  data={subjectOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedOption}
                  onSelect={(option) => setSelectedId((option as SelectOption | null)?.value ?? selectedId)}
                  variant="outlined"
                  placeholder="Select a subject"
                  disabled={subjectOptions.length === 0}
                />
              </div>
            </label>
          </div>
        ) : null}
        {selected && plan ? (
          <p className="mt-2 text-xs text-gray-500">
            {plan.blocks.length} block{plan.blocks.length === 1 ? '' : 's'}
          </p>
        ) : null}
        {plan && plan.skipped.length > 0 ? (
          <button
            type="button"
            className="mt-2 text-xs text-blue-700 hover:underline"
            onClick={() => setSkippedOpen((open) => !open)}
          >
            {plan.skipped.length} block{plan.skipped.length === 1 ? '' : 's'} skipped{' '}
            {skippedOpen ? '▾' : '▸'}
          </button>
        ) : null}
        {skippedOpen && plan ? (
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            {plan.skipped.map((item) => (
              <li key={item.blockId}>
                <span className="font-medium text-gray-800">{item.title}</span>
                <span className="text-gray-400"> — </span>
                {item.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {subjects.length === 0 ? (
        <div className="px-4 py-8">
          <EmptyState
            icon="wm-groups"
            title="No subjects yet"
            description="Add subjects on Distribute, then return here to preview individual reports."
            action={
              <WuButton variant="secondary" onClick={onGoToDistribute}>
                Go to Distribute
              </WuButton>
            }
          />
        </div>
      ) : !selected ? (
        <p className="p-4 text-sm text-gray-500">No subjects in this deployment.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div style={{ zoom: 0.52 }}>
            <ReportPageStack
              survey={survey}
              subject={selected}
              template={template}
              deploymentDate={deploymentDate}
            />
          </div>
        </div>
      )}
    </div>
  )
}
