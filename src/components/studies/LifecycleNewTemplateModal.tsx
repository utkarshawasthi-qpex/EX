'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import '@npm-questionpro/wick-ui-editor/dist/style.css'
import { toEditorHtml } from '@/components/modules/feedback360/MailComposeCard'
import { preventModalDismiss } from '@/lib/modalProps'
import {
  DEFAULT_EMAIL_TEMPLATE_BODY,
  DEFAULT_EMAIL_TEMPLATE_SUBJECT,
  DEFAULT_SLACK_TEMPLATE_BODY,
  DEFAULT_SMS_TEMPLATE_BODY,
  type LifecycleMailTemplate,
  type LifecycleTemplateKind,
} from '@/data/mock/lifecycleMail'

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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)
const WuContentEditor = dynamic(
  () => import('@npm-questionpro/wick-ui-editor').then((mod) => ({ default: mod.WuContentEditor })),
  { ssr: false },
)

type CreateKind = Exclude<LifecycleTemplateKind, 'global'>

const INSERT_SURVEY_LINK_ITEMS: {
  group?: string
  label: string
  token: string
}[] = [
  { label: 'Insert Survey Link', token: '{SURVEY_LINK}' },
  { group: 'Track Respondents', label: 'Track Respondents', token: '{TRACK_RESPONDENTS}' },
  {
    group: 'Anonymous Respondents',
    label: 'Keep Respondents Anonymous',
    token: '{ANONYMOUS}',
  },
  { group: 'Replacement Variables', label: 'First Name', token: '{FIRST_NAME}' },
  { group: 'Replacement Variables', label: 'Last Name', token: '{LAST_NAME}' },
  { group: 'Replacement Variables', label: 'Custom 1', token: '{CUSTOM_1}' },
]

const TITLES: Record<CreateKind, string> = {
  survey: 'Email Template',
  sms: 'SMS Invitation Template',
  slack: 'Slack invitation template',
}

const HELP: Record<CreateKind, string> = {
  survey:
    'Create an email template for this survey, or turn on Global to reuse it across surveys.',
  sms: 'Create an SMS invitation template for this survey.',
  slack: 'Create a Slack invitation template for this survey.',
}

function defaultBody(kind: CreateKind) {
  if (kind === 'sms') return DEFAULT_SMS_TEMPLATE_BODY
  if (kind === 'slack') return DEFAULT_SLACK_TEMPLATE_BODY
  return toEditorHtml(DEFAULT_EMAIL_TEMPLATE_BODY)
}

function HelpChip({ text }: { text: string }) {
  return (
    <WuTooltip content={text} position="right" showArrow>
      <span
        className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
        aria-label="About this template"
      >
        ?
      </span>
    </WuTooltip>
  )
}

