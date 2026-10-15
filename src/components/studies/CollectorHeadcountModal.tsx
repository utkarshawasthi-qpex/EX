'use client'

import dynamic from 'next/dynamic'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CollectorForm } from '@/data/mock-collector-forms'
import {
  RESPONSE_RATE_SEGMENTS,
  fieldsForSet,
  mergeHeadcountRows,
  segmentOptions,
  segmentTitle,
  type CollectorHeadcount,
  type HeadcountSegmentSet,
} from '@/data/mock-headcount'
import { formatRelativeDate } from '@/data/mock-utils'
import { headcountWorkbookBlob, parseHeadcountWorkbook } from '@/lib/headcountWorkbook'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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

type DraftCriteria = { dimension: string; values: string[] }
type DraftSet = HeadcountSegmentSet

type CollectorHeadcountModalProps = {
  form: CollectorForm | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (headcount: CollectorHeadcount) => void
  /** Render the fields only, for the create-form wizard. */
  embedded?: boolean
  collectorName?: string
  sessionKey?: number
  onBlockedChange?: (blocked: boolean) => void
}

export type CollectorHeadcountHandle = {
  /** Returns the expected-responses payload, or null when the step is incomplete. */
  commit: () => CollectorHeadcount | null
}

const DIMENSION_OPTIONS = [{ value: 'none', label: '- select -' }, ...RESPONSE_RATE_SEGMENTS.map((segment) => ({ value: segment.key, label: segment.title }))]

function emptyCriteria(): DraftCriteria {
  return { dimension: 'none', values: [] }
}

