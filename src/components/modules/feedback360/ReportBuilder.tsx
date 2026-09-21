'use client'

import { useId, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  REPORT360_BLOCK_DESCRIPTIONS,
  REPORT360_COMPETENCIES,
  REPORT360_MERGE_VARIABLES,
  REPORT360_OPEN_QUESTIONS,
  REPORT360_PRESETS,
  REPORT360_RELATIONSHIPS,
  REPORT360_RELATIONSHIP_LABELS,
  REPORT360_SCORED_BLOCK_TYPES,
  applyReport360Preset,
  createDefaultReport360Template,
  type Report360Block,
  type Report360CoverTemplate,
  type Report360LogoAsset,
  type Report360MasterDesign,
  type Report360PerformanceCategory,
  type Report360Relationship,
  type Report360RelationshipIcon,
  type Report360Template,
} from '@/data/mock-360-reports'
import { preventModalDismiss } from '@/lib/modalProps'
import { weightTotal } from '@/lib/report360Scoring'
import { useReport360Template } from '@/lib/report360Store'
import { cn } from '@/lib/utils'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

const RELATIONSHIPS = REPORT360_RELATIONSHIPS

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

const DISPLAY_MODE_OPTIONS: SelectOption[] = [
  { value: 'grouped', label: 'Grouped by question' },
  { value: 'combined', label: 'Combined (Legacy)' },
]

const AI_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'All open-ended questions', label: 'All open-ended questions' },
  ...REPORT360_OPEN_QUESTIONS.map((question) => ({ value: question.text, label: question.text })),
]

/** Prototype logos live in localStorage, so keep the data URL small. */
const MAX_LOGO_BYTES = 150 * 1024

const COVER_TEMPLATES: { value: Report360CoverTemplate; label: string; hint: string }[] = [
  { value: 'classic', label: 'Classic', hint: 'Name bottom-left, details stacked below' },
  { value: 'centered', label: 'Centered', hint: 'Title block centered on the page' },
  { value: 'split', label: 'Split', hint: 'Color band on the left, details on the right' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-medium text-gray-600">{children}</p>
}

function TextArea({
  value,
  onChange,
  rows = 3,
  id,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  id?: string
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
    />
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h4>
  )
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
        onClick={() => setOpen((value) => !value)}
      >
        {title} {open ? '▾' : '▸'}
      </button>
      {open ? children : null}
    </div>
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
            onChange={(event) => onChange({ ...weights, [key]: Number(event.target.value) })}
          />
          <span className="text-right tabular-nums text-gray-600">{weights[key]}%</span>
        </label>
      ))}
      <p className={cn('text-xs', total === 100 ? 'text-green-700' : 'text-red-600')}>
        Total {total}% {total === 100 ? '' : '— must equal 100% to save'}
      </p>
      <p className="text-xs text-gray-500">
        Relationships with no responses are excluded and their weight is redistributed
        proportionally.
      </p>
    </div>
  )
}

function PerformanceCategoryEditor({
  categories,
  onChange,
}: {
  categories: Report360PerformanceCategory[]
  onChange: (next: Report360PerformanceCategory[]) => void
}) {
  function update(id: string, patch: Partial<Report360PerformanceCategory>) {
    onChange(categories.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="grid grid-cols-[1fr_72px_72px_56px_32px] items-end gap-2">
          <div>
            <FieldLabel>Label</FieldLabel>
            <WuInput
              variant="outlined"
              value={category.label}
              onChange={(event) => update(category.id, { label: event.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Min %</FieldLabel>
            <WuInput
              variant="outlined"
              type="number"
              value={String(category.min)}
              onChange={(event) => update(category.id, { min: Number(event.target.value) || 0 })}
            />
          </div>
          <div>
            <FieldLabel>Max %</FieldLabel>
            <WuInput
              variant="outlined"
              type="number"
              value={String(category.max)}
              onChange={(event) => update(category.id, { max: Number(event.target.value) || 0 })}
            />
          </div>
          <div>
            <FieldLabel>Color</FieldLabel>
            <input
              type="color"
              value={category.color}
              onChange={(event) => update(category.id, { color: event.target.value })}
              className="h-9 w-full cursor-pointer rounded border border-gray-300"
            />
          </div>
          <button
            type="button"
            className="mb-2 text-gray-400 hover:text-red-600"
            aria-label={`Remove ${category.label}`}
            onClick={() => onChange(categories.filter((item) => item.id !== category.id))}
          >
            ✕
          </button>
        </div>
      ))}
      <WuButton
        variant="secondary"
        onClick={() =>
          onChange([
            ...categories,
            {
              id: `cat_${Date.now()}`,
              label: 'New category',
              min: 0,
              max: 0,
              color: '#6B7280',
            },
          ])
        }
      >
        + Add category
      </WuButton>
    </div>
  )
}

function InsertVariableSelect({ onInsert }: { onInsert: (token: string) => void }) {
  const options: SelectOption[] = REPORT360_MERGE_VARIABLES.map((variable) => ({
    value: variable.token,
    label: `${variable.token} — ${variable.description}`,
  }))
  return (
    <WuSelect
      data={options}
      accessorKey={{ value: 'value', label: 'label' }}
      value={null}
      onSelect={(option) => {
        const token = (option as SelectOption | null)?.value
        if (token) onInsert(token)
      }}
      variant="outlined"
      placeholder="Insert Variable"
    />
  )
}

function FieldRow({
  label,
  hint,
  children,
  align = 'center',
}: {
  label: React.ReactNode
  hint?: string
  children: React.ReactNode
  align?: 'center' | 'start'
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(148px,38%)_minmax(0,1fr)] gap-x-4 py-2.5',
        align === 'center' ? 'items-center' : 'items-start',
      )}
    >
      <div className={align === 'start' ? 'pt-2' : undefined}>
        <p className="text-sm text-gray-700">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function InfoTip({ text }: { text: string }) {
  return (
    <WuTooltip content={text} position="top" showArrow>
      <span
        className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600"
        aria-label={text}
      >
        i
      </span>
    </WuTooltip>
  )
}

