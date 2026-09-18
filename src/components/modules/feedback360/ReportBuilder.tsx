'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  REPORT360_COMPETENCIES,
  REPORT360_RELATIONSHIP_LABELS,
  type Report360Block,
  type Report360MasterDesign,
  type Report360Relationship,
  type Report360Template,
} from '@/data/mock-360-reports'
import { useReport360Template } from '@/lib/report360Store'
import { cn } from '@/lib/utils'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

const RELATIONSHIPS: Report360Relationship[] = [
  'self',
  'manager',
  'direct_report',
  'peer',
  'external',
]

const FONT_OPTIONS: SelectOption[] = [
  { value: 'Fira Sans', label: 'Fira Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
]

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: 'Letter', label: 'Letter' },
  { value: 'A4', label: 'A4' },
]

const CHART_OPTIONS: SelectOption[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'radar', label: 'Radar' },
]

const LINE_STYLE_OPTIONS: SelectOption[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: '#1', label: '#1' },
  { value: '#2', label: '#2' },
  { value: '#3', label: '#3' },
  { value: '#1 to #3', label: '#1 to #3' },
]

function weightTotal(weights: Record<Report360Relationship, number>) {
  return RELATIONSHIPS.reduce((sum, key) => sum + (weights[key] ?? 0), 0)
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-medium text-gray-600">{children}</p>
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
    />
  )
}

