'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { mockPptTemplates } from '@/data/mock/pptTemplates'
import { PageCard } from '@/components/shared/PageCard'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { preventModalDismiss } from '@/lib/modalProps'
import { isAdminContext } from '@/lib/userContext'
import type { ImageLayout, LogoAlignment, PptFontConfig, PptTemplate } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuChip })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

const TEMPLATE_STORAGE_KEY = 'pp_ppt_templates'
const FONT_OPTIONS: SelectOption[] = [
  { value: 'Fira Sans', label: 'Fira Sans' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
]
const IMAGE_LAYOUT_OPTIONS: SelectOption[] = [
  { value: 'full', label: 'Full' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
]

function loadTemplates(): PptTemplate[] {
  if (typeof window === 'undefined') return mockPptTemplates

  try {
    const stored = window.localStorage.getItem(TEMPLATE_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as PptTemplate[]
  } catch {
    return mockPptTemplates
  }

  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(mockPptTemplates))
  return mockPptTemplates
}

function createTemplate(): PptTemplate {
  return {
    ...mockPptTemplates[0],
    id: `tpl_${Date.now()}`,
    name: 'New PPT Template',
    isActive: false,
    isDefault: false,
    createdAt: format(new Date(), 'yyyy-MM-dd'),
  }
}

function getOption(options: SelectOption[], value: string): SelectOption {
  return options.find((option) => option.value === value) ?? options[0]
}

function AlignmentButtons({
  value,
  onChange,
}: {
  value: LogoAlignment
  onChange: (value: LogoAlignment) => void
}) {
  return (
    <div className="flex gap-2">
      {(['left', 'center', 'right'] as LogoAlignment[]).map((alignment) => (
        <button
          key={alignment}
          type="button"
          className={`rounded border px-3 py-1 text-sm ${
            value === alignment ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
          }`}
          onClick={() => onChange(alignment)}
        >
          {alignment[0].toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function FontControls({
  label,
  font,
  onChange,
}: {
  label: string
  font: PptFontConfig
  onChange: (font: PptFontConfig) => void
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
        {label}
      </WuText>
      <div className="grid grid-cols-5 gap-3">
        <WuSelect
          data={FONT_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={getOption(FONT_OPTIONS, font.family)}
          onSelect={(value) => onChange({ ...font, family: (value as SelectOption).value })}
          variant="outlined"
        />
        <WuInput type="number" value={String(font.size)} onChange={(event) => onChange({ ...font, size: Number(event.target.value) || font.size })} />
        <WuToggle checked={font.bold} onChange={(checked) => onChange({ ...font, bold: checked })} Label="Bold" />
        <WuInput type="color" value={`#${font.color}`} onChange={(event) => onChange({ ...font, color: event.target.value.replace('#', '').toUpperCase() })} />
        <AlignmentButtons value={font.alignment} onChange={(alignment) => onChange({ ...font, alignment })} />
      </div>
    </div>
  )
}

export default function PptExportTemplatesPage() {
  const { showToast } = useWuShowToast()
  const [templates, setTemplates] = useState<PptTemplate[]>([])
  const [admin, setAdmin] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PptTemplate | null>(null)

  useEffect(() => {
    setTemplates(loadTemplates())
    setAdmin(isAdminContext())
  }, [])

  function saveTemplates(nextTemplates: PptTemplate[]) {
    setTemplates(nextTemplates)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates))
    }
  }

  function setActive(template: PptTemplate) {
    const nextTemplates = templates.map((item) => ({ ...item, isActive: item.id === template.id }))
    saveTemplates(nextTemplates)
    showToast({ variant: 'success', message: `Template '${template.name}' set as active` })
  }

  function saveTemplate() {
    if (!editingTemplate) return
    const exists = templates.some((template) => template.id === editingTemplate.id)
    const nextTemplates = exists
      ? templates.map((template) => (template.id === editingTemplate.id ? editingTemplate : template))
      : [...templates, editingTemplate]
    saveTemplates(nextTemplates)
    setEditingTemplate(null)
    showToast({ variant: 'success', message: 'Template saved' })
  }

  function updateTemplate(updater: (template: PptTemplate) => PptTemplate) {
    setEditingTemplate((current) => (current ? updater(current) : current))
  }

  return (
    <PageShell>
      <PageHeader
        title="PPT Export Templates"
        description="Manage templates for PowerPoint exports"
        className="bg-white"
        actions={
          admin ? (
            <WuButton variant="primary" onClick={() => setEditingTemplate(createTemplate())}>
              + New Template
            </WuButton>
          ) : undefined
        }
      />

      <PageContent>
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <PageCard key={template.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="size-4 rounded-full" style={{ backgroundColor: `#${template.themeColor}` }} aria-hidden />
              <WuText size="sm" as="span" className="font-medium text-gray-900">
                {template.name}
              </WuText>
              {template.isActive && <WuChip size="sm" color="success">ACTIVE</WuChip>}
              {template.isDefault && <WuChip size="sm" variant="secondary">DEFAULT</WuChip>}
            </div>
            <WuText size="sm" as="p" className="mt-1 text-xs text-gray-400">
              Created {format(new Date(template.createdAt), 'MMM d, yyyy')}
            </WuText>
            {template.confidentialityEnabled && (
              <WuText size="sm" as="p" className="mt-3 text-xs text-gray-500">
                🔒 {template.confidentialityText}
              </WuText>
            )}
            <div className="mt-4 flex items-center gap-3">
              {template.isActive ? (
                <WuButton variant="secondary" size="sm" disabled>
                  Active ✓
                </WuButton>
              ) : (
                <WuButton variant="secondary" size="sm" onClick={() => setActive(template)}>
                  Set Active
                </WuButton>
              )}
              {admin && (
                <>
                  <button type="button" className="text-sm text-blue-600" onClick={() => setEditingTemplate(template)}>
                    Edit
                  </button>
                  {!template.isDefault && (
                    <button
                      type="button"
                      className="text-sm text-red-500"
                      onClick={() => saveTemplates(templates.filter((item) => item.id !== template.id))}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
            </PageCard>
          ))}
        </div>

        <WuModal open={Boolean(editingTemplate)} onOpenChange={(open) => !open && setEditingTemplate(null)} size="lg">
        <WuModalHeader>{editingTemplate?.isDefault ? 'Edit Template' : 'Template Details'}</WuModalHeader>
        <WuModalContent {...preventModalDismiss}>
          {editingTemplate && (
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
              <section className="space-y-3">
                <WuHeading size="sm">General Settings</WuHeading>
                <WuInput value={editingTemplate.name} onChange={(event) => updateTemplate((template) => ({ ...template, name: event.target.value }))} />
                <div className="flex items-center gap-3">
                  <WuInput type="color" value={`#${editingTemplate.themeColor}`} onChange={(event) => updateTemplate((template) => ({ ...template, themeColor: event.target.value.replace('#', '').toUpperCase() }))} />
                  <WuText size="sm" as="span">#{editingTemplate.themeColor}</WuText>
                </div>
                <WuToggle checked={editingTemplate.confidentialityEnabled} Label="Confidentiality" onChange={(checked) => updateTemplate((template) => ({ ...template, confidentialityEnabled: checked }))} />
                <WuInput value={editingTemplate.confidentialityText} onChange={(event) => updateTemplate((template) => ({ ...template, confidentialityText: event.target.value }))} />
              </section>

              <section className="space-y-3 border-t border-gray-200 pt-4">
                <WuHeading size="sm">First Slide</WuHeading>
                <AlignmentButtons value={editingTemplate.firstSlide.logoAlignment} onChange={(logoAlignment) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, logoAlignment } }))} />
                <WuTextarea rows={2} value={editingTemplate.firstSlide.title} onChange={(event) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, title: event.target.value } }))} />
                <FontControls label="Title font" font={editingTemplate.firstSlide.titleFont} onChange={(titleFont) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, titleFont } }))} />
                <WuTextarea rows={2} value={editingTemplate.firstSlide.description} onChange={(event) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, description: event.target.value } }))} />
                <FontControls label="Description font" font={editingTemplate.firstSlide.descriptionFont} onChange={(descriptionFont) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, descriptionFont } }))} />
                <WuSelect
                  data={IMAGE_LAYOUT_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={IMAGE_LAYOUT_OPTIONS.find((option) => option.value === editingTemplate.firstSlide.coverImageLayout)}
                  onSelect={(value) => updateTemplate((template) => ({ ...template, firstSlide: { ...template.firstSlide, coverImageLayout: (value as SelectOption).value as ImageLayout } }))}
                  variant="outlined"
                />
              </section>

              <section className="space-y-3 border-t border-gray-200 pt-4">
                <WuHeading size="sm">Widget Slide</WuHeading>
                <AlignmentButtons value={editingTemplate.widgetSlide.logoAlignment} onChange={(logoAlignment) => updateTemplate((template) => ({ ...template, widgetSlide: { ...template.widgetSlide, logoAlignment } }))} />
                <FontControls label="Heading font" font={editingTemplate.widgetSlide.headingFont} onChange={(headingFont) => updateTemplate((template) => ({ ...template, widgetSlide: { ...template.widgetSlide, headingFont } }))} />
              </section>

              <section className="space-y-3 border-t border-gray-200 pt-4">
                <WuHeading size="sm">Last Slide</WuHeading>
                <AlignmentButtons value={editingTemplate.lastSlide.closingImageAlignment} onChange={(closingImageAlignment) => updateTemplate((template) => ({ ...template, lastSlide: { ...template.lastSlide, closingImageAlignment } }))} />
                <WuInput value={editingTemplate.lastSlide.closingText} onChange={(event) => updateTemplate((template) => ({ ...template, lastSlide: { ...template.lastSlide, closingText: event.target.value } }))} />
                <FontControls label="Closing text font" font={editingTemplate.lastSlide.closingTextFont} onChange={(closingTextFont) => updateTemplate((template) => ({ ...template, lastSlide: { ...template.lastSlide, closingTextFont } }))} />
              </section>
            </div>
          )}
        </WuModalContent>
        <WuModalFooter>
          <div className="flex w-full justify-end gap-2">
            <WuButton variant="secondary" onClick={() => setEditingTemplate(null)}>
              Cancel
            </WuButton>
            <WuButton variant="primary" onClick={saveTemplate}>
              Save Template
            </WuButton>
          </div>
        </WuModalFooter>
        </WuModal>
      </PageContent>
    </PageShell>
  )
}
