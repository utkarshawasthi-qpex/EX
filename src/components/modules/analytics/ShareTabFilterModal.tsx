'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import {
  activeFiltersToConditions,
  conditionsToActiveFilters,
  createEmptyCondition,
  FilterConditionBuilder,
  type FilterCondition,
} from '@/components/modules/analytics/FilterConditionBuilder'
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

type ShareTabFilterModalProps = {
  open: boolean
  activeFilters: ActiveFilter[]
  onApply: (filters: ActiveFilter[]) => void
  onClose: () => void
  title?: string
}

/** Recipient tab filter modal — IF/AND builder with Reset + Apply. */
export function ShareTabFilterModal({
  open,
  activeFilters,
  onApply,
  onClose,
  title = 'Tab filter',
}: ShareTabFilterModalProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(() =>
    activeFiltersToConditions(activeFilters),
  )

  useEffect(() => {
    if (!open) return
    setConditions(activeFiltersToConditions(activeFilters))
  }, [open, activeFilters])

  function handleReset() {
    setConditions([createEmptyCondition()])
  }

  function handleApply() {
    onApply(conditionsToActiveFilters(conditions))
    onClose()
  }

  return (
    <WuModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      variant="action"
      size="md"
      maxWidth="720px"
    >
      <WuModalHeader>
        <span className="text-[#1B2E4A]">{title}</span>
      </WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="py-2">
          <FilterConditionBuilder
            conditions={conditions}
            onChange={setConditions}
            showConnectors
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
          <WuButton variant="primary" onClick={handleApply}>
            Apply
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