function InsertSurveyLinkPicker({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const needle = query.trim().toLowerCase()
  const items = useMemo(
    () =>
      INSERT_SURVEY_LINK_ITEMS.filter((item) => {
        if (!needle) return true
        return (
          item.label.toLowerCase().includes(needle) ||
          (item.group ?? '').toLowerCase().includes(needle)
        )
      }),
    [needle],
  )

  useEffect(() => {
    if (!open) return
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  let lastGroup: string | undefined

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        onClick={() => {
          setQuery('')
          setOpen((current) => !current)
        }}
      >
        Insert Survey Link
        <span className={open ? 'wm-chevron-up' : 'wm-chevron-down'} aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-md border border-blue-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
            Insert Survey Link
            <button
              type="button"
              className="text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <span className="wm-chevron-up" aria-hidden />
            </button>
          </div>
          <div className="border-b border-gray-100 px-2 py-2">
            <WuInput
              variant="outlined"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              Icon={<span className="wm-search" />}
              iconPosition="right"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {items.map((item) => {
              const showGroup = Boolean(item.group && item.group !== lastGroup)
              lastGroup = item.group
              return (
                <li key={`${item.group ?? ''}-${item.label}`}>
                  {showGroup ? (
                    <div className="px-3 pt-2 text-sm font-semibold text-gray-900">{item.group}</div>
                  ) : null}
                  <button
                    type="button"
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 ${
                      item.group ? 'pl-6 text-gray-600' : 'font-medium text-blue-600'
                    }`}
                    onClick={() => {
                      onInsert(item.token)
                      setOpen(false)
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
            {items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No matching variables</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function LifecycleNewTemplateModal({
  open,
  kind,
  onOpenChange,
  onSave,
  onInvalid,
}: {
  open: boolean
  kind: CreateKind
  onOpenChange: (open: boolean) => void
  onSave: (template: LifecycleMailTemplate) => void
  onInvalid: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState(DEFAULT_EMAIL_TEMPLATE_SUBJECT)
  const [body, setBody] = useState(defaultBody(kind))
  const [isGlobal, setIsGlobal] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const isChannel = kind === 'sms' || kind === 'slack'

  useEffect(() => {
    if (!open) return
    setName('')
    setSubject(kind === 'survey' ? DEFAULT_EMAIL_TEMPLATE_SUBJECT : '')
    setBody(defaultBody(kind))
    setIsGlobal(false)
    setEditorKey((current) => current + 1)
  }, [open, kind])

  function insertToken(token: string) {
    const field = messageRef.current
    if (!field) {
      setBody((current) => `${current}${token}`)
      return
    }
    const start = field.selectionStart
    const end = field.selectionEnd
    const next = `${body.slice(0, start)}${token}${body.slice(end)}`
    setBody(next)
    requestAnimationFrame(() => {
      field.focus()
      const caret = start + token.length
      field.setSelectionRange(caret, caret)
    })
  }

  function save() {
    if (!name.trim()) {
      onInvalid('Add a template title.')
      return
    }
    if (!body.trim()) {
      onInvalid('Add a message.')
      return
    }
    const savedKind: LifecycleTemplateKind = kind === 'survey' && isGlobal ? 'global' : kind
    onSave({
      id: `tpl_${Date.now()}`,
      name: name.trim(),
      kind: savedKind,
      templateType:
        kind === 'sms' ? 'SMS Invite' : kind === 'slack' ? 'Slack Invite' : 'Survey Invite',
      type: 'Custom',
      language: 'English',
      subject: kind === 'survey' ? subject.trim() : '',
      body: body.trim(),
    })
  }

  return (
    <WuModal
      open={open}
      onOpenChange={onOpenChange}
      variant="action"
      size={kind === 'survey' ? 'lg' : 'md'}
      {...preventModalDismiss}
    >
      <WuModalHeader>
        <span className="inline-flex items-center gap-2">
          {TITLES[kind]}
          <HelpChip text={HELP[kind]} />
        </span>
      </WuModalHeader>
      <WuModalContent>
        {kind === 'survey' ? (
          <div className="overflow-hidden rounded-md border border-gray-200">
            <label className="flex items-center gap-2 border-b border-gray-200 px-4 py-2.5">
              <span className="shrink-0 text-sm text-gray-500">Template Title :</span>
              <WuInput
                variant="outlined"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 border-b border-gray-200 px-4 py-2.5">
              <span className="shrink-0 text-sm text-gray-500">Subject :</span>
              <WuInput
                variant="outlined"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </label>
            <div className="min-h-[280px] bg-white px-2 py-2">
              <WuContentEditor
                key={editorKey}
                defaultValue={body}
                toolbarPosition="bottom"
                onUpdate={setBody}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[132px_minmax(0,1fr)] items-start gap-x-4 gap-y-5">
            <span className="pt-2 text-right text-sm text-gray-700">Template Title</span>
            <WuInput
              variant="outlined"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <span className="pt-2 text-right text-sm text-gray-700">Message</span>
            <div>
              <div className="mb-1 flex justify-end">
                <InsertSurveyLinkPicker onInsert={insertToken} />
              </div>
              <textarea
                ref={messageRef}
                rows={8}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
        {kind === 'survey' ? (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className={isGlobal ? 'text-gray-500' : 'text-blue-600'}>Survey Specific</span>
              <WuToggle checked={isGlobal} onChange={setIsGlobal} />
              <span className={isGlobal ? 'text-blue-600' : 'text-gray-700'}>Global</span>
            </div>
            <WuButton variant="primary" onClick={save}>
              Save
            </WuButton>
          </div>
        ) : isChannel ? (
          <div className="mt-6 flex justify-center border-t border-dashed border-gray-200 pt-4">
            <WuButton variant="primary" onClick={save}>
              Save
            </WuButton>
          </div>
        ) : null}
      </WuModalContent>
    </WuModal>
  )
}