function emptySet(): DraftSet {
  return { id: `set_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, segment: 'none', segmentValues: [], criteria: [emptyCriteria()] }
}

function setsFromHeadcount(headcount: CollectorHeadcount | null | undefined): DraftSet[] {
  if (!headcount?.sets.length) return [emptySet()]
  return headcount.sets.map((set) => ({
    ...set,
    segmentValues: [...set.segmentValues],
    criteria: set.criteria.length ? set.criteria.map((item) => ({ ...item, values: [...item.values] })) : [emptyCriteria()],
  }))
}

function assessSets(sets: DraftSet[]): { state: 'empty' | 'incomplete' | 'ready'; sets: HeadcountSegmentSet[] } {
  const next = sets.map((set) => ({
    ...set,
    criteria: set.criteria.filter((item) => item.dimension !== 'none'),
  }))
  const started = next.some((set) => set.segment !== 'none' || set.criteria.length > 0)
  if (!started) return { state: 'empty', sets: [] }
  const incomplete = next.some(
    (set) => set.segment === 'none' || set.segmentValues.length === 0 || set.criteria.some((item) => item.values.length === 0),
  )
  if (incomplete) return { state: 'incomplete', sets: next }
  return { state: 'ready', sets: next }
}

function parseTotal(value: string): number | null | 'invalid' {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d+$/.test(trimmed)) return 'invalid'
  return Number.parseInt(trimmed, 10)
}

export const CollectorHeadcountModal = forwardRef<CollectorHeadcountHandle, CollectorHeadcountModalProps>(
  function CollectorHeadcountModal(
    { form, open, onOpenChange, onSave, embedded = false, collectorName, sessionKey = 0, onBlockedChange },
    ref,
  ) {
  const { showToast } = useWuShowToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [sets, setSets] = useState<DraftSet[]>([emptySet()])
  const [totalInput, setTotalInput] = useState('')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [acceptedRows, setAcceptedRows] = useState<CollectorHeadcount['rows'] | null>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])

  function resetDraft(headcount: CollectorHeadcount | null | undefined) {
    setSets(setsFromHeadcount(headcount))
    setTotalInput(headcount?.totalExpected != null ? String(headcount.totalExpected) : '')
    setTemplateOpen(false)
    setStagedFile(null)
    setAcceptedRows(null)
    setDragging(false)
    setErrors([])
  }

  useEffect(() => {
    if (embedded) return
    if (!form) return
    resetDraft(form.headcount)
  }, [embedded, form])

  useEffect(() => {
    if (!embedded) return
    resetDraft(form?.headcount)
  }, [embedded, sessionKey, form])

  function enteredTotal(): number | null | 'invalid' {
    return parseTotal(totalInput)
  }

  function commit(): CollectorHeadcount | null {
    const total = enteredTotal()
    if (total === 'invalid') {
      showToast({ message: 'Total expected responses must be a whole number, 0 or higher', variant: 'error' })
      return null
    }
    const assessed = assessSets(sets)
    if (assessed.state === 'incomplete') {
      showToast({ message: 'Choose a segment and at least one value in each set', variant: 'error' })
      return null
    }
    if (assessed.state === 'ready') {
      const previousRows =
        !acceptedRows && form?.headcount && form.headcount.rows.length > 0 && sameSets(form.headcount.sets, assessed.sets) && !stagedFile
          ? form.headcount.rows
          : null
      const uploadedRows = acceptedRows ?? previousRows
      if (!uploadedRows) {
        showToast({ message: 'Upload the completed template before saving', variant: 'error' })
        return null
      }
      const sameShape = form?.headcount && sameSets(form.headcount.sets, assessed.sets)
      const rows = mergeHeadcountRows(sameShape ? form?.headcount?.rows ?? null : null, uploadedRows, assessed.sets)
      return { sets: assessed.sets, rows, totalExpected: total, updatedAt: new Date().toISOString() }
    }
    return {
      sets: form?.headcount?.sets ?? [],
      rows: form?.headcount?.rows ?? [],
      totalExpected: total,
      updatedAt: new Date().toISOString(),
    }
  }

  useImperativeHandle(ref, () => ({ commit }), [sets, totalInput, acceptedRows, stagedFile, form])

  function saveTotal() {
    if (!form) return
    const headcount = commit()
    if (!headcount) return
    onSave(headcount)
    setSets(setsFromHeadcount(headcount))
    setStagedFile(null)
    setAcceptedRows(null)
    setErrors([])
    showToast({ message: 'Expected responses saved', variant: 'success' })
  }

  function updateSet(id: string, patch: Partial<DraftSet>) {
    clearUpload()
    setSets((current) => current.map((set) => (set.id === id ? { ...set, ...patch } : set)))
  }

  function clearUpload() {
    setStagedFile(null)
    setAcceptedRows(null)
    setErrors([])
  }

  function downloadTemplate() {
    const assessed = assessSets(sets)
    if (assessed.state !== 'ready') return
    const defined = assessed.sets
    const sameShape = !!form?.headcount && sameSets(form.headcount.sets, defined)
    const slug = (collectorName || form?.name || 'collector').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    void headcountWorkbookBlob(defined, sameShape ? form?.headcount?.rows ?? null : null).then((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Headcount_${slug || 'collector'}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  function stageFile(file: File | undefined) {
    if (!file) return
    const assessed = assessSets(sets)
    if (assessed.state !== 'ready') return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast({ message: 'Upload the Excel template (.xlsx)', variant: 'error' })
      return
    }
    setStagedFile(file)
    void file.arrayBuffer().then((data) => parseHeadcountWorkbook(data, assessed.sets)).then((result) => {
      if (!result.ok) {
        setAcceptedRows(null)
        setErrors(result.errors)
        showToast({ message: 'Response file has errors', variant: 'error' })
        return
      }
      setAcceptedRows(result.rows)
      setErrors([])
    })
  }

  const assessed = assessSets(sets)
  const templateReady = assessed.state === 'ready'
  const savedFileStillMatches =
    !stagedFile &&
    !acceptedRows &&
    templateReady &&
    !!form?.headcount &&
    form.headcount.rows.length > 0 &&
    sameSets(form.headcount.sets, assessed.sets)
  const fileReady = acceptedRows != null || savedFileStillMatches
  const saveBlocked = assessed.state === 'incomplete' || (templateReady && !fileReady)

  useEffect(() => {
    onBlockedChange?.(saveBlocked)
  }, [onBlockedChange, saveBlocked])

  const savedSummary = form?.headcount
    ? [
        form.headcount.totalExpected != null ? `${form.headcount.totalExpected.toLocaleString()} expected` : null,
        form.headcount.rows.length > 0
          ? `File uploaded ${formatRelativeDate(form.headcount.updatedAt)}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  const fields = (
    <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
            <label className="block max-w-sm">
              <span className="mb-1.5 block text-sm font-medium text-gray-800">
                Total expected responses for this collector form
              </span>
              <WuInput
                variant="outlined"
                inputMode="numeric"
                value={totalInput}
                placeholder="0"
                onChange={(event) => setTotalInput(event.target.value)}
              />
            </label>
            {savedSummary ? <p className="mt-2 text-xs text-gray-500">Saved · {savedSummary}</p> : null}
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
              aria-expanded={templateOpen}
              onClick={() => setTemplateOpen((current) => !current)}
            >
              <span>
                <span className="block text-sm font-medium text-gray-900">Upload expected responses</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Configure template and upload expected responses count per segment
                </span>
              </span>
              <span
                className={cn('wm-keyboard-arrow-down text-xl leading-none text-gray-500 transition-transform', templateOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {templateOpen ? (
              <div className="space-y-4 border-t border-gray-200 bg-gray-50 px-4 py-4">
                <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Configure template</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Each set is one segment, with optional criteria. Criteria nest inside the segment.
                    </p>
                  </div>
                  {sets.map((set, setIndex) => (
                    <SegmentSetEditor
                      key={set.id}
                      index={setIndex}
                      set={set}
                      canRemove={sets.length > 1}
                      onChange={(patch) => updateSet(set.id, patch)}
                      onRemove={() => {
                        clearUpload()
                        setSets((current) => current.filter((item) => item.id !== set.id))
                      }}
                    />
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                      onClick={() => {
                        clearUpload()
                        setSets((current) => [...current, emptySet()])
                      }}
                    >
                      <span aria-hidden>+</span>
                      Add segment set
                    </button>
                    <button
                      type="button"
                      disabled={!templateReady}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-sm font-medium',
                        templateReady ? 'text-blue-700 hover:underline' : 'cursor-not-allowed text-gray-400',
                      )}
                      onClick={downloadTemplate}
                    >
                      <span className="wm-download text-base" aria-hidden />
                      Download template
                    </button>
                  </div>
                </section>

                <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Upload expected responses</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {templateReady
                        ? 'Upload the Excel file. Do not rename the Set tabs.'
                        : 'Available after a segment set is configured.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!templateReady}
                    className={cn(
                      'flex h-28 w-full flex-col items-center justify-center rounded-md border border-dashed px-3 text-center transition-colors',
                      !templateReady && 'cursor-not-allowed opacity-60',
                      templateReady && (dragging || acceptedRows)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-gray-50',
                      templateReady && !dragging && !acceptedRows && 'hover:border-blue-300 hover:bg-blue-50/40',
                    )}
                    onClick={() => {
                      if (templateReady) fileRef.current?.click()
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      if (templateReady) setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDragging(false)
                      if (templateReady) stageFile(event.dataTransfer.files?.[0])
                    }}
                  >
                    <span className="wc-data-import text-3xl text-gray-400" aria-hidden />
                    <span className="mt-2 px-1 text-sm leading-5 text-gray-700">
                      {stagedFile ? (
                        <span className="line-clamp-2 break-all font-medium">{stagedFile.name}</span>
                      ) : savedFileStillMatches ? (
                        <span className="font-medium">Current file is already saved</span>
                      ) : (
                        <>
                          Drag your file here or <span className="font-medium text-blue-700">browse</span>
                        </>
                      )}
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      stageFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  {errors.length > 0 ? (
                    <ul className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                      {errors.map((error) => (
                        <li key={`${error.row}-${error.message}`}>
                          {error.row > 0 ? `Row ${error.row}: ` : ''}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>
    </div>
  )

  if (embedded) return fields

  return (
    <WuModal open={open} onOpenChange={onOpenChange} variant="action" size="lg" {...preventModalDismiss}>
      <WuModalHeader>
        <span className="block leading-tight">Expected responses</span>
        {form?.name ? <span className="mt-1 block text-sm font-normal text-gray-500">{form.name}</span> : null}
      </WuModalHeader>
      <WuModalContent>{fields}</WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-end gap-3">
          <WuButton variant="link" onClick={() => onOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton onClick={saveTotal} disabled={saveBlocked}>
            Save
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
},
)

function SegmentSetEditor({
  index,
  set,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number
  set: DraftSet
  canRemove: boolean
  onChange: (patch: Partial<DraftSet>) => void
  onRemove: () => void
}) {
  const used = new Set([set.segment, ...set.criteria.map((item) => item.dimension)].filter((item) => item && item !== 'none'))
  const segmentChoices = DIMENSION_OPTIONS.filter((option) => option.value === 'none' || option.value === set.segment || !used.has(option.value))

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-800">Set {index + 1}</h3>
        {canRemove ? (
          <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={onRemove}>
            Remove set
          </button>
        ) : null}
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-gray-800">Segment</p>
          <div className="grid grid-cols-2 gap-4">
            <OptionSelect
              options={segmentChoices}
              value={set.segment}
              placeholder="- select -"
              onChange={(segment) => onChange({ segment, segmentValues: [] })}
            />
            <OptionSelect
              multiple
              options={segmentOptions(set.segment).map((value) => ({ value, label: value }))}
              values={set.segmentValues}
              placeholder="- select value(s) -"
              disabled={set.segment === 'none'}
              onValuesChange={(segmentValues) => onChange({ segmentValues })}
            />
          </div>
        </div>
        {set.criteria.map((criteria, criteriaIndex) => {
          const criteriaChoices = DIMENSION_OPTIONS.filter(
            (option) => option.value === 'none' || option.value === criteria.dimension || !used.has(option.value),
          )
          const isLast = criteriaIndex === set.criteria.length - 1
          return (
            <div key={`${set.id}-criteria-${criteriaIndex}`}>
              {criteriaIndex === 0 ? <p className="mb-2 text-sm text-gray-800">Criteria</p> : null}
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-4">
                <OptionSelect
                  options={criteriaChoices}
                  value={criteria.dimension}
                  placeholder="- select -"
                  disabled={set.segment === 'none'}
                  onChange={(dimension) =>
                    onChange({
                      criteria: set.criteria.map((item, itemIndex) =>
                        itemIndex === criteriaIndex ? { dimension, values: [] } : item,
                      ),
                    })
                  }
                />
                <OptionSelect
                  multiple
                  options={segmentOptions(criteria.dimension).map((value) => ({ value, label: value }))}
                  values={criteria.values}
                  placeholder="- select value(s) -"
                  disabled={set.segment === 'none' || criteria.dimension === 'none'}
                  onValuesChange={(values) =>
                    onChange({
                      criteria: set.criteria.map((item, itemIndex) =>
                        itemIndex === criteriaIndex ? { ...item, values } : item,
                      ),
                    })
                  }
                />
                {isLast ? (
                  <CircleButton
                    label="Add criteria"
                    icon="wm-add"
                    onClick={() => onChange({ criteria: [...set.criteria, emptyCriteria()] })}
                  />
                ) : (
                  <CircleButton
                    label="Remove criteria"
                    icon="wm-remove"
                    onClick={() => onChange({ criteria: set.criteria.filter((_, itemIndex) => itemIndex !== criteriaIndex) })}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CircleButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
      aria-label={label}
      onClick={onClick}
    >
      <span className={cn(icon, 'text-base leading-none')} aria-hidden />
    </button>
  )
}

function OptionSelect({
  options,
  value,
  values = [],
  placeholder,
  disabled,
  multiple = false,
  onChange,
  onValuesChange,
}: {
  options: { value: string; label: string }[]
  value?: string
  values?: string[]
  placeholder: string
  disabled?: boolean
  multiple?: boolean
  onChange?: (next: string) => void
  onValuesChange?: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectedLabels = (multiple ? values : value && value !== 'none' ? [value] : [])
    .map((item) => options.find((option) => option.value === item)?.label ?? segmentTitle(item))
    .filter(Boolean)
  const hasValue = selectedLabels.length > 0

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded border px-3 text-left text-sm',
          disabled ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-300 bg-white hover:border-gray-400',
          !disabled && !hasValue && 'text-gray-400',
          !disabled && hasValue && 'text-gray-800',
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{hasValue ? selectedLabels.join(', ') : placeholder}</span>
        <span className="wm-arrow-drop-down shrink-0 text-xl leading-none text-gray-400" aria-hidden />
      </button>
      {open && !disabled ? (
        <div role="listbox" className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
          {options
            .filter((option) => !multiple || option.value !== 'none')
            .map((option) => {
              const checked = multiple ? values.includes(option.value) : value === option.value
              function selectOption(nextChecked = !checked) {
                if (multiple) {
                  onValuesChange?.(nextChecked ? [...values, option.value] : values.filter((item) => item !== option.value))
                  return
                }
                onChange?.(option.value)
                setOpen(false)
              }
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={checked}
                  className={cn('flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50', checked && !multiple && 'bg-blue-50 font-medium text-blue-700')}
                  onClick={() => selectOption()}
                >
                  {multiple ? (
                    <span onClick={(event) => event.stopPropagation()}>
                      <WuCheckbox checked={checked} onChange={(next: boolean) => selectOption(next)} />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </div>
              )
            })}
        </div>
      ) : null}
    </div>
  )
}

function sameSets(saved: HeadcountSegmentSet[], next: HeadcountSegmentSet[]): boolean {
  return saved.length === next.length && saved.every((set, index) => set.id === next[index]?.id && fieldsForSet(set).map((field) => `${field.key}:${field.options.join(',')}`).join('|') === fieldsForSet(next[index]).map((field) => `${field.key}:${field.options.join(',')}`).join('|'))
}
