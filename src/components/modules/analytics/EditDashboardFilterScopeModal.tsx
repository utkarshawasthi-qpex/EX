'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import {
  DashboardFilterScopeCheckboxes,
  filterScopeIdsFromDashboard,
} from '@/components/modules/analytics/DashboardFilterScopeCheckboxes'
import { preventModalDismiss } from '@/lib/modalProps'
import { normalizeDashboardFilterScope } from '@/lib/portalAccess'
import type { Dashboard } from '@/types'

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

type EditDashboardFilterScopeModalProps = {
  open: boolean
  dashboard: Dashboard
  onOpenChange: (open: boolean) => void
  onSave: (dashboard: Dashboard) => void
}

export function EditDashboardFilterScopeModal({
  open,
  dashboard,
  onOpenChange,
  onSave,
}: EditDashboardFilterScopeModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    filterScopeIdsFromDashboard(dashboard.filterScope),
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedIds(filterScopeIdsFromDashboard(dashboard.filterScope))
    setError('')
  }, [open, dashboard.filterScope])

  function handleSave() {
    if (selectedIds.length === 0) {
      setError('Select at least one filter dimension.')
      return
    }
    const { filterScope } = normalizeDashboardFilterScope(selectedIds)
    const next: Dashboard = { ...dashboard }
    if (filterScope) next.filterScope = filterScope
    else delete next.filterScope
    onSave(next)
    onOpenChange(false)
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md" {...preventModalDismiss}>
      <WuModalHeader>Allowed filters</WuModalHeader>
      <WuModalContent>
        <DashboardFilterScopeCheckboxes
          selectedIds={selectedIds}
          onChange={(ids) => {
            setSelectedIds(ids)
            if (error) setError('')
          }}
          error={error}
        />
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-3">
          <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleSave}>
            Save
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