function ColorField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span
        className="block size-8 overflow-hidden rounded border border-gray-300"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full cursor-pointer opacity-0"
          aria-label="Color"
        />
      </span>
    </label>
  )
}

function LogoThumb({ logo }: { logo: Report360LogoAsset | null }) {
  if (!logo) return null
  if (logo.dataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo.dataUrl} alt={logo.name} className="h-5 w-auto max-w-[72px] object-contain" />
  }
  return <span className="text-[10px] uppercase tracking-wide text-gray-400">{logo.name}</span>
}

function LogoField({
  logo,
  onChange,
  disabled,
  emptyLabel,
}: {
  logo: Report360LogoAsset | null
  onChange: (next: Report360LogoAsset | null) => void
  disabled?: boolean
  emptyLabel: string
}) {
  const { showToast } = useWuShowToast()
  const inputId = useId()

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      showToast({ message: 'Only PNG and JPEG files are accepted.', variant: 'error' })
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      onChange({ name: file.name, dataUrl: '' })
      showToast({
        message: 'Logo is over 150 KB, so only the file name is stored in this prototype.',
        variant: 'error',
      })
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange({ name: file.name, dataUrl: String(reader.result ?? '') })
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn(disabled && 'pointer-events-none opacity-40')}>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {logo ? (
        <div className="flex items-center gap-2 rounded border border-gray-200 px-2.5 py-1.5">
          <LogoThumb logo={logo} />
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{logo.name}</span>
          <label htmlFor={inputId} className="cursor-pointer text-xs text-blue-700 hover:underline">
            Replace
          </label>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-red-600"
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:border-gray-400"
        >
          {emptyLabel}
        </label>
      )}
      <p className="mt-1 text-[11px] text-gray-400">*only PNG and JPEG files accepted</p>
    </div>
  )
}

function RelationshipIconPills({
  icons,
}: {
  icons: Record<Report360Relationship, Report360RelationshipIcon>
}) {
  return (
    <div className="flex items-center gap-1.5">
      {RELATIONSHIPS.map((key) => (
        <span
          key={key}
          title={REPORT360_RELATIONSHIP_LABELS[key]}
          className="flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: icons[key]?.color }}
        >
          {icons[key]?.letter}
        </span>
      ))}
    </div>
  )
}