function WeightSliders({
  weights,
  onChange,
}: {
  weights: Record<Report360Relationship, number>
  onChange: (next: Record<Report360Relationship, number>) => void
}) {
  const total = weightTotal(weights)
  return (
    <div className="space-y-3">
      {RELATIONSHIPS.map((key) => (
        <label key={key} className="grid grid-cols-[140px_1fr_48px] items-center gap-3 text-sm">
          <span className="text-gray-700">{REPORT360_RELATIONSHIP_LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={(event) =>
              onChange({ ...weights, [key]: Number(event.target.value) })
            }
          />
          <span className="text-right tabular-nums text-gray-600">{weights[key]}%</span>
        </label>
      ))}
      <p className={cn('text-xs', total === 100 ? 'text-green-700' : 'text-red-600')}>
        Total {total}% {total === 100 ? '' : '— must equal 100% to save'}
      </p>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h4>
  )
}

function MasterDesignFields({
  design,
  onChange,
}: {
  design: Report360MasterDesign
  onChange: (next: Report360MasterDesign) => void
}) {
  const fontValue = FONT_OPTIONS.find((item) => item.value === design.fontFamily) ?? FONT_OPTIONS[0]
  const pageValue = PAGE_SIZE_OPTIONS.find((item) => item.value === design.pageSize) ?? PAGE_SIZE_OPTIONS[0]
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <WuFormGroup
          Label="Font style"
          Input={
            <WuSelect
              data={FONT_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={fontValue}
              onSelect={(option) =>
                onChange({ ...design, fontFamily: (option as SelectOption | null)?.value ?? design.fontFamily })
              }
              variant="outlined"
            />
          }
        />
        <WuFormGroup
          Label="Font color"
          Input={
            <WuInput
              variant="outlined"
              value={design.fontColor}
              onChange={(event) => onChange({ ...design, fontColor: event.target.value })}
            />
          }
        />
        <WuFormGroup
          Label="Custom header"
          Input={
            <WuInput
              variant="outlined"
              value={design.headerText}
              onChange={(event) => onChange({ ...design, headerText: event.target.value })}
            />
          }
        />
        <WuFormGroup
          Label="Custom footer"
          Input={
            <WuInput
              variant="outlined"
              value={design.footerText}
              onChange={(event) => onChange({ ...design, footerText: event.target.value })}
            />
          }
        />
        <WuFormGroup
          Label="Logo"
          Input={
            <WuInput
              variant="outlined"
              value={design.logoName}
              onChange={(event) => onChange({ ...design, logoName: event.target.value })}
            />
          }
        />
        <WuFormGroup
          Label="Page size"
          Input={
            <WuSelect
              data={PAGE_SIZE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={pageValue}
              onSelect={(option) =>
                onChange({
                  ...design,
                  pageSize: ((option as SelectOption | null)?.value as 'Letter' | 'A4') ?? design.pageSize,
                })
              }
              variant="outlined"
            />
          }
        />
      </div>
      <div className="flex flex-wrap gap-6">
        <WuToggle
          Label="Page numbering"
          checked={design.pageNumbering}
          onChange={(checked) => onChange({ ...design, pageNumbering: checked })}
        />
        <WuToggle
          Label="Report logo"
          checked={design.showLogo}
          onChange={(checked) => onChange({ ...design, showLogo: checked })}
        />
        <WuToggle
          Label="Apply relationship weights globally"
          checked={design.globalWeightsEnabled}
          onChange={(checked) => onChange({ ...design, globalWeightsEnabled: checked })}
        />
      </div>
      {design.globalWeightsEnabled ? (
        <div>
          <SectionHeading>Relationship weight configuration</SectionHeading>
          <WeightSliders
            weights={design.relationshipWeights}
            onChange={(relationshipWeights) => onChange({ ...design, relationshipWeights })}
          />
        </div>
      ) : null}
    </div>
  )
}

function CompetencyDetailFields({
  block,
  sectionOptions,
  onChange,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const [openWeighting, setOpenWeighting] = useState(false)
  const [openBenchmark, setOpenBenchmark] = useState(false)
  const [openVisibility, setOpenVisibility] = useState(false)
  const dataSource =
    sectionOptions.find((item) => item.value === block.dataSource) ?? sectionOptions[0]
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>General</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <WuFormGroup
            Label="Title"
            Input={
              <WuInput
                variant="outlined"
                value={block.title}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            }
          />
          <WuFormGroup
            Label="Data Source"
            Input={
              <WuSelect
                data={sectionOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={dataSource}
                onSelect={(option) =>
                  onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
                }
                variant="outlined"
              />
            }
          />
        </div>
        <div className="mt-3">
          <FieldLabel>Introduction</FieldLabel>
          <TextArea value={block.introduction} onChange={(introduction) => onChange({ introduction })} />
        </div>
        <div className="mt-3">
          <FieldLabel>Closing Text</FieldLabel>
          <TextArea value={block.closingText} onChange={(closingText) => onChange({ closingText })} />
        </div>
      </div>

      <div>
        <SectionHeading>Display options</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <WuFormGroup
            Label="Chart type"
            Input={
              <WuSelect
                data={CHART_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={chartValue}
                onSelect={(option) =>
                  onChange({
                    chartType: ((option as SelectOption | null)?.value as 'bar' | 'radar') ?? block.chartType,
                  })
                }
                variant="outlined"
              />
            }
          />
          <WuFormGroup
            Label="Behaviours per page"
            Input={
              <WuInput
                variant="outlined"
                type="number"
                value={String(block.behavioursPerPage)}
                onChange={(event) => onChange({ behavioursPerPage: Number(event.target.value) || 1 })}
              />
            }
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <WuToggle Label="Mean Column" checked={block.meanColumn} onChange={(meanColumn) => onChange({ meanColumn })} />
          <WuToggle
            Label="Relationship Icons"
            checked={block.relationshipIcons}
            onChange={(relationshipIcons) => onChange({ relationshipIcons })}
          />
          <WuToggle Label="Tabular Data" checked={block.tabularData} onChange={(tabularData) => onChange({ tabularData })} />
          <WuToggle
            Label="Priority Column"
            checked={block.priorityColumn}
            onChange={(priorityColumn) => onChange({ priorityColumn })}
          />
          <WuToggle
            Label="QxBot Insights"
            checked={block.qxBotInsights}
            onChange={(qxBotInsights) => onChange({ qxBotInsights })}
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
          onClick={() => setOpenWeighting((open) => !open)}
        >
          Weighting {openWeighting ? '▾' : '▸'}
        </button>
        {openWeighting ? (
          <div className="space-y-3 rounded border border-gray-100 p-3">
            <WuToggle
              Label="Include in Overall Score"
              checked={block.includeInOverallScore}
              onChange={(includeInOverallScore) => onChange({ includeInOverallScore })}
            />
            <WuToggle
              Label="Override global relationship weights"
              checked={block.useBlockWeights}
              onChange={(useBlockWeights) => onChange({ useBlockWeights })}
            />
            {block.useBlockWeights ? (
              <WeightSliders
                weights={block.relationshipWeights}
                onChange={(relationshipWeights) => onChange({ relationshipWeights })}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
          onClick={() => setOpenBenchmark((open) => !open)}
        >
          Benchmark {openBenchmark ? '▾' : '▸'}
        </button>
        {openBenchmark ? (
          <p className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Coming in Phase 3
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
          onClick={() => setOpenVisibility((open) => !open)}
        >
          Visibility {openVisibility ? '▾' : '▸'}
        </button>
        {openVisibility ? (
          <div className="flex flex-wrap gap-4">
            <WuToggle
              Label="Subject"
              checked={block.visibleToSubject}
              onChange={(visibleToSubject) => onChange({ visibleToSubject })}
            />
            <WuToggle
              Label="Manager"
              checked={block.visibleToManager}
              onChange={(visibleToManager) => onChange({ visibleToManager })}
            />
            <WuToggle
              Label="Admin"
              checked={block.visibleToAdmin}
              onChange={(visibleToAdmin) => onChange({ visibleToAdmin })}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function GenericBlockFields({
  block,
  sectionOptions,
  onChange,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const dataSource =
    sectionOptions.find((item) => item.value === block.dataSource) ?? sectionOptions[0]

  return (
    <div className="space-y-4">
      <WuFormGroup
        Label="Title"
        Input={
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        }
      />
      {block.type !== 'cover' && block.type !== 'introduction' && block.type !== 'nominatedRaters' ? (
        <WuFormGroup
          Label="Data Source"
          Input={
            <WuSelect
              data={sectionOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={dataSource}
              onSelect={(option) =>
                onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
              }
              variant="outlined"
            />
          }
        />
      ) : null}
      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea value={block.introduction} onChange={(introduction) => onChange({ introduction })} />
      </div>
      {block.type === 'spiderChart' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Select at least 3 competencies.</p>
          <div className="flex flex-wrap gap-3">
            {REPORT360_COMPETENCIES.map((competency) => {
              const checked = block.spiderCompetencyIds.includes(competency.id)
              return (
                <label key={competency.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? block.spiderCompetencyIds.filter((id) => id !== competency.id)
                        : [...block.spiderCompetencyIds, competency.id]
                      onChange({ spiderCompetencyIds: next })
                    }}
                  />
                  {competency.name}
                </label>
              )
            })}
          </div>
          {RELATIONSHIPS.map((key) => {
            const selected = block.spiderRelationships.includes(key)
            const styleValue =
              LINE_STYLE_OPTIONS.find((item) => item.value === block.lineStyles[key]) ?? LINE_STYLE_OPTIONS[0]
            return (
              <div key={key} className="grid grid-cols-[160px_1fr] items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const next = selected
                        ? block.spiderRelationships.filter((item) => item !== key)
                        : [...block.spiderRelationships, key]
                      onChange({ spiderRelationships: next })
                    }}
                  />
                  {REPORT360_RELATIONSHIP_LABELS[key]}
                </label>
                {selected ? (
                  <WuSelect
                    data={LINE_STYLE_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={styleValue}
                    onSelect={(option) =>
                      onChange({
                        lineStyles: {
                          ...block.lineStyles,
                          [key]: ((option as SelectOption | null)?.value as 'solid' | 'dashed' | 'dotted') ?? 'solid',
                        },
                      })
                    }
                    variant="outlined"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
      {block.type === 'rankingByRelationship' ? (
        <WuFormGroup
          Label="Priorities to display (max 5)"
          Input={
            <WuInput
              variant="outlined"
              type="number"
              value={String(block.rankingCount)}
              onChange={(event) =>
                onChange({ rankingCount: Math.min(5, Math.max(1, Number(event.target.value) || 1)) })
              }
            />
          }
        />
      ) : null}
      {block.type === 'actionPlan' ? (
        <div>
          <FieldLabel>Select priorities</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {PRIORITY_OPTIONS.map((option) => {
              const checked = block.actionPlanPriorities.includes(option.value)
              return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? block.actionPlanPriorities.filter((item) => item !== option.value)
                        : [...block.actionPlanPriorities, option.value]
                      onChange({ actionPlanPriorities: next })
                    }}
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function blockSettings(
  block: Report360Block,
  sectionOptions: SelectOption[],
  masterDesign: Report360MasterDesign,
  onMasterChange: (next: Report360MasterDesign) => void,
  onChange: (patch: Partial<Report360Block>) => void,
) {
  if (block.type === 'masterDesign') {
    return <MasterDesignFields design={masterDesign} onChange={onMasterChange} />
  }
  if (block.type === 'competencyDetail') {
    return <CompetencyDetailFields block={block} sectionOptions={sectionOptions} onChange={onChange} />
  }
  return <GenericBlockFields block={block} sectionOptions={sectionOptions} onChange={onChange} />
}

export function ReportBuilder({ survey }: { survey: Survey360 }) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const { template, setTemplate, save, reset } = useReport360Template(survey.id)
  const [expandedId, setExpandedId] = useState('block_competencyDetail')
  const [dragId, setDragId] = useState<string | null>(null)

  const sectionOptions = useMemo<SelectOption[]>(
    () =>
      survey.sections.map((section) => ({ value: section.title, label: section.title })),
    [survey.sections],
  )

  function updateBlock(blockId: string, patch: Partial<Report360Block>) {
    setTemplate({
      ...template,
      blocks: template.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    })
  }

  function reorder(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const source = template.blocks.find((block) => block.id === sourceId)
    const target = template.blocks.find((block) => block.id === targetId)
    if (!source || !target || source.locked || target.locked) return
    const without = template.blocks.filter((block) => block.id !== sourceId)
    const targetIndex = without.findIndex((block) => block.id === targetId)
    const next = [...without]
    next.splice(targetIndex, 0, source)
    if (next[0]?.type !== 'masterDesign') return
    setTemplate({ ...template, blocks: next })
  }

  function handleSave() {
    if (template.masterDesign.globalWeightsEnabled && weightTotal(template.masterDesign.relationshipWeights) !== 100) {
      showToast({ message: 'Global relationship weights must equal 100%.', variant: 'error' })
      return
    }
    const invalidBlock = template.blocks.find(
      (block) => block.useBlockWeights && weightTotal(block.relationshipWeights) !== 100,
    )
    if (invalidBlock) {
      showToast({ message: `${invalidBlock.title} weights must equal 100%.`, variant: 'error' })
      return
    }
    const spider = template.blocks.find((block) => block.type === 'spiderChart')
    if (spider?.enabled && spider.spiderCompetencyIds.length < 3) {
      showToast({ message: 'Spider chart needs at least 3 competencies.', variant: 'error' })
      return
    }
    save(template)
    showToast({ message: 'Report template saved', variant: 'success' })
  }

  function handleReset() {
    const next = reset()
    setTemplate(next)
    setExpandedId('block_competencyDetail')
    showToast({ message: 'Report template reset', variant: 'success' })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-4">
        <div>
          <p className="text-xs text-gray-500">{survey.title}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Report Builder</h1>
          <p className="mt-1 text-sm text-gray-500">Configure template blocks and preview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WuButton variant="secondary">Configure Template</WuButton>
          <WuButton variant="secondary" onClick={() => router.push(`/360/reports/${survey.id}/preview`)}>
            Preview
          </WuButton>
          <WuButton
            onClick={() =>
              showToast({ message: 'PDF download is a prototype action. Use Preview to review pages.', variant: 'success' })
            }
          >
            Download PDFs
          </WuButton>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-6 py-6">
        {template.blocks.map((block) => {
          const expanded = expandedId === block.id
          return (
            <section
              key={block.id}
              draggable={!block.locked}
              onDragStart={() => setDragId(block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragId) reorder(dragId, block.id)
                setDragId(null)
              }}
              className={cn(
                'rounded-lg border bg-white shadow-sm',
                expanded ? 'border-blue-200' : 'border-gray-200',
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn('text-gray-400', block.locked ? 'cursor-not-allowed' : 'cursor-grab')}
                  aria-hidden
                >
                  ⋮⋮
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left font-medium text-gray-900"
                  onClick={() => setExpandedId(expanded ? '' : block.id)}
                >
                  {block.title}
                </button>
                {block.locked ? (
                  <WuText size="sm" className="text-gray-400">
                    Always on
                  </WuText>
                ) : (
                  <WuToggle
                    checked={block.enabled}
                    onChange={(enabled) => updateBlock(block.id, { enabled })}
                  />
                )}
              </div>
              {expanded ? (
                <div className="border-t border-gray-100 px-4 py-4">
                  {blockSettings(
                    block,
                    sectionOptions.length > 0 ? sectionOptions : [{ value: 'Inclusive Leadership', label: 'Inclusive Leadership' }],
                    template.masterDesign,
                    (masterDesign) => setTemplate({ ...template, masterDesign }),
                    (patch) => updateBlock(block.id, patch),
                  )}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
        <WuButton variant="secondary" onClick={handleReset}>
          Reset
        </WuButton>
        <WuButton onClick={handleSave}>Save Changes</WuButton>
      </footer>
    </div>
  )
}
