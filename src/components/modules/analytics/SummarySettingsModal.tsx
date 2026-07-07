'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  buildSummaryAdminConfigFromFields,
  SummaryAdminSettingsFields,
  summaryAdminConfigToFields,
  type SummaryAdminSettingsFieldValues,
} from '@/components/modules/analytics/SummaryAdminSettingsFields'
import { DEFAULT_SUMMARY_ADMIN_SETTINGS } from '@/lib/summaryDefaults'
import { normalizeSummaryAdminConfig } from '@/lib/normalizeSummaryConfig'
import { preventModalDismiss } from '@/lib/modalProps'
import { clearAllManagerCachesForWidget } from '@/lib/summaryStorage'
import type { DashboardWidget } from '@/types'

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

type SummarySettingsModalProps = {
  open: boolean
  onClose: () => void
  widget: DashboardWidget
  onUpdate: (updated: DashboardWidget) => void
}

const DEFAULT_FIELD_VALUES: SummaryAdminSettingsFieldValues = {
  ...DEFAULT_SUMMARY_ADMIN_SETTINGS,
}

export function SummarySettingsModal({
  open,
  onClose,
  widget,
  onUpdate,
}: SummarySettingsModalProps) {
  const { showToast } = useWuShowToast()
  const [values, setValues] = useState<SummaryAdminSettingsFieldValues>(DEFAULT_FIELD_VALUES)

  useEffect(() => {
    if (!open || !widget.summaryConfig) return
    const config = normalizeSummaryAdminConfig(widget.summaryConfig)
    setValues(summaryAdminConfigToFields(config))
  }, [open, widget])

  function handleSave() {
    if (!widget.summaryConfig) return

    const previous = normalizeSummaryAdminConfig(widget.summaryConfig)
    const nextConfig = buildSummaryAdminConfigFromFields(values, previous.createdBy, {
      companyContent: previous.companyContent,
      isGenerating: previous.isGenerating,
      generationError: previous.generationError,
    })

    if (previous.visibility !== nextConfig.visibility) {
      clearAllManagerCachesForWidget(widget.id)
    }

    if (previous.allowEmployeeSummaries && !nextConfig.allowEmployeeSummaries) {
      clearAllManagerCachesForWidget(widget.id)
    }

    onUpdate({
      ...widget,
      summaryConfig: nextConfig,
    })
    showToast({ variant: 'success', message: 'Settings updated' })
    onClose()
  }

  return (
    <WuModal open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} size="md">
      <WuModalHeader>Summary Widget Settings</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <SummaryAdminSettingsFields
          values={values}
          onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        />
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-3">
          <WuButton variant="secondary" onClick={onClose}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleSave}>
            Save Settings
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