function MasterDesignPreview({ design }: { design: Report360MasterDesign }) {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-white shadow-sm"
      style={{ borderColor: design.tableBorderColor, fontFamily: design.fontFamily, color: design.fontColor }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2 text-[11px] text-gray-500"
        style={{ borderColor: design.tableBorderColor }}
      >
        <span className="flex items-center gap-2">
          {design.showLogo ? <LogoThumb logo={design.leftHeaderLogo} /> : null}
          <span>{design.headerText || 'Left Header Text'}</span>
        </span>
        {design.showLogo ? <LogoThumb logo={design.rightHeaderLogo} /> : null}
      </div>
      <div className="px-4 py-3">
        <p className="mb-2 text-sm font-semibold" style={{ color: design.themeColor }}>
          Competency Detail View
        </p>
        <table className="w-full text-left text-[11px]" style={{ borderColor: design.tableBorderColor }}>
          <thead>
            <tr className="border-b" style={{ color: design.tableHeadingTextColor, borderColor: design.tableBorderColor }}>
              <th className="py-1.5 pr-2 font-medium">Behavior</th>
              {RELATIONSHIPS.slice(0, 4).map((key) => (
                <th key={key} className="py-1.5 font-medium">
                  <span
                    className="mr-1 inline-flex size-3.5 items-center justify-center rounded-full text-[8px] font-semibold text-white"
                    style={{ background: design.relationshipIcons[key]?.color }}
                  >
                    {design.relationshipIcons[key]?.letter}
                  </span>
                  {REPORT360_RELATIONSHIP_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['Sets a clear direction for the team.', 'Pays focused attention when speaking.'].map(
              (text, index) => (
                <tr
                  key={text}
                  className="border-b"
                  style={{
                    background: index % 2 === 0 ? design.tableBackground1 : design.tableBackground2,
                    borderColor: design.tableBorderColor,
                  }}
                >
                  <td className="py-1.5 pr-2">{text}</td>
                  <td className="py-1.5">4.2</td>
                  <td className="py-1.5">4.6</td>
                  <td className="py-1.5">4.1</td>
                  <td className="py-1.5">3.9</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 text-[11px] text-gray-400">
        <span>{design.footerText || 'Footer Text'}</span>
        <span>{design.pageNumbering ? 'Page 1' : ''}</span>
      </div>
    </div>
  )
}

function MasterDesignFields({
  design,
  onChange,
}: {
  design: Report360MasterDesign
  onChange: (next: Report360MasterDesign) => void
}) {
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [iconsOpen, setIconsOpen] = useState(false)
  const fontValue = FONT_OPTIONS.find((item) => item.value === design.fontFamily) ?? FONT_OPTIONS[0]
  const pageValue =
    PAGE_SIZE_OPTIONS.find((item) => item.value === design.pageSize) ?? PAGE_SIZE_OPTIONS[0]
  const weightsOk = !design.globalWeightsEnabled || weightTotal(design.relationshipWeights) === 100

  return (
    <div className="space-y-8">
      <MasterDesignPreview design={design} />

      <section>
        <SectionHeading>Header &amp; page</SectionHeading>
        <div className="grid gap-x-10 md:grid-cols-2">
          <div>
            <FieldRow label="Report Logo">
              <WuToggle
                checked={design.showLogo}
                onChange={(checked) => onChange({ ...design, showLogo: checked })}
              />
            </FieldRow>
            <FieldRow
              align="start"
              label={
                <>
                  Left Header Logo
                  <InfoTip text="Appears in the top-left of every report page. PNG or JPEG." />
                </>
              }
            >
              <LogoField
                logo={design.leftHeaderLogo}
                emptyLabel="Add Left Header Logo"
                disabled={!design.showLogo}
                onChange={(leftHeaderLogo) => onChange({ ...design, leftHeaderLogo })}
              />
            </FieldRow>
            <FieldRow
              align="start"
              label={
                <>
                  Right Header Logo
                  <InfoTip text="Appears in the top-right of every report page. PNG or JPEG." />
                </>
              }
            >
              <LogoField
                logo={design.rightHeaderLogo}
                emptyLabel="Add Right Header Logo"
                disabled={!design.showLogo}
                onChange={(rightHeaderLogo) => onChange({ ...design, rightHeaderLogo })}
              />
            </FieldRow>
            <FieldRow label="Left Header Text">
              <WuInput
                variant="outlined"
                value={design.headerText}
                onChange={(event) => onChange({ ...design, headerText: event.target.value })}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label="Page Number">
              <WuToggle
                checked={design.pageNumbering}
                onChange={(checked) => onChange({ ...design, pageNumbering: checked })}
              />
            </FieldRow>
            <FieldRow label="Footer Text">
              <WuInput
                variant="outlined"
                value={design.footerText}
                onChange={(event) => onChange({ ...design, footerText: event.target.value })}
              />
            </FieldRow>
            <FieldRow label="Page Size">
              <WuSelect
                data={PAGE_SIZE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={pageValue}
                onSelect={(option) =>
                  onChange({
                    ...design,
                    pageSize:
                      ((option as SelectOption | null)?.value as 'Letter' | 'A4') ?? design.pageSize,
                  })
                }
                variant="outlined"
              />
            </FieldRow>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading>Typography &amp; table</SectionHeading>
        <div className="grid gap-x-10 md:grid-cols-2">
          <div>
            <FieldRow label="Theme Color">
              <ColorField
                value={design.themeColor}
                onChange={(themeColor) => onChange({ ...design, themeColor })}
              />
            </FieldRow>
            <FieldRow label="Font Family">
              <WuSelect
                data={FONT_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={fontValue}
                onSelect={(option) =>
                  onChange({
                    ...design,
                    fontFamily: (option as SelectOption | null)?.value ?? design.fontFamily,
                  })
                }
                variant="outlined"
              />
            </FieldRow>
            <FieldRow label="Font Color">
              <ColorField
                value={design.fontColor}
                onChange={(fontColor) => onChange({ ...design, fontColor })}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label="Table Heading Text Color">
              <ColorField
                value={design.tableHeadingTextColor}
                onChange={(tableHeadingTextColor) => onChange({ ...design, tableHeadingTextColor })}
              />
            </FieldRow>
            <FieldRow label="Table Background 1">
              <ColorField
                value={design.tableBackground1}
                onChange={(tableBackground1) => onChange({ ...design, tableBackground1 })}
              />
            </FieldRow>
            <FieldRow label="Table Background 2">
              <ColorField
                value={design.tableBackground2}
                onChange={(tableBackground2) => onChange({ ...design, tableBackground2 })}
              />
            </FieldRow>
            <FieldRow label="Table Border">
              <ColorField
                value={design.tableBorderColor}
                onChange={(tableBorderColor) => onChange({ ...design, tableBorderColor })}
              />
            </FieldRow>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading>Relationships</SectionHeading>
        <div className="grid gap-x-10 md:grid-cols-2">
          <FieldRow
            align="start"
            label="Relationship Icons"
            hint="Letter and color used in tables and charts"
          >
            <div className="flex items-center gap-2">
              <RelationshipIconPills icons={design.relationshipIcons} />
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-blue-700"
                aria-label="Edit relationship icons"
                onClick={() => setIconsOpen((open) => !open)}
              >
                ✎
              </button>
            </div>
            {iconsOpen ? (
              <div className="mt-3 space-y-2 rounded border border-gray-100 p-3">
                {RELATIONSHIPS.map((key) => (
                  <div key={key} className="grid grid-cols-[120px_56px_1fr] items-center gap-2">
                    <span className="text-sm text-gray-700">{REPORT360_RELATIONSHIP_LABELS[key]}</span>
                    <WuInput
                      variant="outlined"
                      value={design.relationshipIcons[key]?.letter ?? ''}
                      onChange={(event) =>
                        onChange({
                          ...design,
                          relationshipIcons: {
                            ...design.relationshipIcons,
                            [key]: {
                              ...design.relationshipIcons[key],
                              letter: event.target.value.slice(0, 2).toUpperCase(),
                            },
                          },
                        })
                      }
                    />
                    <ColorField
                      value={design.relationshipIcons[key]?.color ?? '#6B7280'}
                      onChange={(color) =>
                        onChange({
                          ...design,
                          relationshipIcons: {
                            ...design.relationshipIcons,
                            [key]: { ...design.relationshipIcons[key], color },
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </FieldRow>
          <FieldRow
            label="Relationship Weight Configuration"
            hint={weightsOk ? undefined : 'Weights must equal 100%'}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
              onClick={() => setWeightsOpen(true)}
            >
              <span aria-hidden>✎</span> Configure Weights
            </button>
          </FieldRow>
        </div>
      </section>

      <section>
        <SectionHeading>Scoring</SectionHeading>
        <div className="grid gap-x-10 md:grid-cols-2">
          <div>
            <FieldRow label="Exclude Self in Priority Score">
              <WuToggle
                checked={design.excludeSelfInPriorityScore}
                onChange={(checked) => onChange({ ...design, excludeSelfInPriorityScore: checked })}
              />
            </FieldRow>
            <FieldRow label="Exclude Self in Average Score">
              <WuToggle
                checked={design.excludeSelfInAverageScore}
                onChange={(checked) => onChange({ ...design, excludeSelfInAverageScore: checked })}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label="Show Category Headers">
              <WuToggle
                checked={design.showCategoryHeaders}
                onChange={(checked) => onChange({ ...design, showCategoryHeaders: checked })}
              />
            </FieldRow>
            <FieldRow label="Category Header Title">
              <div className={cn(!design.showCategoryHeaders && 'pointer-events-none opacity-40')}>
                <WuInput
                  variant="outlined"
                  value={design.categoryHeaderTitle}
                  onChange={(event) => onChange({ ...design, categoryHeaderTitle: event.target.value })}
                />
              </div>
            </FieldRow>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-1 text-sm text-gray-700">Performance categories</p>
          <p className="mb-3 text-xs text-gray-400">
            Bands used to label a subject&apos;s overall score on the cover and executive summary.
          </p>
          <PerformanceCategoryEditor
            categories={design.performanceCategories}
            onChange={(performanceCategories) => onChange({ ...design, performanceCategories })}
          />
        </div>
      </section>

      <section>
        <SectionHeading>Empty pages &amp; confidentiality</SectionHeading>
        <div className="grid gap-x-10 md:grid-cols-2">
          <FieldRow
            label="Skip Empty Blocks"
            hint="Remove a block with no data instead of printing a blank page"
          >
            <WuToggle
              checked={design.skipEmptyBlocks}
              onChange={(checked) => onChange({ ...design, skipEmptyBlocks: checked })}
            />
          </FieldRow>
          <FieldRow
            label="Minimum Raters Per Group"
            hint="Smaller groups merge into Combined others. Self and Manager are exempt."
          >
            <WuInput
              variant="outlined"
              type="number"
              value={String(design.minRatersPerGroup)}
              onChange={(event) =>
                onChange({
                  ...design,
                  minRatersPerGroup: Math.max(1, Number(event.target.value) || 1),
                })
              }
            />
          </FieldRow>
        </div>
      </section>

      <div className="flex justify-end">
        <WuButton
          variant="secondary"
          onClick={() => onChange(createDefaultReport360Template().masterDesign)}
        >
          Reset
        </WuButton>
      </div>

      <WuModal
        open={weightsOpen}
        onOpenChange={setWeightsOpen}
        variant="action"
        size="md"
        maxWidth="560px"
        {...preventModalDismiss}
      >
        <WuModalHeader>Relationship Weight Configuration</WuModalHeader>
        <WuModalContent>
          <p className="mb-4 text-sm text-gray-500">
            These weights apply to every block where a mean is calculated, unless a block overrides
            them.
          </p>
          <WuToggle
            Label="Apply relationship weights globally"
            checked={design.globalWeightsEnabled}
            onChange={(checked) => onChange({ ...design, globalWeightsEnabled: checked })}
          />
          {design.globalWeightsEnabled ? (
            <div className="mt-4">
              <WeightSliders
                weights={design.relationshipWeights}
                onChange={(relationshipWeights) => onChange({ ...design, relationshipWeights })}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              All relationships contribute equally until you turn this on.
            </p>
          )}
        </WuModalContent>
        <WuModalFooter>
          <WuButton onClick={() => setWeightsOpen(false)} disabled={!weightsOk}>
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function GeneralFields({
  block,
  sectionOptions,
  onChange,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? sectionOptions[0]
  const showDataSource = !['cover', 'introduction', 'nominatedRaters', 'customContent'].includes(
    block.type,
  )
  const isCustomTitle = block.title !== block.defaultTitle

  return (
    <div>
      <SectionHeading>General</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
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
          {isCustomTitle ? (
            <button
              type="button"
              className="mt-1 text-xs text-blue-700 hover:underline"
              onClick={() => onChange({ title: block.defaultTitle })}
            >
              Reset to Default Name
            </button>
          ) : null}
        </div>
        {showDataSource ? (
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
      </div>
      {block.type !== 'customContent' ? (
        <div className="mt-3">
          <FieldLabel>Introduction</FieldLabel>
          <TextArea value={block.introduction} onChange={(introduction) => onChange({ introduction })} />
        </div>
      ) : null}
      {REPORT360_SCORED_BLOCK_TYPES.includes(block.type) ? (
        <div className="mt-3">
          <FieldLabel>Closing Text</FieldLabel>
          <TextArea value={block.closingText} onChange={(closingText) => onChange({ closingText })} />
        </div>
      ) : null}
    </div>
  )
}

function CoverFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Cover template</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-3">
          {COVER_TEMPLATES.map((template) => {
            const active = block.coverTemplate === template.value
            return (
              <button
                key={template.value}
                type="button"
                onClick={() => onChange({ coverTemplate: template.value })}
                className={cn(
                  'rounded-lg border p-3 text-left transition',
                  active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <div
                  className="mb-2 flex h-16 w-full overflow-hidden rounded"
                  style={{ background: block.coverBackgroundColor }}
                >
                  {template.value === 'classic' ? (
                    <div className="mt-auto w-full px-2 pb-2">
                      <div className="h-1.5 w-2/3 rounded bg-white/80" />
                      <div className="mt-1 h-1 w-1/2 rounded bg-white/50" />
                    </div>
                  ) : null}
                  {template.value === 'centered' ? (
                    <div className="m-auto w-2/3">
                      <div className="mx-auto h-1.5 w-full rounded bg-white/80" />
                      <div className="mx-auto mt-1 h-1 w-1/2 rounded bg-white/50" />
                    </div>
                  ) : null}
                  {template.value === 'split' ? (
                    <>
                      <div className="h-full w-1/3 bg-black/25" />
                      <div className="my-auto w-2/3 px-2">
                        <div className="h-1.5 w-3/4 rounded bg-white/80" />
                        <div className="mt-1 h-1 w-1/2 rounded bg-white/50" />
                      </div>
                    </>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500">{template.hint}</p>
              </button>
            )
          })}
        </div>
        <div className="mt-4 max-w-[220px]">
          <FieldLabel>Background color</FieldLabel>
          <input
            type="color"
            value={block.coverBackgroundColor}
            onChange={(event) => onChange({ coverBackgroundColor: event.target.value })}
            className="h-9 w-full cursor-pointer rounded border border-gray-300"
          />
        </div>
      </div>

      <div>
        <SectionHeading>Cover content</SectionHeading>
        <div className="mb-3 max-w-[320px]">
          <InsertVariableSelect
            onInsert={(token) => onChange({ introduction: `${block.introduction}${token}` })}
          />
        </div>
        <FieldLabel>Cover text</FieldLabel>
        <TextArea
          value={block.introduction}
          rows={3}
          onChange={(introduction) => onChange({ introduction })}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <WuToggle
            Label="Show Overall Score on Cover"
            checked={block.showOverallScoreOnCover}
            onChange={(showOverallScoreOnCover) => onChange({ showOverallScoreOnCover })}
          />
          <WuToggle
            Label="Show Performance Category on Cover"
            checked={block.showPerformanceCategoryOnCover}
            onChange={(showPerformanceCategoryOnCover) => onChange({ showPerformanceCategoryOnCover })}
          />
        </div>
      </div>

      <div>
        <SectionHeading>Back cover</SectionHeading>
        <WuToggle
          Label="Include Back Cover"
          checked={block.includeBackCover}
          onChange={(includeBackCover) => onChange({ includeBackCover })}
        />
        {block.includeBackCover ? (
          <div className="mt-4 space-y-4">
            <WuToggle
              Label="Show logo on back cover"
              checked={block.backCoverLogo}
              onChange={(backCoverLogo) => onChange({ backCoverLogo })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <WuFormGroup
                Label="Contact name"
                Input={
                  <WuInput
                    variant="outlined"
                    value={block.contactName}
                    onChange={(event) => onChange({ contactName: event.target.value })}
                  />
                }
              />
              <WuFormGroup
                Label="Contact email"
                Input={
                  <WuInput
                    variant="outlined"
                    value={block.contactEmail}
                    onChange={(event) => onChange({ contactEmail: event.target.value })}
                  />
                }
              />
            </div>
            <div>
              <FieldLabel>Confidentiality note</FieldLabel>
              <TextArea
                value={block.confidentialityNote}
                onChange={(confidentialityNote) => onChange({ confidentialityNote })}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CommentsFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const displayMode =
    DISPLAY_MODE_OPTIONS.find((item) => item.value === block.commentDisplayMode) ??
    DISPLAY_MODE_OPTIONS[0]
  const multipleQuestions = block.commentQuestionIds.length > 1

  return (
    <div>
      <SectionHeading>Questions</SectionHeading>
      <div className="space-y-2">
        {REPORT360_OPEN_QUESTIONS.map((question) => {
          const checked = block.commentQuestionIds.includes(question.id)
          return (
            <label key={question.id} className="flex items-start gap-2 text-sm text-gray-700">
              <WuCheckbox
                checked={checked}
                onChange={() =>
                  onChange({
                    commentQuestionIds: checked
                      ? block.commentQuestionIds.filter((id) => id !== question.id)
                      : [...block.commentQuestionIds, question.id],
                  })
                }
              />
              {question.text}
            </label>
          )
        })}
      </div>
      {block.commentQuestionIds.length === 0 ? (
        <p className="mt-2 text-xs text-red-600">Select at least one question.</p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {multipleQuestions ? (
          <WuFormGroup
            Label="Display Mode"
            Input={
              <WuSelect
                data={DISPLAY_MODE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={displayMode}
                onSelect={(option) =>
                  onChange({
                    commentDisplayMode:
                      ((option as SelectOption | null)?.value as 'grouped' | 'combined') ??
                      block.commentDisplayMode,
                  })
                }
                variant="outlined"
              />
            }
          />
        ) : null}
        <div className="self-end pb-2">
          <WuToggle
            Label="Show relationship label on each comment"
            checked={block.showRelationshipLabel}
            onChange={(showRelationshipLabel) => onChange({ showRelationshipLabel })}
          />
        </div>
      </div>
    </div>
  )
}

function AiFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const source =
    AI_SOURCE_OPTIONS.find((item) => item.value === block.aiDataSource) ?? AI_SOURCE_OPTIONS[0]
  return (
    <div>
      <SectionHeading>QxBot settings</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        <WuFormGroup
          Label="Analyze responses from"
          Input={
            <WuSelect
              data={AI_SOURCE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={source}
              onSelect={(option) =>
                onChange({ aiDataSource: (option as SelectOption | null)?.value ?? block.aiDataSource })
              }
              variant="outlined"
            />
          }
        />
        <WuFormGroup
          Label="Recommendations to show"
          Input={
            <WuInput
              variant="outlined"
              type="number"
              value={String(block.aiRecommendationCount)}
              onChange={(event) =>
                onChange({
                  aiRecommendationCount: Math.min(5, Math.max(1, Number(event.target.value) || 1)),
                })
              }
            />
          }
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <WuToggle
          Label="Sentiment summary bar"
          checked={block.showSentimentBar}
          onChange={(showSentimentBar) => onChange({ showSentimentBar })}
        />
        <WuToggle
          Label="Theme tags on cards"
          checked={block.showThemeTags}
          onChange={(showThemeTags) => onChange({ showThemeTags })}
        />
        <WuToggle
          Label="Reinforcement when feedback is all positive"
          checked={block.includeReinforcement}
          onChange={(includeReinforcement) => onChange({ includeReinforcement })}
        />
      </div>
      <p className="mt-3 text-xs text-gray-500">
        A minimum of 3 responses is required before recommendations are generated.
      </p>
    </div>
  )
}

function DisplayOptionFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]
  return (
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
        <WuToggle
          Label="Tabular Data"
          checked={block.tabularData}
          onChange={(tabularData) => onChange({ tabularData })}
        />
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
  )
}

function SpiderFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  const tooFew = block.spiderCompetencyIds.length < 3
  return (
    <div>
      <SectionHeading>Chart content</SectionHeading>
      <FieldLabel>Competencies</FieldLabel>
      <div className="flex flex-wrap gap-3">
        {REPORT360_COMPETENCIES.map((competency) => {
          const checked = block.spiderCompetencyIds.includes(competency.id)
          return (
            <label key={competency.id} className="flex items-center gap-2 text-sm text-gray-700">
              <WuCheckbox
                checked={checked}
                onChange={() =>
                  onChange({
                    spiderCompetencyIds: checked
                      ? block.spiderCompetencyIds.filter((id) => id !== competency.id)
                      : [...block.spiderCompetencyIds, competency.id],
                  })
                }
              />
              {competency.name}
            </label>
          )
        })}
      </div>
      <p className={cn('mt-2 text-xs', tooFew ? 'text-red-600' : 'text-gray-500')}>
        Select at least 3 competencies.
      </p>
      <div className="mt-4 space-y-2">
        <FieldLabel>Relationship lines</FieldLabel>
        {RELATIONSHIPS.map((key) => {
          const selected = block.spiderRelationships.includes(key)
          const styleValue =
            LINE_STYLE_OPTIONS.find((item) => item.value === block.lineStyles[key]) ?? LINE_STYLE_OPTIONS[0]
          return (
            <div key={key} className="grid grid-cols-[160px_1fr] items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <WuCheckbox
                  checked={selected}
                  onChange={() =>
                    onChange({
                      spiderRelationships: selected
                        ? block.spiderRelationships.filter((item) => item !== key)
                        : [...block.spiderRelationships, key],
                    })
                  }
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
                        [key]:
                          ((option as SelectOption | null)?.value as 'solid' | 'dashed' | 'dotted') ??
                          'solid',
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
    </div>
  )
}

function ItemCountField({
  block,
  label,
  onChange,
}: {
  block: Report360Block
  label: string
  onChange: (patch: Partial<Report360Block>) => void
}) {
  return (
    <div className="max-w-[220px]">
      <WuFormGroup
        Label={label}
        Input={
          <WuInput
            variant="outlined"
            type="number"
            value={String(block.itemCount)}
            onChange={(event) =>
              onChange({ itemCount: Math.min(10, Math.max(1, Number(event.target.value) || 1)) })
            }
          />
        }
      />
    </div>
  )
}

function WeightingFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  return (
    <CollapsibleSection title="Weighting">
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
        ) : (
          <p className="text-xs text-gray-500">Using the global weights from Master Design.</p>
        )}
      </div>
    </CollapsibleSection>
  )
}

function VisibilityFields({
  block,
  onChange,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
}) {
  return (
    <CollapsibleSection title="Visibility">
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
    </CollapsibleSection>
  )
}

function BlockSettings({
  block,
  masterDesign,
  sectionOptions,
  onMasterChange,
  onChange,
}: {
  block: Report360Block
  masterDesign: Report360MasterDesign
  sectionOptions: SelectOption[]
  onMasterChange: (next: Report360MasterDesign) => void
  onChange: (patch: Partial<Report360Block>) => void
}) {
  if (block.type === 'masterDesign') {
    return <MasterDesignFields design={masterDesign} onChange={onMasterChange} />
  }

  const scored = REPORT360_SCORED_BLOCK_TYPES.includes(block.type)

  return (
    <div className="space-y-6">
      <GeneralFields block={block} sectionOptions={sectionOptions} onChange={onChange} />

      {block.type === 'cover' ? <CoverFields block={block} onChange={onChange} /> : null}
      {block.type === 'competencyDetail' ? <DisplayOptionFields block={block} onChange={onChange} /> : null}
      {block.type === 'spiderChart' ? <SpiderFields block={block} onChange={onChange} /> : null}
      {block.type === 'priorityComments' ? <CommentsFields block={block} onChange={onChange} /> : null}
      {block.type === 'aiRecommendations' ? <AiFields block={block} onChange={onChange} /> : null}
      {block.type === 'keyDevelopmentAreas' ? (
        <ItemCountField block={block} label="Development areas to show" onChange={onChange} />
      ) : null}
      {block.type === 'strengthGrowthIndicators' ? (
        <ItemCountField block={block} label="Items per column" onChange={onChange} />
      ) : null}
      {block.type === 'overallData' ? (
        <ItemCountField block={block} label="Behaviors to show" onChange={onChange} />
      ) : null}
      {block.type === 'rankingByRelationship' ? (
        <div className="max-w-[220px]">
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
        </div>
      ) : null}
      {block.type === 'actionPlan' ? (
        <div>
          <SectionHeading>Priorities</SectionHeading>
          <div className="flex flex-wrap gap-3">
            {PRIORITY_OPTIONS.map((option) => {
              const checked = block.actionPlanPriorities.includes(option.value)
              return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <WuCheckbox
                    checked={checked}
                    onChange={() =>
                      onChange({
                        actionPlanPriorities: checked
                          ? block.actionPlanPriorities.filter((item) => item !== option.value)
                          : [...block.actionPlanPriorities, option.value],
                      })
                    }
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
      {block.type === 'customContent' ? (
        <div>
          <SectionHeading>Page content</SectionHeading>
          <TextArea
            rows={6}
            value={block.customBody}
            onChange={(customBody) => onChange({ customBody })}
          />
          <p className="mt-2 text-xs text-gray-500">
            Free-form page. Use it for a leadership message, the competency model, or program next
            steps.
          </p>
        </div>
      ) : null}

      {scored ? <WeightingFields block={block} onChange={onChange} /> : null}
      {scored ? (
        <CollapsibleSection title="Benchmark">
          <p className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Coming in Phase 3
          </p>
        </CollapsibleSection>
      ) : null}
      <VisibilityFields block={block} onChange={onChange} />
    </div>
  )
}

export function ReportBuilder({ survey }: { survey: Survey360 }) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const { template, setTemplate, save, reset } = useReport360Template(survey.id)
  const [expandedId, setExpandedId] = useState('block_competencyDetail')
  const [dragId, setDragId] = useState<string | null>(null)

  const sectionOptions = useMemo<SelectOption[]>(
    () => survey.sections.map((section) => ({ value: section.title, label: section.title })),
    [survey.sections],
  )

  const presetOptions: SelectOption[] = REPORT360_PRESETS.map((preset) => ({
    value: preset.id,
    label: preset.name,
  }))

  const errors = useMemo(() => {
    const list: string[] = []
    if (
      template.masterDesign.globalWeightsEnabled &&
      weightTotal(template.masterDesign.relationshipWeights) !== 100
    ) {
      list.push('Global relationship weights must equal 100%.')
    }
    template.blocks.forEach((block) => {
      if (block.enabled && block.useBlockWeights && weightTotal(block.relationshipWeights) !== 100) {
        list.push(`${block.title} weights must equal 100%.`)
      }
    })
    const spider = template.blocks.find((block) => block.type === 'spiderChart')
    if (spider?.enabled && spider.spiderCompetencyIds.length < 3) {
      list.push('Spider / Radar Chart needs at least 3 competencies.')
    }
    const comments = template.blocks.find((block) => block.type === 'priorityComments')
    if (comments?.enabled && comments.commentQuestionIds.length === 0) {
      list.push('Priority Comments & Evidence needs at least one question.')
    }
    return list
  }, [template])

  function updateBlock(blockId: string, patch: Partial<Report360Block>) {
    setTemplate({
      ...template,
      blocks: template.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    })
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const index = template.blocks.findIndex((block) => block.id === blockId)
    const target = index + direction
    if (index < 1 || target < 1 || target >= template.blocks.length) return
    const next = [...template.blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setTemplate({ ...template, blocks: next })
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
    if (errors.length > 0) {
      showToast({ message: errors[0], variant: 'error' })
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

  function handlePreset(presetId: string) {
    const preset = REPORT360_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setTemplate(applyReport360Preset(template, presetId))
    showToast({ message: `${preset.name} preset applied. Save to keep it.`, variant: 'success' })
  }

  const enabledCount = template.blocks.filter((block) => block.enabled && !block.locked).length

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-4">
        <div>
          <p className="text-xs text-gray-500">{survey.title}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Report Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            {enabledCount} blocks enabled · drag to reorder
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[180px]">
            <WuSelect
              data={presetOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={null}
              onSelect={(option) => {
                const presetId = (option as SelectOption | null)?.value
                if (presetId) handlePreset(presetId)
              }}
              variant="outlined"
              placeholder="Start from preset"
            />
          </div>
          <WuButton variant="secondary" onClick={() => setExpandedId('block_masterDesign')}>
            Configure Template
          </WuButton>
          <WuButton variant="secondary" onClick={() => router.push(`/360/reports/${survey.id}/preview`)}>
            Preview
          </WuButton>
          <WuButton
            onClick={() =>
              showToast({
                message: 'PDF download is a prototype action. Use Preview to review pages.',
                variant: 'success',
              })
            }
          >
            Download PDFs
          </WuButton>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-6 py-6">
        {template.blocks.map((block, blockIndex) => {
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
                <span className="w-5 text-right text-sm tabular-nums text-gray-500">
                  {blockIndex + 1}
                </span>
                {block.locked ? (
                  <span className="w-4" aria-hidden />
                ) : (
                  <span className="flex flex-col leading-none">
                    <button
                      type="button"
                      className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label={`Move ${block.title} up`}
                      disabled={blockIndex <= 1}
                      onClick={() => moveBlock(block.id, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label={`Move ${block.title} down`}
                      disabled={blockIndex >= template.blocks.length - 1}
                      onClick={() => moveBlock(block.id, 1)}
                    >
                      ▼
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpandedId(expanded ? '' : block.id)}
                >
                  <span className="font-medium text-gray-900">{block.title}</span>
                  {block.title !== block.defaultTitle ? (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({block.defaultTitle})
                    </span>
                  ) : null}
                  <span className="ml-3 text-sm font-normal text-gray-400">
                    {REPORT360_BLOCK_DESCRIPTIONS[block.type]}
                  </span>
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
                  <BlockSettings
                    block={block}
                    masterDesign={template.masterDesign}
                    sectionOptions={
                      sectionOptions.length > 0
                        ? sectionOptions
                        : [{ value: 'Inclusive Leadership', label: 'Inclusive Leadership' }]
                    }
                    onMasterChange={(masterDesign) => setTemplate({ ...template, masterDesign })}
                    onChange={(patch) => updateBlock(block.id, patch)}
                  />
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <footer className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
        {errors.length > 0 ? (
          <p className="mr-auto text-sm text-red-600">
            {errors[0]}
            {errors.length > 1 ? ` (+${errors.length - 1} more)` : ''}
          </p>
        ) : null}
        <WuButton variant="secondary" onClick={handleReset}>
          Reset
        </WuButton>
        <WuButton onClick={handleSave} disabled={errors.length > 0}>
          Save Changes
        </WuButton>
      </footer>
    </div>
  )
}
