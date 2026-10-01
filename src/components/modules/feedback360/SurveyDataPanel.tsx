'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { format, parse } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getVisibleCustomFields } from '@/data/mock-custom-fields'
import {
  buildSurvey360ExportRows,
  filterSurvey360ExportRows,
  type Survey360ExportRow,
} from '@/data/mock-360-export'
import { mockSurvey360Deployments, type Survey360Deployment } from '@/data/mock/survey360Deployments'
import type { Survey360 } from '@/data/mock/surveys360'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

function selectedOptions(value: unknown): SelectOption[] {
  if (Array.isArray(value)) return value as SelectOption[]
  if (value) return [value as SelectOption]
  return []
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const body = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function deploymentDate(value: string) {
  const parsed = parse(value, 'yyyy-MM-dd HH:mm:ss', new Date())
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d, yyyy')
}

export function SurveyDataPanel({ survey }: { survey: Survey360 }) {
  const { showToast } = useWuShowToast()
  const { customFields } = useRosterStore()
  const fields = useMemo(() => getVisibleCustomFields(customFields), [customFields])
  const deployments = mockSurvey360Deployments
  const rows = useMemo(() => buildSurvey360ExportRows(survey.id, fields, deployments), [survey.id, fields])

  const [deploymentIds, setDeploymentIds] = useState<string[]>([])
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string[]>>({})
  const [subjectId, setSubjectId] = useState('')

  const fieldOptions: SelectOption[] = fields.map((field) => ({ value: field.key, label: field.title }))
  const selectedFields = fieldOptions.filter((option) => selectedFieldKeys.includes(option.value))

  const subjectOptions = useMemo<SelectOption[]>(() => {
    const seen = new Set<string>()
    const options: SelectOption[] = []
    rows.forEach((row) => {
      if (!deploymentIds.includes(row.deploymentId) || seen.has(row.subjectId)) return
      seen.add(row.subjectId)
      options.push({ value: row.subjectId, label: row.subjectName })
    })
    return options.sort((a, b) => a.label.localeCompare(b.label))
  }, [rows, deploymentIds])
  const selectedSubject = subjectOptions.find((option) => option.value === subjectId) ?? null

  const activeFieldValues = useMemo(() => {
    const next: Record<string, string[]> = {}
    selectedFieldKeys.forEach((key) => {
      next[key] = fieldValues[key] ?? []
    })
    return next
  }, [selectedFieldKeys, fieldValues])

  const matches = useMemo(
    () =>
      filterSurvey360ExportRows(rows, {
        deploymentIds,
        subjectId,
        fieldValues: activeFieldValues,
      }),
    [rows, deploymentIds, subjectId, activeFieldValues],
  )

  const subjectCount = useMemo(() => new Set(matches.map((row) => row.subjectId)).size, [matches])

  function updateFields(nextKeys: string[]) {
    setSelectedFieldKeys(nextKeys)
    setFieldValues((current) => {
      const next: Record<string, string[]> = {}
      nextKeys.forEach((key) => {
        next[key] = current[key] ?? []
      })
      return next
    })
  }

  function updateDeployments(nextIds: string[]) {
    setDeploymentIds(nextIds)
    setSubjectId((current) => {
      if (!current) return ''
      const stillThere = rows.some((row) => row.subjectId === current && nextIds.includes(row.deploymentId))
      return stillThere ? current : ''
    })
  }

  function toggleDeployment(id: string) {
    updateDeployments(
      deploymentIds.includes(id) ? deploymentIds.filter((item) => item !== id) : [...deploymentIds, id],
    )
  }

  function exportData() {
    const headers = [
      'Deployment',
      'Subject',
      'Role',
      'Responses',
      ...fields.map((field) => field.title),
    ]
    const body = matches.map((row) => [
      row.deploymentName,
      row.subjectName,
      row.role,
      row.responses,
      ...fields.map((field) => row.customFields[field.key] ?? ''),
    ])
    const filename = `${survey.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'survey'}-data.csv`
    downloadCsv(filename, headers, body)
    showToast({
      variant: 'success',
      message: `Exported ${matches.length} row${matches.length === 1 ? '' : 's'}`,
    })
  }

  const preview = matches.slice(0, 8)

  return (
    <div>
      <PageHeader
        title="Data"
        description="Export responses for one or more deployments. Narrow the file by custom field or a single subject."
        action={
          <WuButton variant="primary" disabled={deploymentIds.length === 0 || matches.length === 0} onClick={exportData}>
            Export
          </WuButton>
        }
      />

      <div className="space-y-6 px-6 pb-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Deployments" value={`${deploymentIds.length} of ${deployments.length}`} />
          <Stat label="Rows" value={deploymentIds.length === 0 ? '—' : String(matches.length)} />
          <Stat label="Subjects" value={deploymentIds.length === 0 ? '—' : String(subjectCount)} />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)]">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Deployments</h2>
            <p className="mt-1 text-sm text-gray-500">Select one deployment or several. The export includes every selected one.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {deployments.map((deployment) => (
                <DeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  selected={deploymentIds.includes(deployment.id)}
                  onToggle={() => toggleDeployment(deployment.id)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Narrow the export</h2>
            <p className="mt-1 text-sm text-gray-500">Optional. Leave these open to include everyone in the selected deployments.</p>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-gray-700">Subject</span>
                <WuSelect
                  data={subjectOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedSubject}
                  placeholder={deploymentIds.length === 0 ? 'Select deployments first' : 'All subjects'}
                  disabled={deploymentIds.length === 0}
                  onSelect={(option) => setSubjectId((option as SelectOption | null)?.value ?? '')}
                  variant="outlined"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-gray-700">Custom fields</span>
                <WuSelect
                  data={fieldOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedFields}
                  multiple
                  placeholder="Optional"
                  onSelect={(value: unknown) => updateFields(selectedOptions(value).map((option) => option.value))}
                  variant="outlined"
                />
              </label>

              {selectedFieldKeys.map((key) => {
                const field = fields.find((item) => item.key === key)
                if (!field) return null
                const valueOptions = field.options.map((option) => ({ value: option, label: option }))
                const selectedValues = valueOptions.filter((option) => (fieldValues[key] ?? []).includes(option.value))
                return (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-sm text-gray-700">{field.title}</span>
                    <WuSelect
                      data={valueOptions}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedValues}
                      multiple
                      placeholder={`All ${field.title.toLowerCase()} values`}
                      onSelect={(value: unknown) =>
                        setFieldValues((current) => ({
                          ...current,
                          [key]: selectedOptions(value).map((option) => option.value),
                        }))
                      }
                      variant="outlined"
                    />
                  </label>
                )
              })}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
            <p className="text-sm text-gray-500">
              {deploymentIds.length === 0
                ? 'Nothing selected yet'
                : `${matches.length} row${matches.length === 1 ? '' : 's'} in this export`}
            </p>
          </div>
          {deploymentIds.length === 0 ? (
            <EmptyState
              icon="wm-groups"
              title="Select a deployment"
              description="Choose one or more deployments to preview the rows that will be in the file."
            />
          ) : matches.length === 0 ? (
            <EmptyState
              icon="wm-search-off"
              title="No rows match"
              description="Widen the subject or custom field filters to include more of the selected deployments."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 font-semibold">Deployment</th>
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    {selectedFieldKeys.map((key) => (
                      <th key={key} className="px-4 py-3 font-semibold">
                        {fields.find((field) => field.key === key)?.title ?? key}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right font-semibold">Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <ExportPreviewRow
                      key={`${row.deploymentId}-${row.subjectId}`}
                      row={row}
                      fieldKeys={selectedFieldKeys}
                      striped={index % 2 === 1}
                    />
                  ))}
                </tbody>
              </table>
              {matches.length > preview.length ? (
                <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                  Showing {preview.length} of {matches.length}. Export includes every matching row.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{value}</p>
    </div>
  )
}

function DeploymentCard({
  deployment,
  selected,
  onToggle,
}: {
  deployment: Survey360Deployment
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'rounded-xl border p-4 text-left transition',
        selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200 bg-white hover:border-gray-300',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-gray-900">{deployment.name}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            deployment.status === 'Active' && 'bg-green-100 text-green-700',
            deployment.status === 'Closed' && 'bg-gray-100 text-gray-600',
            deployment.status === 'Draft' && 'bg-amber-100 text-amber-700',
          )}
        >
          {deployment.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-500">{deploymentDate(deployment.date)}</p>
      <p className="mt-3 text-sm text-gray-700">
        <span className="font-semibold tabular-nums text-gray-900">{deployment.responseRate}%</span>
        <span className="text-gray-500"> response rate</span>
        <span className="text-gray-300"> · </span>
        <span className="tabular-nums">
          {deployment.responses}/{deployment.invited}
        </span>
      </p>
    </button>
  )
}

function ExportPreviewRow({
  row,
  fieldKeys,
  striped,
}: {
  row: Survey360ExportRow
  fieldKeys: string[]
  striped: boolean
}) {
  return (
    <tr className={cn('border-t border-gray-100', striped && 'bg-gray-50/70')}>
      <td className="px-5 py-3 text-gray-800">{row.deploymentName}</td>
      <td className="px-4 py-3 font-medium text-gray-900">{row.subjectName}</td>
      <td className="px-4 py-3 text-gray-600">{row.role}</td>
      {fieldKeys.map((key) => (
        <td key={key} className="px-4 py-3 text-gray-600">
          {row.customFields[key] || '—'}
        </td>
      ))}
      <td className="px-5 py-3 text-right tabular-nums text-gray-700">{row.responses}</td>
    </tr>
  )
}
