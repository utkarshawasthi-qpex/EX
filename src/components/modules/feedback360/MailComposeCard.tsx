'use client'

import dynamic from 'next/dynamic'
import { useState, type ReactNode } from 'react'
import '@npm-questionpro/wick-ui-editor/dist/style.css'
import { cn } from '@/lib/utils'

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCard })),
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

export type MailSelectOption = { value: string; label: string }

const MAIL_VARIABLES = [
  { token: '[First Name]', label: 'First Name' },
  { token: '[Last Name]', label: 'Last Name' },
  { token: '[Evaluators Name]', label: 'Evaluators Name' },
  { token: '[Reset Portal Password Link]', label: 'Reset Portal Password Link' },
  { token: '[Unique link for each subject]', label: 'Unique link for each subject' },
  { token: '[Deployment date YYYY/MM/DD]', label: 'Deployment date YYYY/MM/DD' },
  { token: '[Deployment date YYYY-MM-DD]', label: 'Deployment date YYYY-MM-DD' },
  { token: '[Deployment date MMM/DD/YYYY]', label: 'Deployment date MMM/DD/YYYY' },
  { token: '[Deployment date DD/MM/YYYY]', label: 'Deployment date DD/MM/YYYY' },
  { token: '[Current Date]', label: 'Current Date' },
  { token: '[Employee Unique Email]', label: 'Employee Unique Email' },
] as const

const INSERT_VARIABLE_PLACEHOLDER = { value: '__none__', label: 'Insert variable' }
const INSERT_VARIABLE_OPTIONS = [
  INSERT_VARIABLE_PLACEHOLDER,
  ...MAIL_VARIABLES.map((variable) => ({ value: variable.token, label: variable.label })),
]

export function toEditorHtml(body: string) {
  const trimmed = body.trim()
  if (!trimmed) return '<p></p>'
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function MailInlineField({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex min-w-0 items-center gap-2', className)}>
      {label ? <span className="shrink-0 text-sm text-gray-500">{label}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  )
}

function stopEditorToolbarEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation()
}

function InsertVariableToolbar({ onInsert }: { onInsert: (token: string) => void }) {
  const [selectKey, setSelectKey] = useState(0)

  return (
    <div
      data-insert-variable=""
      className="ml-1 w-44 shrink-0"
      onPointerDown={stopEditorToolbarEvent}
      onMouseDown={stopEditorToolbarEvent}
      onClick={stopEditorToolbarEvent}
    >
      <WuSelect
        key={selectKey}
        data={INSERT_VARIABLE_OPTIONS}
        accessorKey={{ value: 'value', label: 'label' }}
        value={INSERT_VARIABLE_PLACEHOLDER}
        placeholder="Insert variable"
        variant="outlined"
        onSelect={(next) => {
          const option = next as MailSelectOption
          if (option.value && option.value !== INSERT_VARIABLE_PLACEHOLDER.value) {
            onInsert(option.value)
            setSelectKey((current) => current + 1)
          }
        }}
      />
    </div>
  )
}

export function MailComposeCard({
  typeOptions,
  inviteType,
  onTypeChange,
  toOptions,
  fromOptions,
  mailFrom,
  onFromChange,
  templateOptions,
  selectedTemplate,
  onTemplateChange,
  emailSubject,
  onSubjectChange,
  emailBody,
  onBodyChange,
  editEmail,
  onEditEmailChange,
  editorKey,
  footerRight,
  className,
}: {
  typeOptions: MailSelectOption[]
  inviteType: MailSelectOption
  onTypeChange: (next: MailSelectOption) => void
  toOptions: MailSelectOption[]
  fromOptions: MailSelectOption[]
  mailFrom: MailSelectOption
  onFromChange: (next: MailSelectOption) => void
  templateOptions: MailSelectOption[]
  selectedTemplate: MailSelectOption
  onTemplateChange: (id: string) => void
  emailSubject: string
  onSubjectChange: (value: string) => void
  emailBody: string
  onBodyChange: (value: string) => void
  editEmail: boolean
  onEditEmailChange: (value: boolean) => void
  editorKey: number
  footerRight?: ReactNode
  className?: string
}) {
  const selectedType = typeOptions.find((option) => option.value === inviteType.value) ?? typeOptions[0]
  const [insertKey, setInsertKey] = useState(0)

  function insertVariable(token: string) {
    const surface = document.querySelector(
      '[data-slot="wu-content-editor"] .ProseMirror',
    ) as HTMLElement | null
    if (surface) {
      surface.focus()
      if (document.execCommand('insertText', false, token)) return
    }
    const html = toEditorHtml(emailBody)
    const next = /<\/p>\s*$/i.test(html)
      ? html.replace(/<\/p>\s*$/i, ` ${token}</p>`)
      : `${html}<p>${token}</p>`
    onBodyChange(next)
    setInsertKey((current) => current + 1)
    if (!editEmail) onEditEmailChange(true)
  }

  return (
    <WuCard rounded className={cn('flex min-h-0 flex-1 flex-col overflow-hidden p-0', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-gray-200 bg-white px-5 py-2.5">
        <MailInlineField label="Type :" className="min-w-[200px] flex-1">
          <WuSelect
            data={typeOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedType}
            onSelect={(next) => onTypeChange(next as MailSelectOption)}
            variant="outlined"
          />
        </MailInlineField>
        <MailInlineField label="To :" className="min-w-[200px] flex-1">
          <WuSelect
            data={toOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={toOptions[0]}
            onSelect={() => undefined}
            variant="outlined"
          />
        </MailInlineField>
        <MailInlineField label="From :" className="min-w-[240px] flex-1">
          <WuSelect
            data={fromOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={mailFrom}
            onSelect={(next) => onFromChange(next as MailSelectOption)}
            variant="outlined"
          />
        </MailInlineField>
      </div>

      <div className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-5 py-2.5">
        <MailInlineField label="Subject :" className="min-w-0 flex-1">
          <WuInput
            variant="outlined"
            value={emailSubject}
            disabled={!editEmail}
            onChange={(event) => onSubjectChange(event.target.value)}
          />
        </MailInlineField>
        <div className="w-52 shrink-0">
          <WuSelect
            data={templateOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedTemplate}
            onSelect={(next) => onTemplateChange((next as MailSelectOption).value)}
            variant="outlined"
          />
        </div>
      </div>

      {editEmail ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3 py-3">
          <WuContentEditor
            key={`${editorKey}-${insertKey}`}
            defaultValue={emailBody}
            toolbarPosition="top"
            onUpdate={onBodyChange}
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('[data-slot="wu-content-editor-toolbar"]')) return
            }}
            customToolbarChildren={<InsertVariableToolbar onInsert={insertVariable} />}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F6F8] px-8 py-8">
          <div className="mx-auto max-w-2xl rounded-md bg-white px-12 py-10 shadow-sm">
            <p className="mb-6 text-xs font-medium uppercase tracking-wide text-gray-400">Message preview</p>
            <div
              className="space-y-4 text-sm leading-7 text-gray-800 [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: toEditorHtml(emailBody) }}
            />
          </div>
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3">
        <label className="flex items-center gap-3 text-sm text-gray-700">
          Edit email
          <WuToggle checked={editEmail} onChange={onEditEmailChange} />
        </label>
        {footerRight ? <div className="flex items-center gap-2">{footerRight}</div> : null}
      </div>
    </WuCard>
  )
}
