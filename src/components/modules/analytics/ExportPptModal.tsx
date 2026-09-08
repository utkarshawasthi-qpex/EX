'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { exportTabToPptx } from '@/lib/exportTabToPptx'
import { preventModalDismiss } from '@/lib/modalProps'
import { getActivePptTemplate, getPptTemplates } from '@/lib/mockDb'
import { cn } from '@/lib/utils'
import type { DashboardWidget, PptExportWidget, PptTemplate, WidgetType } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

interface ExportPptModalProps {
  open: boolean
  onClose: () => void
  dashboardName: string
  tabName: string
  widgets: DashboardWidget[]
  activeFilters: string[]
}

const WIDGET_COLORS: Record<WidgetType, string> = {
  summary: 'bg-purple-500',
  response_rate: 'bg-blue-500',
  scorecard: 'bg-blue-400',
  enps: 'bg-green-500',
  heatmap: 'bg-yellow-400',
  text_analysis: 'bg-purple-400',
  text_report: 'bg-gray-400',
  survey_comparison: 'bg-orange-400',
  time_trend: 'bg-blue-500',
  notes: 'bg-yellow-500',
  single_question: 'bg-blue-600',
  driver_analysis: 'bg-green-600',
}

function getWidgetTypeLabel(type: WidgetType) {
  return type.replace(/_/g, ' ')
}

export function ExportPptModal({
  open,
  onClose,
  dashboardName,
  tabName,
  widgets,
  activeFilters,
}: ExportPptModalProps) {
  const { showToast } = useWuShowToast()
  const [templates, setTemplates] = useState<PptTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<PptTemplate | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [exportWidgets, setExportWidgets] = useState<PptExportWidget[]>([])

  useEffect(() => {
    if (!open) return
    const nextTemplates = getPptTemplates()
    setTemplates(nextTemplates)
    setActiveTemplate(getActivePptTemplate())
    setShowTemplates(false)
    setExportWidgets(
      widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        selected: true,
      })),
    )
  }, [open, widgets])

  const selectedWidgets = useMemo(
    () => exportWidgets.filter((widget) => widget.selected),
    [exportWidgets],
  )
  const slideCount = selectedWidgets.length + 2

  function setAllWidgets(selected: boolean) {
    setExportWidgets((current) => current.map((widget) => ({ ...widget, selected })))
  }

  function toggleWidget(widgetId: string, selected: boolean) {
    setExportWidgets((current) =>
      current.map((widget) => (widget.id === widgetId ? { ...widget, selected } : widget)),
    )
  }

  async function handleExport() {
    if (!activeTemplate || selectedWidgets.length === 0) return

    onClose()
    showToast({ variant: 'info', message: '⏳ Generating PPT...' })

    try {
      const exportedAt = format(new Date(), 'MMM d, yyyy h:mm a')
      await exportTabToPptx({
        dashboardName,
        tabName,
        surveyName: 'Workplace Culture',
        selectedWidgets: selectedWidgets.map((widget) => ({
          type: widget.type,
          title: widget.title,
        })),
        activeFilters,
        exportedAt,
        template: activeTemplate,
      })
      showToast({ variant: 'success', message: `✓ PPT downloaded — ${slideCount} slides` })
    } catch {
      showToast({ variant: 'error', message: 'Export failed — please try again' })
    }
  }

  return (
    <WuModal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} size="md">
      <WuModalHeader>Export tab as PowerPoint</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {activeTemplate && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: `#${activeTemplate.themeColor}` }}
                  aria-hidden
                />
                <div>
                  <WuText size="sm" as="p" className="font-medium text-gray-900">
                    {activeTemplate.name}
                  </WuText>
                  <WuText size="sm" as="p" className="text-xs text-gray-500">
                    Active template
                  </WuText>
                </div>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowTemplates((visible) => !visible)}
              >
                Change
              </button>
            </div>
            {showTemplates && (
              <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between rounded bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: `#${template.themeColor}` }}
                        aria-hidden
                      />
                      <WuText size="sm" as="span" className="text-gray-800">
                        {template.name}
                      </WuText>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => {
                        setActiveTemplate(template)
                        setShowTemplates(false)
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <WuText size="sm" as="p" className="font-medium text-gray-800">
            Select widgets to include
          </WuText>
          <div className="text-xs">
            <button type="button" className="text-blue-600 hover:underline" onClick={() => setAllWidgets(true)}>
              Select all
            </button>
            <span className="mx-2 text-gray-300">|</span>
            <button type="button" className="text-blue-600 hover:underline" onClick={() => setAllWidgets(false)}>
              Deselect all
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
          {exportWidgets.map((widget) => (
            <div key={widget.id} className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0">
              <WuCheckbox checked={widget.selected} onChange={(checked) => toggleWidget(widget.id, checked)} />
              <span className={cn('size-3 rounded-sm', WIDGET_COLORS[widget.type])} aria-hidden />
              <WuText size="sm" as="span" className="text-gray-800">
                {widget.title}
              </WuText>
              <WuText size="sm" as="span" className="ml-auto text-xs text-gray-400">
                {getWidgetTypeLabel(widget.type)}
              </WuText>
            </div>
          ))}
        </div>

        <WuText size="sm" as="p" className="mt-2 text-xs text-gray-500">
          {selectedWidgets.length} of {exportWidgets.length} widgets selected
        </WuText>

        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <div>📊 {slideCount} slides will be generated (1 cover + {selectedWidgets.length} widgets + 1 closing slide)</div>
          {activeFilters.length > 0 && <div>🔍 Filters applied: {activeFilters.join(' · ')}</div>}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-between">
          <WuButton variant="secondary" onClick={onClose}>
            Cancel
          </WuButton>
          <WuButton variant="primary" disabled={selectedWidgets.length === 0} onClick={() => void handleExport()}>
            Export PPT ({slideCount} slides)
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
