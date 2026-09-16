'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import { DEFAULT_PORTAL_THEME_COLOR } from '@/data/mock-portal-settings'

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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type PortalThemeEditorModalProps = {
  open: boolean
  color: string
  onOpenChange: (open: boolean) => void
  onSave: (color: string) => void
}

function normalizeHex(value: string) {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`
  return null
}

export function PortalThemeEditorModal({
  open,
  color,
  onOpenChange,
  onSave,
}: PortalThemeEditorModalProps) {
  const { showToast } = useWuShowToast()
  const [draft, setDraft] = useState(color || DEFAULT_PORTAL_THEME_COLOR)

  useEffect(() => {
    if (open) setDraft(color || DEFAULT_PORTAL_THEME_COLOR)
  }, [color, open])

  function handleSave() {
    const next = normalizeHex(draft)
    if (!next) {
      showToast({ message: 'Enter a 6-digit hex color', variant: 'error' })
      return
    }
    onSave(next)
    showToast({ message: 'Portal theme updated', variant: 'success' })
    onOpenChange(false)
  }

  const preview = normalizeHex(draft) ?? draft

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="sm" {...preventModalDismiss}>
      <WuModalHeader>Customize Theme</WuModalHeader>
      <WuModalContent>
        <div className="flex flex-col gap-4">
          <WuText size="sm" className="text-gray-600">
            This color is used for portal navigation, links, and selected states.
          </WuText>
          <div className="flex items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Color
              <input
                type="color"
                value={normalizeHex(draft) ?? DEFAULT_PORTAL_THEME_COLOR}
                onChange={(event) => setDraft(event.target.value.toUpperCase())}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                aria-label="Portal theme color"
              />
            </label>
            <div className="flex-1">
              <WuFormGroup
                Label="Hex"
                Input={
                  <WuInput
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                }
              />
            </div>
            <span
              className="mb-1 size-10 rounded border border-gray-200"
              style={{ backgroundColor: preview }}
              aria-hidden
            />
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
