'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import {
  getPortalCmsHref,
  getPortalGlobalCopy,
  getPortalLanguageName,
  getPortalPageCopy,
  type PortalContentPage,
  type PortalGlobalPage,
  type PortalLanguageCode,
} from '@/data/mock-portal-settings'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
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
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

export type PortalPageEditorTarget =
  | { kind: 'page'; page: PortalContentPage; language: PortalLanguageCode }
  | { kind: 'global'; page: PortalGlobalPage; language: PortalLanguageCode }

type PortalPageEditorModalProps = {
  target: PortalPageEditorTarget | null
  onOpenChange: (open: boolean) => void
  onSave: (target: PortalPageEditorTarget, title: string, body: string) => void
}

export function PortalPageEditorModal({
  target,
  onOpenChange,
  onSave,
}: PortalPageEditorModalProps) {
  const { showToast } = useWuShowToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (!target) return
    const copy =
      target.kind === 'page'
        ? getPortalPageCopy(target.page, target.language)
        : getPortalGlobalCopy(target.page, target.language)
    setTitle(copy.title)
    setBody(copy.body)
  }, [target])

  const languageName = target ? getPortalLanguageName(target.language) : ''
  const pageTitle = target?.page.title ?? 'Page'
  const canPreview = target?.kind === 'page'

  function handleSave() {
    if (!target) return
    const nextTitle = title.trim()
    if (!nextTitle) {
      showToast({ message: 'Title is required', variant: 'error' })
      return
    }
    onSave(target, nextTitle, body)
    showToast({ message: `${pageTitle} updated`, variant: 'success' })
    onOpenChange(false)
  }

  function handlePreview() {
    if (!target || target.kind !== 'page') return
    window.open(getPortalCmsHref(target.page.id), '_blank', 'noopener,noreferrer')
  }

  return (
    <WuModal open={Boolean(target)} onOpenChange={onOpenChange} size="md" {...preventModalDismiss}>
      <WuModalHeader>
        {pageTitle} · {languageName}
      </WuModalHeader>
      <WuModalContent>
        <div className="flex flex-col gap-4">
          <WuFormGroup
            Label="Title"
            Input={<WuInput value={title} onChange={(event) => setTitle(event.target.value)} />}
          />
          <WuFormGroup
            Label="Body"
            Input={
              <WuTextarea
                rows={10}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            }
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        {canPreview ? (
          <WuButton variant="secondary" onClick={handlePreview}>
            Preview in portal
          </WuButton>
        ) : null}
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
