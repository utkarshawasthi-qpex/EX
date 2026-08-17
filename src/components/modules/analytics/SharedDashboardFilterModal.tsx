'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { DASHBOARD_FILTER_FIELDS } from '@/lib/dashboardFilters'
import { preventModalDismiss } from '@/lib/modalProps'
import type { ActiveFilter } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

type SharedDashboardFilterModalProps = {
  open: boolean
  activeFilters: ActiveFilter[]
  onApply: (filters: ActiveFilter[]) => void
  onClose: () => void
}

/**
 * Recipient dashboard-level filters — horizontal multi-select fields
 * (Location / Level / Department / Tenure) with Clear all, Cancel, Apply.
 */
export function SharedDashboardFilterModal({
  open,
  activeFilters,
  onApply,
  onClose,
}: SharedDashboardFilterModalProps) {
  const [draftByField, setDraftByField] = useState<Record<string, SelectOption[]>>({})

  useEffect(() => {
    if (!open) return
    const next: Record<string, SelectOption[]> = {}
    for (const field of DASHBOARD_FILTER_FIELDS) {
      next[field.id] = activeFilters
        .filter((filter) => filter.fieldId === field.id)
        .map((filter) => ({ value: filter.value, label: filter.value }))
    }
    setDraftByField(next)
  }, [open, activeFilters])

  function clearAll() {
    const next: Record<string, SelectOption[]> = {}
    for (const field of DASHBOARD_FILTER_FIELDS) {
      next[field.id] = []
    }
    setDraftByField(next)
  }

  function handleApply() {
    const next: ActiveFilter[] = []
    for (const field of DASHBOARD_FILTER_FIELDS) {
      for (const option of draftByField[field.id] ?? []) {
        next.push({ fieldId: field.id, fieldLabel: field.label, value: option.value })
      }
    }
    onApply(next)
    onClose()
  }

  return (
    <WuModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      variant="action"
      size="lg"
      maxWidth="880px"
    >
      <WuModalHeader>Filters</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="wm-account-tree text-sm text-blue-600" aria-hidden />
            <button type="button" className="text-sm text-blue-600 hover:underline">
              Hierarchy based rule
            </button>
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
              aria-label="Hierarchy rule information"
            >
              ?
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WuText size="sm" as="span" className="font-semibold text-gray-800">
                  Filters
                </WuText>
                <button
                  type="button"
                  className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
                  aria-label="Filters information"
                >
                  ?
                </button>
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <span className="text-base leading-none" aria-hidden>
                  ↺
                </span>
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DASHBOARD_FILTER_FIELDS.map((field) => {
                const options = field.values.map((value) => ({ value, label: value }))
                const selected = draftByField[field.id] ?? []
                return (
                  <div key={field.id}>
                    <p className="mb-1.5 text-xs font-medium text-gray-500">{field.label}</p>
                    <WuSelect
                      data={options}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selected}
                      onSelect={(value: unknown) => {
                        const next = (
                          Array.isArray(value) ? value : value ? [value] : []
                        ) as SelectOption[]
                        setDraftByField((current) => ({
                          ...current,
                          [field.id]: next,
                        }))
                      }}
                      multiple
                      variant="outlined"
                      placeholder="Select value(s)"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          <WuButton variant="secondary" onClick={onClose}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleApply}>
            Apply
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
