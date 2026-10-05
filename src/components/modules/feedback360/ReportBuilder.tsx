'use client'

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import '@npm-questionpro/wick-ui-editor/dist/style.css'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ReportPreview } from '@/components/modules/feedback360/ReportPreview'
import {
  REPORT360_BLOCK_DEFAULT_TITLES,
  REPORT360_BLOCK_DESCRIPTIONS,
  REPORT360_COMPETENCIES,
  REPORT360_CONSTANT_BLOCK_TYPES,
  REPORT360_MERGE_VARIABLES,
  REPORT360_RELATIONSHIPS,
  REPORT360_RELATIONSHIP_LABELS,
  REPORT360_SCORED_BLOCK_TYPES,
  REPORT360_STARTER_BLOCK_TYPES,
  REPORT360_TEMPLATE_OPTIONS,
  cloneReport360Template,
  createDefaultReport360Template,
  createReport360Block,
  createDefaultReportBlocks,
  report360SpiderQuestions,
  type Report360Block,
  type Report360BlockType,
  type Report360CoverTemplate,
  type Report360LogoAsset,
  type Report360MasterDesign,
  type Report360Relationship,
  type Report360RelationshipIcon,
  type Report360Template,
} from '@/data/mock-360-reports'
import { MOCK_STUDIES, STUDY_FOLDERS } from '@/data/mock-studies'
import { preventModalDismiss } from '@/lib/modalProps'
import { weightTotal } from '@/lib/report360Scoring'
import { getReport360Template, useReport360Template } from '@/lib/report360Store'
import { cn } from '@/lib/utils'
import { mockSurveys360, type Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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
const WuContentEditor = dynamic(
  () => import('@npm-questionpro/wick-ui-editor').then((mod) => ({ default: mod.WuContentEditor })),
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
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Avant Garde', label: 'Avant Garde' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana Pro', label: 'Verdana Pro' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Tahoma', label: 'Tahoma' },
]

const CHART_OPTIONS: SelectOption[] = [
  { value: 'bar', label: 'Default' },
  { value: 'horizontalBar', label: 'Horizontal bar chart' },
]

const DISPLAY_RANK_OPTIONS: SelectOption[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
]

const BEHAVIOR_COUNT_OPTIONS: SelectOption[] = [1, 2, 3, 4, 5].map((count) => ({
  value: String(count),
  label: String(count),
}))

const RELATIONSHIP_OPTIONS: SelectOption[] = REPORT360_RELATIONSHIPS.map((key) => ({
  value: key,
  label: REPORT360_RELATIONSHIP_LABELS[key],
}))

const SETTINGS_GRID = 'settings-grid grid items-center gap-x-6 gap-y-1 md:grid-cols-2'

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: '#1', label: '#1' },
  { value: '#2', label: '#2' },
  { value: '#3', label: '#3' },
  { value: '#1 to #3', label: '#1 to #3' },
]

/** Prototype logos live in localStorage, so keep the data URL small. */
const MAX_LOGO_BYTES = 150 * 1024

const COVER_TEMPLATES: { value: Report360CoverTemplate; label: string; hint: string; imageSize: string }[] = [
  { value: 'classic', label: 'Left', hint: 'Name at the top left. An uploaded image sits beside it.', imageSize: '350 × 460 px' },
  { value: 'centered', label: 'Center', hint: 'Title centered. An uploaded image fills the top of the page.', imageSize: '1240 × 540 px' },
  { value: 'split', label: 'Split', hint: 'Color band on the left. An uploaded image fills that band.', imageSize: '410 × 1670 px' },
]

