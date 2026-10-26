'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import {
  MailComposeCard,
  type MailSelectOption,
} from '@/components/modules/feedback360/MailComposeCard'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuItem })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

export function MailComposer({
  title,
  banner,
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
  recipientCount,
  recipientKind,
  onSend,
  onSendTest,
  onSchedule,
  showMore = true,
  hideType = false,
  hideFrom = false,
  hideSubject = false,
  typeField,
  toField,
  fromExtra,
  extraContent,
  editLabel,
  sendLabel = 'Send Mail',
  typeFieldPlacement,
  onAddFrom,
}: {
  title: string
  banner?: string
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
  recipientCount: number
  recipientKind: string
  onSend: () => void
  onSendTest: () => void
  onSchedule: () => void
  showMore?: boolean
  hideType?: boolean
  hideFrom?: boolean
  hideSubject?: boolean
  typeField?: ReactNode
  toField?: ReactNode
  fromExtra?: ReactNode
  extraContent?: ReactNode
  editLabel?: string
  sendLabel?: string
  typeFieldPlacement?: 'start' | 'templates'
  onAddFrom?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F9FC] px-6 py-5">
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <WuHeading size="sm" className="text-gray-900">
            {title}
          </WuHeading>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {recipientCount} {recipientKind}
            {recipientCount === 1 ? '' : 's'}
          </span>
          <WuTooltip
            content="Turn on Edit email to change the subject, body, and merge variables before you send."
            position="left"
            showArrow
          >
            <span
              className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
              aria-label="About this page"
            >
              ?
            </span>
          </WuTooltip>
        </div>
      </div>

      {banner ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {banner}
        </div>
      ) : null}

      <MailComposeCard
        typeOptions={typeOptions}
        inviteType={inviteType}
        onTypeChange={onTypeChange}
        toOptions={toOptions}
        fromOptions={fromOptions}
        mailFrom={mailFrom}
        onFromChange={onFromChange}
        templateOptions={templateOptions}
        selectedTemplate={selectedTemplate}
        onTemplateChange={onTemplateChange}
        emailSubject={emailSubject}
        onSubjectChange={onSubjectChange}
        emailBody={emailBody}
        onBodyChange={onBodyChange}
        editEmail={editEmail}
        onEditEmailChange={onEditEmailChange}
        editorKey={editorKey}
        hideType={hideType}
        hideFrom={hideFrom}
        hideSubject={hideSubject}
        typeField={typeField}
        toField={toField}
        fromExtra={fromExtra}
        extraContent={extraContent}
        editLabel={editLabel}
        typeFieldPlacement={typeFieldPlacement}
        onAddFrom={onAddFrom}
        footerRight={
          <>
            {showMore ? (
              <WuMenu Trigger={<WuButton variant="secondary">More</WuButton>} align="end">
                <WuMenuItem onSelect={onSendTest}>Send test</WuMenuItem>
                <WuMenuItem onSelect={onSchedule}>Schedule mail</WuMenuItem>
              </WuMenu>
            ) : null}
            <WuButton variant="primary" onClick={onSend}>
              {sendLabel}
            </WuButton>
          </>
        }
      />
    </div>
  )
}