function CoverTextEditor({
  value,
  editorKey,
  onChange,
  showVariables = false,
}: {
  value: string
  editorKey: string | number
  onChange: (next: string) => void
  showVariables?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)

  function editorSurface() {
    const surface = rootRef.current?.querySelector('.ProseMirror')
    return surface instanceof HTMLElement ? surface : null
  }

  function insertToken(token: string) {
    if (!token) return
    const surface = editorSurface()
    if (!surface) return
    surface.focus()
    const selection = window.getSelection()
    if (savedRange.current && selection) {
      selection.removeAllRanges()
      selection.addRange(savedRange.current)
    }
    document.execCommand('insertText', false, token)
  }

  return (
    <div ref={rootRef}>
      <WuContentEditor
        key={editorKey}
        defaultValue={value}
        toolbarPosition="top"
        customFonts={FONT_OPTIONS.map((font) => font.value).filter((font) => font !== 'Fira Sans')}
        onUpdate={onChange}
        customToolbarChildren={
          showVariables ? (
          <select
            aria-label="Insert variable"
            className="ml-1 h-8 rounded border border-transparent bg-transparent px-1 text-xs text-gray-600 hover:border-gray-200"
            defaultValue=""
            onMouseDown={() => {
              const selection = window.getSelection()
              if (!selection || selection.rangeCount === 0) return
              const range = selection.getRangeAt(0)
              if (editorSurface()?.contains(range.commonAncestorContainer)) {
                savedRange.current = range.cloneRange()
              }
            }}
            onChange={(event) => {
              insertToken(event.target.value)
              event.target.value = ''
            }}
          >
            <option value="">Insert variable</option>
            {REPORT360_MERGE_VARIABLES.map((variable) => (
              <option key={variable.token} value={variable.token}>
                {variable.description}
              </option>
            ))}
          </select>
          ) : undefined
        }
      />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-sm text-gray-700">{children}</p>
}

function TextArea({
  value,
  onChange,
  id,
  resetKey = 0,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  id?: string
  resetKey?: string | number
}) {
  const editorKey = useId()
  return (
    <div id={id}>
      <CoverTextEditor value={value} editorKey={`${editorKey}-${resetKey}`} onChange={onChange} />
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

function LimitedLineField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [writing, setWriting] = useState(false)
  const showLimit = writing && value.length > 0

  return (
    <div className="relative" onFocus={() => setWriting(true)} onBlur={() => setWriting(false)}>
      <WuInput
        variant="outlined"
        value={value}
        maxLength={100}
        className={showLimit ? '!pr-14' : undefined}
        onChange={(event) => onChange(event.target.value.slice(0, 100))}
      />
      {showLimit ? (
        <>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-b bg-[#1B87E6]" />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-green-600">
            {value.length}/100
          </span>
        </>
      ) : null}
    </div>
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
        'field-row grid min-w-0 grid-cols-[minmax(7.5rem,13.5rem)_minmax(0,1fr)] gap-x-3 py-2.5',
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
  sizeHint,
}: {
  logo: Report360LogoAsset | null
  onChange: (next: Report360LogoAsset | null) => void
  disabled?: boolean
  emptyLabel: string
  sizeHint?: string
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
        <div className="flex h-9 items-center gap-2 rounded border border-gray-200 px-2.5">
          <LogoThumb logo={logo} />
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{logo.name}</span>
          {sizeHint ? <span className="shrink-0 text-xs text-gray-400">{sizeHint}</span> : null}
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
          className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:border-gray-400"
        >
          <span className="wm-image text-base text-gray-400" aria-hidden />
          <span className="min-w-0 truncate">{emptyLabel}</span>
          {sizeHint ? <span className="shrink-0 text-xs text-gray-400">{sizeHint}</span> : null}
        </label>
      )}
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

function MasterDesignFields({
  design,
  onChange,
}: {
  design: Report360MasterDesign
  onChange: (next: Report360MasterDesign) => void
}) {
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [iconsOpen, setIconsOpen] = useState(false)
  const [iconsDraft, setIconsDraft] = useState(design.relationshipIcons)
  const [weightsDraft, setWeightsDraft] = useState({
    enabled: design.globalWeightsEnabled,
    weights: design.relationshipWeights,
  })
  const fontValue = FONT_OPTIONS.find((item) => item.value === design.fontFamily) ?? FONT_OPTIONS[0]
  const weightsOk = !design.globalWeightsEnabled || weightTotal(design.relationshipWeights) === 100
  const draftWeightsOk = !weightsDraft.enabled || weightTotal(weightsDraft.weights) === 100

  return (
    <div className="space-y-8">
      <section>
        <SectionHeading>Header &amp; page</SectionHeading>
        <div className={SETTINGS_GRID}>
          <FieldRow label="Report logo">
            <WuToggle
              checked={design.showLogo}
              onChange={(checked) => onChange({ ...design, showLogo: checked })}
            />
          </FieldRow>
          <FieldRow label="Page number">
            <WuToggle
              checked={design.pageNumbering}
              onChange={(checked) => onChange({ ...design, pageNumbering: checked })}
            />
          </FieldRow>
          <FieldRow
            label={
              <>
                Left header logo
                <InfoTip text="Appears in the top-left of every report page. PNG or JPEG." />
              </>
            }
          >
            <LogoField
              logo={design.leftHeaderLogo}
              emptyLabel="Add left header logo"
              disabled={!design.showLogo}
              onChange={(leftHeaderLogo) => onChange({ ...design, leftHeaderLogo })}
            />
          </FieldRow>
          <FieldRow label="Left header text">
            <LimitedLineField
              value={design.headerText}
              onChange={(headerText) => onChange({ ...design, headerText })}
            />
          </FieldRow>
          <FieldRow
            label={
              <>
                Right header logo
                <InfoTip text="Appears in the top-right of every report page. PNG or JPEG." />
              </>
            }
          >
            <LogoField
              logo={design.rightHeaderLogo}
              emptyLabel="Add right header logo"
              disabled={!design.showLogo}
              onChange={(rightHeaderLogo) => onChange({ ...design, rightHeaderLogo })}
            />
          </FieldRow>
          <FieldRow label="Footer text">
            <LimitedLineField
              value={design.footerText}
              onChange={(footerText) => onChange({ ...design, footerText })}
            />
          </FieldRow>
        </div>
        <p className="mt-2 text-xs text-gray-400">Logos accept PNG and JPEG files.</p>
      </section>

      <section>
        <SectionHeading>Typography &amp; table</SectionHeading>
        <div className={SETTINGS_GRID}>
          <FieldRow label="Font">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
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
              </div>
              <ColorField
                value={design.fontColor}
                onChange={(fontColor) => onChange({ ...design, fontColor })}
              />
            </div>
          </FieldRow>
          <FieldRow label="Theme color">
            <ColorField
              value={design.themeColor}
              onChange={(themeColor) => onChange({ ...design, themeColor })}
            />
          </FieldRow>
          <FieldRow label="Table heading text color">
            <ColorField
              value={design.tableHeadingTextColor}
              onChange={(tableHeadingTextColor) => onChange({ ...design, tableHeadingTextColor })}
            />
          </FieldRow>
          <FieldRow label="Table background 1">
            <ColorField
              value={design.tableBackground1}
              onChange={(tableBackground1) => onChange({ ...design, tableBackground1 })}
            />
          </FieldRow>
          <FieldRow label="Table border">
            <ColorField
              value={design.tableBorderColor}
              onChange={(tableBorderColor) => onChange({ ...design, tableBorderColor })}
            />
          </FieldRow>
          <FieldRow label="Table background 2">
            <ColorField
              value={design.tableBackground2}
              onChange={(tableBackground2) => onChange({ ...design, tableBackground2 })}
            />
          </FieldRow>
        </div>
      </section>

      <section>
        <SectionHeading>Relationships &amp; categories</SectionHeading>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
          <button
            type="button"
            className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50"
            onClick={() => {
              setIconsDraft(design.relationshipIcons)
              setIconsOpen(true)
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900">Relationship icons</span>
              <span className="mt-1.5 block">
                <RelationshipIconPills icons={design.relationshipIcons} />
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-blue-700">Edit</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50"
            onClick={() => {
              setWeightsDraft({
                enabled: design.globalWeightsEnabled,
                weights: design.relationshipWeights,
              })
              setWeightsOpen(true)
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900">Relationship weight configuration</span>
              <span className={cn('mt-0.5 block text-xs', weightsOk ? 'text-gray-500' : 'text-red-600')}>
                {design.globalWeightsEnabled
                  ? `Custom weights · ${weightTotal(design.relationshipWeights)}%`
                  : 'All relationships weighted equally'}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-blue-700">Edit</span>
          </button>
        </div>
      </section>

      <section>
        <SectionHeading>Scoring</SectionHeading>
        <div className={SETTINGS_GRID}>
          <FieldRow label="Exclude self in priority score">
            <WuToggle
              checked={design.excludeSelfInPriorityScore}
              onChange={(checked) => onChange({ ...design, excludeSelfInPriorityScore: checked })}
            />
          </FieldRow>
          <FieldRow label="Exclude self in average score">
            <WuToggle
              checked={design.excludeSelfInAverageScore}
              onChange={(checked) => onChange({ ...design, excludeSelfInAverageScore: checked })}
            />
          </FieldRow>
          <FieldRow label="Show category headers">
            <WuToggle
              checked={design.showCategoryHeaders}
              onChange={(checked) => onChange({ ...design, showCategoryHeaders: checked })}
            />
          </FieldRow>
          <FieldRow label="Category header title">
            <div className={cn(!design.showCategoryHeaders && 'pointer-events-none opacity-40')}>
              <WuInput
                variant="outlined"
                value={design.categoryHeaderTitle}
                onChange={(event) => onChange({ ...design, categoryHeaderTitle: event.target.value })}
              />
            </div>
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
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <p className="mb-4 text-sm text-gray-500">
            These weights apply to every block where a mean is calculated, unless a block overrides
            them.
          </p>
          <WuToggle
            Label="Apply relationship weights globally"
            checked={weightsDraft.enabled}
            onChange={(checked) => setWeightsDraft((current) => ({ ...current, enabled: checked }))}
          />
          {weightsDraft.enabled ? (
            <div className="mt-4">
              <WeightSliders
                weights={weightsDraft.weights}
                onChange={(weights) => setWeightsDraft((current) => ({ ...current, weights }))}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              All relationships contribute equally until you turn this on.
            </p>
          )}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({
                ...design,
                globalWeightsEnabled: weightsDraft.enabled,
                relationshipWeights: weightsDraft.weights,
              })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={iconsOpen}
        onOpenChange={setIconsOpen}
        variant="action"
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>Relationship icons</WuModalHeader>
        <WuModalContent>
          <p className="mb-4 text-sm text-gray-500">
            Letter and color used for each relationship in tables and charts.
          </p>
          <div className="space-y-3">
            {RELATIONSHIPS.map((key) => (
              <div key={key} className="grid grid-cols-[8.5rem_4.5rem_auto] items-center gap-3">
                <span className="text-sm text-gray-800">{REPORT360_RELATIONSHIP_LABELS[key]}</span>
                <WuInput
                  variant="outlined"
                  value={iconsDraft[key]?.letter ?? ''}
                  aria-label={`${REPORT360_RELATIONSHIP_LABELS[key]} letter`}
                  onChange={(event) =>
                    setIconsDraft((current) => ({
                      ...current,
                      [key]: {
                        ...current[key],
                        letter: event.target.value.slice(0, 2).toUpperCase(),
                      },
                    }))
                  }
                />
                <ColorField
                  value={iconsDraft[key]?.color ?? '#6B7280'}
                  onChange={(color) =>
                    setIconsDraft((current) => ({
                      ...current,
                      [key]: { ...current[key], color },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setIconsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            onClick={() => {
              onChange({ ...design, relationshipIcons: iconsDraft })
              setIconsOpen(false)
            }}
          >
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
  const showDataSource = ![
    'cover',
    'introduction',
    'nominatedRaters',
    'customContent',
    'executiveSummary',
  ].includes(block.type)
  const isCustomTitle = block.title !== block.defaultTitle

  return (
    <div>
      <SectionHeading>General</SectionHeading>
      <div className={block.type === 'introduction' || showDataSource ? SETTINGS_GRID : undefined}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        {block.type === 'introduction' ? (
          <FieldRow label="Relationship icons">
            <WuToggle
              checked={block.relationshipIcons}
              onChange={(relationshipIcons) => onChange({ relationshipIcons })}
            />
          </FieldRow>
        ) : showDataSource ? (
          <FieldRow label="Data source">
            <WuSelect
              data={sectionOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={dataSource}
              onSelect={(option) =>
                onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
              }
              variant="outlined"
            />
          </FieldRow>
        ) : null}
      </div>
      {block.type !== 'customContent' ? (
        <div className="mt-3">
          <FieldLabel>Introduction</FieldLabel>
          <TextArea value={block.introduction} onChange={(introduction) => onChange({ introduction })} />
        </div>
      ) : null}
      {REPORT360_SCORED_BLOCK_TYPES.includes(block.type) || block.type === 'executiveSummary' ? (
        <div className="mt-3">
          <FieldLabel>Closing text</FieldLabel>
          <TextArea value={block.closingText} onChange={(closingText) => onChange({ closingText })} />
        </div>
      ) : null}
    </div>
  )
}

function CoverFields({
  block,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-4 border-b border-gray-100 pb-1">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cover template</h4>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            Background
            <ColorField
              value={block.coverBackgroundColor}
              onChange={(coverBackgroundColor) => onChange({ coverBackgroundColor })}
            />
          </div>
        </div>
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
                    <div className="flex h-full w-full items-start justify-between px-2 py-2">
                      <div className="mt-1">
                        <div className="h-1.5 w-10 rounded bg-white/80" />
                        <div className="mt-1 h-1 w-7 rounded bg-white/50" />
                      </div>
                      <div className="h-8 w-5 bg-white/20" />
                    </div>
                  ) : null}
                  {template.value === 'centered' ? (
                    <div className="flex h-full w-full flex-col">
                      <div className="h-[46%] bg-white/20" />
                      <div className="flex flex-1 flex-col items-center justify-center px-3">
                        <div className="h-1.5 w-2/3 rounded bg-white/80" />
                        <div className="mt-1 h-1 w-1/3 rounded bg-white/50" />
                      </div>
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
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow align="start" label="Cover image">
          <LogoField
            logo={block.coverImage}
            emptyLabel="Add cover image"
            sizeHint={COVER_TEMPLATES.find((item) => item.value === block.coverTemplate)?.imageSize}
            onChange={(coverImage) => onChange({ coverImage })}
          />
        </FieldRow>
        <FieldRow label="Relationship icons">
          <WuToggle
            checked={block.relationshipIcons}
            onChange={(relationshipIcons) => onChange({ relationshipIcons })}
          />
        </FieldRow>
      </div>
      <div className={SETTINGS_GRID}>
        <FieldRow label="Survey respondents">
          <WuToggle
            checked={block.showSurveyRespondents}
            onChange={(showSurveyRespondents) => onChange({ showSurveyRespondents })}
          />
        </FieldRow>
        <FieldRow label="Exclude zero responses">
          <WuToggle
            checked={block.excludeZeroResponses}
            onChange={(excludeZeroResponses) => onChange({ excludeZeroResponses })}
          />
        </FieldRow>
        <FieldRow label="Survey respondents - total sent">
          <WuToggle
            checked={block.showTotalSent}
            onChange={(showTotalSent) => onChange({ showTotalSent })}
          />
        </FieldRow>
        <FieldRow label="Nominated raters">
          <WuToggle
            checked={block.showNominatedRatersOnCover}
            onChange={(showNominatedRatersOnCover) => onChange({ showNominatedRatersOnCover })}
          />
        </FieldRow>
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow label="Report label">
          <WuInput
            variant="outlined"
            value={block.coverLabel}
            onChange={(event) => onChange({ coverLabel: event.target.value })}
          />
        </FieldRow>
      </div>

      <div>
        <p className="mb-2 text-sm text-gray-700">Text content</p>
        <CoverTextEditor
          editorKey={editorKey}
          value={block.coverBody}
          showVariables
          onChange={(coverBody) => onChange({ coverBody })}
        />
      </div>

      <div>
        <SectionHeading>Back cover</SectionHeading>
        <div className={SETTINGS_GRID}>
          <FieldRow label="Include back cover">
            <WuToggle
              checked={block.includeBackCover}
              onChange={(includeBackCover) => onChange({ includeBackCover })}
            />
          </FieldRow>
          {block.includeBackCover ? (
            <FieldRow label="Show logo on back cover">
              <WuToggle
                checked={block.backCoverLogo}
                onChange={(backCoverLogo) => onChange({ backCoverLogo })}
              />
            </FieldRow>
          ) : null}
        </div>
        {block.includeBackCover ? (
          <div className="mt-2 space-y-4">
            <div className={SETTINGS_GRID}>
              <FieldRow label="Contact name">
                <WuInput
                  variant="outlined"
                  value={block.contactName}
                  onChange={(event) => onChange({ contactName: event.target.value })}
                />
              </FieldRow>
              <FieldRow label="Contact email">
                <WuInput
                  variant="outlined"
                  value={block.contactEmail}
                  onChange={(event) => onChange({ contactEmail: event.target.value })}
                />
              </FieldRow>
            </div>
            <div>
              <FieldLabel>Confidentiality note</FieldLabel>
              <TextArea
                resetKey={editorKey}
                value={block.confidentialityNote}
                onChange={(confidentialityNote) => onChange({ confidentialityNote })}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            onReset()
            setEditorKey((key) => key + 1)
          }}
        >
          <span className="wm-refresh mr-1 text-sm" aria-hidden />
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function RankingByBehaviorFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100


  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>


      <FieldRow label="Relationship weight configuration">
        <WuButton
          variant="secondary"
          onClick={() => {
            setWeightsDraft(block.relationshipWeights)
            setOverrideDraft(block.useBlockWeights)
            setWeightsOpen(true)
          }}
        >
          {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
        </WuButton>
      </FieldRow>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>


      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function PriorityAreasFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function SurveyRespondentsFields({
  block,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <FieldRow label="Title" align="start">
        <WuInput
          variant="outlined"
          value={block.title}
          onChange={(event) => onChange({ title: event.target.value })}
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
      </FieldRow>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow label="Show survey respondents - total sent">
          <WuToggle
            checked={block.showTotalSent}
            onChange={(showTotalSent) => onChange({ showTotalSent })}
          />
        </FieldRow>
        <FieldRow label="Exclude zero responses">
          <WuToggle
            checked={block.excludeZeroResponses}
            onChange={(excludeZeroResponses) => onChange({ excludeZeroResponses })}
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function PrioritySurveyFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100

  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow label="Priority text">
          <WuInput
            variant="outlined"
            value={block.priorityText}
            onChange={(event) => onChange({ priorityText: event.target.value })}
          />
        </FieldRow>
        <FieldRow label="Relationship weight configuration">
          <WuButton
            variant="secondary"
            onClick={() => {
              setWeightsDraft(block.relationshipWeights)
              setOverrideDraft(block.useBlockWeights)
              setWeightsOpen(true)
            }}
          >
            {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
          </WuButton>
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>

      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function PresentationTextFields({
  block,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <FieldRow label="Title" align="start">
        <WuInput
          variant="outlined"
          value={block.title}
          onChange={(event) => onChange({ title: event.target.value })}
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
      </FieldRow>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function NominatedRatersFields({
  block,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <FieldRow label="Title" align="start">
        <WuInput
          variant="outlined"
          value={block.title}
          onChange={(event) => onChange({ title: event.target.value })}
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
      </FieldRow>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function DevelopmentResultsFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const selectedPriorities = PRIORITY_OPTIONS.filter((item) => block.actionPlanPriorities.includes(item.value))
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <FieldRow label="Priorities">
        <WuSelect
          data={PRIORITY_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selectedPriorities}
          multiple
          placeholder="Nothing selected"
          onSelect={(value: unknown) => {
            const next = (Array.isArray(value) ? value : value ? [value] : []) as SelectOption[]
            onChange({ actionPlanPriorities: next.map((option) => option.value) })
          }}
          variant="outlined"
        />
      </FieldRow>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function AiSummaryFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const sourceOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [{ value: 'All', label: 'All' }]
    const seen = new Set<string>(['All'])
    ;[
      ...sectionOptions,
      ...REPORT360_COMPETENCIES.map((competency) => ({ value: competency.name, label: competency.name })),
    ].forEach((option) => {
      if (seen.has(option.value)) return
      seen.add(option.value)
      options.push(option)
    })
    return options
  }, [sectionOptions])
  const dataSource = sourceOptions.find((item) => item.value === block.dataSource) ?? sourceOptions[0]
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)

  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sourceOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? 'All' })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow label="Merge comments">
          <WuToggle
            checked={block.commentDisplayMode === 'combined'}
            onChange={(merged) => onChange({ commentDisplayMode: merged ? 'combined' : 'grouped' })}
          />
        </FieldRow>
        <FieldRow label="Generate recommendations">
          <WuToggle
            checked={block.generateRecommendations}
            onChange={(generateRecommendations) => onChange({ generateRecommendations })}
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>
    </div>
  )
}

function OptionCell({ label, children }: { label: string; children: React.ReactNode }) {
  return <FieldRow label={label}>{children}</FieldRow>
}

function AllItemsFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? sectionOptions[0]
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100


  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>


      <div className={SETTINGS_GRID}>
        <OptionCell label="Priority column">
          <WuToggle
            checked={block.priorityColumn}
            onChange={(priorityColumn) => onChange({ priorityColumn })}
          />
        </OptionCell>
        <OptionCell label="Mean column">
          <WuToggle checked={block.meanColumn} onChange={(meanColumn) => onChange({ meanColumn })} />
        </OptionCell>
        <OptionCell label="Chart type">
          <div className="w-full">
            <WuSelect
              data={CHART_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={chartValue}
              onSelect={(option) =>
                onChange({
                  chartType: ((option as SelectOption | null)?.value as 'bar' | 'horizontalBar') ?? block.chartType,
                })
              }
              variant="outlined"
            />
          </div>
        </OptionCell>
        <OptionCell label="Relationship icons">
          <WuToggle
            checked={block.relationshipIcons}
            onChange={(relationshipIcons) => onChange({ relationshipIcons })}
          />
        </OptionCell>
        <OptionCell label="Behaviours per page">
          <WuInput
            variant="outlined"
            type="number"
            value={String(block.behavioursPerPage)}
            onChange={(event) =>
              onChange({ behavioursPerPage: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </OptionCell>
        <OptionCell label="Relationship weight configuration">
          <WuButton
            variant="secondary"
            onClick={() => {
              setWeightsDraft(block.relationshipWeights)
              setOverrideDraft(block.useBlockWeights)
              setWeightsOpen(true)
            }}
          >
            {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
          </WuButton>
        </OptionCell>
        <OptionCell label="Priority text">
          <WuInput
            variant="outlined"
            value={block.priorityText}
            disabled={!block.priorityColumn}
            onChange={(event) => onChange({ priorityText: event.target.value })}
          />
        </OptionCell>
        <OptionCell label="Enable tabular data">
          <WuToggle
            checked={block.tabularData}
            onChange={(tabularData) => onChange({ tabularData })}
          />
        </OptionCell>
        <OptionCell label="AI insights">
          <WuToggle
            checked={block.qxBotInsights}
            onChange={(qxBotInsights) => onChange({ qxBotInsights })}
          />
        </OptionCell>
        <OptionCell label="Tabular data heading">
          <WuInput
            variant="outlined"
            value={block.tabularDataHeading}
            disabled={!block.tabularData}
            placeholder="Table heading"
            onChange={(event) => onChange({ tabularDataHeading: event.target.value })}
          />
        </OptionCell>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>


      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function OverallDataFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]
  const displayValue =
    DISPLAY_RANK_OPTIONS.find((item) => item.value === block.behaviorDisplay) ?? DISPLAY_RANK_OPTIONS[0]
  const count = Math.min(5, Math.max(1, block.itemCount || 1))
  const countValue =
    BEHAVIOR_COUNT_OPTIONS.find((item) => item.value === String(count)) ?? BEHAVIOR_COUNT_OPTIONS[0]
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100


  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>


      <div className={SETTINGS_GRID}>
        <OptionCell label="Priority column">
          <WuToggle
            checked={block.priorityColumn}
            onChange={(priorityColumn) => onChange({ priorityColumn })}
          />
        </OptionCell>
        <OptionCell label="Display">
          <div className="flex items-center gap-2">
            <div className="w-28">
              <WuSelect
                data={DISPLAY_RANK_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={displayValue}
                onSelect={(option) =>
                  onChange({
                    behaviorDisplay:
                      ((option as SelectOption | null)?.value as 'top' | 'bottom') ?? block.behaviorDisplay,
                  })
                }
                variant="outlined"
              />
            </div>
            <div className="w-20">
              <WuSelect
                data={BEHAVIOR_COUNT_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={countValue}
                onSelect={(option) =>
                  onChange({
                    itemCount: Math.min(5, Math.max(1, Number((option as SelectOption | null)?.value) || 1)),
                  })
                }
                variant="outlined"
              />
            </div>
            <span className="text-sm text-gray-700">Behaviors</span>
          </div>
        </OptionCell>
        <OptionCell label="Chart type">
          <WuSelect
            data={CHART_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={chartValue}
            onSelect={(option) =>
              onChange({
                chartType: ((option as SelectOption | null)?.value as 'bar' | 'horizontalBar') ?? block.chartType,
              })
            }
            variant="outlined"
          />
        </OptionCell>
        <OptionCell label="Mean column">
          <WuToggle checked={block.meanColumn} onChange={(meanColumn) => onChange({ meanColumn })} />
        </OptionCell>
        <OptionCell label="Priority text">
          <WuInput
            variant="outlined"
            value={block.priorityText}
            disabled={!block.priorityColumn}
            onChange={(event) => onChange({ priorityText: event.target.value })}
          />
        </OptionCell>
        <OptionCell label="Relationship icons">
          <WuToggle
            checked={block.relationshipIcons}
            onChange={(relationshipIcons) => onChange({ relationshipIcons })}
          />
        </OptionCell>
        <div className="hidden md:block" aria-hidden />
        <OptionCell label="Relationship weight configuration">
          <WuButton
            variant="secondary"
            onClick={() => {
              setWeightsDraft(block.relationshipWeights)
              setOverrideDraft(block.useBlockWeights)
              setWeightsOpen(true)
            }}
          >
            {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
          </WuButton>
        </OptionCell>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>


      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function ActionPlanFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]
  const selectedPriorities = PRIORITY_OPTIONS.filter((item) => block.actionPlanPriorities.includes(item.value))
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)


  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>


      <div className="space-y-1">
        <FieldRow label="Priorities">
          <WuSelect
            data={PRIORITY_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedPriorities}
            multiple
            placeholder="Nothing selected"
            onSelect={(value: unknown) => {
              const next = (Array.isArray(value) ? value : value ? [value] : []) as SelectOption[]
              onChange({ actionPlanPriorities: next.map((option) => option.value) })
            }}
            variant="outlined"
          />
        </FieldRow>
        <FieldRow label="Manager comments">
          <WuToggle
            checked={block.showManagerComments}
            onChange={(showManagerComments) => onChange({ showManagerComments })}
          />
        </FieldRow>
        <FieldRow label="Priority column">
          <WuToggle
            checked={block.priorityColumn}
            onChange={(priorityColumn) => onChange({ priorityColumn })}
          />
        </FieldRow>
        <FieldRow label="Chart type">
          <WuSelect
            data={CHART_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={chartValue}
            onSelect={(option) =>
              onChange({
                chartType: ((option as SelectOption | null)?.value as 'bar' | 'horizontalBar') ?? block.chartType,
              })
            }
            variant="outlined"
          />
        </FieldRow>
        <FieldRow label="Behaviors per page">
          <WuInput
            variant="outlined"
            type="number"
            value={String(block.behavioursPerPage)}
            onChange={(event) =>
              onChange({ behavioursPerPage: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </FieldRow>
        <FieldRow label="Priority text">
          <WuInput
            variant="outlined"
            value={block.priorityText}
            disabled={!block.priorityColumn}
            onChange={(event) => onChange({ priorityText: event.target.value })}
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>

    </div>
  )
}

function RankingRelationshipFields({
  block,
  sectionOptions,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  sectionOptions: SelectOption[]
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const dataSource = sectionOptions.find((item) => item.value === block.dataSource) ?? null
  const chartValue = CHART_OPTIONS.find((item) => item.value === block.chartType) ?? CHART_OPTIONS[0]
  const displayValue =
    DISPLAY_RANK_OPTIONS.find((item) => item.value === block.behaviorDisplay) ?? DISPLAY_RANK_OPTIONS[0]
  const count = Math.min(5, Math.max(1, block.rankingCount || 1))
  const countValue =
    BEHAVIOR_COUNT_OPTIONS.find((item) => item.value === String(count)) ?? BEHAVIOR_COUNT_OPTIONS[0]
  const selectedRelationships = RELATIONSHIP_OPTIONS.filter((item) =>
    block.rankingRelationships.includes(item.value as Report360Relationship),
  )
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100


  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <WuSelect
            data={sectionOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={dataSource}
            onSelect={(option) =>
              onChange({ dataSource: (option as SelectOption | null)?.value ?? block.dataSource })
            }
            variant="outlined"
            placeholder="Select data source"
          />
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>


      <div className={SETTINGS_GRID}>
        <OptionCell label="Relationships">
          <WuSelect
            data={RELATIONSHIP_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedRelationships}
            multiple
            placeholder="Nothing selected"
            onSelect={(value: unknown) => {
              const next = (Array.isArray(value) ? value : value ? [value] : []) as SelectOption[]
              onChange({
                rankingRelationships: next.map((option) => option.value as Report360Relationship),
              })
            }}
            variant="outlined"
          />
        </OptionCell>
        <OptionCell label="Display">
          <div className="flex items-center gap-2">
            <div className="w-28">
              <WuSelect
                data={DISPLAY_RANK_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={displayValue}
                onSelect={(option) =>
                  onChange({
                    behaviorDisplay:
                      ((option as SelectOption | null)?.value as 'top' | 'bottom') ?? block.behaviorDisplay,
                  })
                }
                variant="outlined"
              />
            </div>
            <div className="w-20">
              <WuSelect
                data={BEHAVIOR_COUNT_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={countValue}
                onSelect={(option) =>
                  onChange({
                    rankingCount: Math.min(5, Math.max(1, Number((option as SelectOption | null)?.value) || 1)),
                  })
                }
                variant="outlined"
              />
            </div>
            <span className="text-sm text-gray-700">Behaviors</span>
          </div>
        </OptionCell>
        <OptionCell label="Manager comments">
          <WuToggle
            checked={block.showManagerComments}
            onChange={(showManagerComments) => onChange({ showManagerComments })}
          />
        </OptionCell>
        <OptionCell label="Mean column">
          <WuToggle checked={block.meanColumn} onChange={(meanColumn) => onChange({ meanColumn })} />
        </OptionCell>
        <OptionCell label="Priority column">
          <WuToggle
            checked={block.priorityColumn}
            onChange={(priorityColumn) => onChange({ priorityColumn })}
          />
        </OptionCell>
        <OptionCell label="Relationship icons">
          <WuToggle
            checked={block.relationshipIcons}
            onChange={(relationshipIcons) => onChange({ relationshipIcons })}
          />
        </OptionCell>
        <OptionCell label="Chart type">
          <WuSelect
            data={CHART_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={chartValue}
            onSelect={(option) =>
              onChange({
                chartType: ((option as SelectOption | null)?.value as 'bar' | 'horizontalBar') ?? block.chartType,
              })
            }
            variant="outlined"
          />
        </OptionCell>
        <OptionCell label="Relationship weight configuration">
          <WuButton
            variant="secondary"
            onClick={() => {
              setWeightsDraft(block.relationshipWeights)
              setOverrideDraft(block.useBlockWeights)
              setWeightsOpen(true)
            }}
          >
            {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
          </WuButton>
        </OptionCell>
        <OptionCell label="Priority text">
          <WuInput
            variant="outlined"
            value={block.priorityText}
            disabled={!block.priorityColumn}
            onChange={(event) => onChange({ priorityText: event.target.value })}
          />
        </OptionCell>
      </div>

      <div>
        <FieldLabel>Closing text</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.closingText}
          onChange={(closingText) => onChange({ closingText })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>


      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function ChecklistMultiSelect({
  options = [],
  groups = [],
  selectedIds,
  onChange,
  placeholder,
}: {
  options?: { id: string; label: string }[]
  groups?: { id: string; label: string; options: { id: string; label: string }[] }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const allIds = groups.length > 0 ? groups.flatMap((group) => group.options.map((option) => option.id)) : options.map((option) => option.id)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])
  const summary =
    selectedIds.length === 0
      ? placeholder
      : `${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} selected`

  function setChecked(id: string, checked: boolean) {
    if (checked) {
      onChange(selectedIds.includes(id) ? selectedIds : [...selectedIds, id])
      return
    }
    onChange(selectedIds.filter((item) => item !== id))
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded border border-gray-300 bg-white px-3 text-left text-sm"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-800'}>{summary}</span>
        <span className="text-gray-400" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-80 w-full min-w-[16rem] overflow-auto rounded border border-gray-200 bg-white shadow-lg">
          <div className="grid grid-cols-2 border-b border-gray-100 text-sm">
            <button type="button" className="px-3 py-2 text-blue-700 hover:bg-gray-50" onClick={() => onChange(allIds)}>
              Select All
            </button>
            <button
              type="button"
              className="border-l border-gray-100 px-3 py-2 text-blue-700 hover:bg-gray-50"
              onClick={() => onChange([])}
            >
              Deselect All
            </button>
          </div>
          {groups.length > 0
            ? groups.map((group) => (
                <div key={group.id} className="border-b border-gray-50 py-1">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-500">{group.label}</p>
                  {group.options.map((option) => (
                    <div key={option.id} className="px-3 py-1.5 text-sm text-gray-700">
                      <WuCheckbox
                        checked={selectedIds.includes(option.id)}
                        Label={option.label}
                        onChange={(checked) => setChecked(option.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              ))
            : options.map((option) => (
                <div key={option.id} className="px-3 py-1.5 text-sm text-gray-700">
                  <WuCheckbox
                    checked={selectedIds.includes(option.id)}
                    Label={option.label}
                    onChange={(checked) => setChecked(option.id, checked)}
                  />
                </div>
              ))}
          {allIds.length === 0 ? <p className="px-3 py-3 text-sm text-gray-500">Nothing to select</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function SpiderChartFields({
  block,
  onChange,
  onSave,
  onReset,
}: {
  block: Report360Block
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onReset: () => void
}) {
  const catalog = report360SpiderQuestions()
  const isCustomTitle = block.title !== block.defaultTitle
  const [editorKey, setEditorKey] = useState(0)
  const [sourceHint, setSourceHint] = useState('')
  const [weightsOpen, setWeightsOpen] = useState(false)
  const [weightsDraft, setWeightsDraft] = useState(block.relationshipWeights)
  const [overrideDraft, setOverrideDraft] = useState(block.useBlockWeights)
  const draftWeightsOk = !overrideDraft || weightTotal(weightsDraft) === 100
  const questionGroups = REPORT360_COMPETENCIES.filter((competency) =>
    block.spiderCompetencyIds.includes(competency.id),
  ).map((competency) => ({
    id: competency.id,
    label: competency.name,
    options: catalog
      .filter((question) => question.competencyId === competency.id)
      .map((question) => ({ id: question.id, label: question.text })),
  }))

  function updateSources(nextIds: string[]) {
    const adding = nextIds.length > block.spiderCompetencyIds.length
    if (nextIds.length < 3 && !adding) {
      setSourceHint('Select at least 3 data sources.')
      return
    }
    setSourceHint(nextIds.length < 3 ? 'Select at least 3 data sources.' : '')
    const added = nextIds.filter((id) => !block.spiderCompetencyIds.includes(id))
    const removed = new Set(block.spiderCompetencyIds.filter((id) => !nextIds.includes(id)))
    const kept = block.spiderQuestionIds.filter((id) => {
      const question = catalog.find((item) => item.id === id)
      return question != null && !removed.has(question.competencyId)
    })
    const addedQuestions = catalog.filter((question) => added.includes(question.competencyId)).map((question) => question.id)
    onChange({
      spiderCompetencyIds: nextIds,
      spiderQuestionIds: [...kept, ...addedQuestions.filter((id) => !kept.includes(id))],
    })
  }

  return (
    <div className="space-y-6">
      <div className={SETTINGS_GRID}>
        <FieldRow label="Title" align="start">
          <WuInput
            variant="outlined"
            value={block.title}
            onChange={(event) => onChange({ title: event.target.value })}
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
        </FieldRow>
        <FieldRow label="Data source">
          <ChecklistMultiSelect
            options={REPORT360_COMPETENCIES.map((competency) => ({ id: competency.id, label: competency.name }))}
            selectedIds={block.spiderCompetencyIds}
            onChange={updateSources}
            placeholder="Nothing selected"
          />
          {sourceHint || block.spiderCompetencyIds.length < 3 ? (
            <p className="mt-1 text-xs text-red-600">Select at least 3 data sources.</p>
          ) : null}
        </FieldRow>
      </div>

      <div>
        <FieldLabel>Introduction</FieldLabel>
        <TextArea
          resetKey={editorKey}
          value={block.introduction}
          onChange={(introduction) => onChange({ introduction })}
        />
      </div>

      <div className={SETTINGS_GRID}>
        <FieldRow label="Relationships">
          <ChecklistMultiSelect
            options={REPORT360_RELATIONSHIPS.map((key) => ({ id: key, label: REPORT360_RELATIONSHIP_LABELS[key] }))}
            selectedIds={block.spiderRelationships}
            onChange={(ids) => onChange({ spiderRelationships: ids as Report360Relationship[] })}
            placeholder="Nothing selected"
          />
        </FieldRow>
        <FieldRow label="Questions">
          <ChecklistMultiSelect
            groups={questionGroups}
            selectedIds={block.spiderQuestionIds.filter((id) =>
              questionGroups.some((group) => group.options.some((option) => option.id === id)),
            )}
            onChange={(spiderQuestionIds) => onChange({ spiderQuestionIds })}
            placeholder="Nothing selected"
          />
        </FieldRow>
      </div>

      <FieldRow label="Relationship weight configuration">
        <WuButton
          variant="secondary"
          onClick={() => {
            setWeightsDraft(block.relationshipWeights)
            setOverrideDraft(block.useBlockWeights)
            setWeightsOpen(true)
          }}
        >
          {block.useBlockWeights ? 'Edit weights' : 'Configure weights'}
        </WuButton>
      </FieldRow>

      <div className="flex justify-end gap-2 pt-2">
        <WuButton
          variant="secondary"
          onClick={() => {
            setEditorKey((key) => key + 1)
            onReset()
          }}
        >
          Reset
        </WuButton>
        <WuButton variant="primary" onClick={onSave}>
          Save
        </WuButton>
      </div>

      <WuModal open={weightsOpen} onOpenChange={setWeightsOpen} variant="action" size="md" {...preventModalDismiss}>
        <WuModalHeader>Relationship weight configuration</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuToggle
              Label="Override global relationship weights"
              checked={overrideDraft}
              onChange={setOverrideDraft}
            />
            {overrideDraft ? (
              <WeightSliders weights={weightsDraft} onChange={setWeightsDraft} />
            ) : (
              <p className="text-sm text-gray-500">Using the global weights from Master Design.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setWeightsOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            variant="primary"
            disabled={!draftWeightsOk}
            onClick={() => {
              onChange({ useBlockWeights: overrideDraft, relationshipWeights: weightsDraft })
              setWeightsOpen(false)
            }}
          >
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>
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
    <div className={SETTINGS_GRID}>
      <FieldRow label={label}>
        <WuInput
          variant="outlined"
          type="number"
          value={String(block.itemCount)}
          onChange={(event) =>
            onChange({ itemCount: Math.min(10, Math.max(1, Number(event.target.value) || 1)) })
          }
        />
      </FieldRow>
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
    <div>
      <SectionHeading>Weighting</SectionHeading>
      <div className={SETTINGS_GRID}>
        <FieldRow label="Override global relationship weights">
          <WuToggle
            checked={block.useBlockWeights}
            onChange={(useBlockWeights) => onChange({ useBlockWeights })}
          />
        </FieldRow>
      </div>
      {block.useBlockWeights ? (
        <div className="mt-3">
          <WeightSliders
            weights={block.relationshipWeights}
            onChange={(relationshipWeights) => onChange({ relationshipWeights })}
          />
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">Using the global weights from Master Design.</p>
      )}
    </div>
  )
}

function BlockSettings({
  block,
  masterDesign,
  sectionOptions,
  onMasterChange,
  onChange,
  onSave,
  onResetCover,
  onResetAllItems,
  onResetOverallData,
  onResetRanking,
  onResetActionPlan,
  onResetDevelopmentResults,
  onResetNominatedRaters,
  onResetSurveyRespondents,
  onResetPriorityAreas,
  onResetRankingByBehavior,
  onResetPresentation,
  onResetPrioritySurvey,
  onResetAiSummary,
  onResetSpider,
}: {
  block: Report360Block
  masterDesign: Report360MasterDesign
  sectionOptions: SelectOption[]
  onMasterChange: (next: Report360MasterDesign) => void
  onChange: (patch: Partial<Report360Block>) => void
  onSave: () => void
  onResetCover: () => void
  onResetAllItems: () => void
  onResetOverallData: () => void
  onResetRanking: () => void
  onResetActionPlan: () => void
  onResetDevelopmentResults: () => void
  onResetNominatedRaters: () => void
  onResetSurveyRespondents: () => void
  onResetPriorityAreas: () => void
  onResetRankingByBehavior: () => void
  onResetPresentation: () => void
  onResetPrioritySurvey: () => void
  onResetAiSummary: () => void
  onResetSpider: () => void
}) {
  if (block.type === 'masterDesign') {
    return <MasterDesignFields design={masterDesign} onChange={onMasterChange} />
  }

  const scored =
    REPORT360_SCORED_BLOCK_TYPES.includes(block.type) &&
    block.type !== 'executiveSummary' &&
    block.type !== 'competencyDetail' &&
    block.type !== 'overallData' &&
    block.type !== 'rankingByRelationship' &&
    block.type !== 'keyDevelopmentAreas' &&
    block.type !== 'strengthGrowthIndicators' &&
    block.type !== 'competencyPriorityIndex' &&
    block.type !== 'spiderChart'

  return (
    <div className="space-y-6">
      {block.type === 'cover' ||
      block.type === 'competencyDetail' ||
      block.type === 'overallData' ||
      block.type === 'rankingByRelationship' ||
      block.type === 'actionPlan' ||
      block.type === 'priorityComments' ||
      block.type === 'nominatedRaters' ||
      block.type === 'surveyRespondents' ||
      block.type === 'keyDevelopmentAreas' ||
      block.type === 'strengthGrowthIndicators' ||
      block.type === 'customContent' ||
      block.type === 'competencyPriorityIndex' ||
      block.type === 'aiRecommendations' ||
      block.type === 'spiderChart' ? null : (
        <GeneralFields block={block} sectionOptions={sectionOptions} onChange={onChange} />
      )}

      {block.type === 'cover' ? (
        <CoverFields block={block} onChange={onChange} onSave={onSave} onReset={onResetCover} />
      ) : null}
      {block.type === 'competencyDetail' ? (
        <AllItemsFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetAllItems}
        />
      ) : null}
      {block.type === 'overallData' ? (
        <OverallDataFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetOverallData}
        />
      ) : null}
      {block.type === 'spiderChart' ? (
        <SpiderChartFields block={block} onChange={onChange} onSave={onSave} onReset={onResetSpider} />
      ) : null}
      {block.type === 'surveyRespondents' ? (
        <SurveyRespondentsFields
          block={block}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetSurveyRespondents}
        />
      ) : null}
      {block.type === 'nominatedRaters' ? (
        <NominatedRatersFields
          block={block}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetNominatedRaters}
        />
      ) : null}
      {block.type === 'priorityComments' ? (
        <DevelopmentResultsFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetDevelopmentResults}
        />
      ) : null}
      {block.type === 'aiRecommendations' ? (
        <AiSummaryFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetAiSummary}
        />
      ) : null}
      {block.type === 'keyDevelopmentAreas' ? (
        <PriorityAreasFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetPriorityAreas}
        />
      ) : null}
      {block.type === 'strengthGrowthIndicators' ? (
        <RankingByBehaviorFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetRankingByBehavior}
        />
      ) : null}
      {block.type === 'rankingByRelationship' ? (
        <RankingRelationshipFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetRanking}
        />
      ) : null}
      {block.type === 'actionPlan' ? (
        <ActionPlanFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetActionPlan}
        />
      ) : null}
      {block.type === 'competencyPriorityIndex' ? (
        <PrioritySurveyFields
          block={block}
          sectionOptions={sectionOptions}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetPrioritySurvey}
        />
      ) : null}
      {block.type === 'customContent' ? (
        <PresentationTextFields
          block={block}
          onChange={onChange}
          onSave={onSave}
          onReset={onResetPresentation}
        />
      ) : null}

      {scored ? <WeightingFields block={block} onChange={onChange} /> : null}
      {scored ? (
        <CollapsibleSection title="Benchmark">
          <p className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Coming in Phase 3
          </p>
        </CollapsibleSection>
      ) : null}
    </div>
  )
}

function BlockCatalogCard({
  type,
  selected,
  onToggle,
}: {
  type: Report360BlockType
  selected: boolean
  onToggle: (type: Report360BlockType) => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[80px] cursor-pointer gap-4 rounded-lg border p-4 text-left transition-all hover:border-blue-400 hover:shadow-sm',
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
      )}
      onClick={() => onToggle(type)}
    >
      <span
        className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg font-semibold text-blue-700"
        aria-hidden
      >
        {REPORT360_BLOCK_DEFAULT_TITLES[type].charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <WuText size="sm" as="span" className="font-semibold text-gray-900">
          {REPORT360_BLOCK_DEFAULT_TITLES[type]}
        </WuText>
        <WuText size="sm" as="span" className="mt-1 block text-gray-500">
          {REPORT360_BLOCK_DESCRIPTIONS[type]}
        </WuText>
      </span>
    </button>
  )
}

const PREVIEW_MIN_WIDTH = 240
const PREVIEW_MAX_WIDTH = 420

export function ReportBuilder({
  survey,
  onGoToDistribute,
}: {
  survey: Survey360
  onGoToDistribute: () => void
}) {
  const { showToast } = useWuShowToast()
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_MAX_WIDTH)
  const { template, setTemplate, save, reset } = useReport360Template(survey.id)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [blocksToAdd, setBlocksToAdd] = useState<Report360BlockType[]>([])
  const [useExistingOpen, setUseExistingOpen] = useState(false)
  const [sourceFolderId, setSourceFolderId] = useState('new-folks')
  const [sourceSurveyId, setSourceSurveyId] = useState('')
  const [copiedFromTitle, setCopiedFromTitle] = useState<string | null>(null)
  const activeTemplate = template

  function commit(next: Report360Template) {
    setTemplate(next)
  }

  const sectionOptions = useMemo<SelectOption[]>(
    () => survey.sections.map((section) => ({ value: section.title, label: section.title })),
    [survey.sections],
  )

  const addableBlockTypes = (Object.keys(REPORT360_BLOCK_DEFAULT_TITLES) as Report360BlockType[]).filter(
    (type) => !REPORT360_CONSTANT_BLOCK_TYPES.includes(type),
  )

  const errors = useMemo(() => {
    const list: string[] = []
    if (
      activeTemplate.masterDesign.globalWeightsEnabled &&
      weightTotal(activeTemplate.masterDesign.relationshipWeights) !== 100
    ) {
      list.push('Global relationship weights must equal 100%.')
    }
    activeTemplate.blocks.forEach((block) => {
      if (block.enabled && block.useBlockWeights && weightTotal(block.relationshipWeights) !== 100) {
        list.push(`${block.title} weights must equal 100%.`)
      }
    })
    const spider = activeTemplate.blocks.find((block) => block.type === 'spiderChart')
    if (spider?.enabled && spider.spiderCompetencyIds.length < 3) {
      list.push(`${REPORT360_BLOCK_DEFAULT_TITLES.spiderChart} needs at least 3 data sources.`)
    }
    return list
  }, [activeTemplate])

  function updateBlock(blockId: string, patch: Partial<Report360Block>) {
    commit({
      ...activeTemplate,
      blocks: activeTemplate.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    })
  }

  function reorder(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const source = activeTemplate.blocks.find((block) => block.id === sourceId)
    const target = activeTemplate.blocks.find((block) => block.id === targetId)
    if (!source || !target || source.locked || target.locked) return
    const without = activeTemplate.blocks.filter((block) => block.id !== sourceId)
    const targetIndex = without.findIndex((block) => block.id === targetId)
    const next = [...without]
    next.splice(targetIndex, 0, source)
    if (next[0]?.type !== 'masterDesign') return
    commit({ ...activeTemplate, blocks: next })
  }

  function handleSave() {
    if (errors.length > 0) {
      showToast({ message: errors[0], variant: 'error' })
      return
    }
    save(activeTemplate)
    showToast({ message: 'Report saved', variant: 'success' })
  }

  function handleReset() {
    const next = reset()
    setTemplate(next)
    setCopiedFromTitle(null)
    setExpandedIds([])
    showToast({ message: 'Report reset', variant: 'success' })
  }

  const workforceOptions = STUDY_FOLDERS.filter((folder) => folder.value !== 'all-folders')

  const surveysInWorkforce = useMemo(() => {
    const seen = new Set<string>()
    return MOCK_STUDIES.flatMap((study) => {
      if (study.type !== '360 Review' || study.folderId !== sourceFolderId || !study.surveyId) return []
      if (study.surveyId === survey.id || seen.has(study.surveyId)) return []
      seen.add(study.surveyId)
      return [
        {
          value: study.surveyId,
          label: mockSurveys360.find((item) => item.id === study.surveyId)?.title ?? study.name,
        },
      ]
    })
  }, [sourceFolderId, survey.id])

  const surveyOptions =
    surveysInWorkforce.length > 0 ? surveysInWorkforce : [{ value: '', label: 'No 360 surveys' }]

  function openUseExisting() {
    const folderId = workforceOptions[0]?.value ?? 'new-folks'
    setSourceFolderId(folderId)
    const first = MOCK_STUDIES.find(
      (study) =>
        study.type === '360 Review' &&
        study.folderId === folderId &&
        study.surveyId &&
        study.surveyId !== survey.id,
    )
    setSourceSurveyId(first?.surveyId ?? '')
    setUseExistingOpen(true)
  }

  function reportForSurvey(surveyId: string): Report360Template {
    const stored = getReport360Template(surveyId)
    const untouched =
      stored.blocks.length === REPORT360_STARTER_BLOCK_TYPES.length &&
      stored.blocks.every((block, index) => block.type === REPORT360_STARTER_BLOCK_TYPES[index])
    if (!untouched) return stored
    const seeded: Record<string, Report360Template> = {
      surv360_leadership_2025: REPORT360_TEMPLATE_OPTIONS[0].template,
      surv360_manager_q1: REPORT360_TEMPLATE_OPTIONS[1].template,
      surv360_newhire_90: REPORT360_TEMPLATE_OPTIONS[2].template,
    }
    return seeded[surveyId] ?? stored
  }

  function selectWorkforce(folderId: string) {
    setSourceFolderId(folderId)
    const first = MOCK_STUDIES.find(
      (study) =>
        study.type === '360 Review' &&
        study.folderId === folderId &&
        study.surveyId &&
        study.surveyId !== survey.id,
    )
    setSourceSurveyId(first?.surveyId ?? '')
  }

  function confirmUseExisting() {
    const source = surveysInWorkforce.find((item) => item.value === sourceSurveyId)
    if (!source) return
    setTemplate(cloneReport360Template(reportForSurvey(source.value)))
    setCopiedFromTitle(source.label)
    setUseExistingOpen(false)
    showToast({
      message: `Report settings copied from ${source.label}.`,
      variant: 'success',
    })
  }

  function toggleBlockToAdd(type: Report360BlockType) {
    setBlocksToAdd((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    )
  }

  function addSelectedBlocks() {
    if (blocksToAdd.length === 0) return
    const stamp = Date.now().toString(36)
    const created = blocksToAdd.map((type, index) =>
      createReport360Block(type, `block_${type}_${stamp}_${index}`),
    )
    commit({ ...activeTemplate, blocks: [...activeTemplate.blocks, ...created] })
    setExpandedIds((current) => [...current, ...created.map((block) => block.id)])
    setBlocksToAdd([])
    setAddOpen(false)
    showToast({
      message: created.length === 1 ? 'Block added' : `${created.length} blocks added`,
      variant: 'success',
    })
  }

  function removeBlock(blockId: string) {
    const block = activeTemplate.blocks.find((item) => item.id === blockId)
    if (!block || REPORT360_CONSTANT_BLOCK_TYPES.includes(block.type)) return
    commit({ ...activeTemplate, blocks: activeTemplate.blocks.filter((item) => item.id !== blockId) })
    setExpandedIds((current) => current.filter((id) => id !== blockId))
  }

  const enabledCount = activeTemplate.blocks.filter((block) => block.enabled && !block.locked).length
  const isStarterReport =
    activeTemplate.blocks.length === REPORT360_STARTER_BLOCK_TYPES.length &&
    REPORT360_STARTER_BLOCK_TYPES.every((type) =>
      activeTemplate.blocks.some((block) => block.type === type),
    )

  function startPreviewResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = previewWidth
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function move(next: PointerEvent) {
      const width = Math.min(
        PREVIEW_MAX_WIDTH,
        Math.max(PREVIEW_MIN_WIDTH, startWidth + (startX - next.clientX)),
      )
      setPreviewWidth(width)
    }

    function up() {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function createWithTemplate() {
    const created = createDefaultReportBlocks(survey.sections)
    commit({ ...activeTemplate, blocks: [...activeTemplate.blocks, ...created] })
    showToast({ message: 'Default report added', variant: 'success' })
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="builder-pane flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 pt-5 pb-4">
        <div>
          <p className="text-xs text-gray-500">{survey.title}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Report builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            {copiedFromTitle
              ? `Copied from ${copiedFromTitle} · ${enabledCount} blocks enabled`
              : `${enabledCount} blocks enabled · drag to reorder`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WuButton variant="secondary" onClick={openUseExisting}>
            Use an existing report
          </WuButton>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-6">
        {activeTemplate.blocks.map((block, blockIndex) => {
          const expanded = expandedIds.includes(block.id)
          const isSetup = block.type === 'masterDesign'
          const blockNumber = activeTemplate.blocks
            .slice(0, blockIndex + 1)
            .filter((item) => item.type !== 'masterDesign').length
          return (
            <Fragment key={block.id}>
            <section
              onDragOver={(event) => {
                if (!dragId || block.locked) return
                event.preventDefault()
              }}
              onDrop={() => {
                if (dragId) reorder(dragId, block.id)
                setDragId(null)
              }}
              className={cn(
                'rounded-lg border bg-white shadow-sm',
                expanded ? 'border-blue-200' : 'border-gray-200',
                dragId === block.id ? 'opacity-60' : '',
              )}
            >
              <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                {isSetup ? <span className="w-4" aria-hidden /> : (
                  <button
                    type="button"
                    draggable
                    aria-label={`Drag to reorder ${block.title}`}
                    className="cursor-grab text-gray-400 active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', block.id)
                      setDragId(block.id)
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    ⋮⋮
                  </button>
                )}
                <span className="w-5 text-right text-sm tabular-nums text-gray-500">
                  {isSetup ? '' : blockNumber}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 overflow-hidden text-left"
                  onClick={() =>
                    setExpandedIds((current) =>
                      current.includes(block.id)
                        ? current.filter((id) => id !== block.id)
                        : [...current, block.id],
                    )
                  }
                >
                  <span className="font-medium text-gray-900">{block.title}</span>
                  {block.title !== block.defaultTitle ? (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({block.defaultTitle})
                    </span>
                  ) : null}
                  <span className="block-desc ml-3 text-sm font-normal text-gray-400">
                    {REPORT360_BLOCK_DESCRIPTIONS[block.type]}
                  </span>
                </button>
                {isSetup ? null : (
                  <div className="flex shrink-0 items-center gap-3">
                    {REPORT360_CONSTANT_BLOCK_TYPES.includes(block.type) ? null : (
                      <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-gray-800"
                        onClick={() => removeBlock(block.id)}
                      >
                        Remove
                      </button>
                    )}
                    <WuToggle
                      checked={block.enabled}
                      onChange={(enabled) => updateBlock(block.id, { enabled })}
                    />
                  </div>
                )}
              </div>
              {expanded ? (
                <div className="border-t border-gray-100 px-4 py-4">
                  <BlockSettings
                    block={block}
                    masterDesign={activeTemplate.masterDesign}
                    sectionOptions={
                      sectionOptions.length > 0
                        ? sectionOptions
                        : [{ value: 'Inclusive leadership', label: 'Inclusive leadership' }]
                    }
                    onMasterChange={(masterDesign) => commit({ ...activeTemplate, masterDesign })}
                    onChange={(patch) => updateBlock(block.id, patch)}
                    onSave={handleSave}
                    onResetCover={() => {
                      const fresh = createReport360Block('cover')
                      updateBlock(block.id, {
                        coverTemplate: fresh.coverTemplate,
                        coverBackgroundColor: fresh.coverBackgroundColor,
                        showOverallScoreOnCover: fresh.showOverallScoreOnCover,
                        showPerformanceCategoryOnCover: fresh.showPerformanceCategoryOnCover,
                        coverImage: fresh.coverImage,
                        coverLabel: fresh.coverLabel,
                        coverBody: fresh.coverBody,
                        relationshipIcons: fresh.relationshipIcons,
                        showSurveyRespondents: fresh.showSurveyRespondents,
                        excludeZeroResponses: fresh.excludeZeroResponses,
                        showTotalSent: fresh.showTotalSent,
                        showNominatedRatersOnCover: fresh.showNominatedRatersOnCover,
                        includeBackCover: fresh.includeBackCover,
                        backCoverLogo: fresh.backCoverLogo,
                        contactName: fresh.contactName,
                        contactEmail: fresh.contactEmail,
                        confidentialityNote: fresh.confidentialityNote,
                      })
                      showToast({ message: 'Cover page reset', variant: 'success' })
                    }}
                    onResetAllItems={() => {
                      const fresh = createReport360Block('competencyDetail')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        chartType: fresh.chartType,
                        meanColumn: fresh.meanColumn,
                        relationshipIcons: fresh.relationshipIcons,
                        tabularData: fresh.tabularData,
                        priorityColumn: fresh.priorityColumn,
                        qxBotInsights: fresh.qxBotInsights,
                        priorityText: fresh.priorityText,
                        tabularDataHeading: fresh.tabularDataHeading,
                        conditionalTexts: fresh.conditionalTexts,
                        conditionalElse: fresh.conditionalElse,
                        behavioursPerPage: fresh.behavioursPerPage,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'All items block reset', variant: 'success' })
                    }}
                    onResetOverallData={() => {
                      const fresh = createReport360Block('overallData')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        chartType: fresh.chartType,
                        meanColumn: fresh.meanColumn,
                        relationshipIcons: fresh.relationshipIcons,
                        priorityColumn: fresh.priorityColumn,
                        priorityText: fresh.priorityText,
                        conditionalTexts: fresh.conditionalTexts,
                        conditionalElse: fresh.conditionalElse,
                        itemCount: fresh.itemCount,
                        behaviorDisplay: fresh.behaviorDisplay,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'Overall data block reset', variant: 'success' })
                    }}
                    onResetRanking={() => {
                      const fresh = createReport360Block('rankingByRelationship')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        chartType: fresh.chartType,
                        meanColumn: fresh.meanColumn,
                        relationshipIcons: fresh.relationshipIcons,
                        priorityColumn: fresh.priorityColumn,
                        priorityText: fresh.priorityText,
                        conditionalTexts: fresh.conditionalTexts,
                        conditionalElse: fresh.conditionalElse,
                        rankingCount: fresh.rankingCount,
                        behaviorDisplay: fresh.behaviorDisplay,
                        rankingRelationships: fresh.rankingRelationships,
                        showManagerComments: fresh.showManagerComments,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'Ranking relationship block reset', variant: 'success' })
                    }}
                    onResetActionPlan={() => {
                      const fresh = createReport360Block('actionPlan')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        chartType: fresh.chartType,
                        priorityColumn: fresh.priorityColumn,
                        priorityText: fresh.priorityText,
                        conditionalTexts: fresh.conditionalTexts,
                        conditionalElse: fresh.conditionalElse,
                        behavioursPerPage: fresh.behavioursPerPage,
                        actionPlanPriorities: fresh.actionPlanPriorities,
                        showManagerComments: fresh.showManagerComments,
                      })
                      showToast({ message: 'Action plan block reset', variant: 'success' })
                    }}
                    onResetDevelopmentResults={() => {
                      const fresh = createReport360Block('priorityComments')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        actionPlanPriorities: fresh.actionPlanPriorities,
                      })
                      showToast({ message: 'Details of development results reset', variant: 'success' })
                    }}
                    onResetNominatedRaters={() => {
                      const fresh = createReport360Block('nominatedRaters')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                      })
                      showToast({ message: 'Nominated raters block reset', variant: 'success' })
                    }}
                    onResetSurveyRespondents={() => {
                      const fresh = createReport360Block('surveyRespondents')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        showTotalSent: fresh.showTotalSent,
                        excludeZeroResponses: fresh.excludeZeroResponses,
                      })
                      showToast({ message: 'Survey respondents block reset', variant: 'success' })
                    }}
                    onResetPriorityAreas={() => {
                      const fresh = createReport360Block('keyDevelopmentAreas')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                      })
                      showToast({ message: 'Priority areas of development reset', variant: 'success' })
                    }}
                    onResetRankingByBehavior={() => {
                      const fresh = createReport360Block('strengthGrowthIndicators')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        conditionalTexts: fresh.conditionalTexts,
                        conditionalElse: fresh.conditionalElse,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'Ranking by behavior block reset', variant: 'success' })
                    }}
                    onResetPresentation={() => {
                      const fresh = createReport360Block('customContent')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                      })
                      showToast({ message: 'Presentation text block reset', variant: 'success' })
                    }}
                    onResetPrioritySurvey={() => {
                      const fresh = createReport360Block('competencyPriorityIndex')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        priorityText: fresh.priorityText,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'Priority areas of development - survey reset', variant: 'success' })
                    }}
                    onResetAiSummary={() => {
                      const fresh = createReport360Block('aiRecommendations')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        closingText: fresh.closingText,
                        dataSource: fresh.dataSource,
                        commentDisplayMode: fresh.commentDisplayMode,
                        generateRecommendations: fresh.generateRecommendations,
                        showSentimentBar: fresh.showSentimentBar,
                      })
                      showToast({ message: 'AI insights and recommendations reset', variant: 'success' })
                    }}
                    onResetSpider={() => {
                      const fresh = createReport360Block('spiderChart')
                      updateBlock(block.id, {
                        title: fresh.defaultTitle,
                        introduction: fresh.introduction,
                        spiderCompetencyIds: fresh.spiderCompetencyIds,
                        spiderQuestionIds: fresh.spiderQuestionIds,
                        spiderRelationships: fresh.spiderRelationships,
                        useBlockWeights: fresh.useBlockWeights,
                        relationshipWeights: fresh.relationshipWeights,
                      })
                      showToast({ message: 'Spider chart block reset', variant: 'success' })
                    }}
                  />
                </div>
              ) : null}
            </section>
            {isSetup ? (
              <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Blocks
              </p>
            ) : null}
            </Fragment>
          )
        })}
        <div className={cn('grid gap-3', isStarterReport && 'sm:grid-cols-2')}>
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white text-sm font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-50"
            onClick={() => {
              setBlocksToAdd([])
              setAddOpen(true)
            }}
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            Add a block
          </button>
          {isStarterReport ? (
            <button
              type="button"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#1B3A6B] bg-slate-50 text-sm font-medium text-[#1B3A6B] hover:bg-slate-100"
              onClick={createWithTemplate}
            >
              Create default report
            </button>
          ) : null}
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
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
          Save changes
        </WuButton>
      </footer>

      <WuModal
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setBlocksToAdd([])
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>Add a block</WuModalHeader>
        <WuModalContent>
          <p className="mb-4 text-sm font-semibold text-gray-900">Select blocks</p>
          <div className="grid max-h-[420px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            {addableBlockTypes.map((type) => (
              <BlockCatalogCard
                key={type}
                type={type}
                selected={blocksToAdd.includes(type)}
                onToggle={toggleBlockToAdd}
              />
            ))}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            variant="secondary"
            onClick={() => {
              setBlocksToAdd([])
              setAddOpen(false)
            }}
          >
            Cancel
          </WuButton>
          <WuButton variant="primary" disabled={blocksToAdd.length === 0} onClick={addSelectedBlocks}>
            {blocksToAdd.length > 1 ? `Add ${blocksToAdd.length} blocks` : 'Add'}
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={useExistingOpen}
        onOpenChange={setUseExistingOpen}
        variant="action"
        size="sm"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          <span className="inline-flex items-center gap-2">
            Use Existing Report
            <WuTooltip
              content="Every 360 survey has one report format. This copies that format onto the report you are editing."
              position="top"
              showArrow
            >
              <span
                className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
                aria-label="Every 360 survey has one report format"
              >
                ?
              </span>
            </WuTooltip>
          </span>
        </WuModalHeader>
        <WuModalContent>
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3">
            <p className="text-left text-sm text-gray-800">Folder</p>
            <div className="min-w-0 [&_button]:w-full">
              <WuSelect
                data={workforceOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={workforceOptions.find((option) => option.value === sourceFolderId) ?? workforceOptions[0]}
                onSelect={(option) => {
                  const folderId = (option as SelectOption | null)?.value
                  if (folderId) selectWorkforce(folderId)
                }}
                variant="outlined"
              />
            </div>
            <p className="text-left text-sm text-gray-800">Survey</p>
            <div className="min-w-0 [&_button]:w-full">
              <WuSelect
                data={surveyOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={surveyOptions.find((option) => option.value === sourceSurveyId) ?? null}
                onSelect={(option) => {
                  const nextId = (option as SelectOption | null)?.value ?? ''
                  if (nextId) setSourceSurveyId(nextId)
                }}
                variant="outlined"
                placeholder="Select a survey"
                disabled={surveysInWorkforce.length === 0}
              />
            </div>
          </div>
          <p className="mt-6 border border-[#f1e3a1] bg-[#fff6cc] px-3 py-2.5 text-sm leading-5 text-gray-800">
            This will copy all report settings associated with the survey.
          </p>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setUseExistingOpen(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" disabled={!sourceSurveyId} onClick={confirmUseExisting}>
            Submit
          </WuButton>
        </WuModalFooter>
      </WuModal>
      </div>
      <aside
          className="relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-100"
          style={{ width: previewWidth }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview"
            aria-valuemin={PREVIEW_MIN_WIDTH}
            aria-valuemax={PREVIEW_MAX_WIDTH}
            aria-valuenow={Math.round(previewWidth)}
            className="absolute inset-y-0 left-0 z-10 w-2 cursor-col-resize touch-none hover:bg-blue-400/50"
            onPointerDown={startPreviewResize}
          />
          <ReportPreview
            survey={survey}
            template={activeTemplate}
            onGoToDistribute={onGoToDistribute}
          />
        </aside>
    </div>
  )
}
